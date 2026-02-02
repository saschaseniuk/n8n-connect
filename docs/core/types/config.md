# Configuration Types

TypeScript types for configuring n8n-connect.

## Import

```typescript
import type {
  N8nClientOptions,
  N8nProviderConfig,
  PollingOptions,
} from '@n8n-connect/core';
```

## Types

### N8nClientOptions

Configuration options for the core client.

```typescript
interface N8nClientOptions {
  /**
   * Base URL of your n8n instance.
   * Should include the protocol (https://).
   * @example 'https://n8n.example.com'
   */
  baseUrl: string;

  /**
   * Custom headers to include in all requests.
   * Useful for authentication or custom tracking.
   * @default {}
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds.
   * Applies to the initial request; use polling for long workflows.
   * @default 30000
   */
  timeout?: number;

  /**
   * API token for n8n authentication.
   * Only use in server-side code; never expose in browser.
   */
  apiToken?: string;
}
```

### N8nProviderConfig

Configuration options for the React provider.

```typescript
interface N8nProviderConfig {
  /**
   * Base URL of your n8n instance.
   * @example 'https://n8n.example.com'
   */
  baseUrl?: string;

  /**
   * Enable server proxy mode.
   * When true, requests route through a server action.
   * @default false
   */
  useServerProxy?: boolean;

  /**
   * Server action function for proxy mode.
   * Required when useServerProxy is true.
   */
  serverAction?: N8nServerAction;

  /**
   * Default polling configuration for all workflows.
   * Individual hooks can override these settings.
   */
  defaultPolling?: PollingOptions;

  /**
   * Default persistence mode for workflow state.
   * @default undefined (no persistence)
   */
  defaultPersist?: PersistMode;
}
```

### PollingOptions

Configuration for long-running workflow polling.

```typescript
interface PollingOptions {
  /**
   * Enable polling mode.
   * @default false
   */
  enabled?: boolean;

  /**
   * Interval between poll requests in milliseconds.
   * @default 2000
   */
  interval?: number;

  /**
   * Maximum time to poll before timing out (milliseconds).
   * @default 60000
   */
  timeout?: number;

  /**
   * Maximum number of poll attempts.
   * If both timeout and maxAttempts are set,
   * whichever is reached first stops polling.
   */
  maxAttempts?: number;

  /**
   * Callback for progress updates.
   * Progress is 0-100 if provided by the workflow.
   */
  onProgress?: (progress: number) => void;

  /**
   * Custom status endpoint path.
   * @default '{webhookPath}-status'
   */
  statusEndpoint?: string;

  /**
   * Use exponential backoff for poll intervals.
   * @default false
   */
  exponentialBackoff?: boolean;

  /**
   * Maximum interval when using exponential backoff.
   * @default 30000
   */
  maxInterval?: number;
}
```

### PersistMode

Options for workflow state persistence.

```typescript
type PersistMode = 'session' | 'local' | false;
```

| Value | Description |
|-------|-------------|
| `'session'` | Persist to sessionStorage (cleared on tab close) |
| `'local'` | Persist to localStorage (persists across sessions) |
| `false` | No persistence |

### CreateN8nActionOptions

Configuration for server-side actions.

```typescript
interface CreateN8nActionOptions {
  /**
   * The full webhook URL including path.
   * @example 'https://n8n.example.com/webhook/my-workflow'
   */
  webhookUrl: string;

  /**
   * API token for n8n authentication.
   */
  apiToken?: string;

  /**
   * Custom headers for requests.
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Allowed webhook paths for security.
   * If set, only these paths can be executed.
   */
  allowedPaths?: string[];

  /**
   * Custom validation function for incoming data.
   * Return false to reject the request.
   */
  validate?: (path: string, data: unknown) => boolean | Promise<boolean>;
}
```

## Usage Examples

### Client Configuration

```typescript
import { createN8nClient, type N8nClientOptions } from '@n8n-connect/core';

const options: N8nClientOptions = {
  baseUrl: 'https://n8n.example.com',
  timeout: 60000,
  headers: {
    'X-Custom-Header': 'value',
  },
};

const client = createN8nClient(options);
```

### Provider Configuration

```tsx
import { N8nProvider, type N8nProviderConfig } from '@n8n-connect/react';

const config: N8nProviderConfig = {
  baseUrl: 'https://n8n.example.com',
  useServerProxy: true,
  defaultPolling: {
    enabled: false,
    interval: 2000,
    timeout: 60000,
  },
};

<N8nProvider config={config}>
  {children}
</N8nProvider>
```

## Related

- [Workflow Types](./workflow.md)
- [Error Types](./errors.md)
- [Configuration Guide](../../getting-started/configuration.md)
