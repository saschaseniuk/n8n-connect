# ExecutionPollingOptions

Configure polling behavior when using the Executions API.

## Import

```typescript
import type { ExecutionPollingOptions } from '@n8n-connect/core';
```

## Interface

```typescript
interface ExecutionPollingOptions {
  /**
   * Polling interval in milliseconds.
   * @default 1000
   */
  interval?: number;

  /**
   * Maximum time to poll before timing out in milliseconds.
   * @default 300000 (5 minutes)
   */
  timeout?: number;

  /**
   * Maximum number of polling attempts.
   * If both timeout and maxAttempts are set, whichever is reached first stops polling.
   */
  maxAttempts?: number;

  /**
   * Use exponential backoff for poll intervals.
   * @default false
   */
  exponentialBackoff?: boolean;

  /**
   * Maximum interval when using exponential backoff.
   * @default 10000
   */
  maxInterval?: number;

  /**
   * Callback invoked on each poll with the current execution state.
   * Receives the full ExecutionResult object.
   */
  onProgress?: (execution: ExecutionResult) => void;

  /**
   * AbortSignal for cancelling the polling operation.
   */
  signal?: AbortSignal;
}
```

## Examples

### Basic Polling

```typescript
const result = await executeAndPoll(client, execClient, '/webhook/process', {
  polling: {
    interval: 2000,  // Check every 2 seconds
    timeout: 60000,  // Give up after 1 minute
  },
});
```

### With Progress Callback

```typescript
const result = await executeAndPoll(client, execClient, '/webhook/process', {
  polling: {
    interval: 1000,
    onProgress: (exec) => {
      console.log(`Status: ${exec.status}`);
      console.log(`Workflow: ${exec.workflowName}`);
    },
  },
});
```

### With Exponential Backoff

Useful for workflows with unpredictable duration:

```typescript
const result = await executeAndPoll(client, execClient, '/webhook/process', {
  polling: {
    interval: 1000,           // Start at 1 second
    exponentialBackoff: true,
    maxInterval: 10000,       // Cap at 10 seconds
    timeout: 300000,          // 5 minute timeout
  },
});
```

### With Max Attempts

```typescript
const result = await executeAndPoll(client, execClient, '/webhook/process', {
  polling: {
    interval: 5000,
    maxAttempts: 10,  // Stop after 10 attempts
  },
});
```

### With Cancellation

```typescript
const controller = new AbortController();

// Start polling
const promise = executeAndPoll(client, execClient, '/webhook/process', {
  polling: {
    signal: controller.signal,
  },
});

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30000);
```

## Behavior Details

### Polling Flow

1. Webhook request sent, receives `executionId`
2. SDK calls `GET /api/v1/executions/{id}`
3. If `finished: false`, wait for `interval` ms
4. Repeat from step 2
5. If `finished: true` with `status: 'success'`, return result
6. If `finished: true` with `status: 'error'`, throw error
7. If timeout/maxAttempts reached, throw timeout error

### Exponential Backoff

When enabled, interval doubles after each poll:
- Poll 1: 1000ms
- Poll 2: 2000ms
- Poll 3: 4000ms
- Poll 4: 8000ms
- Poll 5+: 10000ms (capped at maxInterval)

## Related

- [Polling Overview](./README.md)
- [ExecutionsClient](./executions-client.md)
- [executeAndPoll](./execute-and-poll.md)
