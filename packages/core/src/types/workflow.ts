/**
 * Workflow execution types for @n8n-connect/core
 *
 * These types define the interfaces for executing workflows,
 * tracking status, and handling results.
 */

import type { PollingOptions, PersistMode } from './config';
import type { N8nError } from '../errors';

/**
 * Options for executing a workflow.
 *
 * @typeParam TInput - The input data type for the workflow
 *
 * @example
 * ```typescript
 * interface ContactFormData {
 *   name: string;
 *   email: string;
 *   message: string;
 * }
 *
 * const options: ExecuteOptions<ContactFormData> = {
 *   data: { name: 'John', email: 'john@example.com', message: 'Hello' },
 *   method: 'POST',
 *   timeout: 30000,
 * };
 * ```
 */
export interface ExecuteOptions<TInput = unknown> {
  /** The data payload to send to the workflow */
  data?: TInput;
  /** Files to upload with the request */
  files?: Record<string, File | Blob>;
  /** HTTP method for the request */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Custom headers for this specific request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (overrides client default) */
  timeout?: number;
  /** Polling options for long-running workflows */
  polling?: PollingOptions;
}

/**
 * Possible states of a workflow execution.
 *
 * - `'idle'`: No execution in progress
 * - `'running'`: Workflow is currently executing
 * - `'success'`: Workflow completed successfully
 * - `'error'`: Workflow failed with an error
 */
export type WorkflowStatus = 'idle' | 'running' | 'success' | 'error';

/**
 * Options for the useWorkflow hook.
 *
 * @typeParam TInput - The input data type for the workflow
 * @typeParam TOutput - The expected output data type from the workflow
 *
 * @example
 * ```typescript
 * const options: UseWorkflowOptions<FormData, ApiResponse> = {
 *   polling: { enabled: true, interval: 2000 },
 *   persist: 'session',
 *   onSuccess: (data) => console.log('Success:', data),
 *   onError: (error) => console.error('Error:', error),
 * };
 * ```
 */
export interface UseWorkflowOptions<TInput = unknown, TOutput = unknown> {
  /** Polling configuration for long-running workflows */
  polling?: PollingOptions;
  /** Persistence mode for workflow state */
  persist?: PersistMode;
  /** Callback invoked when workflow completes successfully */
  onSuccess?: (data: TOutput) => void;
  /** Callback invoked when workflow fails */
  onError?: (error: N8nError) => void;
  /** Callback invoked when workflow status changes */
  onStatusChange?: (status: WorkflowStatus) => void;
  /** If true, workflow will not execute automatically */
  manual?: boolean;
  /** Initial data to pass to the workflow */
  initialData?: TInput;
}

/**
 * Return value of the useWorkflow hook.
 *
 * @typeParam TInput - The input data type for the workflow
 * @typeParam TOutput - The expected output data type from the workflow
 *
 * @example
 * ```typescript
 * const { execute, status, data, error, isLoading, reset, cancel } = useWorkflow<
 *   FormData,
 *   ApiResponse
 * >('/webhook/process');
 *
 * if (isLoading) {
 *   return <Spinner />;
 * }
 * ```
 */
export interface UseWorkflowReturn<TInput = unknown, TOutput = unknown> {
  /** Function to execute the workflow */
  execute: (data?: TInput, files?: Record<string, File | Blob>) => Promise<TOutput>;
  /** Current workflow status */
  status: WorkflowStatus;
  /** Workflow output data (null if not completed) */
  data: TOutput | null;
  /** Error object if workflow failed (null otherwise) */
  error: N8nError | null;
  /** Progress percentage (0-100) for long-running workflows, null when idle */
  progress: number | null;
  /** Whether the workflow is currently executing */
  isLoading: boolean;
  /** Reset the workflow state to initial values */
  reset: () => void;
  /** Cancel the current workflow execution */
  cancel: () => void;
}

/**
 * Result of a successful workflow execution.
 *
 * @typeParam TOutput - The output data type from the workflow
 *
 * @example
 * ```typescript
 * const result: WorkflowResult<ProcessedData> = {
 *   data: { processed: true, items: 42 },
 *   meta: {
 *     executionId: 'exec-123',
 *     startedAt: new Date('2024-01-01T10:00:00Z'),
 *     finishedAt: new Date('2024-01-01T10:00:05Z'),
 *     duration: 5000,
 *   },
 * };
 * ```
 */
export interface WorkflowResult<TOutput = unknown> {
  /** The workflow output data */
  data: TOutput;
  /** Metadata about the workflow execution */
  meta: {
    /** Unique identifier for this execution */
    executionId: string;
    /** When the execution started */
    startedAt: Date;
    /** When the execution finished */
    finishedAt: Date;
    /** Execution duration in milliseconds */
    duration: number;
  };
}

/**
 * Response containing binary data from a workflow.
 *
 * Used when workflows return files, images, or other binary content.
 *
 * @example
 * ```typescript
 * const response: BinaryResponse = {
 *   binaryUrl: 'blob:http://localhost/abc123',
 *   contentType: 'application/pdf',
 *   filename: 'report.pdf',
 * };
 * ```
 */
export interface BinaryResponse {
  /** Blob URL for accessing the binary data */
  binaryUrl: string;
  /** MIME type of the binary content */
  contentType: string;
  /** Optional filename for the binary content */
  filename?: string;
}

/**
 * Response from a polling status endpoint.
 *
 * Used to check the status of long-running workflows.
 */
export interface PollingStatusResponse {
  /** Current status of the workflow */
  status: 'running' | 'complete' | 'error';
  /** Progress value (0-1), if available */
  progress?: number;
  /** Workflow result data, if complete */
  result?: unknown;
  /** Error message, if status is 'error' */
  error?: string;
}
