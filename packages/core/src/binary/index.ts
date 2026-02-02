/**
 * Binary handling utilities for @n8n-connect/core
 *
 * @example
 * ```typescript
 * import {
 *   createFile,
 *   base64ToFile,
 *   downloadBinaryResponse,
 *   isBinaryResponse,
 * } from '@n8n-connect/core';
 * ```
 */

// Upload utilities
export { createFile, base64ToFile, dataUrlToFile, prepareFiles } from './upload';

// Download utilities
export {
  downloadBlobUrl,
  downloadBinaryResponse,
  revokeBlobUrl,
  downloadAndCleanup,
  blobUrlToBlob,
  blobUrlToBase64,
} from './download';

// Type guards and utilities
export { isBinaryResponse, isBinaryContentType, isImageFile, getFileExtension } from './types';
