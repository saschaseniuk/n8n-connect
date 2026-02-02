/**
 * Upload utilities for @n8n-connect/core
 *
 * Helper functions for preparing files for upload to n8n workflows.
 */

/**
 * Create a File object from various sources.
 *
 * @param content - The file content (string, Blob, or ArrayBuffer)
 * @param filename - The name for the file
 * @param options - Optional configuration
 * @returns A File object
 *
 * @example
 * ```typescript
 * // From string
 * const textFile = createFile('Hello World', 'hello.txt', { type: 'text/plain' });
 *
 * // From Blob
 * const blob = new Blob(['content'], { type: 'text/html' });
 * const htmlFile = createFile(blob, 'page.html');
 *
 * // From ArrayBuffer
 * const buffer = new ArrayBuffer(8);
 * const binFile = createFile(buffer, 'data.bin');
 * ```
 */
export function createFile(
  content: string | Blob | ArrayBuffer,
  filename: string,
  options?: { type?: string }
): File {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: options?.type ?? 'application/octet-stream' });

  return new File([blob], filename, { type: blob.type });
}

/**
 * Convert a base64 string to a File object.
 *
 * @param base64 - The base64-encoded string
 * @param filename - The name for the file
 * @param mimeType - The MIME type (defaults to 'application/octet-stream')
 * @returns A File object
 *
 * @example
 * ```typescript
 * const base64Data = 'SGVsbG8gV29ybGQ='; // "Hello World"
 * const file = base64ToFile(base64Data, 'hello.txt', 'text/plain');
 * ```
 */
export function base64ToFile(
  base64: string,
  filename: string,
  mimeType: string = 'application/octet-stream'
): File {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  return new File([blob], filename, { type: mimeType });
}

/**
 * Convert a data URL to a File object.
 *
 * @param dataUrl - The data URL string
 * @param filename - The name for the file
 * @returns A File object
 *
 * @example
 * ```typescript
 * const dataUrl = 'data:text/plain;base64,SGVsbG8=';
 * const file = dataUrlToFile(dataUrl, 'hello.txt');
 * // file.type === 'text/plain'
 * ```
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const parts = dataUrl.split(',');
  const header = parts[0] ?? '';
  const base64 = parts[1] ?? '';
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType =
    mimeMatch?.[1] && mimeMatch[1].length > 0 ? mimeMatch[1] : 'application/octet-stream';

  return base64ToFile(base64, filename, mimeType);
}

/**
 * Prepare files from a FileList or File array for upload.
 *
 * Converts a FileList (e.g., from an input element) or array of Files
 * into a Record suitable for the execute() files parameter.
 *
 * @param fileList - The FileList or array of Files
 * @param prefix - The key prefix for the files (default: 'file')
 * @returns A Record mapping keys to File objects
 *
 * @example
 * ```typescript
 * // From input element
 * const input = document.querySelector<HTMLInputElement>('#file-input');
 * const files = prepareFiles(input.files!, 'document');
 * // Single file: { document: File }
 * // Multiple files: { document_0: File, document_1: File }
 *
 * await client.execute('/upload', { files });
 * ```
 */
export function prepareFiles(
  fileList: FileList | File[],
  prefix: string = 'file'
): Record<string, File> {
  const files: Record<string, File> = {};
  const list = Array.from(fileList);

  for (let i = 0; i < list.length; i++) {
    const key = list.length === 1 ? prefix : `${prefix}_${String(i)}`;
    const file = list[i];
    if (file) {
      files[key] = file;
    }
  }

  return files;
}
