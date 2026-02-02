# Polling with the Executions API

Handle long-running n8n workflows using the native n8n Executions API.

## Overview

Some workflows (AI image generation, batch processing, complex integrations) may take longer than typical HTTP timeouts allow. The SDK provides native polling via the n8n REST API:

1. The webhook returns immediately with an `executionId`
2. The SDK polls `/api/v1/executions/{id}` for status
3. When complete, the final result is extracted and returned

```
┌─────────┐                    ┌─────────┐
│  Client │─── Webhook ────────▶│  n8n    │
│         │◀── executionId ────│         │
│         │                    │         │
│         │─── GET execution ─▶│  API    │
│         │◀── "running" ──────│         │
│         │                    │         │
│         │─── GET execution ─▶│         │
│         │◀── "success" + ────│         │
│         │    result data     │         │
└─────────┘                    └─────────┘
```

## Requirements

- **API Token**: Required for accessing the Executions API
- **Webhook Configuration**: Must respond immediately with `executionId`

No custom status webhooks needed!

## Quick Start

```typescript
import { createN8nClient, ExecutionsClient, executeAndPoll } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});

const execClient = new ExecutionsClient(
  'https://n8n.example.com',
  'your-api-key'
);

const result = await executeAndPoll(client, execClient, '/webhook/process', {
  data: { task: 'heavy-processing' },
  polling: {
    interval: 2000,
    timeout: 300000,
    onProgress: (exec) => console.log(`Status: ${exec.status}`),
  },
});

console.log(result.data);
```

## n8n Webhook Setup

Configure your webhook to respond immediately:

```
Webhook Node Settings:
- Respond: Immediately
- Response Code: 202
- Response Data:
  {
    "executionId": "{{ $execution.id }}",
    "message": "Processing started"
  }
```

The workflow then continues processing in the background.

## API Reference

### [ExecutionsClient](./executions-client.md)

Client for the n8n Executions REST API.

### [executeAndPoll](./execute-and-poll.md)

High-level function combining webhook execution with polling.

### [ExecutionPollingOptions](./polling-options.md)

Configure polling behavior.

## Status Values

| n8n Status | Description |
|------------|-------------|
| `new` | Execution created but not started |
| `running` | Workflow is executing |
| `success` | Workflow completed successfully |
| `error` | Workflow failed |
| `canceled` | Workflow was canceled |
| `waiting` | Workflow is waiting (e.g., for external trigger) |

## Cancellation

```typescript
const controller = new AbortController();

const promise = executeAndPoll(client, execClient, '/webhook/process', {
  data: { task: 'heavy-processing' },
  polling: {
    signal: controller.signal,
  },
});

// Cancel if needed
controller.abort();
```

## Error Handling

```typescript
import { N8nError } from '@n8n-connect/core';

try {
  const result = await executeAndPoll(client, execClient, '/webhook/process', {
    polling: { timeout: 60000 },
  });
} catch (error) {
  if (error instanceof N8nError) {
    switch (error.code) {
      case 'POLLING_ERROR':
        console.log('Polling timeout or cancelled');
        break;
      case 'WORKFLOW_ERROR':
        console.log('Workflow execution failed');
        break;
      case 'AUTH_ERROR':
        console.log('Invalid API token');
        break;
    }
  }
}
```

## Related

- [ExecutionsClient](./executions-client.md) - Direct API access
- [executeAndPoll](./execute-and-poll.md) - Combined execute + poll
- [Polling Options](./polling-options.md) - Configuration options
