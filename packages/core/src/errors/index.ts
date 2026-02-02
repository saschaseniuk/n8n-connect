/**
 * Error handling module for @n8n-connect/core
 *
 * Provides the N8nError class and utility functions for consistent
 * error handling across the SDK.
 */

export { N8nError } from './N8nError';
export {
  isN8nError,
  createErrorFromResponse,
  mapStatusCodeToErrorCode,
  wrapError,
  createTimeoutError,
  createPollingError,
} from './utils';
