import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionsClient } from '../ExecutionsClient';
import { executeAndPoll } from '../executeAndPoll';
import { N8nError } from '../../errors';
import type { N8nClient } from '../../client';

describe('ExecutionsClient', () => {
  const baseUrl = 'https://n8n.example.com';
  const apiToken = 'test-api-token';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw if apiToken is not provided', () => {
      expect(() => new ExecutionsClient(baseUrl, '')).toThrow(N8nError);
      expect(() => new ExecutionsClient(baseUrl, '')).toThrow(
        'API token is required'
      );
    });

    it('should create client with valid parameters', () => {
      const client = new ExecutionsClient(baseUrl, apiToken);
      expect(client).toBeInstanceOf(ExecutionsClient);
    });

    it('should normalize baseUrl by removing trailing slash', () => {
      const client = new ExecutionsClient('https://n8n.example.com/', apiToken);
      expect(client).toBeInstanceOf(ExecutionsClient);
    });
  });

  describe('getExecution', () => {
    it('should fetch execution by ID', async () => {
      const mockExecution = {
        id: '123',
        finished: true,
        mode: 'webhook',
        status: 'success',
        startedAt: '2024-01-15T10:00:00.000Z',
        stoppedAt: '2024-01-15T10:00:05.000Z',
        workflowId: '1',
        workflowName: 'Test Workflow',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExecution),
      });

      const client = new ExecutionsClient(baseUrl, apiToken);
      const result = await client.getExecution('123');

      expect(fetch).toHaveBeenCalledWith(
        'https://n8n.example.com/api/v1/executions/123',
        expect.objectContaining({
          headers: {
            'X-N8N-API-KEY': apiToken,
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result.executionId).toBe('123');
      expect(result.status).toBe('success');
      expect(result.finished).toBe(true);
      expect(result.workflowName).toBe('Test Workflow');
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.stoppedAt).toBeInstanceOf(Date);
      expect(result.duration).toBe(5000);
    });

    it('should throw NOT_FOUND error for 404 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const client = new ExecutionsClient(baseUrl, apiToken);

      await expect(client.getExecution('999')).rejects.toThrow(N8nError);
      await expect(client.getExecution('999')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw AUTH_ERROR for 401 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const client = new ExecutionsClient(baseUrl, apiToken);

      await expect(client.getExecution('123')).rejects.toThrow(N8nError);
      await expect(client.getExecution('123')).rejects.toMatchObject({
        code: 'AUTH_ERROR',
      });
    });

    it('should throw AUTH_ERROR for 403 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const client = new ExecutionsClient(baseUrl, apiToken);

      await expect(client.getExecution('123')).rejects.toMatchObject({
        code: 'AUTH_ERROR',
      });
    });

    it('should extract output data from last node', async () => {
      const mockExecution = {
        id: '123',
        finished: true,
        mode: 'webhook',
        status: 'success',
        startedAt: '2024-01-15T10:00:00.000Z',
        workflowId: '1',
        data: {
          resultData: {
            runData: {
              LastNode: [
                {
                  data: {
                    main: [[{ json: { result: 'success', count: 42 } }]],
                  },
                },
              ],
            },
            lastNodeExecuted: 'LastNode',
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExecution),
      });

      const client = new ExecutionsClient(baseUrl, apiToken);
      const result = await client.getExecution('123');

      expect(result.data).toEqual({ result: 'success', count: 42 });
    });

    it('should prefer customData over extracted data', async () => {
      const mockExecution = {
        id: '123',
        finished: true,
        mode: 'webhook',
        status: 'success',
        startedAt: '2024-01-15T10:00:00.000Z',
        workflowId: '1',
        customData: { custom: 'value' },
        data: {
          resultData: {
            runData: {
              LastNode: [
                {
                  data: {
                    main: [[{ json: { result: 'ignored' } }]],
                  },
                },
              ],
            },
            lastNodeExecuted: 'LastNode',
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExecution),
      });

      const client = new ExecutionsClient(baseUrl, apiToken);
      const result = await client.getExecution('123');

      expect(result.data).toEqual({ custom: 'value' });
    });
  });

  describe('pollExecution', () => {
    it('should poll until execution is finished', async () => {
      const runningExecution = {
        id: '123',
        finished: false,
        mode: 'webhook',
        status: 'running',
        startedAt: '2024-01-15T10:00:00.000Z',
        workflowId: '1',
      };

      const finishedExecution = {
        id: '123',
        finished: true,
        mode: 'webhook',
        status: 'success',
        startedAt: '2024-01-15T10:00:00.000Z',
        stoppedAt: '2024-01-15T10:00:05.000Z',
        workflowId: '1',
        data: {
          resultData: {
            runData: {
              Result: [{ data: { main: [[{ json: { done: true } }]] } }],
            },
            lastNodeExecuted: 'Result',
          },
        },
      };

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              callCount < 3 ? runningExecution : finishedExecution
            ),
        });
      });

      const client = new ExecutionsClient(baseUrl, apiToken);
      const result = await client.pollExecution('123', {
        interval: 10, // Short interval for test
      });

      expect(result.finished).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toEqual({ done: true });
      expect(callCount).toBe(3);
    });

    it('should call onProgress callback', async () => {
      const runningExecution = {
        id: '123',
        finished: false,
        mode: 'webhook',
        status: 'running',
        startedAt: '2024-01-15T10:00:00.000Z',
        workflowId: '1',
      };

      const finishedExecution = {
        ...runningExecution,
        finished: true,
        status: 'success',
      };

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              callCount < 2 ? runningExecution : finishedExecution
            ),
        });
      });

      const onProgress = vi.fn();
      const client = new ExecutionsClient(baseUrl, apiToken);

      await client.pollExecution('123', {
        interval: 10,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'running' })
      );
    });

    it('should throw on timeout', async () => {
      const runningExecution = {
        id: '123',
        finished: false,
        mode: 'webhook',
        status: 'running',
        startedAt: '2024-01-15T10:00:00.000Z',
        workflowId: '1',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(runningExecution),
      });

      const client = new ExecutionsClient(baseUrl, apiToken);

      await expect(
        client.pollExecution('123', {
          interval: 10,
          timeout: 50,
        })
      ).rejects.toMatchObject({
        code: 'POLLING_ERROR',
        message: expect.stringContaining('timed out'),
      });
    });

    it('should throw on maxAttempts exceeded', async () => {
      const runningExecution = {
        id: '123',
        finished: false,
        mode: 'webhook',
        status: 'running',
        startedAt: '2024-01-15T10:00:00.000Z',
        workflowId: '1',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(runningExecution),
      });

      const client = new ExecutionsClient(baseUrl, apiToken);

      await expect(
        client.pollExecution('123', {
          interval: 10,
          maxAttempts: 3,
          timeout: 10000,
        })
      ).rejects.toMatchObject({
        code: 'POLLING_ERROR',
        message: expect.stringContaining('exceeded 3 attempts'),
      });
    });

    it('should throw WORKFLOW_ERROR on error status', async () => {
      const errorExecution = {
        id: '123',
        finished: true,
        mode: 'webhook',
        status: 'error',
        startedAt: '2024-01-15T10:00:00.000Z',
        stoppedAt: '2024-01-15T10:00:05.000Z',
        workflowId: '1',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(errorExecution),
      });

      const client = new ExecutionsClient(baseUrl, apiToken);

      await expect(client.pollExecution('123')).rejects.toMatchObject({
        code: 'WORKFLOW_ERROR',
        message: expect.stringContaining('failed'),
      });
    });

    it('should throw WORKFLOW_ERROR on canceled status', async () => {
      const canceledExecution = {
        id: '123',
        finished: true,
        mode: 'webhook',
        status: 'canceled',
        startedAt: '2024-01-15T10:00:00.000Z',
        stoppedAt: '2024-01-15T10:00:05.000Z',
        workflowId: '1',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(canceledExecution),
      });

      const client = new ExecutionsClient(baseUrl, apiToken);

      await expect(client.pollExecution('123')).rejects.toMatchObject({
        code: 'WORKFLOW_ERROR',
        message: expect.stringContaining('canceled'),
      });
    });

    it('should support cancellation via AbortSignal', async () => {
      const runningExecution = {
        id: '123',
        finished: false,
        mode: 'webhook',
        status: 'running',
        startedAt: '2024-01-15T10:00:00.000Z',
        workflowId: '1',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(runningExecution),
      });

      const controller = new AbortController();
      const client = new ExecutionsClient(baseUrl, apiToken);

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      await expect(
        client.pollExecution('123', {
          interval: 100,
          signal: controller.signal,
        })
      ).rejects.toMatchObject({
        code: 'POLLING_ERROR',
        message: expect.stringContaining('cancelled'),
      });
    });
  });
});

describe('executeAndPoll', () => {
  const baseUrl = 'https://n8n.example.com';
  const apiToken = 'test-api-token';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute webhook and poll for completion', async () => {
    const mockClient = {
      execute: vi.fn().mockResolvedValue({ executionId: '123' }),
    } as unknown as N8nClient;

    const finishedExecution = {
      id: '123',
      finished: true,
      mode: 'webhook',
      status: 'success',
      startedAt: '2024-01-15T10:00:00.000Z',
      stoppedAt: '2024-01-15T10:00:05.000Z',
      workflowId: '1',
      data: {
        resultData: {
          runData: {
            Result: [{ data: { main: [[{ json: { result: 'done' } }]] } }],
          },
          lastNodeExecuted: 'Result',
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(finishedExecution),
    });

    const execClient = new ExecutionsClient(baseUrl, apiToken);

    const result = await executeAndPoll(
      mockClient,
      execClient,
      '/webhook/process',
      {
        data: { input: 'test' },
        polling: { interval: 10 },
      }
    );

    expect(mockClient.execute).toHaveBeenCalledWith('/webhook/process', {
      data: { input: 'test' },
      files: undefined,
    });

    expect(result.data).toEqual({ result: 'done' });
    expect(result.status).toBe('success');
  });

  it('should throw VALIDATION_ERROR if no executionId in response', async () => {
    const mockClient = {
      execute: vi.fn().mockResolvedValue({ message: 'started' }),
    } as unknown as N8nClient;

    const execClient = new ExecutionsClient(baseUrl, apiToken);

    await expect(
      executeAndPoll(mockClient, execClient, '/webhook/process')
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: expect.stringContaining('executionId'),
    });
  });

  it('should pass files to webhook execution', async () => {
    const mockClient = {
      execute: vi.fn().mockResolvedValue({ executionId: '123' }),
    } as unknown as N8nClient;

    const finishedExecution = {
      id: '123',
      finished: true,
      mode: 'webhook',
      status: 'success',
      startedAt: '2024-01-15T10:00:00.000Z',
      workflowId: '1',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(finishedExecution),
    });

    const execClient = new ExecutionsClient(baseUrl, apiToken);
    const testFile = new Blob(['test'], { type: 'text/plain' });

    await executeAndPoll(mockClient, execClient, '/webhook/upload', {
      files: { document: testFile },
      polling: { interval: 10 },
    });

    expect(mockClient.execute).toHaveBeenCalledWith(
      '/webhook/upload',
      expect.objectContaining({
        files: { document: testFile },
      })
    );
  });
});
