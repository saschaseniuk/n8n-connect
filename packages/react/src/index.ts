/**
 * @n8n-connect/react
 *
 * React hooks and components for n8n workflow integration.
 */

export { VERSION } from '@n8n-connect/core';

// Re-export types from core that are commonly used with React
export type { N8nProviderConfig, N8nClient } from '@n8n-connect/core';

// Context exports
export { N8nContext, N8nProvider, type N8nContextValue, type N8nProviderProps } from './context';

// Hook exports
export {
  useN8nContext,
  useN8nExecute,
  useN8nStatus,
  useWorkflow,
  type N8nStatusInfo,
} from './hooks';

// Component exports
export {
  WorkflowStatus as WorkflowStatusComponent,
  type WorkflowStatusProps,
  N8nUploadZone,
  type N8nUploadZoneProps,
  type UploadError,
  type UploadErrorType,
} from './components';

// Re-export useful types from core
export type {
  UseWorkflowOptions,
  UseWorkflowReturn,
  WorkflowStatus,
  ExecuteOptions,
  PollingOptions,
  PersistMode,
} from '@n8n-connect/core';
