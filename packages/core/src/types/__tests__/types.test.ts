import { describe, it, expect, vi } from 'vitest';
import type {
  N8nClientOptions,
  N8nProviderConfig,
  PollingOptions,
  PersistMode,
  CreateN8nActionOptions,
  ExecuteOptions,
  WorkflowStatus,
  UseWorkflowOptions,
  UseWorkflowReturn,
  WorkflowResult,
  BinaryResponse,
  PollingStatusResponse,
  N8nErrorCode,
  N8nErrorDetails,
  N8nServerAction,
} from '../index';
import { N8nError, isN8nError } from '../index';

describe('Type Exports', () => {
  it('should export all Config types', () => {
    // TypeScript compile-time test - if it compiles, the test passes
    const clientOptions: N8nClientOptions = {
      baseUrl: 'https://test.com',
    };
    expect(clientOptions.baseUrl).toBe('https://test.com');
  });

  it('should export all Workflow types', () => {
    const status: WorkflowStatus = 'idle';
    expect(['idle', 'running', 'success', 'error']).toContain(status);
  });

  it('should export all Error types', () => {
    const errorCode: N8nErrorCode = 'NETWORK_ERROR';
    expect(errorCode).toBe('NETWORK_ERROR');
  });
});

describe('N8nClientOptions', () => {
  it('should have baseUrl as required', () => {
    const options: N8nClientOptions = {
      baseUrl: 'https://n8n.example.com',
    };
    expect(options.baseUrl).toBeDefined();
  });

  it('should accept optional headers', () => {
    const options: N8nClientOptions = {
      baseUrl: 'https://n8n.example.com',
      headers: { 'X-Custom': 'value' },
    };
    expect(options.headers).toEqual({ 'X-Custom': 'value' });
  });

  it('should accept optional timeout', () => {
    const options: N8nClientOptions = {
      baseUrl: 'https://n8n.example.com',
      timeout: 60000,
    };
    expect(options.timeout).toBe(60000);
  });

  it('should accept optional apiToken', () => {
    const options: N8nClientOptions = {
      baseUrl: 'https://n8n.example.com',
      apiToken: 'secret-token',
    };
    expect(options.apiToken).toBe('secret-token');
  });
});

describe('N8nProviderConfig', () => {
  it('should accept minimal configuration', () => {
    const config: N8nProviderConfig = {};
    expect(config).toBeDefined();
  });

  it('should accept all optional fields', () => {
    // Cast to N8nServerAction to satisfy the generic function type
    const mockServerAction = (() => Promise.resolve({ success: true })) as N8nServerAction;

    const config: N8nProviderConfig = {
      baseUrl: 'https://n8n.example.com',
      apiToken: 'token',
      headers: { 'X-Custom': 'value' },
      timeout: 30000,
      useServerProxy: true,
      serverAction: mockServerAction,
      defaultPolling: { enabled: true, interval: 2000 },
      defaultPersist: 'session',
    };

    expect(config.useServerProxy).toBe(true);
  });
});

describe('PollingOptions', () => {
  it('should accept all polling options', () => {
    const progressCallback = vi.fn();

    const options: PollingOptions = {
      enabled: true,
      interval: 2000,
      timeout: 60000,
      maxAttempts: 30,
      onProgress: progressCallback,
      statusEndpoint: '/status',
      exponentialBackoff: true,
      maxInterval: 30000,
    };

    expect(options.enabled).toBe(true);
    expect(options.exponentialBackoff).toBe(true);
  });

  it('should accept empty options', () => {
    const options: PollingOptions = {};
    expect(options).toBeDefined();
  });
});

describe('PersistMode', () => {
  it('should accept "session"', () => {
    const mode: PersistMode = 'session';
    expect(mode).toBe('session');
  });

  it('should accept "local"', () => {
    const mode: PersistMode = 'local';
    expect(mode).toBe('local');
  });

  it('should accept false', () => {
    const mode: PersistMode = false;
    expect(mode).toBe(false);
  });
});

describe('CreateN8nActionOptions', () => {
  it('should have webhookUrl as required', () => {
    const options: CreateN8nActionOptions = {
      webhookUrl: 'https://n8n.example.com/webhook',
    };
    expect(options.webhookUrl).toBeDefined();
  });

  it('should accept all optional fields', () => {
    const validateFn = vi.fn().mockReturnValue(true);

    const options: CreateN8nActionOptions = {
      webhookUrl: 'https://n8n.example.com/webhook',
      apiToken: 'secret-token',
      headers: { 'X-Custom': 'value' },
      timeout: 30000,
      allowedPaths: ['/contact-form', '/newsletter-signup'],
      validate: validateFn,
    };

    expect(options.allowedPaths).toHaveLength(2);
  });
});

describe('ExecuteOptions', () => {
  it('should support generic types', () => {
    interface MyInput {
      name: string;
      email: string;
    }

    const options: ExecuteOptions<MyInput> = {
      data: { name: 'John', email: 'john@example.com' },
    };

    expect(options.data?.name).toBe('John');
  });

  it('should accept files', () => {
    const mockFile = new File(['content'], 'test.txt');

    const options: ExecuteOptions = {
      files: { document: mockFile },
    };

    expect(options.files?.document).toBe(mockFile);
  });

  it('should accept HTTP methods', () => {
    const methods: Array<ExecuteOptions['method']> = ['GET', 'POST', 'PUT', 'DELETE'];

    methods.forEach((method) => {
      const options: ExecuteOptions = { method };
      expect(options.method).toBe(method);
    });
  });

  it('should accept all optional fields', () => {
    const options: ExecuteOptions = {
      data: { test: true },
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      polling: { enabled: true, interval: 2000 },
    };

    expect(options.polling?.enabled).toBe(true);
  });
});

describe('WorkflowStatus', () => {
  it('should have all valid status values', () => {
    const statuses: WorkflowStatus[] = ['idle', 'running', 'success', 'error'];

    statuses.forEach((status) => {
      expect(['idle', 'running', 'success', 'error']).toContain(status);
    });
  });
});

describe('UseWorkflowOptions', () => {
  it('should accept all optional fields', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onStatusChange = vi.fn();

    const options: UseWorkflowOptions<{ input: string }, { output: string }> = {
      polling: { enabled: true },
      persist: 'session',
      onSuccess,
      onError,
      onStatusChange,
      manual: true,
      initialData: { input: 'test' },
    };

    expect(options.manual).toBe(true);
    expect(options.initialData?.input).toBe('test');
  });
});

describe('UseWorkflowReturn', () => {
  it('should have all return values defined', () => {
    // Mock implementation for type verification
    const mockReturn: UseWorkflowReturn<{ input: string }, { output: string }> = {
      execute: vi.fn().mockResolvedValue({ output: 'result' }),
      status: 'idle',
      data: null,
      error: null,
      progress: 0,
      isLoading: false,
      reset: vi.fn(),
      cancel: vi.fn(),
    };

    expect(mockReturn.status).toBe('idle');
    expect(mockReturn.isLoading).toBe(false);
    expect(typeof mockReturn.execute).toBe('function');
    expect(typeof mockReturn.reset).toBe('function');
    expect(typeof mockReturn.cancel).toBe('function');
  });
});

describe('WorkflowResult', () => {
  it('should have data and meta fields', () => {
    const result: WorkflowResult<{ processed: boolean }> = {
      data: { processed: true },
      meta: {
        executionId: 'exec-123',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        finishedAt: new Date('2024-01-01T10:00:05Z'),
        duration: 5000,
      },
    };

    expect(result.data.processed).toBe(true);
    expect(result.meta.executionId).toBe('exec-123');
    expect(result.meta.duration).toBe(5000);
  });
});

describe('BinaryResponse', () => {
  it('should have binaryUrl and contentType', () => {
    const response: BinaryResponse = {
      binaryUrl: 'blob:http://localhost/abc123',
      contentType: 'application/pdf',
    };

    expect(response.binaryUrl).toBeDefined();
    expect(response.contentType).toBeDefined();
  });

  it('should have optional filename', () => {
    const response: BinaryResponse = {
      binaryUrl: 'blob:http://localhost/abc123',
      contentType: 'application/pdf',
      filename: 'document.pdf',
    };

    expect(response.filename).toBe('document.pdf');
  });
});

describe('PollingStatusResponse', () => {
  it('should have status field', () => {
    const runningResponse: PollingStatusResponse = {
      status: 'running',
      progress: 50,
    };

    const completeResponse: PollingStatusResponse = {
      status: 'complete',
      result: { data: 'success' },
    };

    const errorResponse: PollingStatusResponse = {
      status: 'error',
      error: 'Something went wrong',
    };

    expect(runningResponse.status).toBe('running');
    expect(completeResponse.status).toBe('complete');
    expect(errorResponse.status).toBe('error');
  });
});

describe('N8nErrorCode', () => {
  it('should have all error codes defined', () => {
    const errorCodes: N8nErrorCode[] = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'WORKFLOW_ERROR',
      'VALIDATION_ERROR',
      'AUTH_ERROR',
      'NOT_FOUND',
      'SERVER_ERROR',
      'POLLING_ERROR',
      'UNKNOWN',
    ];

    errorCodes.forEach((code) => {
      const details: N8nErrorDetails = { code };
      expect(details.code).toBe(code);
    });
  });
});

describe('N8nErrorDetails', () => {
  it('should accept all optional fields', () => {
    const details: N8nErrorDetails = {
      code: 'WORKFLOW_ERROR',
      statusCode: 500,
      executionId: 'exec-123',
      nodeName: 'HTTP Request',
      details: { message: 'External API returned 404' },
    };

    expect(details.code).toBe('WORKFLOW_ERROR');
    expect(details.statusCode).toBe(500);
    expect(details.executionId).toBe('exec-123');
    expect(details.nodeName).toBe('HTTP Request');
  });
});

describe('N8nError', () => {
  it('should create error with message and details', () => {
    const error = new N8nError('Workflow failed', {
      code: 'WORKFLOW_ERROR',
      statusCode: 500,
      executionId: 'exec-123',
    });

    expect(error.message).toBe('Workflow failed');
    expect(error.code).toBe('WORKFLOW_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.executionId).toBe('exec-123');
    expect(error.name).toBe('N8nError');
  });

  it('should be instanceof Error', () => {
    const error = new N8nError('Test error', { code: 'UNKNOWN' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(N8nError);
  });
});

describe('Type Guards', () => {
  it('should detect N8nError with isN8nError', () => {
    const n8nError = new N8nError('Test error', { code: 'NETWORK_ERROR' });
    const genericError = new Error('Generic error');

    expect(isN8nError(n8nError)).toBe(true);
    expect(isN8nError(genericError)).toBe(false);
    expect(isN8nError(null)).toBe(false);
    expect(isN8nError(undefined)).toBe(false);
    expect(isN8nError('string')).toBe(false);
  });
});

describe('N8nServerAction', () => {
  it('should be callable with webhookPath and options', async () => {
    const mockAction: N8nServerAction = vi.fn().mockResolvedValue({ success: true });

    const result = await mockAction('/webhook/test', {
      data: { name: 'John' },
      method: 'POST',
    });

    expect(mockAction).toHaveBeenCalledWith('/webhook/test', {
      data: { name: 'John' },
      method: 'POST',
    });
    expect(result).toEqual({ success: true });
  });
});
