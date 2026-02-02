/**
 * Types for the n8n Executions API integration.
 *
 * These types enable native polling for long-running workflows
 * without requiring custom status webhooks.
 */

/**
 * n8n Execution status values
 */
export type N8nExecutionStatus =
  | 'new'
  | 'running'
  | 'success'
  | 'error'
  | 'canceled'
  | 'waiting';

/**
 * n8n Execution from the REST API
 */
export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: 'webhook' | 'trigger' | 'manual' | 'retry';
  status: N8nExecutionStatus;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowName?: string;
  data?: {
    resultData?: {
      runData?: Record<string, unknown>;
      lastNodeExecuted?: string;
    };
  };
  /** Custom data returned by workflow (from last node output) */
  customData?: unknown;
}

/**
 * Parsed execution result
 */
export interface ExecutionResult<T = unknown> {
  executionId: string;
  status: N8nExecutionStatus;
  finished: boolean;
  data: T | null;
  startedAt: Date;
  stoppedAt?: Date;
  duration?: number;
  workflowId: string;
  workflowName?: string;
}

/**
 * Options for execution polling
 */
export interface ExecutionPollingOptions {
  /** Polling interval in milliseconds (default: 1000) */
  interval?: number;
  /** Maximum time to poll before timing out (default: 300000 = 5 min) */
  timeout?: number;
  /** Maximum number of polling attempts */
  maxAttempts?: number;
  /** Use exponential backoff */
  exponentialBackoff?: boolean;
  /** Maximum interval with exponential backoff (default: 10000) */
  maxInterval?: number;
  /** Progress callback - receives execution status on each poll */
  onProgress?: (execution: ExecutionResult) => void;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Options for executeAndPoll
 */
export interface ExecuteAndPollOptions<TInput = unknown> {
  /** Input data for the webhook */
  data?: TInput;
  /** Files to upload */
  files?: Record<string, File | Blob>;
  /** Polling options */
  polling?: ExecutionPollingOptions;
}
