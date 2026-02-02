import type { N8nErrorCode, N8nErrorDetails } from '../types/errors';

/**
 * N8nError class for typed error handling.
 *
 * This class extends the standard Error with additional n8n-specific
 * information for better error handling and debugging.
 *
 * @example
 * ```typescript
 * try {
 *   await client.execute('/webhook/process', { data: input });
 * } catch (error) {
 *   if (isN8nError(error)) {
 *     console.log('Error code:', error.code);
 *     console.log('Execution ID:', error.executionId);
 *   }
 * }
 * ```
 */
export class N8nError extends Error {
  /** The error code identifying the type of error */
  readonly code: N8nErrorCode;
  /** HTTP status code, if applicable */
  readonly statusCode?: number;
  /** Additional error details */
  readonly details?: Record<string, unknown>;
  /** n8n execution ID, if available */
  readonly executionId?: string;
  /** Name of the n8n node that failed, if applicable */
  readonly nodeName?: string;

  constructor(message: string, options: Partial<N8nErrorDetails> = {}) {
    super(message);
    this.name = 'N8nError';
    this.code = options.code ?? 'UNKNOWN';
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.executionId = options.executionId;
    this.nodeName = options.nodeName;

    // Maintains proper stack trace for where error was thrown (V8 engines only)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, N8nError);
    }
  }

  /**
   * Serializes the error to a JSON-compatible object.
   * Useful for logging, error tracking services, and Server Action responses.
   */
  toJSON(): N8nErrorDetails & { message: string } {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      executionId: this.executionId,
      nodeName: this.nodeName,
    };
  }
}
