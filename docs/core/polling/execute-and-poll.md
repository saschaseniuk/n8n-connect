# executeAndPoll

Execute a webhook and poll for completion using the n8n Executions API.

## Import

```typescript
import { executeAndPoll } from '@n8n-connect/core';
```

## Signature

```typescript
function executeAndPoll<TInput = unknown, TOutput = unknown>(
  client: N8nClient,
  executionsClient: ExecutionsClient,
  webhookPath: string,
  options?: ExecuteAndPollOptions<TInput>
): Promise<ExecutionResult<TOutput>>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `N8nClient` | Client for executing the webhook |
| `executionsClient` | `ExecutionsClient` | Client for polling executions |
| `webhookPath` | `string` | Webhook path to execute |
| `options` | `ExecuteAndPollOptions` | Input data and polling options |

### ExecuteAndPollOptions

```typescript
interface ExecuteAndPollOptions<TInput = unknown> {
  /** Input data for the webhook */
  data?: TInput;
  /** Files to upload */
  files?: Record<string, File | Blob>;
  /** Polling options */
  polling?: ExecutionPollingOptions;
}
```

## Returns

`ExecutionResult<TOutput>` - The final execution result

## Usage

### Basic Example

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
  data: { task: 'process-data' },
});

console.log(result.data);
```

### With Type Safety

```typescript
interface ProcessInput {
  task: string;
  items: string[];
}

interface ProcessOutput {
  processedCount: number;
  results: { id: string; status: string }[];
}

const result = await executeAndPoll<ProcessInput, ProcessOutput>(
  client,
  execClient,
  '/webhook/batch-process',
  {
    data: {
      task: 'batch-process',
      items: ['item1', 'item2', 'item3'],
    },
    polling: {
      interval: 2000,
      timeout: 300000,
    },
  }
);

console.log(result.data?.processedCount); // TypeScript knows this is number | undefined
```

### With File Upload

```typescript
const result = await executeAndPoll(client, execClient, '/webhook/import', {
  data: { format: 'csv' },
  files: {
    dataFile: new File([csvContent], 'data.csv', { type: 'text/csv' }),
  },
  polling: {
    interval: 5000,
    timeout: 600000, // 10 minutes for large files
  },
});
```

### With Progress Tracking

```typescript
const result = await executeAndPoll(client, execClient, '/webhook/process', {
  data: { items: largeDataset },
  polling: {
    interval: 2000,
    onProgress: (exec) => {
      console.log(`Status: ${exec.status}`);
      if (exec.duration) {
        console.log(`Running for ${exec.duration}ms`);
      }
    },
  },
});
```

### With Cancellation

```typescript
const controller = new AbortController();

const promise = executeAndPoll(client, execClient, '/webhook/process', {
  data: { task: 'long-running' },
  polling: {
    signal: controller.signal,
  },
});

// Cancel after user action
document.getElementById('cancel-btn')?.addEventListener('click', () => {
  controller.abort();
});

try {
  const result = await promise;
} catch (error) {
  if (error.code === 'POLLING_ERROR') {
    console.log('Operation cancelled');
  }
}
```

## n8n Webhook Requirements

The webhook must respond immediately with the execution ID:

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

If the webhook response doesn't include `executionId`, the function throws:

```typescript
N8nError: Webhook response must include executionId.
Configure your webhook to respond immediately with { "executionId": "{{ $execution.id }}" }
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
      case 'VALIDATION_ERROR':
        // Webhook didn't return executionId
        console.log('Configure webhook to return executionId');
        break;
      case 'POLLING_ERROR':
        // Timeout or cancelled
        console.log('Polling failed:', error.message);
        break;
      case 'WORKFLOW_ERROR':
        // n8n workflow failed
        console.log('Workflow error:', error.details);
        break;
      case 'AUTH_ERROR':
        // API token issue
        console.log('Check your API token');
        break;
    }
  }
}
```

## Comparison with Direct Polling

| Approach | Use Case |
|----------|----------|
| `executeAndPoll()` | Most common - execute webhook, then poll |
| `execClient.pollExecution()` | When you already have an executionId |

## Related

- [Polling Overview](./README.md)
- [ExecutionsClient](./executions-client.md)
- [Polling Options](./polling-options.md)
