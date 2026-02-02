'use client';

import { useContext, useMemo } from 'react';
import type { ExecuteOptions } from '@n8n-connect/core';
import { N8nContext, type N8nContextValue } from '../context';

/**
 * Access n8n configuration and client from context.
 *
 * This hook provides access to the configuration and client instance
 * set up by the nearest `N8nProvider` ancestor.
 *
 * @throws Error if used outside an N8nProvider
 *
 * @returns The context value containing config and client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { config, client } = useN8nContext();
 *
 *   // Access configuration
 *   console.log('Base URL:', config.baseUrl);
 *   console.log('Using proxy:', config.useServerProxy);
 *
 *   // Use client directly (if in direct mode)
 *   if (client) {
 *     const result = await client.execute('/my-webhook', { data: { foo: 'bar' } });
 *   }
 * }
 * ```
 */
export function useN8nContext(): N8nContextValue {
  const context = useContext(N8nContext);

  if (context === null) {
    throw new Error(
      'useN8nContext must be used within an N8nProvider. ' +
        'Wrap your component tree with <N8nProvider config={...}>.'
    );
  }

  return context;
}

/**
 * Hook to get a configured execute function.
 *
 * Automatically uses server proxy or direct client based on provider config.
 * This is useful for simple one-off workflow executions without full state management.
 *
 * @throws Error if used outside an N8nProvider
 * @throws Error at execution time if no execution method is available
 *
 * @returns A function to execute n8n workflows
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const execute = useN8nExecute();
 *
 *   const handleSubmit = async (data) => {
 *     const result = await execute('/my-webhook', { data });
 *     console.log('Result:', result);
 *   };
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript generics for type safety
 * interface Input { email: string }
 * interface Output { userId: string }
 *
 * function CreateUser() {
 *   const execute = useN8nExecute();
 *
 *   const handleCreate = async (email: string) => {
 *     const result = await execute<Input, Output>('/create-user', {
 *       data: { email },
 *     });
 *     console.log('Created user:', result.userId);
 *   };
 * }
 * ```
 */
export function useN8nExecute() {
  const { config, client } = useN8nContext();

  const execute = useMemo(() => {
    return async <TInput = unknown, TOutput = unknown>(
      webhookPath: string,
      options?: ExecuteOptions<TInput>
    ): Promise<TOutput> => {
      if (config.useServerProxy && config.serverAction) {
        return config.serverAction<TInput, TOutput>(webhookPath, options);
      }

      if (client) {
        return client.execute<TInput, TOutput>(webhookPath, options);
      }

      throw new Error(
        'No execution method available. ' +
          'Configure either baseUrl (for direct mode) or useServerProxy with serverAction.'
      );
    };
  }, [config.useServerProxy, config.serverAction, client]);

  return execute;
}

/**
 * Status information about the n8n configuration.
 */
export interface N8nStatusInfo {
  /** Whether n8n is properly configured for execution */
  isConfigured: boolean;
  /** The current operation mode */
  mode: 'direct' | 'proxy' | 'unconfigured';
  /** Warning message if configuration is incomplete */
  warning?: string;
}

/**
 * Hook to check if n8n is properly configured.
 *
 * Useful for debugging or conditional rendering based on configuration state.
 *
 * @throws Error if used outside an N8nProvider
 *
 * @returns Status information about the n8n configuration
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConfigured, mode, warning } = useN8nStatus();
 *
 *   if (!isConfigured) {
 *     return <div className="warning">Warning: {warning}</div>;
 *   }
 *
 *   return <div>n8n is configured in {mode} mode</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Development-only warning banner
 * function DevTools() {
 *   const { isConfigured, warning } = useN8nStatus();
 *
 *   if (process.env.NODE_ENV === 'development' && !isConfigured) {
 *     return <div className="warning-banner">{warning}</div>;
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useN8nStatus(): N8nStatusInfo {
  const { config, client } = useN8nContext();

  return useMemo(() => {
    if (config.useServerProxy) {
      if (config.serverAction) {
        return { isConfigured: true, mode: 'proxy' as const };
      }
      return {
        isConfigured: false,
        mode: 'unconfigured' as const,
        warning: 'useServerProxy is true but no serverAction provided',
      };
    }

    if (client && config.baseUrl) {
      return { isConfigured: true, mode: 'direct' as const };
    }

    return {
      isConfigured: false,
      mode: 'unconfigured' as const,
      warning: 'No baseUrl provided for direct mode',
    };
  }, [config.useServerProxy, config.serverAction, config.baseUrl, client]);
}
