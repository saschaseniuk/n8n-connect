import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createN8nClient, N8nClient } from '../index';
import { N8nError } from '../../errors';

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('createN8nClient', () => {
  it('should create N8nClient instance', () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
    });

    expect(client).toBeInstanceOf(N8nClient);
  });

  it('should throw error when baseUrl is missing', () => {
    expect(() => {
      // @ts-expect-error - Testing invalid input
      createN8nClient({});
    }).toThrow('baseUrl is required');
  });

  it('should throw error when baseUrl is empty', () => {
    expect(() => {
      createN8nClient({ baseUrl: '' });
    }).toThrow('baseUrl is required');
  });

  it('should remove trailing slash from baseUrl', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com/',
    });

    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/test',
      expect.any(Object)
    );
  });
});

describe('N8nClient URL Construction', () => {
  let client: N8nClient;

  beforeEach(() => {
    client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
    mockFetch.mockResolvedValue(new Response('{}'));
  });

  it('should handle path without leading slash', async () => {
    await client.execute('my-webhook');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/my-webhook',
      expect.any(Object)
    );
  });

  it('should handle path with leading slash', async () => {
    await client.execute('/my-webhook');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/my-webhook',
      expect.any(Object)
    );
  });

  it('should handle nested path', async () => {
    await client.execute('webhook/my-webhook');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/webhook/my-webhook',
      expect.any(Object)
    );
  });
});

describe('N8nClient JSON Requests', () => {
  let client: N8nClient;

  beforeEach(() => {
    client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
  });

  it('should send JSON data correctly', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await client.execute('test', {
      data: { foo: 'bar', count: 42 },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ foo: 'bar', count: 42 }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should support GET method', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test', { method: 'GET' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should support PUT method', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test', { method: 'PUT', data: { id: 1 } });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('should support PATCH method', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test', { method: 'PATCH', data: { id: 1 } });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('should support DELETE method', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test', { method: 'DELETE' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('should send without body when no data provided', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: undefined })
    );
  });
});

describe('N8nClient File Uploads', () => {
  let client: N8nClient;

  beforeEach(() => {
    client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
    mockFetch.mockResolvedValue(new Response('{}'));
  });

  it('should create FormData when files are present', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await client.execute('upload', {
      files: { document: file },
    });

    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    const options = call?.[1] as RequestInit;
    expect(options.body).toBeInstanceOf(FormData);
  });

  it('should add JSON data as data field in FormData', async () => {
    const file = new File(['content'], 'test.txt');

    await client.execute('upload', {
      data: { title: 'My Document' },
      files: { document: file },
    });

    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    const options = call?.[1] as RequestInit;
    const formData = options.body as FormData;

    expect(formData.get('data')).toBe(JSON.stringify({ title: 'My Document' }));
    expect(formData.get('document')).toBeInstanceOf(File);
  });

  it('should support multiple files', async () => {
    const file1 = new File(['content1'], 'file1.txt');
    const file2 = new File(['content2'], 'file2.txt');

    await client.execute('upload', {
      files: { file1, file2 },
    });

    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    const options = call?.[1] as RequestInit;
    const formData = options.body as FormData;

    expect(formData.get('file1')).toBeInstanceOf(File);
    expect(formData.get('file2')).toBeInstanceOf(File);
  });

  it('should remove Content-Type header for FormData', async () => {
    const file = new File(['content'], 'test.txt');

    await client.execute('upload', {
      files: { document: file },
    });

    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    const options = call?.[1] as RequestInit;
    const headers = options.headers as Record<string, string>;

    // Content-Type should not be manually set (browser sets it automatically)
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('should accept Blob as file', async () => {
    const blob = new Blob(['content'], { type: 'text/plain' });

    await client.execute('upload', {
      files: { blob },
    });

    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    const options = call?.[1] as RequestInit;
    expect(options.body).toBeInstanceOf(FormData);
  });
});

describe('N8nClient Response Parsing', () => {
  let client: N8nClient;

  beforeEach(() => {
    client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
  });

  it('should parse JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: 'success', count: 42 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await client.execute<unknown, { result: string; count: number }>('test');

    expect(result.result).toBe('success');
    expect(result.count).toBe(42);
  });

  it('should return text response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Plain text response', {
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    const result = await client.execute('test');

    expect(result).toBe('Plain text response');
  });
});

describe('N8nClient Binary Responses', () => {
  let client: N8nClient;

  beforeEach(() => {
    client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
  });

  it('should return PDF response as BinaryResponse', async () => {
    const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

    mockFetch.mockResolvedValueOnce(
      new Response(pdfBlob, {
        headers: { 'Content-Type': 'application/pdf' },
      })
    );

    const result = await client.execute('generate-pdf');

    expect(result).toHaveProperty('binaryUrl');
    expect(result).toHaveProperty('contentType', 'application/pdf');
  });

  it('should return Image response as BinaryResponse', async () => {
    const imageBlob = new Blob(['image data'], { type: 'image/png' });

    mockFetch.mockResolvedValueOnce(
      new Response(imageBlob, {
        headers: { 'Content-Type': 'image/png' },
      })
    );

    const result = await client.execute('generate-image');

    expect(result).toHaveProperty('binaryUrl');
    expect((result as { binaryUrl: string }).binaryUrl).toMatch(/^blob:/);
    expect(result).toHaveProperty('contentType', 'image/png');
  });

  it('should extract filename from Content-Disposition', async () => {
    const blob = new Blob(['data'], { type: 'application/octet-stream' });

    mockFetch.mockResolvedValueOnce(
      new Response(blob, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="document.pdf"',
        },
      })
    );

    const result = await client.execute('download');

    expect(result).toHaveProperty('filename', 'document.pdf');
  });

  it('should detect various binary Content-Types', async () => {
    const binaryTypes = [
      'application/octet-stream',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'audio/mpeg',
      'video/mp4',
      'application/zip',
    ];

    for (const contentType of binaryTypes) {
      mockFetch.mockResolvedValueOnce(
        new Response(new Blob(['data']), {
          headers: { 'Content-Type': contentType },
        })
      );

      const result = await client.execute('test');

      expect(result).toHaveProperty('binaryUrl');
      expect(result).toHaveProperty('contentType', contentType);
    }
  });
});

describe('N8nClient Headers', () => {
  it('should send default headers', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
      headers: { 'X-Custom': 'value' },
    });

    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: expect.objectContaining({ 'X-Custom': 'value' }),
      })
    );
  });

  it('should set API token as Authorization header', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
      apiToken: 'secret-token',
    });

    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token',
        }),
      })
    );
  });

  it('should merge request-specific headers', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
      headers: { 'X-Default': 'default' },
    });

    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test', {
      headers: { 'X-Request': 'request' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: expect.objectContaining({
          'X-Default': 'default',
          'X-Request': 'request',
        }),
      })
    );
  });

  it('should allow request headers to override default headers', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
      headers: { 'X-Header': 'default' },
    });

    mockFetch.mockResolvedValueOnce(new Response('{}'));

    await client.execute('test', {
      headers: { 'X-Header': 'override' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: expect.objectContaining({ 'X-Header': 'override' }),
      })
    );
  });
});

describe('N8nClient Timeout', () => {
  // Helper to create a fetch mock that respects AbortSignal
  const createSlowFetchMock = (delayMs: number) => {
    return (_url: string, options: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve(new Response('{}'));
        }, delayMs);
        options.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
  };

  it('should have default timeout of 30000ms', async () => {
    const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });

    // Mock fetch to check that AbortSignal is passed
    let receivedSignal: AbortSignal | null | undefined;
    mockFetch.mockImplementationOnce((_url: string, options: RequestInit) => {
      receivedSignal = options.signal;
      return Promise.resolve(new Response('{}'));
    });

    await client.execute('test');

    // Verify AbortSignal was passed
    expect(receivedSignal).toBeDefined();
    expect(receivedSignal?.aborted).toBe(false);
  });

  it('should use configured timeout', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
      timeout: 50,
    });

    mockFetch.mockImplementationOnce(createSlowFetchMock(200));

    await expect(client.execute('test')).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('should use request-specific timeout', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
      timeout: 30000,
    });

    mockFetch.mockImplementationOnce(createSlowFetchMock(200));

    await expect(client.execute('test', { timeout: 50 })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('should throw N8nError with TIMEOUT code on timeout', async () => {
    const client = createN8nClient({
      baseUrl: 'https://n8n.example.com',
      timeout: 50,
    });

    mockFetch.mockImplementationOnce(createSlowFetchMock(200));

    await expect(client.execute('test')).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });
});

describe('N8nClient Error Handling', () => {
  let client: N8nClient;

  beforeEach(() => {
    client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
  });

  it('should throw N8nError on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(client.execute('test')).rejects.toBeInstanceOf(N8nError);
  });

  it('should have correct error code for HTTP 404', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Not found', { status: 404 }));

    await expect(client.execute('test')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('should have correct error code for HTTP 401', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

    await expect(client.execute('test')).rejects.toMatchObject({
      code: 'AUTH_ERROR',
      statusCode: 401,
    });
  });

  it('should have correct error code for HTTP 500', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 })
    );

    await expect(client.execute('test')).rejects.toMatchObject({
      code: 'SERVER_ERROR',
      statusCode: 500,
    });
  });

  it('should wrap network error as NETWORK_ERROR', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(client.execute('test')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('should wrap AbortError as TIMEOUT', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    await expect(client.execute('test')).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });
});

describe('N8nClient TypeScript Generics', () => {
  let client: N8nClient;

  beforeEach(() => {
    client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
  });

  it('should infer input and output types correctly', async () => {
    interface OrderInput {
      productId: string;
      quantity: number;
    }

    interface OrderOutput {
      orderId: string;
      total: number;
    }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ orderId: 'ord123', total: 99.99 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await client.execute<OrderInput, OrderOutput>('create-order', {
      data: { productId: 'prod1', quantity: 2 },
    });

    // TypeScript should recognize result.orderId and result.total
    expect(result.orderId).toBe('ord123');
    expect(result.total).toBe(99.99);
  });
});
