import { env } from '@/shared/config/env';
import { ApiError } from '@/shared/api/errors';
import {
  filesApi,
  type ContentUrlResponse,
  type CreateUploadSessionRequest,
  type FilePurpose,
} from '@/shared/api/filesApi';
import { FileUploadUserError, fileLimitMessage, purposeMaxBytes, purposeMaxMb } from '@/shared/utils/fileLimits';
import { prepareFileForUpload } from '@/shared/utils/optimizeImageFile';

export type UploadLocalFileOptions = Omit<
  CreateUploadSessionRequest,
  'contentType' | 'byteSize' | 'originalFilename'
> & {
  purpose: FilePurpose;
};

function resolveUploadUrl(uploadUrl: string): string {
  if (uploadUrl.startsWith('http://') || uploadUrl.startsWith('https://')) {
    return uploadUrl;
  }
  const path = uploadUrl.startsWith('/') ? uploadUrl : `/${uploadUrl}`;
  return `${env.apiBaseUrl}${path}`;
}

function isRetryableDownloadStatus(status: number): boolean {
  return status === 403 || status === 401 || status === 410;
}

const BROWSER_OMITTED_UPLOAD_HEADERS = new Set([
  'authorization',
  'connection',
  'content-length',
  'content-type',
  'expect',
  'host',
  'transfer-encoding',
]);

/**
 * Browser fetch cannot set Host/Content-Length (the UA sends them). Spreading AWS
 * signed headers also duplicates Content-Type and triggers a CORS preflight for
 * headers R2 does not allow.
 */
export function directBrowserUploadHeaders(
  contentType: string,
  sessionHeaders?: Record<string, string> | null,
): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': contentType };
  if (!sessionHeaders) {
    return headers;
  }
  for (const [name, value] of Object.entries(sessionHeaders)) {
    if (!name || value == null || value === '') {
      continue;
    }
    if (BROWSER_OMITTED_UPLOAD_HEADERS.has(name.toLowerCase())) {
      continue;
    }
    headers[name] = value;
  }
  return headers;
}

export async function ensureUploadedFileId(
  existingFileId: string | undefined,
  file: File | undefined,
  options: UploadLocalFileOptions,
): Promise<string | undefined> {
  if (existingFileId) {
    return existingFileId;
  }
  if (!file) {
    return undefined;
  }
  return uploadLocalFile(file, options);
}

export function mapFileUploadError(error: unknown): string {
  if (error instanceof FileUploadUserError) {
    return error.message;
  }
  if (error instanceof ApiError && error.message && !/stack|exception|r2|aws/i.test(error.message)) {
    return error.message;
  }
  return 'Unable to upload the file. Please try again.';
}

export async function uploadLocalFile(
  file: File,
  options: UploadLocalFileOptions,
): Promise<string> {
  let prepared: File;
  try {
    prepared = await prepareFileForUpload(file, options.purpose);
  } catch (error) {
    if (error instanceof FileUploadUserError) {
      throw new FileUploadUserError(
        error.code,
        fileLimitMessage(error.code, purposeMaxMb(options.purpose)),
      );
    }
    throw error;
  }
  if (prepared.size > purposeMaxBytes(options.purpose)) {
    throw new FileUploadUserError(
      'TOO_LARGE',
      fileLimitMessage('TOO_LARGE', purposeMaxMb(options.purpose)),
    );
  }

  const contentType = prepared.type || 'image/jpeg';
  const session = await filesApi.createUploadSession({
    ...options,
    contentType,
    byteSize: prepared.size,
    originalFilename: prepared.name,
  });

  if (session.useAcomiUploadProxy || session.uploadUrl.startsWith('/')) {
    await filesApi.putContent(session.fileId, prepared, contentType);
  } else {
    const uploadResponse = await fetch(resolveUploadUrl(session.uploadUrl), {
      method: session.uploadMethod || 'PUT',
      headers: directBrowserUploadHeaders(contentType, session.uploadHeaders),
      body: prepared,
    });
    if (!uploadResponse.ok) {
      throw new ApiError('Unable to upload the file. Please try again.', uploadResponse.status);
    }
  }

  await filesApi.complete(session.fileId);
  return session.fileId;
}

export async function fetchSignedContentUrlResponse(fileId: string): Promise<ContentUrlResponse> {
  const first = await filesApi.getContentUrl(fileId);
  return {
    ...first,
    contentUrl: resolveDownloadUrl(first.contentUrl),
  };
}

export async function fetchSignedContentUrl(fileId: string): Promise<string> {
  const first = await fetchSignedContentUrlResponse(fileId);
  return first.contentUrl;
}

export async function fetchSignedContentUrlWithRetry(fileId: string): Promise<string> {
  try {
    return await fetchSignedContentUrl(fileId);
  } catch (error) {
    if (error instanceof ApiError && isRetryableDownloadStatus(error.status)) {
      return fetchSignedContentUrl(fileId);
    }
    throw error;
  }
}

function resolveDownloadUrl(contentUrl: string): string {
  if (contentUrl.startsWith('http://') || contentUrl.startsWith('https://')) {
    return contentUrl;
  }
  const path = contentUrl.startsWith('/') ? contentUrl : `/${contentUrl}`;
  return `${env.apiBaseUrl}${path}`;
}

export async function downloadAuthorizedFile(
  fileId: string,
  fallbackFilename = 'file.jpg',
): Promise<void> {
  const meta = await fetchSignedContentUrlResponse(fileId);
  const response = await fetch(meta.contentUrl);
  if (!response.ok) {
    throw new ApiError('Unable to download the file. Please try again.', response.status);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = meta.downloadFilename || fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
