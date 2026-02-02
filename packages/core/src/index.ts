/**
 * @n8n-connect/core
 *
 * Framework-agnostic SDK for integrating n8n workflows into web applications.
 */

export const VERSION = '0.0.1';

// Export all types
export type {
  // Configuration types
  N8nClientOptions,
  N8nProviderConfig,
  PollingOptions,
  PersistMode,
  CreateN8nActionOptions,
  N8nServerAction,
  // Workflow types
  ExecuteOptions,
  WorkflowStatus,
  UseWorkflowOptions,
  UseWorkflowReturn,
  WorkflowResult,
  BinaryResponse,
  // Executions API types
  N8nExecutionStatus,
  N8nExecution,
  ExecutionResult,
  ExecutionPollingOptions,
  ExecuteAndPollOptions,
  // Error types
  N8nErrorCode,
  N8nErrorDetails,
} from './types';

// Export error class, type guard, and utilities
export { N8nError, isN8nError } from './types';
export { wrapError } from './errors';

// Export client
export { N8nClient, createN8nClient } from './client';

// Export binary utilities
export {
  // Upload utilities
  createFile,
  base64ToFile,
  dataUrlToFile,
  prepareFiles,
  // Download utilities
  downloadBlobUrl,
  downloadBinaryResponse,
  revokeBlobUrl,
  downloadAndCleanup,
  blobUrlToBlob,
  blobUrlToBase64,
  // Type guards and utilities
  isBinaryResponse,
  isBinaryContentType,
  isImageFile,
  getFileExtension,
} from './binary';

// Export executions API (for long-running workflows)
export { ExecutionsClient, executeAndPoll } from './executions';
