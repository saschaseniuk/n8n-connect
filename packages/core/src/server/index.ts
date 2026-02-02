/**
 * Server-side utilities for @n8n-connect/core
 *
 * This module provides server-only functionality for secure n8n integration.
 * Import from '@n8n-connect/core/server' to keep server code separate from client bundles.
 *
 * @example
 * ```typescript
 * // app/actions/n8n.ts
 * 'use server'
 * import { createN8nAction } from '@n8n-connect/core/server';
 *
 * export const executeWorkflow = createN8nAction({
 *   webhookUrl: process.env.N8N_WEBHOOK_URL!,
 *   apiToken: process.env.N8N_API_TOKEN,
 *   allowedPaths: ['/process-form', '/generate-report'],
 * });
 * ```
 */

export { createN8nAction } from './createN8nAction';
export type { CreateN8nActionOptions, N8nServerAction } from '../types';
