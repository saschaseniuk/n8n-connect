# createN8nClient

Factory function that creates a configured n8n client instance.

## Import

```typescript
import { createN8nClient } from '@n8n-connect/core';
```

## Usage

```typescript
const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});

// Execute a workflow
const result = await client.execute('my-webhook', {
  data: { message: 'Hello' },
});
```

## Parameters

### options

**Type**: `N8nClientOptions`

Configuration options for the client.

```typescript
interface N8nClientOptions {
  /**
   * Base URL of your n8n instance.
   * @example 'https://n8n.example.com'
   */
  baseUrl: string;

  /**
   * Custom headers to include in all requests.
   * @default {}
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * API token for authentication (optional).
   * Prefer using server-side proxy for production.
   */
  apiToken?: string;
}
```

## Return Value

**Type**: `N8nClient`

Returns a client instance with the following methods:

```typescript
interface N8nClient {
  /**
   * Execute a workflow via webhook.
   */
  execute<TInput, TOutput>(
    webhookPath: string,
    options?: ExecuteOptions<TInput>
  ): Promise<TOutput>;
}
```

## Examples

### Basic Client

```typescript
const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});
```

### With Custom Headers

```typescript
const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
  headers: {
    'X-Custom-Header': 'my-value',
    'Authorization': 'Bearer custom-token',
  },
});
```

### With Timeout

```typescript
const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
  timeout: 60000, // 60 seconds
});
```

### With API Token

```typescript
// Note: Only use in server-side code
const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
  apiToken: process.env.N8N_API_TOKEN,
});
```

### Server-Side Usage (Node.js)

```typescript
// scripts/trigger-workflow.ts
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: process.env.N8N_BASE_URL!,
  apiToken: process.env.N8N_API_TOKEN,
});

async function processData(data: unknown) {
  return client.execute('data-processor', { data });
}
```

## Best Practices

1. **Create once, reuse**: Create a single client instance and reuse it throughout your application.

2. **Server-side credentials**: Never expose API tokens in browser code. Use the server proxy pattern or Next.js Server Actions.

3. **Appropriate timeouts**: Set timeouts based on expected workflow duration. Use [polling](../polling/README.md) for long-running workflows.

## Related

- [client.execute](./execute.md) - Execute workflows
- [createN8nAction](../server/create-n8n-action.md) - Server-side proxy
- [Configuration Types](../types/config.md)
