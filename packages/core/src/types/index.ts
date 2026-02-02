/**
 * Type definitions for @n8n-connect/core
 *
 * This module re-exports all types from the SDK for convenient importing.
 *
 * @example
 * ```typescript
 * import type {
 *   N8nClientOptions,
 *   ExecuteOptions,
 *   WorkflowStatus,
 *   N8nError,
 * } from '@n8n-connect/core';
 * ```
 */

// Configuration types
export type {
  N8nClientOptions,
  N8nProviderConfig,
  PollingOptions,
  PersistMode,
  CreateN8nActionOptions,
  N8nServerAction,
} from './config';

// Workflow types
export type {
  ExecuteOptions,
  WorkflowStatus,
  UseWorkflowOptions,
  UseWorkflowReturn,
  WorkflowResult,
  BinaryResponse,
} from './workflow';

// Executions API types
export type {
  N8nExecutionStatus,
  N8nExecution,
  ExecutionResult,
  ExecutionPollingOptions,
  ExecuteAndPollOptions,
} from '../executions';

// Error types
export type { N8nErrorCode, N8nErrorDetails } from './errors';

// Re-export error class and utilities from errors module
export { N8nError, isN8nError } from '../errors';
