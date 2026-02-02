import type { N8nClientOptions } from '../types';
import { N8nClient } from './N8nClient';

/**
 * Factory function to create an N8nClient instance.
 *
 * @param options - Configuration options for the client
 * @returns A configured N8nClient instance
 *
 * @example
 * ```typescript
 * const client = createN8nClient({
 *   baseUrl: 'https://n8n.example.com',
 *   apiToken: 'your-api-token',
 *   timeout: 30000,
 * });
 *
 * const result = await client.execute('/webhook/process', {
 *   data: { name: 'John' },
 * });
 * ```
 */
export function createN8nClient(options: N8nClientOptions): N8nClient {
  if (!options.baseUrl) {
    throw new Error('baseUrl is required');
  }

  return new N8nClient(options);
}
