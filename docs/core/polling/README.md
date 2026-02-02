# Polling Module

Handle long-running n8n workflows that exceed standard HTTP timeouts.

## Overview

Some workflows (AI image generation, batch processing, complex integrations) may take longer than typical HTTP timeouts allow. The polling module provides a seamless solution:

1. The initial request returns immediately with an `executionId`
2. The client polls a status endpoint at configured intervals
3. When complete, the final result is returned

```
┌─────────┐                    ┌─────────┐
│  Client │─── Start ─────────▶│  n8n    │
│         │◀── executionId ────│         │
│         │                    │         │
│         │─── Poll status ───▶│         │
│         │◀── "running" ──────│         │
│         │                    │         │
│         │─── Poll status ───▶│         │
│         │◀── "running" ──────│         │
│         │                    │         │
│         │─── Poll status ───▶│         │
│         │◀── "complete" + ───│         │
│         │    result          │         │
└─────────┘                    └─────────┘
```

## Configuration

### [Polling Options](./polling-options.md)

Configure polling behavior for your workflows.

```typescript
const { execute } = useWorkflow('heavy-workflow', {
  polling: {
    enabled: true,
    interval: 2000,    // Poll every 2 seconds
    timeout: 60000,    // Give up after 60 seconds
  },
});
```

## n8n Workflow Setup

For polling to work, your n8n workflow must be structured correctly:

### 1. Return executionId Immediately

The webhook should respond quickly with an execution identifier:

```json
{
  "executionId": "{{ $execution.id }}",
  "status": "running"
}
```

### 2. Create a Status Endpoint

A separate webhook to check execution status:

```
GET /webhook/my-workflow-status?executionId=xxx
```

### 3. Return Final Result

When complete, the status endpoint returns:

```json
{
  "status": "complete",
  "result": { /* your data */ }
}
```

## React Integration

The `useWorkflow` hook handles polling automatically:

```tsx
function AIImageGenerator() {
  const { execute, status, data, progress } = useWorkflow('generate-image', {
    polling: {
      enabled: true,
      interval: 2000,
      timeout: 120000,
    },
  });

  return (
    <div>
      <button onClick={() => execute({ data: { prompt: 'A sunset' } })}>
        Generate
      </button>

      {status === 'running' && (
        <p>Generating... {progress && `${progress}%`}</p>
      )}

      {data && <img src={data.imageUrl} alt="Generated" />}
    </div>
  );
}
```

## Core Package Usage

```typescript
import { createN8nClient, executeWithPolling } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});

// With polling options
const result = await executeWithPolling(client, 'heavy-workflow', {
  data: { /* input */ },
  polling: {
    enabled: true,
    interval: 2000,
    timeout: 60000,
    onProgress: (progress) => console.log(`Progress: ${Math.round(progress * 100)}%`),
  },
});
```

### Cancellation

```typescript
import { createN8nClient, executeWithPolling, createPollingController } from '@n8n-connect/core';

const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
const controller = createPollingController();

// Start polling
const promise = executeWithPolling(client, 'long-task', {
  polling: { enabled: true },
  signal: controller.signal,
});

// Cancel if needed
controller.cancel();
```

## Status Values

| Status | Description |
|--------|-------------|
| `idle` | No execution in progress |
| `running` | Workflow is executing (polling active) |
| `complete` | Workflow finished successfully |
| `error` | Workflow failed |
| `timeout` | Polling timeout exceeded |

## Related

- [Polling Options](./polling-options.md) - Detailed configuration
- [useWorkflow Hook](../../react/hooks/use-workflow.md) - React integration
- [Persistence Guide](../../guides/persistence.md) - Resume polling after page reload
