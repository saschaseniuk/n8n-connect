/**
 * N8n Context definition for React applications.
 *
 * This module provides the React Context used by N8nProvider
 * to share n8n configuration and client across the component tree.
 */

import { createContext } from 'react';
import type { N8nClient, N8nProviderConfig } from '@n8n-connect/core';

/**
 * Value provided by the N8nContext.
 *
 * @property config - The n8n provider configuration
 * @property client - The n8n client instance (null in server proxy mode)
 */
export interface N8nContextValue {
  config: N8nProviderConfig;
  client: N8nClient | null;
}

/**
 * React Context for n8n configuration and client.
 *
 * Use `useN8nContext` hook to access this context.
 * Must be used within an `N8nProvider` component.
 */
export const N8nContext = createContext<N8nContextValue | null>(null);

N8nContext.displayName = 'N8nContext';
