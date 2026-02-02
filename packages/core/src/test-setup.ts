/**
 * Test setup for vitest with jsdom
 * Polyfills for browser APIs not fully supported in jsdom
 */

import { vi } from 'vitest';

// Mock URL.createObjectURL and URL.revokeObjectURL
let objectUrlCounter = 0;
const objectUrls = new Map<string, Blob>();

global.URL.createObjectURL = vi.fn((blob: Blob) => {
  objectUrlCounter++;
  const url = `blob:http://localhost/${String(objectUrlCounter)}`;
  objectUrls.set(url, blob);
  return url;
});

global.URL.revokeObjectURL = vi.fn((url: string) => {
  objectUrls.delete(url);
});

// Polyfill File.prototype.text() if not available
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!File.prototype.text) {
  File.prototype.text = function (): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
}

// Polyfill File.prototype.arrayBuffer() if not available
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(this);
    });
  };
}

// Polyfill Blob.prototype.text() if not available
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!Blob.prototype.text) {
  Blob.prototype.text = function (): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
}
