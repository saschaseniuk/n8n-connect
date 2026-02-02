/**
 * Download utilities for @n8n-connect/core
 *
 * Helper functions for handling binary responses from n8n workflows.
 */

import type { BinaryResponse } from '../types';

/**
 * Trigger a browser download of a blob URL.
 *
 * Creates a temporary link element and clicks it to initiate the download.
 *
 * @param blobUrl - The blob URL to download
 * @param filename - The filename for the download (default: 'download')
 * @throws Error if called in a non-browser environment
 *
 * @example
 * ```typescript
 * const blobUrl = URL.createObjectURL(blob);
 * downloadBlobUrl(blobUrl, 'document.pdf');
 * ```
 */
export function downloadBlobUrl(blobUrl: string, filename: string = 'download'): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadBlobUrl can only be used in browser environment');
  }

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a file from a BinaryResponse.
 *
 * @param response - The BinaryResponse from a workflow
 *
 * @example
 * ```typescript
 * const result = await client.execute<BinaryResponse>('/download/report');
 * downloadBinaryResponse(result);
 * ```
 */
export function downloadBinaryResponse(response: BinaryResponse): void {
  downloadBlobUrl(response.binaryUrl, response.filename ?? 'download');
}

/**
 * Cleanup a blob URL to free memory.
 *
 * Blob URLs consume memory until explicitly revoked.
 * Call this after you're done using the blob URL.
 *
 * @param blobUrl - The blob URL to revoke
 *
 * @example
 * ```typescript
 * const blobUrl = response.binaryUrl;
 * // Use the blob URL...
 * revokeBlobUrl(blobUrl); // Free memory
 * ```
 */
export function revokeBlobUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl);
}

/**
 * Download a file and automatically cleanup the blob URL.
 *
 * Combines download and cleanup in one call. The blob URL is revoked
 * after a short delay to ensure the download starts.
 *
 * @param response - The BinaryResponse from a workflow
 *
 * @example
 * ```typescript
 * const result = await client.execute<BinaryResponse>('/download/report');
 * downloadAndCleanup(result); // Downloads and frees memory
 * ```
 */
export function downloadAndCleanup(response: BinaryResponse): void {
  downloadBinaryResponse(response);
  // Delay cleanup to ensure download starts
  setTimeout(() => {
    revokeBlobUrl(response.binaryUrl);
  }, 1000);
}

/**
 * Convert a blob URL back to a Blob.
 *
 * Useful when you need to process the binary data.
 *
 * @param blobUrl - The blob URL to convert
 * @returns A Promise that resolves to the Blob
 *
 * @example
 * ```typescript
 * const blob = await blobUrlToBlob(response.binaryUrl);
 * const text = await blob.text();
 * ```
 */
export async function blobUrlToBlob(blobUrl: string): Promise<Blob> {
  const response = await fetch(blobUrl);
  return response.blob();
}

/**
 * Convert a blob URL to a base64 string.
 *
 * Useful for sending binary data to APIs that expect base64.
 *
 * @param blobUrl - The blob URL to convert
 * @returns A Promise that resolves to the base64 string (without data URL prefix)
 *
 * @example
 * ```typescript
 * const base64 = await blobUrlToBase64(response.binaryUrl);
 * // Can be used in JSON payloads, etc.
 * ```
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const blob = await blobUrlToBlob(blobUrl);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const parts = base64.split(',');
      resolve(parts[1] ?? ''); // Remove data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
