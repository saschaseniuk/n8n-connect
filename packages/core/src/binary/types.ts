/**
 * Type guards and utilities for binary data in @n8n-connect/core
 */

import type { BinaryResponse } from '../types';

/**
 * Check if a value is a BinaryResponse.
 *
 * @param value - The value to check
 * @returns true if the value is a BinaryResponse
 *
 * @example
 * ```typescript
 * const result = await client.execute('/workflow');
 *
 * if (isBinaryResponse(result)) {
 *   downloadBinaryResponse(result);
 * } else {
 *   console.log('JSON data:', result);
 * }
 * ```
 */
export function isBinaryResponse(value: unknown): value is BinaryResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'binaryUrl' in value &&
    typeof (value as BinaryResponse).binaryUrl === 'string' &&
    'contentType' in value &&
    typeof (value as BinaryResponse).contentType === 'string'
  );
}

/**
 * Check if a Content-Type header indicates binary data.
 *
 * @param contentType - The Content-Type string to check
 * @returns true if the content type indicates binary data
 *
 * @example
 * ```typescript
 * if (isBinaryContentType(response.headers.get('content-type'))) {
 *   // Handle as binary
 * }
 * ```
 */
export function isBinaryContentType(contentType: string): boolean {
  const binaryPatterns = [
    /^application\/octet-stream/,
    /^application\/pdf/,
    /^application\/zip/,
    /^application\/gzip/,
    /^application\/x-/,
    /^image\//,
    /^audio\//,
    /^video\//,
  ];

  return binaryPatterns.some((pattern) => pattern.test(contentType));
}

/**
 * Check if a File or Blob is an image.
 *
 * @param file - The File or Blob to check
 * @returns true if the file is an image
 *
 * @example
 * ```typescript
 * if (isImageFile(file)) {
 *   // Show image preview
 *   const url = URL.createObjectURL(file);
 *   img.src = url;
 * }
 * ```
 */
export function isImageFile(file: File | Blob): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get the file extension from a filename or MIME type.
 *
 * @param filename - Optional filename to extract extension from
 * @param mimeType - Optional MIME type to derive extension from
 * @returns The file extension (lowercase) or undefined
 *
 * @example
 * ```typescript
 * getFileExtension('document.PDF'); // 'pdf'
 * getFileExtension(undefined, 'image/jpeg'); // 'jpg'
 * getFileExtension('report.final.pdf'); // 'pdf'
 * ```
 */
export function getFileExtension(filename?: string, mimeType?: string): string | undefined {
  if (filename) {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts.pop()?.toLowerCase();
    }
  }

  if (mimeType) {
    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/zip': 'zip',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/json': 'json',
    };
    return mimeToExt[mimeType];
  }

  return undefined;
}
