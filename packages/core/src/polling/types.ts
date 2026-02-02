import type { PollingOptions } from '../types';

/**
 * Internal context for polling operations.
 */
export interface PollingContext {
  /** The n8n execution ID being polled */
  executionId: string;
  /** The endpoint to poll for status */
  statusEndpoint: string;
  /** Resolved polling options with defaults applied */
  options: Required<Omit<PollingOptions, 'onProgress' | 'statusEndpoint' | 'onPollingStart'>> & {
    onProgress?: (progress: number) => void;
    statusEndpoint?: string;
    onPollingStart?: (executionId: string, statusEndpoint: string) => void;
  };
  /** Controller for aborting the polling operation */
  abortController: AbortController;
  /** Current attempt number (1-indexed) */
  attempt: number;
  /** Timestamp when polling started */
  startTime: number;
}

/**
 * Result of a successful polling operation.
 */
export interface PollResult<T> {
  /** The workflow result data */
  data: T;
  /** Number of polling attempts made */
  attempts: number;
  /** Total time spent polling in milliseconds */
  totalTime: number;
}
