'use client';

import React, { useMemo, type ReactNode } from 'react';
import { createN8nClient, type N8nProviderConfig } from '@n8n-connect/core';
import { N8nContext, type N8nContextValue } from './N8nContext';

/**
 * Props for the N8nProvider component.
 */
export interface N8nProviderProps {
  /**
   * Configuration for the n8n connection.
   *
   * @example
   * ```typescript
   * // Direct mode
   * { baseUrl: 'https://n8n.example.com/webhook' }
   *
   * // Server proxy mode
   * { useServerProxy: true, serverAction: myServerAction }
   * ```
   */
  config: N8nProviderConfig;
  /**
   * Child components that will have access to the n8n context.
   */
  children: ReactNode;
}

/**
 * Provider component for n8n-connect configuration.
 *
 * Wrap your application (or part of it) with this provider to enable
 * n8n workflow execution via hooks like `useWorkflow`.
 *
 * @example
 * ```tsx
 * // Direct mode (development)
 * <N8nProvider config={{ baseUrl: 'https://n8n.example.com/webhook' }}>
 *   <App />
 * </N8nProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Server proxy mode (production)
 * <N8nProvider config={{ useServerProxy: true, serverAction: executeWorkflow }}>
 *   <App />
 * </N8nProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Nested providers for different n8n instances
 * <N8nProvider config={{ baseUrl: 'https://n8n-1.example.com' }}>
 *   <MainApp />
 *   <N8nProvider config={{ baseUrl: 'https://n8n-2.example.com' }}>
 *     <SpecialFeature />
 *   </N8nProvider>
 * </N8nProvider>
 * ```
 */
export function N8nProvider({ config, children }: N8nProviderProps): JSX.Element {
  const contextValue = useMemo<N8nContextValue>(() => {
    // In server proxy mode, client is not created on frontend
    if (config.useServerProxy) {
      if (!config.serverAction) {
        console.warn(
          'N8nProvider: useServerProxy is true but no serverAction provided. ' +
            'Workflows will fail to execute.'
        );
      }
      return { config, client: null };
    }

    // In direct mode, create client
    if (!config.baseUrl) {
      console.warn(
        'N8nProvider: No baseUrl provided and useServerProxy is false. ' +
          'Workflows will fail to execute.'
      );
      return { config, client: null };
    }

    const client = createN8nClient({
      baseUrl: config.baseUrl,
      apiToken: config.apiToken,
      headers: config.headers,
      timeout: config.timeout,
    });

    return { config, client };
  }, [
    config.baseUrl,
    config.apiToken,
    config.headers,
    config.timeout,
    config.useServerProxy,
    config.serverAction,
    config.defaultPolling,
    config.defaultPersist,
  ]);

  return <N8nContext.Provider value={contextValue}>{children}</N8nContext.Provider>;
}
