import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeWithPolling, createPollingController } from '../index';
import type { N8nClient } from '../../client';
import { N8nError } from '../../errors';

// Mock Client - create fresh mock for each test
let mockExecute: ReturnType<typeof vi.fn>;
let mockClient: N8nClient;

beforeEach(() => {
  mockExecute = vi.fn();
  mockClient = { execute: mockExecute } as unknown as N8nClient;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Non-Polling Responses', () => {
  it('should return immediate result directly', async () => {
    mockExecute.mockResolvedValue({ result: 'immediate' });

    const promise = executeWithPolling(mockClient, '/webhook', {
      data: { test: true },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ result: 'immediate' });
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('should handle normal JSON response without polling', async () => {
    mockExecute.mockResolvedValue({ data: 'value', count: 42 });

    const promise = executeWithPolling(mockClient, '/webhook', {});

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ data: 'value', count: 42 });
  });

  it('should not poll response without executionId', async () => {
    mockExecute.mockResolvedValue({ status: 'complete', data: 'done' });

    const promise = executeWithPolling(mockClient, '/webhook', {});

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ status: 'complete', data: 'done' });
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });
});

describe('Polling Detection', () => {
  it('should start polling when executionId and status=running', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({
        status: 'complete',
        result: { done: true },
      });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ done: true });
  });

  it('should not poll when status is not "running"', async () => {
    mockExecute.mockResolvedValue({
      executionId: 'exec123',
      status: 'complete',
      result: 'immediate',
    });

    const promise = executeWithPolling(mockClient, '/webhook', {});

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      executionId: 'exec123',
      status: 'complete',
      result: 'immediate',
    });
  });
});

describe('Status Endpoint', () => {
  it('should use statusEndpoint from response', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/custom-status/{executionId}',
      })
      .mockResolvedValueOnce({
        status: 'complete',
        result: {},
      });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true },
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      '/custom-status/exec123',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should use statusEndpoint from options', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
      })
      .mockResolvedValueOnce({
        status: 'complete',
        result: {},
      });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: {
        enabled: true,
        statusEndpoint: '/my-status-endpoint',
      },
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      '/my-status-endpoint?executionId=exec123',
      expect.any(Object)
    );
  });

  it('should append executionId as query parameter', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec456',
        status: 'running',
      })
      .mockResolvedValueOnce({
        status: 'complete',
        result: {},
      });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: {
        enabled: true,
        statusEndpoint: '/status',
      },
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      '/status?executionId=exec456',
      expect.any(Object)
    );
  });

  it('should throw error when no statusEndpoint is available', async () => {
    mockExecute.mockResolvedValueOnce({
      executionId: 'exec123',
      status: 'running',
    });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true },
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({
      code: 'POLLING_ERROR',
    });
  });
});

describe('Polling Interval', () => {
  it('should use default interval of 2000ms', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'complete', result: {} });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true },
    });

    // Initial call happens synchronously
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // After 2000ms: first poll
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockExecute).toHaveBeenCalledTimes(2);

    // After another 2000ms: second poll
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockExecute).toHaveBeenCalledTimes(3);

    await promise;
  });

  it('should use custom interval', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'complete', result: {} });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 5000 },
    });

    // Initial call
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // After 2000ms: no poll yet
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // After 5000ms: first poll
    await vi.advanceTimersByTimeAsync(3000);
    expect(mockExecute).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(5000);
    await promise;
  });
});

describe('Progress Callback', () => {
  it('should call onProgress with progress values', async () => {
    const onProgress = vi.fn();

    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({ status: 'running', progress: 0.25 })
      .mockResolvedValueOnce({ status: 'running', progress: 0.5 })
      .mockResolvedValueOnce({ status: 'running', progress: 0.75 })
      .mockResolvedValueOnce({ status: 'complete', progress: 1.0, result: {} });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 1000, onProgress },
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(onProgress).toHaveBeenCalledWith(0.25);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onProgress).toHaveBeenCalledWith(0.5);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onProgress).toHaveBeenCalledWith(0.75);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onProgress).toHaveBeenCalledWith(1.0);

    await promise;
  });

  it('should not call onProgress when progress is missing', async () => {
    const onProgress = vi.fn();

    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({ status: 'running' }) // No progress
      .mockResolvedValueOnce({ status: 'complete', result: {} });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 100, onProgress },
    });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    expect(onProgress).not.toHaveBeenCalled();

    await promise;
  });
});

describe('Polling Timeout', () => {
  it('should abort after timeout', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValue({ status: 'running' });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: {
        enabled: true,
        interval: 1000,
        timeout: 5000,
      },
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    // Advance past timeout
    await vi.advanceTimersByTimeAsync(6000);

    await expect(promise).rejects.toMatchObject({
      code: 'POLLING_ERROR',
      message: expect.stringContaining('timed out'),
    });
  });

  it('should use default timeout of 60000ms', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValue({ status: 'running' });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 10000 },
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    // Advance past default timeout
    await vi.advanceTimersByTimeAsync(61000);

    await expect(promise).rejects.toMatchObject({
      code: 'POLLING_ERROR',
    });
  });
});

describe('Max Attempts', () => {
  it('should abort after maxAttempts', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValue({ status: 'running' });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: {
        enabled: true,
        interval: 100,
        maxAttempts: 3,
        timeout: 60000,
      },
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    // Advance enough for 3 attempts
    await vi.advanceTimersByTimeAsync(400);

    await expect(promise).rejects.toMatchObject({
      code: 'POLLING_ERROR',
      message: expect.stringContaining('max attempts'),
    });
  });

  it('should stop before maxAttempts when complete', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'complete', result: { done: true } });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: {
        enabled: true,
        interval: 100,
        maxAttempts: 10,
      },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ done: true });
    expect(mockExecute).toHaveBeenCalledTimes(3);
  });
});

describe('Exponential Backoff', () => {
  it('should increase interval exponentially', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'complete', result: {} });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: {
        enabled: true,
        interval: 1000,
        exponentialBackoff: true,
        maxInterval: 30000,
      },
    });

    // Initial call
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // After 1000ms (1s * 2^0 for attempt 1)
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockExecute).toHaveBeenCalledTimes(2);

    // After 2000ms (1s * 2^1 for attempt 2)
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockExecute).toHaveBeenCalledTimes(3);

    // After 4000ms (1s * 2^2 for attempt 3)
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockExecute).toHaveBeenCalledTimes(4);

    // After 8000ms (1s * 2^3 for attempt 4)
    await vi.advanceTimersByTimeAsync(8000);
    expect(mockExecute).toHaveBeenCalledTimes(5);

    await promise;
  });

  it('should not exceed maxInterval', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValue({ status: 'running' });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: {
        enabled: true,
        interval: 1000,
        exponentialBackoff: true,
        maxInterval: 5000,
        timeout: 100000,
        maxAttempts: 100,
      },
    });

    // Initial
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // 1s (attempt 1)
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockExecute).toHaveBeenCalledTimes(2);

    // 2s (attempt 2)
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockExecute).toHaveBeenCalledTimes(3);

    // 4s (attempt 3)
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockExecute).toHaveBeenCalledTimes(4);

    // 5s (attempt 4, capped at maxInterval instead of 8s)
    await vi.advanceTimersByTimeAsync(5000);
    expect(mockExecute).toHaveBeenCalledTimes(5);

    // 5s (attempt 5, stays at max)
    await vi.advanceTimersByTimeAsync(5000);
    expect(mockExecute).toHaveBeenCalledTimes(6);

    promise.catch(() => {}); // Cleanup
  });
});

describe('Error Status', () => {
  it('should throw N8nError on error status', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({
        status: 'error',
        error: 'Workflow failed at node XYZ',
      });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 100 },
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toMatchObject({
      code: 'WORKFLOW_ERROR',
      message: 'Workflow failed at node XYZ',
      executionId: 'exec123',
    });
  });

  it('should use default error message when error field is missing', async () => {
    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValueOnce({ status: 'error' });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 100 },
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toMatchObject({
      message: 'Workflow failed',
    });
  });
});

describe('Cancellation', () => {
  it('should stop polling on abort', async () => {
    const controller = new AbortController();

    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockResolvedValue({ status: 'running' });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 1000 },
      signal: controller.signal,
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    // First poll
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockExecute).toHaveBeenCalledTimes(2);

    // Abort before next poll completes
    controller.abort();

    // Try to advance, but should be cancelled
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).rejects.toMatchObject({
      code: 'POLLING_ERROR',
      message: expect.stringContaining('cancelled'),
    });
  });

  it('should work with createPollingController', () => {
    const controller = createPollingController();

    expect(controller).toHaveProperty('cancel');
    expect(controller).toHaveProperty('signal');
    expect(typeof controller.cancel).toBe('function');
    expect(controller.signal).toBeInstanceOf(AbortSignal);
  });

  it('should cancel immediately if signal already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    mockExecute.mockResolvedValueOnce({
      executionId: 'exec123',
      status: 'running',
      statusEndpoint: '/status',
    });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true },
      signal: controller.signal,
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({
      code: 'POLLING_ERROR',
      message: expect.stringContaining('cancelled'),
    });
  });
});

describe('Network Error Recovery', () => {
  it('should continue polling on network error', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'complete', result: { recovered: true } });

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 100 },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ recovered: true });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should throw N8nError immediately (no recovery)', async () => {
    const n8nError = new N8nError('Auth failed', { code: 'AUTH_ERROR' });

    mockExecute
      .mockResolvedValueOnce({
        executionId: 'exec123',
        status: 'running',
        statusEndpoint: '/status',
      })
      .mockRejectedValueOnce(n8nError);

    const promise = executeWithPolling(mockClient, '/webhook', {
      polling: { enabled: true, interval: 100 },
    });

    // Add error handler to prevent unhandled rejection
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toBe(n8nError);
  });
});
