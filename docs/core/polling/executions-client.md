# ExecutionsClient

Client for the n8n Executions REST API.

## Import

```typescript
import { ExecutionsClient } from '@n8n-connect/core';
```

## Constructor

```typescript
new ExecutionsClient(baseUrl: string, apiToken: string)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `baseUrl` | `string` | The base URL of your n8n instance |
| `apiToken` | `string` | n8n API token with execution read permissions |

### Throws

- `N8nError` with code `AUTH_ERROR` if apiToken is not provided

## Usage

```typescript
const execClient = new ExecutionsClient(
  'https://n8n.example.com',
  'your-api-key'
);
```

## Methods

### getExecution

Get execution details by ID.

```typescript
async getExecution(executionId: string): Promise<ExecutionResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `executionId` | `string` | The execution ID to retrieve |

#### Returns

`ExecutionResult` - Parsed execution data

#### Throws

| Error Code | Condition |
|------------|-----------|
| `NOT_FOUND` | Execution not found (404) |
| `AUTH_ERROR` | Invalid or missing API token (401, 403) |
| `SERVER_ERROR` | Other server errors |

#### Example

```typescript
const execution = await execClient.getExecution('12345');

console.log(execution.status);      // 'running' | 'success' | 'error' | ...
console.log(execution.finished);    // true | false
console.log(execution.data);        // Workflow output data
console.log(execution.workflowName);// 'My Workflow'
```

### pollExecution

Poll for execution completion.

```typescript
async pollExecution<T = unknown>(
  executionId: string,
  options?: ExecutionPollingOptions
): Promise<ExecutionResult<T>>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `executionId` | `string` | The execution ID to poll |
| `options` | `ExecutionPollingOptions` | Polling configuration (optional) |

#### Returns

`ExecutionResult<T>` - Final execution result with typed data

#### Throws

| Error Code | Condition |
|------------|-----------|
| `POLLING_ERROR` | Timeout, max attempts, or cancelled |
| `WORKFLOW_ERROR` | Execution finished with error or canceled status |
| `NOT_FOUND` | Execution not found |
| `AUTH_ERROR` | Invalid API token |

#### Example

```typescript
const result = await execClient.pollExecution<{ processedItems: number }>('12345', {
  interval: 2000,
  timeout: 300000,
  onProgress: (exec) => console.log(`Status: ${exec.status}`),
});

console.log(result.data?.processedItems); // 42
```

## ExecutionResult

```typescript
interface ExecutionResult<T = unknown> {
  executionId: string;
  status: N8nExecutionStatus;
  finished: boolean;
  data: T | null;
  startedAt: Date;
  stoppedAt?: Date;
  duration?: number;
  workflowId: string;
  workflowName?: string;
}
```

## N8nExecutionStatus

```typescript
type N8nExecutionStatus =
  | 'new'
  | 'running'
  | 'success'
  | 'error'
  | 'canceled'
  | 'waiting';
```

## Error Handling

```typescript
import { N8nError } from '@n8n-connect/core';

try {
  const result = await execClient.pollExecution('12345');
} catch (error) {
  if (error instanceof N8nError) {
    switch (error.code) {
      case 'NOT_FOUND':
        console.log('Execution not found');
        break;
      case 'AUTH_ERROR':
        console.log('Check your API token');
        break;
      case 'POLLING_ERROR':
        console.log('Polling timeout or cancelled');
        break;
      case 'WORKFLOW_ERROR':
        console.log('Workflow execution failed');
        break;
    }
  }
}
```

## API Authentication

The client uses the `X-N8N-API-KEY` header for authentication:

```http
GET /api/v1/executions/12345
X-N8N-API-KEY: your-api-key
```

## Related

- [Polling Overview](./README.md)
- [executeAndPoll](./execute-and-poll.md)
- [Polling Options](./polling-options.md)
