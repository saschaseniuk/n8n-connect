/**
 * Executions API module for @n8n-connect/core
 *
 * Provides native polling for long-running workflows using the n8n REST API.
 * This is simpler than custom status webhooks - just needs an API token.
 *
 * @example
 * ```typescript
 * import {
 *   ExecutionsClient,
 *   executeAndPoll,
 * } from '@n8n-connect/core';
 *
 * const client = createN8nClient({ baseUrl });
 * const execClient = new ExecutionsClient(baseUrl, apiToken);
 *
 * // For long-running workflows
 * const result = await executeAndPoll(client, execClient, '/webhook/process', {
 *   data: { task: 'heavy-processing' },
 *   polling: {
 *     interval: 2000,
 *     onProgress: (exec) => console.log(`Status: ${exec.status}`),
 *   },
 * });
 * ```
 */

export { ExecutionsClient } from './ExecutionsClient';
export { executeAndPoll } from './executeAndPoll';
export type {
  N8nExecutionStatus,
  N8nExecution,
  ExecutionResult,
  ExecutionPollingOptions,
  ExecuteAndPollOptions,
} from './types';
