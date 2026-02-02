import type { N8nClient } from '../client';
import { N8nError, createPollingError } from '../errors';
import type { PollingOptions, PollingStatusResponse } from '../types';
import type { PollingContext, PollResult } from './types';

const DEFAULT_POLLING_OPTIONS = {
  enabled: false,
  interval: 2000,
  timeout: 60000,
  maxAttempts: 30,
  exponentialBackoff: false,
  maxInterval: 30000,
} as const;

/**
 * Execute a workflow with polling support for long-running operations.
 *
 * If the initial response indicates polling is needed (contains executionId and status: 'running'),
 * this function will poll the status endpoint until completion, timeout, or max attempts.
 *
 * @example
 * ```typescript
 * const result = await executeWithPolling(client, '/webhook/long-running', {
 *   data: { task: 'process-large-file' },
 *   polling: {
 *     enabled: true,
 *     interval: 2000,
 *     timeout: 60000,
 *     onProgress: (progress) => console.log(`${progress * 100}%`),
 *   },
 * });
 * ```
 */
export async function executeWithPolling<TInput, TOutput>(
  client: N8nClient,
  webhookPath: string,
  options: {
    data?: TInput;
    files?: Record<string, File | Blob>;
    polling?: PollingOptions;
    signal?: AbortSignal;
  }
): Promise<TOutput> {
  const pollingOptions = {
    ...DEFAULT_POLLING_OPTIONS,
    ...options.polling,
  };

  // Initial request
  const initialResponse = await client.execute<TInput, unknown>(webhookPath, {
    data: options.data,
    files: options.files,
  });

  // Check if polling is needed
  if (!isPollingResponse(initialResponse)) {
    return initialResponse as TOutput;
  }

  const { executionId, statusEndpoint } = initialResponse;
  const resolvedStatusEndpoint = statusEndpoint || pollingOptions.statusEndpoint;

  if (!resolvedStatusEndpoint) {
    throw createPollingError(
      'Workflow returned executionId but no statusEndpoint. ' +
        'Either configure statusEndpoint in polling options or ensure workflow returns it.',
      executionId
    );
  }

  // Notify that polling is starting (for persistence)
  if (pollingOptions.onPollingStart) {
    pollingOptions.onPollingStart(executionId, resolvedStatusEndpoint);
  }

  // Start polling
  const abortController = new AbortController();

  // Link external signal to internal controller
  if (options.signal) {
    if (options.signal.aborted) {
      throw createPollingError('Polling was cancelled', executionId);
    }
    options.signal.addEventListener(
      'abort',
      () => abortController.abort(),
      { once: true }
    );
  }

  const result = await poll<TOutput>(client, {
    executionId,
    statusEndpoint: resolvedStatusEndpoint,
    options: pollingOptions,
    abortController,
    attempt: 0,
    startTime: Date.now(),
  });

  return result.data;
}

/**
 * Check if response indicates polling is needed.
 */
function isPollingResponse(
  response: unknown
): response is { executionId: string; status: 'running'; statusEndpoint?: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'executionId' in response &&
    'status' in response &&
    (response as { status: string }).status === 'running'
  );
}

/**
 * Poll for workflow completion.
 */
async function poll<TOutput>(
  client: N8nClient,
  context: PollingContext
): Promise<PollResult<TOutput>> {
  const { executionId, statusEndpoint, options, abortController } = context;

  while (true) {
    // Check timeout
    const elapsed = Date.now() - context.startTime;
    if (elapsed >= options.timeout) {
      throw createPollingError(
        `Polling timed out after ${String(options.timeout)}ms`,
        executionId
      );
    }

    // Check max attempts
    if (options.maxAttempts && context.attempt >= options.maxAttempts) {
      throw createPollingError(
        `Polling exceeded max attempts (${String(options.maxAttempts)})`,
        executionId
      );
    }

    // Check if aborted
    if (abortController.signal.aborted) {
      throw createPollingError('Polling was cancelled', executionId);
    }

    context.attempt++;

    // Wait before polling
    const delay = calculateDelay(context.attempt, options);
    try {
      await sleep(delay, abortController.signal);
    } catch (error) {
      // Handle abort during sleep
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw createPollingError('Polling was cancelled', executionId);
      }
      throw error;
    }

    try {
      // Fetch status
      const statusUrl = buildStatusUrl(statusEndpoint, executionId);
      const status = await client.execute<void, PollingStatusResponse>(statusUrl, {
        method: 'GET',
      });

      // Report progress
      if (options.onProgress && status.progress !== undefined) {
        options.onProgress(status.progress);
      }

      // Check completion
      if (status.status === 'complete') {
        return {
          data: status.result as TOutput,
          attempts: context.attempt,
          totalTime: Date.now() - context.startTime,
        };
      }

      // Check error
      if (status.status === 'error') {
        throw new N8nError(status.error || 'Workflow failed', {
          code: 'WORKFLOW_ERROR',
          executionId,
        });
      }

      // Continue polling (status === 'running')
    } catch (error) {
      // If it's our error, re-throw
      if (error instanceof N8nError) {
        throw error;
      }

      // Network errors during polling - continue trying
      console.warn(`Polling attempt ${String(context.attempt)} failed:`, error);
    }
  }
}

/**
 * Calculate delay with optional exponential backoff.
 */
function calculateDelay(
  attempt: number,
  options: { interval: number; exponentialBackoff: boolean; maxInterval: number }
): number {
  if (!options.exponentialBackoff) {
    return options.interval;
  }

  // Exponential backoff: interval * 2^(attempt-1)
  const delay = options.interval * Math.pow(2, attempt - 1);
  return Math.min(delay, options.maxInterval);
}

/**
 * Build status URL with execution ID.
 */
function buildStatusUrl(statusEndpoint: string, executionId: string): string {
  // Replace {executionId} placeholder
  if (statusEndpoint.includes('{executionId}')) {
    return statusEndpoint.replace('{executionId}', executionId);
  }

  // Append as query param
  const separator = statusEndpoint.includes('?') ? '&' : '?';
  return `${statusEndpoint}${separator}executionId=${executionId}`;
}

/**
 * Sleep with abort support.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true }
      );
    }
  });
}

/**
 * Create a cancellation controller for polling operations.
 *
 * @example
 * ```typescript
 * const controller = createPollingController();
 *
 * // Start polling
 * const promise = executeWithPolling(client, '/webhook', { polling: { enabled: true } });
 *
 * // Cancel if needed
 * controller.cancel();
 * ```
 */
export function createPollingController(): {
  cancel: () => void;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  return {
    cancel: () => controller.abort(),
    signal: controller.signal,
  };
}

/**
 * Resume polling for an existing execution.
 *
 * Use this to continue polling after a page reload when the execution ID
 * was persisted. Unlike `executeWithPolling`, this does not make an initial
 * request - it starts polling immediately.
 *
 * @example
 * ```typescript
 * // After page reload, resume with persisted execution ID
 * const result = await resumePolling(client, {
 *   executionId: 'abc123',
 *   statusEndpoint: '/webhook/status',
 *   polling: {
 *     interval: 2000,
 *     timeout: 60000,
 *     onProgress: (progress) => console.log(`${progress * 100}%`),
 *   },
 * });
 * ```
 */
export async function resumePolling<TOutput>(
  client: N8nClient,
  options: {
    executionId: string;
    statusEndpoint: string;
    polling?: PollingOptions;
    signal?: AbortSignal;
  }
): Promise<TOutput> {
  const pollingOptions = {
    ...DEFAULT_POLLING_OPTIONS,
    ...options.polling,
  };

  const abortController = new AbortController();

  // Link external signal to internal controller
  if (options.signal) {
    if (options.signal.aborted) {
      throw createPollingError('Polling was cancelled', options.executionId);
    }
    options.signal.addEventListener(
      'abort',
      () => abortController.abort(),
      { once: true }
    );
  }

  const result = await poll<TOutput>(client, {
    executionId: options.executionId,
    statusEndpoint: options.statusEndpoint,
    options: pollingOptions,
    abortController,
    attempt: 0,
    startTime: Date.now(),
  });

  return result.data;
}
