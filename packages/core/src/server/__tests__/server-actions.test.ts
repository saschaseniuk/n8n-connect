import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createN8nAction } from '../createN8nAction';
import { N8nError } from '../../errors';
import { createN8nClient } from '../../client';

// Mock the client module
vi.mock('../../client', () => ({
  createN8nClient: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

const mockClientExecute = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockClientExecute.mockResolvedValue({ success: true });
  (createN8nClient as ReturnType<typeof vi.fn>).mockReturnValue({
    execute: mockClientExecute,
  });
});

describe('createN8nAction', () => {
  it('should return a server action function', () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    expect(typeof action).toBe('function');
  });

  it('should throw error when webhookUrl is missing', () => {
    expect(() => {
      // @ts-expect-error - Testing invalid input
      createN8nAction({});
    }).toThrow('webhookUrl is required');
  });

  it('should throw error when webhookUrl is empty', () => {
    expect(() => {
      createN8nAction({ webhookUrl: '' });
    }).toThrow('webhookUrl is required');
  });

  it('should create N8nClient with correct options', () => {
    createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      apiToken: 'test-token',
      headers: { 'X-Custom': 'value' },
      timeout: 60000,
    });

    expect(createN8nClient).toHaveBeenCalledWith({
      baseUrl: 'https://n8n.example.com/webhook',
      apiToken: 'test-token',
      headers: { 'X-Custom': 'value' },
      timeout: 60000,
    });
  });
});

describe('Server Action Execution', () => {
  it('should execute workflow successfully', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    const result = await action('/my-workflow', {
      data: { foo: 'bar' },
    });

    expect(result).toEqual({ success: true });
    expect(mockClientExecute).toHaveBeenCalledWith('/my-workflow', {
      data: { foo: 'bar' },
    });
  });

  it('should work without options', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    await action('/simple-webhook');

    expect(mockClientExecute).toHaveBeenCalledWith('/simple-webhook', undefined);
  });

  it('should pass files to client', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    const file = new File(['content'], 'test.txt');

    await action('/upload', {
      data: { title: 'Doc' },
      files: { document: file },
    });

    expect(mockClientExecute).toHaveBeenCalledWith('/upload', {
      data: { title: 'Doc' },
      files: { document: file },
    });
  });
});

describe('allowedPaths Validation', () => {
  it('should execute allowed path', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: ['/allowed', '/also-allowed'],
    });

    await action('/allowed', { data: {} });

    expect(mockClientExecute).toHaveBeenCalled();
  });

  it('should block disallowed path', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: ['/allowed'],
    });

    await expect(action('/not-allowed', { data: {} })).rejects.toThrow(
      'Path not allowed'
    );
  });

  it('should throw VALIDATION_ERROR code for blocked path', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: ['/allowed'],
    });

    await expect(action('/forbidden', {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 403,
    });
  });

  it('should normalize path with leading slash', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: ['/test'],
    });

    // Both should work
    await action('/test', {});
    await action('test', {});

    expect(mockClientExecute).toHaveBeenCalledTimes(2);
  });

  it('should support wildcard paths', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: ['/api/*'],
    });

    await action('/api/users', {});
    await action('/api/orders', {});
    await action('/api/deep/nested/path', {});

    expect(mockClientExecute).toHaveBeenCalledTimes(3);
  });

  it('should block paths outside wildcard', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: ['/api/*'],
    });

    await expect(action('/other', {})).rejects.toThrow('Path not allowed');
    await expect(action('/ap', {})).rejects.toThrow('Path not allowed');
  });

  it('should allow all paths when allowedPaths is not set', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    await action('/any/path', {});
    await action('/completely/random', {});

    expect(mockClientExecute).toHaveBeenCalledTimes(2);
  });

  it('should allow all paths when allowedPaths is empty', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: [],
    });

    await action('/any/path', {});

    expect(mockClientExecute).toHaveBeenCalled();
  });
});

describe('Custom validate Function', () => {
  it('should call custom validation', async () => {
    const validateFn = vi.fn().mockReturnValue(true);

    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      validate: validateFn,
    });

    await action('/test', { data: { foo: 'bar' } });

    expect(validateFn).toHaveBeenCalledWith('/test', { foo: 'bar' });
  });

  it('should block request when validation returns false', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      validate: () => false,
    });

    await expect(action('/test', { data: {} })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  });

  it('should support async validation', async () => {
    const asyncValidate = vi.fn().mockResolvedValue(true);

    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      validate: asyncValidate,
    });

    await action('/test', { data: { valid: true } });

    expect(asyncValidate).toHaveBeenCalled();
    expect(mockClientExecute).toHaveBeenCalled();
  });

  it('should handle async validation rejection', async () => {
    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      validate: async () => {
        await new Promise(r => setTimeout(r, 10));
        return false;
      },
    });

    await expect(action('/test', {})).rejects.toThrow('Validation failed');
  });

  it('should check validation after allowedPaths', async () => {
    const validateFn = vi.fn().mockReturnValue(true);

    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
      allowedPaths: ['/allowed'],
      validate: validateFn,
    });

    // Path not allowed - validation should not be called
    try {
      await action('/not-allowed', {});
    } catch {
      // Expected to throw
    }

    expect(validateFn).not.toHaveBeenCalled();

    // Path allowed - validation should be called
    await action('/allowed', { data: {} });

    expect(validateFn).toHaveBeenCalled();
  });
});

describe('Error Handling', () => {
  it('should pass through N8nError unchanged', async () => {
    const originalError = new N8nError('Workflow failed', {
      code: 'WORKFLOW_ERROR',
      statusCode: 500,
      executionId: 'exec123',
    });

    mockClientExecute.mockRejectedValueOnce(originalError);

    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    await expect(action('/test', {})).rejects.toBe(originalError);
  });

  it('should wrap unknown errors', async () => {
    mockClientExecute.mockRejectedValueOnce(new Error('Unknown error'));

    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    await expect(action('/test', {})).rejects.toBeInstanceOf(N8nError);
  });

  describe('Production Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should sanitize error details in production', async () => {
      const detailedError = new N8nError('Detailed internal error', {
        code: 'SERVER_ERROR',
        statusCode: 500,
        details: { sensitive: 'data' },
        executionId: 'exec123',
        nodeName: 'Internal Node',
      });

      mockClientExecute.mockRejectedValueOnce(detailedError);

      const action = createN8nAction({
        webhookUrl: 'https://n8n.example.com/webhook',
      });

      try {
        await action('/test', {});
      } catch (error: unknown) {
        const n8nError = error as N8nError;
        expect(n8nError.message).toBe('An error occurred processing your request');
        expect(n8nError.code).toBe('SERVER_ERROR');
        expect(n8nError.details).toBeUndefined();
        expect(n8nError.executionId).toBeUndefined();
        expect(n8nError.nodeName).toBeUndefined();
      }
    });
  });

  describe('Development Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should keep error details in development', async () => {
      const detailedError = new N8nError('Detailed error', {
        code: 'WORKFLOW_ERROR',
        details: { debug: 'info' },
        executionId: 'exec123',
      });

      mockClientExecute.mockRejectedValueOnce(detailedError);

      const action = createN8nAction({
        webhookUrl: 'https://n8n.example.com/webhook',
      });

      await expect(action('/test', {})).rejects.toMatchObject({
        details: { debug: 'info' },
        executionId: 'exec123',
      });
    });
  });
});

describe('TypeScript Signatures', () => {
  it('should have correct generic types', async () => {
    interface Input {
      email: string;
      name: string;
    }

    interface Output {
      userId: string;
      created: boolean;
    }

    const action = createN8nAction({
      webhookUrl: 'https://n8n.example.com/webhook',
    });

    mockClientExecute.mockResolvedValueOnce({ userId: 'u123', created: true });

    const result = await action<Input, Output>('/create-user', {
      data: { email: 'test@example.com', name: 'Test User' },
    });

    // TypeScript should recognize these properties
    expect(result.userId).toBe('u123');
    expect(result.created).toBe(true);
  });
});

describe('Integration: Server Action with Next.js', () => {
  it('should work as Next.js Server Action', async () => {
    // Simulates usage in a Server Action file
    // 'use server' directive cannot be tested here (Next.js specific)

    const action = createN8nAction({
      webhookUrl: process.env.N8N_WEBHOOK_URL || 'https://n8n.example.com',
      apiToken: process.env.N8N_API_TOKEN,
      allowedPaths: ['/process-form', '/send-email'],
    });

    // Simulate call from a client component
    mockClientExecute.mockResolvedValueOnce({ processed: true });

    const result = await action('/process-form', {
      data: { email: 'user@example.com', message: 'Hello' },
    });

    expect(result).toEqual({ processed: true });
  });
});
