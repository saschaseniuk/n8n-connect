import { N8nError } from './N8nError';
import type { N8nErrorCode } from '../types/errors';

/**
 * Type guard for N8nError
 */
export function isN8nError(error: unknown): error is N8nError {
  return error instanceof N8nError;
}

/**
 * Create N8nError from HTTP response
 */
export async function createErrorFromResponse(
  response: Response
): Promise<N8nError> {
  const statusCode = response.status;
  let message = `Request failed with status ${String(statusCode)}`;
  let details: Record<string, unknown> | undefined;
  let executionId: string | undefined;
  let nodeName: string | undefined;

  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const bodyObj = body as Record<string, unknown>;
      if (typeof bodyObj.message === 'string') message = bodyObj.message;
      if (typeof bodyObj.executionId === 'string') executionId = bodyObj.executionId;
      if (typeof bodyObj.nodeName === 'string') nodeName = bodyObj.nodeName;
      details = bodyObj;
    }
  } catch {
    // Response body not JSON, use default message
  }

  const code = mapStatusCodeToErrorCode(statusCode);

  return new N8nError(message, {
    code,
    statusCode,
    details,
    executionId,
    nodeName,
  });
}

/**
 * Map HTTP status code to N8nErrorCode
 */
export function mapStatusCodeToErrorCode(statusCode: number): N8nErrorCode {
  if (statusCode === 401 || statusCode === 403) return 'AUTH_ERROR';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 408) return 'TIMEOUT';
  if (statusCode === 422) return 'VALIDATION_ERROR';
  if (statusCode >= 500) return 'SERVER_ERROR';
  if (statusCode >= 400) return 'WORKFLOW_ERROR';
  return 'UNKNOWN';
}

/**
 * Wrap unknown errors in N8nError
 */
export function wrapError(error: unknown): N8nError {
  if (isN8nError(error)) return error;

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new N8nError('Network request failed', {
      code: 'NETWORK_ERROR',
      details: { originalError: String(error) },
    });
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new N8nError('Request was cancelled', {
      code: 'TIMEOUT',
    });
  }

  if (error instanceof Error) {
    return new N8nError(error.message, {
      code: 'UNKNOWN',
      details: { originalError: error.name },
    });
  }

  return new N8nError(String(error), { code: 'UNKNOWN' });
}

/**
 * Create timeout error
 */
export function createTimeoutError(timeout: number): N8nError {
  return new N8nError(`Request timed out after ${String(timeout)}ms`, {
    code: 'TIMEOUT',
    details: { timeout },
  });
}

/**
 * Create polling error
 */
export function createPollingError(
  message: string,
  executionId?: string
): N8nError {
  return new N8nError(message, {
    code: 'POLLING_ERROR',
    executionId,
  });
}
