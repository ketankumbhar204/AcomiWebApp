import type { FilePurpose } from '@/shared/api/filesApi';
import {
  ABSOLUTE_MAX_BYTES,
  DOCUMENT_IMAGE_JPEG_QUALITY,
  DOCUMENT_IMAGE_MAX_DIMENSION,
  FileUploadUserError,
  IMAGE_JPEG_QUALITY,
  IMAGE_OPTIMIZE_MAX_DIMENSION,
  ORIGINAL_READ_MAX_BYTES,
  computeTargetDimensions,
  isDocumentImagePurpose,
  isSupportedImageMime,
  normalizeImageMime,
  purposeMaxBytes,
} from './fileLimits';

function canvasHasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return false;
  }
  const { width, height } = canvas;
  const sampleW = Math.min(width, 64);
  const sampleH = Math.min(height, 64);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i];
    if (alpha !== undefined && alpha < 250) {
      return true;
    }
  }
  return false;
}

function blobToFile(blob: Blob, name: string, type: string): File {
  return new File([blob], name, { type, lastModified: Date.now() });
}

function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base || 'image'}.${ext}`;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('encode-failed'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

/**
 * Resize/re-encode a photographic image. Strips EXIF by redrawing to canvas.
 * Keeps PNG when transparency is present. Does not upscale.
 */
export async function optimizeImageFile(
  file: File,
  purpose: FilePurpose,
): Promise<File> {
  if (!isSupportedImageMime(file.type)) {
    throw new FileUploadUserError('UNSUPPORTED', 'This file type is not supported.');
  }
  if (file.size > ORIGINAL_READ_MAX_BYTES) {
    throw new FileUploadUserError(
      'TOO_LARGE_ORIGINAL',
      'This image is too large to upload. Please choose a smaller image.',
    );
  }

  const maxBytes = purposeMaxBytes(purpose);
  const maxDimension = isDocumentImagePurpose(purpose)
    ? DOCUMENT_IMAGE_MAX_DIMENSION
    : IMAGE_OPTIMIZE_MAX_DIMENSION;
  const jpegQuality = isDocumentImagePurpose(purpose)
    ? DOCUMENT_IMAGE_JPEG_QUALITY
    : IMAGE_JPEG_QUALITY;

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file);
  } catch {
    source = await loadHtmlImage(file);
  }

  const sourceWidth = 'width' in source ? source.width : (source as HTMLImageElement).naturalWidth;
  const sourceHeight =
    'height' in source ? source.height : (source as HTMLImageElement).naturalHeight;
  const { width, height } = computeTargetDimensions(sourceWidth, sourceHeight, maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new FileUploadUserError('COMPRESS_FAILED', 'This image is too large to upload. Please choose a smaller image.');
  }
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  const keepPng =
    normalizeImageMime(file.type) === 'image/png' && canvasHasTransparency(canvas);

  const qualities = keepPng ? [undefined] : [jpegQuality, 0.72, 0.6];
  let lastBlob: Blob | null = null;

  for (const quality of qualities) {
    const type = keepPng ? 'image/png' : 'image/jpeg';
    lastBlob = await canvasToBlob(canvas, type, quality ?? 1);
    if (lastBlob.size <= maxBytes && lastBlob.size <= ABSOLUTE_MAX_BYTES) {
      const ext = keepPng ? 'png' : 'jpg';
      return blobToFile(lastBlob, replaceExtension(file.name || 'image', ext), type);
    }
  }

  if (keepPng && lastBlob && lastBlob.size > maxBytes) {
    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.72);
    if (jpegBlob.size <= maxBytes) {
      return blobToFile(jpegBlob, replaceExtension(file.name || 'image', 'jpg'), 'image/jpeg');
    }
  }

  throw new FileUploadUserError(
    'COMPRESS_FAILED',
    'This image is too large to upload. Please choose a smaller image.',
  );
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new FileUploadUserError('UNSUPPORTED', 'This file type is not supported.'));
    };
    image.src = url;
  });
}

export async function prepareFileForUpload(file: File, purpose: FilePurpose): Promise<File> {
  if (!isSupportedImageMime(file.type)) {
    throw new FileUploadUserError('UNSUPPORTED', 'This file type is not supported.');
  }
  return optimizeImageFile(file, purpose);
}
