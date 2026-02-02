/**
 * Polling module for @n8n-connect/core
 *
 * Provides support for long-running workflows that exceed HTTP timeout limits.
 * The polling mechanism checks workflow status at configurable intervals.
 *
 * @example
 * ```typescript
 * import { executeWithPolling, createPollingController } from '@n8n-connect/core';
 *
 * const result = await executeWithPolling(client, '/webhook/long-running', {
 *   data: { task: 'process-file' },
 *   polling: {
 *     enabled: true,
 *     interval: 2000,
 *     timeout: 60000,
 *     onProgress: (progress) => console.log(`${progress * 100}%`),
 *   },
 * });
 * ```
 */

export { executeWithPolling, createPollingController, resumePolling } from './poll';
export type { PollingContext, PollResult } from './types';
