import type { N8nClient } from '../client';
import type { ExecutionsClient } from './ExecutionsClient';
import type { ExecuteAndPollOptions, ExecutionResult } from './types';
import { N8nError } from '../errors';

/**
 * Execute a webhook and poll for completion using the n8n Executions API.
 *
 * The webhook must return the execution ID in the response. Configure your
 * n8n webhook to "Respond Immediately" and include `{{ $execution.id }}`
 * in the response.
 *
 * @example
 * ```typescript
 * const client = createN8nClient({ baseUrl });
 * const execClient = new ExecutionsClient(baseUrl, apiToken);
 *
 * const result = await executeAndPoll(client, execClient, '/webhook/process', {
 *   data: { file: 'large-file.csv' },
 *   polling: {
 *     interval: 2000,
 *     timeout: 300000,
 *     onProgress: (exec) => console.log(`Status: ${exec.status}`),
 *   },
 * });
 * ```
 */
export async function executeAndPoll<TInput = unknown, TOutput = unknown>(
  client: N8nClient,
  executionsClient: ExecutionsClient,
  webhookPath: string,
  options: ExecuteAndPollOptions<TInput> = {}
): Promise<ExecutionResult<TOutput>> {
  // Execute webhook
  const response = await client.execute<TInput, { executionId?: string }>(
    webhookPath,
    {
      data: options.data,
      files: options.files,
    }
  );

  // Extract execution ID
  const executionId = response?.executionId;

  if (!executionId) {
    throw new N8nError(
      'Webhook response must include executionId. ' +
        'Configure your webhook to respond immediately with { "executionId": "{{ $execution.id }}" }',
      { code: 'VALIDATION_ERROR' }
    );
  }

  // Poll for completion
  return executionsClient.pollExecution<TOutput>(executionId, options.polling);
}
