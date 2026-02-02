# Polling Options

Configure polling behavior for long-running workflows.

## Import

```typescript
// Core package
import {
  createN8nClient,
  executeWithPolling,
  createPollingController,
  resumePolling
} from '@n8n-connect/core';

// React package
import { useWorkflow } from '@n8n-connect/react';
```

## Usage

### React Hook

```typescript
const { execute } = useWorkflow('my-webhook', {
  polling: {
    enabled: true,
    interval: 2000,
    timeout: 60000,
  },
});
```

### Core Client

```typescript
import { createN8nClient, executeWithPolling } from '@n8n-connect/core';

const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });

const result = await executeWithPolling(client, 'my-webhook', {
  data: { /* input */ },
  polling: {
    enabled: true,
    interval: 2000,
    timeout: 60000,
  },
});
```

## Options

### PollingOptions

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
   * Maximum time to wait before timing out in milliseconds.
   * @default 60000
   */
  timeout?: number;

  /**
   * Maximum number of poll attempts.
   * If both timeout and maxAttempts are set, whichever is reached first will stop polling.
   * @default 30
   */
  maxAttempts?: number;

  /**
   * Callback function called with progress updates.
   * Progress is a number between 0 and 1 (if provided by the workflow).
   */
  onProgress?: (progress: number) => void;

  /**
   * Custom status endpoint path.
   * Must be provided either here or returned by the workflow's initial response.
   * Supports {executionId} placeholder: '/status/{executionId}'
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

  /**
   * Callback invoked when polling starts.
   * Receives the execution ID and status endpoint URL.
   * Use this to persist state for resuming after page reload.
   */
  onPollingStart?: (executionId: string, statusEndpoint: string) => void;
}
```

## Examples

### Basic Polling

```typescript
const { execute } = useWorkflow('ai-generation', {
  polling: {
    enabled: true,
    interval: 2000,  // Check every 2 seconds
    timeout: 60000,  // Give up after 1 minute
  },
});
```

### With Progress Callback

```typescript
const [progress, setProgress] = useState(0);

const { execute } = useWorkflow('batch-process', {
  polling: {
    enabled: true,
    interval: 1000,
    onProgress: (p) => setProgress(Math.round(p * 100)),
  },
});

return (
  <div>
    <progress value={progress} max={100} />
    <span>{progress}%</span>
  </div>
);
```

### With Exponential Backoff

Useful for workflows with unpredictable duration:

```typescript
const { execute } = useWorkflow('long-running-task', {
  polling: {
    enabled: true,
    interval: 1000,           // Start at 1 second
    exponentialBackoff: true,
    maxInterval: 30000,       // Cap at 30 seconds
    timeout: 300000,          // 5 minute timeout
  },
});
```

### With Max Attempts

```typescript
const { execute } = useWorkflow('finite-task', {
  polling: {
    enabled: true,
    interval: 5000,
    maxAttempts: 10,  // Stop after 10 attempts
  },
});
```

### Custom Status Endpoint

```typescript
const { execute } = useWorkflow('custom-workflow', {
  polling: {
    enabled: true,
    statusEndpoint: '/workflow-status/{executionId}',
  },
});
```

### Cancellation

Use `createPollingController` to cancel ongoing polling:

```typescript
import { createN8nClient, executeWithPolling, createPollingController } from '@n8n-connect/core';

const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
const controller = createPollingController();

// Start polling with cancellation support
const promise = executeWithPolling(client, 'long-task', {
  data: { input: 'value' },
  polling: { enabled: true },
  signal: controller.signal,
});

// Cancel when needed (e.g., user navigates away)
controller.cancel();
```

### Resume Polling After Page Reload

With persistence enabled, `useWorkflow` automatically resumes polling after page reload:

```tsx
function LongRunningTask() {
  const { execute, status, progress, data } = useWorkflow('long-task', {
    persist: 'session', // Persist state to sessionStorage
    polling: {
      enabled: true,
      interval: 2000,
      timeout: 300000, // 5 minutes
    },
  });

  // After page reload, if polling was in progress:
  // - status will be 'running'
  // - polling automatically resumes from where it left off

  return (
    <div>
      {status === 'running' && (
        <p>Processing... {progress}% (safe to refresh)</p>
      )}
      {data && <p>Result: {JSON.stringify(data)}</p>}
    </div>
  );
}
```

For manual resume with the core package:

```typescript
import { createN8nClient, resumePolling } from '@n8n-connect/core';

// After page reload, restore persisted execution info
const executionId = sessionStorage.getItem('executionId');
const statusEndpoint = sessionStorage.getItem('statusEndpoint');

if (executionId && statusEndpoint) {
  const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });

  const result = await resumePolling(client, {
    executionId,
    statusEndpoint,
    polling: {
      interval: 2000,
      timeout: 60000,
      onProgress: (p) => console.log(`${p * 100}%`),
    },
  });
}
```

## Default Configuration

Set default polling options in the provider:

```tsx
<N8nProvider
  config={{
    baseUrl: 'https://n8n.example.com',
    defaultPolling: {
      enabled: false,
      interval: 2000,
      timeout: 60000,
    },
  }}
>
  {children}
</N8nProvider>
```

Individual hooks override these defaults.

## Behavior Details

### Polling Flow

1. Initial request sent to webhook
2. Response must include `executionId` and `status: 'running'`
3. Client waits for `interval` milliseconds
4. Polls status endpoint with `executionId`
5. If `status: 'running'`, repeat from step 3
6. If `status: 'complete'`, return the result
7. If timeout/maxAttempts reached, throw timeout error

### Expected Response Format

Initial response:
```json
{
  "executionId": "abc123",
  "status": "running"
}
```

Status endpoint response (running):
```json
{
  "status": "running",
  "progress": 0.45
}
```

Status endpoint response (complete):
```json
{
  "status": "complete",
  "result": { /* your data */ }
}
```

Status endpoint response (error):
```json
{
  "status": "error",
  "error": "Something went wrong"
}
```

## Functions

### executeWithPolling

Executes a workflow and automatically polls for completion if needed.

```typescript
function executeWithPolling<TInput, TOutput>(
  client: N8nClient,
  webhookPath: string,
  options: {
    data?: TInput;
    files?: Record<string, File | Blob>;
    polling?: PollingOptions;
    signal?: AbortSignal;
  }
): Promise<TOutput>
```

### resumePolling

Resumes polling for an existing execution (e.g., after page reload).

```typescript
function resumePolling<TOutput>(
  client: N8nClient,
  options: {
    executionId: string;
    statusEndpoint: string;
    polling?: PollingOptions;
    signal?: AbortSignal;
  }
): Promise<TOutput>
```

### createPollingController

Creates a controller for cancelling polling operations.

```typescript
function createPollingController(): {
  cancel: () => void;
  signal: AbortSignal;
}
```

## Related

- [Polling Module Overview](./README.md)
- [useWorkflow Hook](../../react/hooks/use-workflow.md)
- [Persistence Guide](../../guides/persistence.md)
