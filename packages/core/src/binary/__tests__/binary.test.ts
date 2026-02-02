import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createFile,
  base64ToFile,
  dataUrlToFile,
  prepareFiles,
  downloadBlobUrl,
  downloadBinaryResponse,
  revokeBlobUrl,
  downloadAndCleanup,
  blobUrlToBlob,
  blobUrlToBase64,
  isBinaryResponse,
  isBinaryContentType,
  isImageFile,
  getFileExtension,
} from '../index';

describe('createFile', () => {
  it('should create File from string', () => {
    const file = createFile('Hello World', 'hello.txt');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('hello.txt');
    expect(file.type).toBe('application/octet-stream');
  });

  it('should create File from string with custom type', () => {
    const file = createFile('Hello World', 'hello.txt', { type: 'text/plain' });

    expect(file.type).toBe('text/plain');
  });

  it('should create File from Blob', () => {
    const blob = new Blob(['content'], { type: 'text/html' });
    const file = createFile(blob, 'page.html');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('page.html');
    expect(file.type).toBe('text/html');
  });

  it('should create File from ArrayBuffer', () => {
    const buffer = new ArrayBuffer(8);
    const file = createFile(buffer, 'data.bin');

    expect(file).toBeInstanceOf(File);
    expect(file.size).toBe(8);
  });

  it('should preserve correct content', async () => {
    const content = 'Test Content';
    const file = createFile(content, 'test.txt', { type: 'text/plain' });

    const text = await file.text();
    expect(text).toBe(content);
  });
});

describe('base64ToFile', () => {
  it('should create File from base64 string', () => {
    const base64 = btoa('Hello World');
    const file = base64ToFile(base64, 'hello.txt', 'text/plain');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('hello.txt');
    expect(file.type).toBe('text/plain');
  });

  it('should decode content correctly', async () => {
    const original = 'Test Content';
    const base64 = btoa(original);
    const file = base64ToFile(base64, 'test.txt', 'text/plain');

    const text = await file.text();
    expect(text).toBe(original);
  });

  it('should use default MIME type', () => {
    const base64 = btoa('data');
    const file = base64ToFile(base64, 'file.bin');

    expect(file.type).toBe('application/octet-stream');
  });

  it('should handle binary base64 data', async () => {
    // Simulate binary data (e.g., a small PNG header)
    const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const base64 = btoa(String.fromCharCode(...binaryData));

    const file = base64ToFile(base64, 'image.png', 'image/png');

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    expect(uint8[0]).toBe(0x89);
    expect(uint8[1]).toBe(0x50);
  });
});

describe('dataUrlToFile', () => {
  it('should create File from data URL', () => {
    const dataUrl = 'data:text/plain;base64,' + btoa('Hello');
    const file = dataUrlToFile(dataUrl, 'hello.txt');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('hello.txt');
    expect(file.type).toBe('text/plain');
  });

  it('should extract MIME type from data URL', () => {
    const dataUrl = 'data:image/png;base64,' + btoa('fake-png');
    const file = dataUrlToFile(dataUrl, 'image.png');

    expect(file.type).toBe('image/png');
  });

  it('should have correct content', async () => {
    const content = 'Data URL Content';
    const dataUrl = 'data:text/plain;base64,' + btoa(content);
    const file = dataUrlToFile(dataUrl, 'content.txt');

    const text = await file.text();
    expect(text).toBe(content);
  });

  it('should handle missing MIME type', () => {
    const dataUrl = 'data:;base64,' + btoa('content');
    const file = dataUrlToFile(dataUrl, 'unknown.bin');

    expect(file.type).toBe('application/octet-stream');
  });
});

describe('prepareFiles', () => {
  it('should convert FileList to Record', () => {
    const file1 = new File(['1'], 'file1.txt');
    const file2 = new File(['2'], 'file2.txt');

    // Mock FileList
    const fileList = {
      0: file1,
      1: file2,
      length: 2,
      item: (i: number) => [file1, file2][i],
      [Symbol.iterator]: function* () {
        yield file1;
        yield file2;
      },
    } as FileList;

    const result = prepareFiles(fileList);

    expect(result.file_0).toBe(file1);
    expect(result.file_1).toBe(file2);
  });

  it('should name single file without index', () => {
    const file = new File(['content'], 'single.txt');
    const fileList = [file];

    const result = prepareFiles(fileList);

    expect(result.file).toBe(file);
  });

  it('should use custom prefix', () => {
    const file = new File(['content'], 'doc.pdf');
    const result = prepareFiles([file], 'document');

    expect(result.document).toBe(file);
  });

  it('should handle empty FileList', () => {
    const result = prepareFiles([]);

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should accept array of Files', () => {
    const files = [new File(['1'], 'a.txt'), new File(['2'], 'b.txt')];

    const result = prepareFiles(files);

    expect(Object.keys(result)).toHaveLength(2);
  });
});

describe('downloadBlobUrl', () => {
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };
  let mockAppendChild: ReturnType<typeof vi.spyOn>;
  let mockRemoveChild: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    // @ts-expect-error - Mock type incompatibility
    mockAppendChild = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
    // @ts-expect-error - Mock type incompatibility
    mockRemoveChild = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and click download link', () => {
    downloadBlobUrl('blob:http://localhost/abc123', 'file.pdf');

    // eslint-disable-next-line @typescript-eslint/no-deprecated, @typescript-eslint/unbound-method
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe('blob:http://localhost/abc123');
    expect(mockLink.download).toBe('file.pdf');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should use default filename', () => {
    downloadBlobUrl('blob:http://localhost/abc123');

    expect(mockLink.download).toBe('download');
  });

  it('should remove link after download', () => {
    downloadBlobUrl('blob:url', 'file.txt');

    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });

  it('should throw error in server environment', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally deleting window for test
    delete global.window;

    expect(() => {
      downloadBlobUrl('blob:url', 'file.txt');
    }).toThrow('downloadBlobUrl can only be used in browser environment');

    global.window = originalWindow;
  });
});

describe('downloadBinaryResponse', () => {
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as HTMLAnchorElement
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as HTMLAnchorElement
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should download BinaryResponse', () => {
    const response = {
      binaryUrl: 'blob:http://localhost/abc',
      contentType: 'application/pdf',
      filename: 'document.pdf',
    };

    downloadBinaryResponse(response);

    expect(mockLink.href).toBe('blob:http://localhost/abc');
    expect(mockLink.download).toBe('document.pdf');
  });

  it('should use default filename when not provided', () => {
    const response = {
      binaryUrl: 'blob:url',
      contentType: 'image/png',
    };

    downloadBinaryResponse(response);

    expect(mockLink.download).toBe('download');
  });
});

describe('revokeBlobUrl', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(URL.revokeObjectURL).mockClear();
  });

  it('should call URL.revokeObjectURL', () => {
    revokeBlobUrl('blob:http://localhost/abc123');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/abc123');
  });
});

describe('downloadAndCleanup', () => {
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(URL.revokeObjectURL).mockClear();

    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as HTMLAnchorElement
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as HTMLAnchorElement
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should download and revoke blob URL after delay', () => {
    const response = {
      binaryUrl: 'blob:http://localhost/abc',
      contentType: 'application/pdf',
      filename: 'doc.pdf',
    };

    downloadAndCleanup(response);

    // Immediately: download should have started
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    // After 1 second: cleanup
    vi.advanceTimersByTime(1000);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/abc');
  });
});

describe('blobUrlToBlob', () => {
  it('should load Blob from blob URL', async () => {
    const originalBlob = new Blob(['content'], { type: 'text/plain' });

    // Mock fetch to return our blob
    const mockFetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(originalBlob),
    });
    global.fetch = mockFetch;

    const resultBlob = await blobUrlToBlob('blob:http://localhost/test');

    expect(resultBlob).toBeInstanceOf(Blob);
    expect(resultBlob.type).toBe('text/plain');

    const text = await resultBlob.text();
    expect(text).toBe('content');
  });
});

describe('blobUrlToBase64', () => {
  it('should create base64 string from blob URL', async () => {
    const content = 'Hello World';
    const blob = new Blob([content], { type: 'text/plain' });

    // Mock fetch to return our blob
    const mockFetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(blob),
    });
    global.fetch = mockFetch;

    const base64 = await blobUrlToBase64('blob:http://localhost/test');

    expect(base64).toBe(btoa(content));
  });

  it('should return without data URL prefix', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' });

    // Mock fetch to return our blob
    const mockFetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(blob),
    });
    global.fetch = mockFetch;

    const base64 = await blobUrlToBase64('blob:http://localhost/test');

    expect(base64).not.toContain('data:');
    expect(base64).not.toContain(';base64,');
  });
});

describe('isBinaryResponse', () => {
  it('should return true for valid BinaryResponse', () => {
    const response = {
      binaryUrl: 'blob:http://localhost/abc',
      contentType: 'application/pdf',
    };

    expect(isBinaryResponse(response)).toBe(true);
  });

  it('should return true with optional filename', () => {
    const response = {
      binaryUrl: 'blob:url',
      contentType: 'image/png',
      filename: 'image.png',
    };

    expect(isBinaryResponse(response)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isBinaryResponse(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isBinaryResponse(undefined)).toBe(false);
  });

  it('should return false when binaryUrl is missing', () => {
    expect(isBinaryResponse({ contentType: 'text/plain' })).toBe(false);
  });

  it('should return false when contentType is missing', () => {
    expect(isBinaryResponse({ binaryUrl: 'blob:url' })).toBe(false);
  });

  it('should return false when binaryUrl is not a string', () => {
    expect(isBinaryResponse({ binaryUrl: 123, contentType: 'text/plain' })).toBe(false);
  });

  it('should return false for regular objects', () => {
    expect(isBinaryResponse({ data: 'value' })).toBe(false);
    expect(isBinaryResponse({ url: 'https://example.com' })).toBe(false);
  });
});

describe('isBinaryContentType', () => {
  it('should return true for application/octet-stream', () => {
    expect(isBinaryContentType('application/octet-stream')).toBe(true);
  });

  it('should return true for application/pdf', () => {
    expect(isBinaryContentType('application/pdf')).toBe(true);
  });

  it('should return true for image/* types', () => {
    expect(isBinaryContentType('image/png')).toBe(true);
    expect(isBinaryContentType('image/jpeg')).toBe(true);
    expect(isBinaryContentType('image/gif')).toBe(true);
    expect(isBinaryContentType('image/webp')).toBe(true);
  });

  it('should return true for audio/* types', () => {
    expect(isBinaryContentType('audio/mpeg')).toBe(true);
    expect(isBinaryContentType('audio/wav')).toBe(true);
  });

  it('should return true for video/* types', () => {
    expect(isBinaryContentType('video/mp4')).toBe(true);
    expect(isBinaryContentType('video/webm')).toBe(true);
  });

  it('should return true for application/zip', () => {
    expect(isBinaryContentType('application/zip')).toBe(true);
  });

  it('should return true for application/gzip', () => {
    expect(isBinaryContentType('application/gzip')).toBe(true);
  });

  it('should return false for text/plain', () => {
    expect(isBinaryContentType('text/plain')).toBe(false);
  });

  it('should return false for application/json', () => {
    expect(isBinaryContentType('application/json')).toBe(false);
  });

  it('should return false for text/html', () => {
    expect(isBinaryContentType('text/html')).toBe(false);
  });
});

describe('isImageFile', () => {
  it('should return true for image Files', () => {
    expect(isImageFile(new File([''], 'test.png', { type: 'image/png' }))).toBe(true);
    expect(isImageFile(new File([''], 'test.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(isImageFile(new File([''], 'test.gif', { type: 'image/gif' }))).toBe(true);
  });

  it('should return true for image Blobs', () => {
    expect(isImageFile(new Blob([''], { type: 'image/webp' }))).toBe(true);
  });

  it('should return false for non-image Files', () => {
    expect(isImageFile(new File([''], 'test.pdf', { type: 'application/pdf' }))).toBe(false);
    expect(isImageFile(new File([''], 'test.txt', { type: 'text/plain' }))).toBe(false);
  });
});

describe('getFileExtension', () => {
  it('should extract extension from filename', () => {
    expect(getFileExtension('document.pdf')).toBe('pdf');
    expect(getFileExtension('image.PNG')).toBe('png');
    expect(getFileExtension('file.tar.gz')).toBe('gz');
  });

  it('should derive extension from MIME type', () => {
    expect(getFileExtension(undefined, 'application/pdf')).toBe('pdf');
    expect(getFileExtension(undefined, 'image/jpeg')).toBe('jpg');
    expect(getFileExtension(undefined, 'image/png')).toBe('png');
    expect(getFileExtension(undefined, 'text/plain')).toBe('txt');
  });

  it('should prioritize filename over MIME type', () => {
    expect(getFileExtension('file.doc', 'application/pdf')).toBe('doc');
  });

  it('should return undefined when no extension', () => {
    expect(getFileExtension('noextension')).toBeUndefined();
    expect(getFileExtension(undefined, 'unknown/type')).toBeUndefined();
    expect(getFileExtension()).toBeUndefined();
  });
});
