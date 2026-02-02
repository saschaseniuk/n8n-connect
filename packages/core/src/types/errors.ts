/**
 * Error types for @n8n-connect/core
 *
 * These types define the error codes and error details structure
 * used throughout the SDK.
 */

/**
 * Error codes used by the n8n SDK.
 *
 * - `'NETWORK_ERROR'`: Network request failed (no response)
 * - `'TIMEOUT'`: Request timed out
 * - `'WORKFLOW_ERROR'`: Workflow execution failed in n8n
 * - `'VALIDATION_ERROR'`: Input validation failed
 * - `'AUTH_ERROR'`: Authentication or authorization failed
 * - `'NOT_FOUND'`: Webhook or workflow not found
 * - `'SERVER_ERROR'`: n8n server returned an error
 * - `'POLLING_ERROR'`: Error during polling for workflow status
 * - `'UNKNOWN'`: Unknown or unexpected error
 */
export type N8nErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'WORKFLOW_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'POLLING_ERROR'
  | 'UNKNOWN';

/**
 * Detailed information about an n8n error.
 *
 * @example
 * ```typescript
 * const errorDetails: N8nErrorDetails = {
 *   code: 'WORKFLOW_ERROR',
 *   statusCode: 500,
 *   executionId: 'exec-123',
 *   nodeName: 'HTTP Request',
 *   details: { message: 'External API returned 404' },
 * };
 * ```
 */
export interface N8nErrorDetails {
  /** The error code identifying the type of error */
  code: N8nErrorCode;
  /** HTTP status code, if applicable */
  statusCode?: number;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** n8n execution ID, if available */
  executionId?: string;
  /** Name of the n8n node that failed, if applicable */
  nodeName?: string;
}
