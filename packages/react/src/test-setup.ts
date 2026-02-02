/**
 * Test setup for vitest with React Testing Library
 */

import '@testing-library/jest-dom/vitest';

// Polyfill localStorage and sessionStorage for jsdom
const createStorageMock = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
};

// Only polyfill if clear is not available
if (typeof globalThis.localStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorageMock(),
    writable: true,
  });
}

if (typeof globalThis.sessionStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorageMock(),
    writable: true,
  });
}
