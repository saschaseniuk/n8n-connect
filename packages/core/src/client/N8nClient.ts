import type { N8nClientOptions, ExecuteOptions, BinaryResponse } from '../types';
import { createErrorFromResponse, wrapError, createTimeoutError } from '../errors';

/**
 * HTTP client for executing n8n webhooks.
 *
 * @example
 * ```typescript
 * const client = new N8nClient({ baseUrl: 'https://n8n.example.com' });
 * const result = await client.execute('/webhook/process', {
 *   data: { name: 'John' },
 * });
 * ```
 */
export class N8nClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultTimeout: number;

  constructor(options: N8nClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultTimeout = options.timeout ?? 30000;

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.apiToken) {
      this.defaultHeaders['Authorization'] = `Bearer ${options.apiToken}`;
    }
  }

  /**
   * Execute a webhook request to an n8n workflow.
   *
   * @typeParam TInput - The input data type
   * @typeParam TOutput - The expected output data type
   * @param webhookPath - The webhook path (e.g., '/my-webhook' or 'my-webhook')
   * @param options - Request options including data, files, method, headers, and timeout
   * @returns The workflow response
   */
  async execute<TInput = unknown, TOutput = unknown>(
    webhookPath: string,
    options: ExecuteOptions<TInput> = {}
  ): Promise<TOutput> {
    const {
      data,
      files,
      method = 'POST',
      headers = {},
      timeout = this.defaultTimeout,
    } = options;

    const url = this.buildUrl(webhookPath);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const requestInit = this.buildRequest(method, data, files, headers);
      requestInit.signal = controller.signal;

      const response = await fetch(url, requestInit);

      if (!response.ok) {
        throw await createErrorFromResponse(response);
      }

      return await this.parseResponse<TOutput>(response);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw createTimeoutError(timeout);
      }
      throw wrapError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(webhookPath: string): string {
    const path = webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`;
    return `${this.baseUrl}${path}`;
  }

  private buildRequest(
    method: string,
    data: unknown,
    files: Record<string, File | Blob> | undefined,
    headers: Record<string, string>
  ): RequestInit {
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    // If files present, use FormData
    if (files && Object.keys(files).length > 0) {
      const formData = new FormData();

      // Add JSON data as 'data' field
      if (data !== undefined) {
        formData.append('data', JSON.stringify(data));
      }

      // Add files
      for (const [key, file] of Object.entries(files)) {
        formData.append(key, file);
      }

      // Remove Content-Type to let browser set multipart boundary
      delete requestHeaders['Content-Type'];

      return {
        method,
        headers: requestHeaders,
        body: formData,
      };
    }

    // JSON body
    return {
      method,
      headers: requestHeaders,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    };
  }

  private async parseResponse<TOutput>(response: Response): Promise<TOutput> {
    const contentType = response.headers.get('Content-Type') || '';

    // Binary response - create blob URL
    if (this.isBinaryContentType(contentType)) {
      const blob = await response.blob();
      const binaryUrl = URL.createObjectURL(blob);
      const filename = this.extractFilename(response);

      return {
        binaryUrl,
        contentType,
        filename,
      } as BinaryResponse as TOutput;
    }

    // JSON response
    if (contentType.includes('application/json')) {
      return response.json() as Promise<TOutput>;
    }

    // Text response
    const text = await response.text();
    return text as TOutput;
  }

  private isBinaryContentType(contentType: string): boolean {
    const binaryTypes = [
      'application/octet-stream',
      'application/pdf',
      'image/',
      'audio/',
      'video/',
      'application/zip',
      'application/gzip',
    ];
    return binaryTypes.some((type) => contentType.includes(type));
  }

  private extractFilename(response: Response): string | undefined {
    const disposition = response.headers.get('Content-Disposition');
    if (!disposition) return undefined;

    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    return match?.[1]?.replace(/['"]/g, '');
  }
}
