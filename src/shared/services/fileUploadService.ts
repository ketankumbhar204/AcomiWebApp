import { env } from '@/shared/config/env';
import { ApiError } from '@/shared/api/errors';
import {
  filesApi,
  type CreateUploadSessionRequest,
  type FilePurpose,
} from '@/shared/api/filesApi';

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

export async function uploadLocalFile(
  file: File,
  options: UploadLocalFileOptions,
): Promise<string> {
  const contentType = file.type || 'application/octet-stream';
  const session = await filesApi.createUploadSession({
    ...options,
    contentType,
    byteSize: file.size,
    originalFilename: file.name,
  });

  if (session.useAcomiUploadProxy || session.uploadUrl.startsWith('/')) {
    await filesApi.putContent(session.fileId, file, contentType);
  } else {
    const uploadResponse = await fetch(resolveUploadUrl(session.uploadUrl), {
      method: session.uploadMethod || 'PUT',
      headers: directBrowserUploadHeaders(contentType, session.uploadHeaders),
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new ApiError('Direct file upload failed', uploadResponse.status);
    }
  }

  await filesApi.complete(session.fileId);
  return session.fileId;
}

export async function fetchSignedContentUrl(fileId: string): Promise<string> {
  const first = await filesApi.getContentUrl(fileId);
  return resolveDownloadUrl(first.contentUrl);
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
