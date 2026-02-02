import type {
  N8nExecution,
  ExecutionResult,
  ExecutionPollingOptions,
} from './types';
import { N8nError } from '../errors';

/**
 * Client for the n8n Executions REST API.
 *
 * Requires an API token with execution read permissions.
 *
 * @example
 * ```typescript
 * const client = new ExecutionsClient('https://n8n.example.com', 'your-api-key');
 *
 * // Get a single execution
 * const execution = await client.getExecution('123');
 *
 * // Poll until completion
 * const result = await client.pollExecution('123', {
 *   interval: 2000,
 *   timeout: 300000,
 *   onProgress: (exec) => console.log(`Status: ${exec.status}`),
 * });
 * ```
 */
export class ExecutionsClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(baseUrl: string, apiToken: string) {
    if (!apiToken) {
      throw new N8nError('API token is required for ExecutionsClient', {
        code: 'AUTH_ERROR',
      });
    }

    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = {
      'X-N8N-API-KEY': apiToken,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<ExecutionResult> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/executions/${executionId}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new N8nError(`Execution ${executionId} not found`, {
          code: 'NOT_FOUND',
          executionId,
        });
      }
      if (response.status === 401 || response.status === 403) {
        throw new N8nError('Invalid or missing API token', {
          code: 'AUTH_ERROR',
          statusCode: response.status,
        });
      }
      throw new N8nError(`Failed to get execution: ${response.statusText}`, {
        code: 'SERVER_ERROR',
        statusCode: response.status,
        executionId,
      });
    }

    const execution = (await response.json()) as N8nExecution;
    return this.parseExecution(execution);
  }

  /**
   * Poll for execution completion
   */
  async pollExecution<T = unknown>(
    executionId: string,
    options: ExecutionPollingOptions = {}
  ): Promise<ExecutionResult<T>> {
    const {
      interval = 1000,
      timeout = 300000,
      maxAttempts,
      exponentialBackoff = false,
      maxInterval = 10000,
      onProgress,
      signal,
    } = options;

    const startTime = Date.now();
    let attempt = 0;
    let currentInterval = interval;

    while (true) {
      // Check cancellation
      if (signal?.aborted) {
        throw new N8nError('Polling was cancelled', {
          code: 'POLLING_ERROR',
          executionId,
        });
      }

      // Check timeout
      if (Date.now() - startTime >= timeout) {
        throw new N8nError(`Polling timed out after ${timeout}ms`, {
          code: 'POLLING_ERROR',
          executionId,
        });
      }

      // Check max attempts
      if (maxAttempts && attempt >= maxAttempts) {
        throw new N8nError(`Polling exceeded ${maxAttempts} attempts`, {
          code: 'POLLING_ERROR',
          executionId,
        });
      }

      attempt++;

      const execution = await this.getExecution(executionId);

      // Report progress
      if (onProgress) {
        onProgress(execution);
      }

      // Check if finished
      if (execution.finished) {
        if (execution.status === 'error') {
          throw new N8nError('Workflow execution failed', {
            code: 'WORKFLOW_ERROR',
            executionId,
            details: execution.data as Record<string, unknown>,
          });
        }

        if (execution.status === 'canceled') {
          throw new N8nError('Workflow execution was canceled', {
            code: 'WORKFLOW_ERROR',
            executionId,
          });
        }

        return execution as ExecutionResult<T>;
      }

      // Wait before next poll
      try {
        await this.sleep(currentInterval, signal);
      } catch (error) {
        // Handle abort during sleep
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new N8nError('Polling was cancelled', {
            code: 'POLLING_ERROR',
            executionId,
          });
        }
        throw error;
      }

      // Calculate next interval
      if (exponentialBackoff) {
        currentInterval = Math.min(currentInterval * 2, maxInterval);
      }
    }
  }

  private parseExecution(execution: N8nExecution): ExecutionResult {
    const startedAt = new Date(execution.startedAt);
    const stoppedAt = execution.stoppedAt
      ? new Date(execution.stoppedAt)
      : undefined;

    return {
      executionId: execution.id,
      status: execution.status,
      finished: execution.finished,
      data: this.extractOutputData(execution),
      startedAt,
      stoppedAt,
      duration: stoppedAt
        ? stoppedAt.getTime() - startedAt.getTime()
        : undefined,
      workflowId: execution.workflowId,
      workflowName: execution.workflowName,
    };
  }

  private extractOutputData(execution: N8nExecution): unknown {
    // Try to get custom data first (if workflow explicitly sets it)
    if (execution.customData !== undefined) {
      return execution.customData;
    }

    // Extract from last node's output
    const runData = execution.data?.resultData?.runData;
    const lastNode = execution.data?.resultData?.lastNodeExecuted;

    if (runData && lastNode && runData[lastNode]) {
      const nodeOutput = runData[lastNode] as Array<{
        data?: { main?: unknown[][] };
      }>;
      const lastRun = nodeOutput[nodeOutput.length - 1];
      const mainOutput = lastRun?.data?.main?.[0];

      if (Array.isArray(mainOutput) && mainOutput.length > 0) {
        // Return single item or array depending on output
        return mainOutput.length === 1
          ? (mainOutput[0] as { json?: unknown })?.json
          : mainOutput.map((item) => (item as { json?: unknown })?.json);
      }
    }

    return null;
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
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
}
