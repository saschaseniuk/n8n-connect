import { createN8nClient } from '../client';
import { N8nError, wrapError } from '../errors';
import type {
  CreateN8nActionOptions,
  ExecuteOptions,
  N8nServerAction,
} from '../types';

/**
 * Create a Next.js Server Action for secure n8n webhook proxying
 *
 * @example
 * // app/actions/n8n.ts
 * 'use server'
 * import { createN8nAction } from '@n8n-connect/core/server';
 *
 * export const executeWorkflow = createN8nAction({
 *   webhookUrl: process.env.N8N_WEBHOOK_URL!,
 *   apiToken: process.env.N8N_API_TOKEN,
 *   allowedPaths: ['/process-form', '/generate-report'],
 * });
 */
export function createN8nAction(
  options: CreateN8nActionOptions
): N8nServerAction {
  const {
    webhookUrl,
    apiToken,
    headers,
    timeout,
    allowedPaths,
    validate,
  } = options;

  if (!webhookUrl) {
    throw new Error('webhookUrl is required for createN8nAction');
  }

  const client = createN8nClient({
    baseUrl: webhookUrl,
    apiToken,
    headers,
    timeout,
  });

  return async function executeServerAction<TInput = unknown, TOutput = unknown>(
    webhookPath: string,
    executeOptions?: ExecuteOptions<TInput>
  ): Promise<TOutput> {
    try {
      // Path validation
      if (allowedPaths && allowedPaths.length > 0) {
        const normalizedPath = webhookPath.startsWith('/')
          ? webhookPath
          : `/${webhookPath}`;

        const isAllowed = allowedPaths.some(allowed => {
          const normalizedAllowed = allowed.startsWith('/')
            ? allowed
            : `/${allowed}`;

          // Support wildcards: /api/* matches /api/anything
          if (normalizedAllowed.endsWith('/*')) {
            const prefix = normalizedAllowed.slice(0, -1);
            return normalizedPath.startsWith(prefix);
          }

          return normalizedPath === normalizedAllowed;
        });

        if (!isAllowed) {
          throw new N8nError(`Path not allowed: ${webhookPath}`, {
            code: 'VALIDATION_ERROR',
            statusCode: 403,
          });
        }
      }

      // Custom validation
      if (validate) {
        const isValid = await validate(webhookPath, executeOptions?.data);
        if (!isValid) {
          throw new N8nError('Validation failed', {
            code: 'VALIDATION_ERROR',
            statusCode: 400,
          });
        }
      }

      // Execute request
      return await client.execute<TInput, TOutput>(webhookPath, executeOptions);
    } catch (error) {
      // Re-throw N8nError as-is (except in production for non-validation errors)
      if (error instanceof N8nError) {
        // In production, sanitize non-validation errors
        if (process.env.NODE_ENV === 'production' && error.code !== 'VALIDATION_ERROR') {
          throw new N8nError('An error occurred processing your request', {
            code: error.code,
            statusCode: error.statusCode,
            // Don't expose details, executionId, nodeName in production
          });
        }
        throw error;
      }

      // Wrap and sanitize other errors for client safety
      const wrappedError = wrapError(error);

      // In production, hide internal error details
      if (process.env.NODE_ENV === 'production') {
        throw new N8nError('An error occurred processing your request', {
          code: wrappedError.code,
          statusCode: wrappedError.statusCode,
          // Don't expose details, executionId, nodeName in production
        });
      }

      throw wrappedError;
    }
  };
}
