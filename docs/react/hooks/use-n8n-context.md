# useN8nContext

Access the n8n-connect context directly.

## Import

```typescript
import { useN8nContext } from '@n8n-connect/react';
```

## Usage

```typescript
const { config, client } = useN8nContext();
```

## Return Value

**Type**: `N8nContextValue`

```typescript
interface N8nContextValue {
  /**
   * The current configuration from N8nProvider.
   */
  config: N8nProviderConfig;

  /**
   * The underlying n8n client instance.
   * `null` in server proxy mode (when useServerProxy is true).
   */
  client: N8nClient | null;
}
```

## Examples

### Access Configuration

```tsx
function ConfigDisplay() {
  const { config } = useN8nContext();

  return (
    <div>
      <p>Base URL: {config.baseUrl}</p>
      <p>Server Proxy: {config.useServerProxy ? 'Enabled' : 'Disabled'}</p>
    </div>
  );
}
```

### Direct Client Access

For advanced use cases where you need lower-level control:

```tsx
function AdvancedComponent() {
  const { client } = useN8nContext();
  const [result, setResult] = useState(null);

  const handleCustomExecution = async () => {
    // Use the client directly instead of useWorkflow
    const data = await client.execute('custom-endpoint', {
      data: { special: true },
      headers: {
        'X-Custom-Header': 'value',
      },
    });
    setResult(data);
  };

  return <button onClick={handleCustomExecution}>Execute</button>;
}
```

### Conditional Logic Based on Config

```tsx
function ConditionalComponent() {
  const { config } = useN8nContext();

  if (config.useServerProxy) {
    return <SecureUploader />;
  }

  return (
    <div>
      <p>Warning: Direct mode - credentials may be exposed</p>
      <BasicUploader />
    </div>
  );
}
```

### Create Custom Hooks

```typescript
import { useN8nContext } from '@n8n-connect/react';
import { useCallback, useState } from 'react';

// Custom hook for batch operations
function useBatchWorkflow(webhookPath: string) {
  const { client } = useN8nContext();
  const [results, setResults] = useState<unknown[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const executeBatch = useCallback(
    async (items: unknown[]) => {
      setIsProcessing(true);
      setResults([]);

      const batchResults = [];
      for (const item of items) {
        const result = await client.execute(webhookPath, { data: item });
        batchResults.push(result);
        setResults([...batchResults]);
      }

      setIsProcessing(false);
      return batchResults;
    },
    [client, webhookPath]
  );

  return { executeBatch, results, isProcessing };
}
```

### Debug Component

```tsx
function N8nDebugPanel() {
  const { config, client } = useN8nContext();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <details style={{ position: 'fixed', bottom: 10, right: 10 }}>
      <summary>n8n Debug</summary>
      <pre>
        {JSON.stringify(
          {
            baseUrl: config.baseUrl,
            useServerProxy: config.useServerProxy,
            defaultPolling: config.defaultPolling,
          },
          null,
          2
        )}
      </pre>
    </details>
  );
}
```

## When to Use

Use `useN8nContext` when you need to:

- Access configuration values
- Use the client directly for custom requests
- Build custom hooks on top of n8n-connect
- Implement conditional logic based on configuration

For standard workflow execution, prefer `useWorkflow` instead.

## Error Handling

The hook throws an error if used outside of `N8nProvider`:

```tsx
// This will throw: "useN8nContext must be used within N8nProvider"
function BadComponent() {
  const { config } = useN8nContext(); // Error!
  return <div>{config.baseUrl}</div>;
}

// Correct usage
function App() {
  return (
    <N8nProvider config={{ baseUrl: 'https://n8n.example.com' }}>
      <GoodComponent /> {/* Works! */}
    </N8nProvider>
  );
}
```

## Related

- [Hooks Overview](./README.md)
- [useWorkflow](./use-workflow.md)
- [N8nProvider](../providers/n8n-provider.md)
- [Configuration Types](../../core/types/config.md)

---

# useN8nExecute

Get a configured execute function that automatically uses the correct mode (server proxy or direct).

## Import

```typescript
import { useN8nExecute } from '@n8n-connect/react';
```

## Usage

```typescript
const execute = useN8nExecute();

const result = await execute('/my-webhook', { data: { foo: 'bar' } });
```

## Return Value

**Type**: `<TInput, TOutput>(webhookPath: string, options?: ExecuteOptions<TInput>) => Promise<TOutput>`

A function that executes n8n workflows. Automatically routes through server proxy or direct client based on provider configuration.

## Examples

### Basic Usage

```tsx
function QuickAction() {
  const execute = useN8nExecute();
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    const data = await execute('/quick-action', {
      data: { action: 'ping' },
    });
    setResult(data);
  };

  return <button onClick={handleClick}>Execute</button>;
}
```

### With TypeScript Generics

```tsx
interface Input {
  email: string;
}

interface Output {
  userId: string;
  created: boolean;
}

function CreateUser() {
  const execute = useN8nExecute();

  const handleCreate = async (email: string) => {
    const result = await execute<Input, Output>('/create-user', {
      data: { email },
    });
    console.log('Created user:', result.userId);
  };

  return <button onClick={() => handleCreate('test@example.com')}>Create</button>;
}
```

### Fire-and-Forget Pattern

```tsx
function Analytics() {
  const execute = useN8nExecute();

  const trackEvent = (event: string) => {
    // Don't await - fire and forget
    execute('/track-event', { data: { event, timestamp: Date.now() } }).catch(
      console.error
    );
  };

  return <button onClick={() => trackEvent('button_clicked')}>Track</button>;
}
```

## When to Use

Use `useN8nExecute` when you need:

- Simple one-off workflow executions without state management
- Fire-and-forget operations
- Custom execution logic in your own hooks

For workflows that need status tracking, progress, or error handling UI, prefer `useWorkflow` instead.

## Error Handling

The function throws an error at execution time if no execution method is available:

```tsx
// This will throw at runtime if neither baseUrl nor serverAction is configured
const execute = useN8nExecute();
await execute('/webhook'); // Error: "No execution method available..."
```

---

# useN8nStatus

Check if n8n is properly configured for debugging and conditional rendering.

## Import

```typescript
import { useN8nStatus } from '@n8n-connect/react';
```

## Usage

```typescript
const { isConfigured, mode, warning } = useN8nStatus();
```

## Return Value

**Type**: `N8nStatusInfo`

```typescript
interface N8nStatusInfo {
  /** Whether n8n is properly configured for execution */
  isConfigured: boolean;

  /** The current operation mode */
  mode: 'direct' | 'proxy' | 'unconfigured';

  /** Warning message if configuration is incomplete */
  warning?: string;
}
```

### Mode Values

| Mode           | Description                                              |
| -------------- | -------------------------------------------------------- |
| `'direct'`     | Client connects directly to n8n (baseUrl configured)     |
| `'proxy'`      | Requests go through server action (useServerProxy: true) |
| `'unconfigured'` | Missing required configuration                          |

## Examples

### Conditional Warning Banner

```tsx
function ConfigWarning() {
  const { isConfigured, warning } = useN8nStatus();

  if (isConfigured) return null;

  return <div className="warning-banner">{warning}</div>;
}
```

### Development-Only Debug Panel

```tsx
function DevTools() {
  const { isConfigured, mode, warning } = useN8nStatus();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <details className="debug-panel">
      <summary>n8n Status</summary>
      <dl>
        <dt>Configured</dt>
        <dd>{isConfigured ? 'Yes' : 'No'}</dd>
        <dt>Mode</dt>
        <dd>{mode}</dd>
        {warning && (
          <>
            <dt>Warning</dt>
            <dd>{warning}</dd>
          </>
        )}
      </dl>
    </details>
  );
}
```

### Conditional Feature Rendering

```tsx
function WorkflowFeature() {
  const { isConfigured, mode } = useN8nStatus();

  if (!isConfigured) {
    return (
      <div className="placeholder">
        <p>n8n integration not configured.</p>
        <a href="/settings">Configure in Settings</a>
      </div>
    );
  }

  if (mode === 'direct') {
    return (
      <div className="warning">
        <p>Running in direct mode. API credentials may be exposed.</p>
        <WorkflowUI />
      </div>
    );
  }

  return <WorkflowUI />;
}
```

## When to Use

Use `useN8nStatus` when you need to:

- Display configuration warnings during development
- Conditionally render features based on n8n availability
- Debug configuration issues
- Show different UI for different operation modes
