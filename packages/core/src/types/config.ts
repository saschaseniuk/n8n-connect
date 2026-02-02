/**
 * Configuration types for @n8n-connect/core
 *
 * These types define the configuration options for the n8n client,
 * provider, polling behavior, and server actions.
 */

import type { ExecuteOptions } from './workflow';

/**
 * Configuration options for creating an n8n client instance.
 *
 * @example
 * ```typescript
 * const options: N8nClientOptions = {
 *   baseUrl: 'https://n8n.example.com',
 *   apiToken: 'your-api-token',
 *   timeout: 30000,
 * };
 * ```
 */
export interface N8nClientOptions {
  /** The base URL of the n8n instance (required) */
  baseUrl: string;
  /** Custom headers to include with every request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** API token for authentication */
  apiToken?: string;
}

/**
 * Configuration options for the N8nProvider context.
 *
 * All properties are optional, allowing for flexible configuration
 * that can be overridden at the hook level.
 *
 * @example
 * ```typescript
 * const config: N8nProviderConfig = {
 *   baseUrl: 'https://n8n.example.com',
 *   useServerProxy: true,
 *   defaultPolling: { enabled: true, interval: 2000 },
 * };
 * ```
 */
export interface N8nProviderConfig {
  /** The base URL of the n8n instance */
  baseUrl?: string;
  /** API token for authentication */
  apiToken?: string;
  /** Custom headers to include with every request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to route requests through a server proxy for security */
  useServerProxy?: boolean;
  /** Server action function for proxy mode */
  serverAction?: N8nServerAction;
  /** Default polling options for all workflows */
  defaultPolling?: PollingOptions;
  /** Default persistence mode for workflow state */
  defaultPersist?: PersistMode;
}

/**
 * Configuration options for polling long-running workflows.
 *
 * Polling is used when workflows take longer than typical HTTP timeouts
 * and need to be checked periodically for completion.
 *
 * @example
 * ```typescript
 * const polling: PollingOptions = {
 *   enabled: true,
 *   interval: 2000,
 *   timeout: 60000,
 *   exponentialBackoff: true,
 *   maxInterval: 30000,
 * };
 * ```
 */
export interface PollingOptions {
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Polling interval in milliseconds */
  interval?: number;
  /** Maximum time to poll before timing out (milliseconds) */
  timeout?: number;
  /** Maximum number of polling attempts */
  maxAttempts?: number;
  /** Callback invoked with progress updates (0-1) */
  onProgress?: (progress: number) => void;
  /** Custom endpoint for checking workflow status */
  statusEndpoint?: string;
  /** Whether to use exponential backoff for polling intervals */
  exponentialBackoff?: boolean;
  /** Maximum polling interval when using exponential backoff (milliseconds) */
  maxInterval?: number;
  /**
   * Callback invoked when polling starts.
   * Use this to persist the execution ID for resuming after page reload.
   */
  onPollingStart?: (executionId: string, statusEndpoint: string) => void;
}

/**
 * Persistence mode for workflow state.
 *
 * - `'session'`: Persist to sessionStorage (cleared when tab closes)
 * - `'local'`: Persist to localStorage (survives browser restarts)
 * - `false`: No persistence
 */
export type PersistMode = 'session' | 'local' | false;

/**
 * Configuration options for creating a server action proxy.
 *
 * Server actions keep n8n URLs and API tokens server-side only,
 * improving security for client-side applications.
 *
 * @example
 * ```typescript
 * const options: CreateN8nActionOptions = {
 *   webhookUrl: 'https://n8n.example.com/webhook',
 *   apiToken: 'secret-token',
 *   allowedPaths: ['/contact-form', '/newsletter-signup'],
 * };
 * ```
 */
export interface CreateN8nActionOptions {
  /** The base webhook URL for the n8n instance */
  webhookUrl: string;
  /** API token for authentication */
  apiToken?: string;
  /** Custom headers to include with every request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** List of allowed webhook paths (for security) */
  allowedPaths?: string[];
  /** Custom validation function for incoming requests */
  validate?: (path: string, data: unknown) => boolean | Promise<boolean>;
}

/**
 * Server action function type for proxying n8n requests.
 *
 * This function is called by the client when `useServerProxy` is enabled,
 * routing all n8n requests through the server for security.
 *
 * @typeParam TInput - The input data type
 * @typeParam TOutput - The expected output data type
 */
export type N8nServerAction = <TInput = unknown, TOutput = unknown>(
  webhookPath: string,
  options?: ExecuteOptions<TInput>
) => Promise<TOutput>;
