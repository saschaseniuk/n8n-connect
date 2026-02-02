# Configuration

Configure n8n-connect for your environment and requirements.

## Provider Configuration

The `N8nProvider` accepts a configuration object:

```tsx
import { N8nProvider } from '@n8n-connect/react';

<N8nProvider
  config={{
    baseUrl: 'https://n8n.example.com',
    useServerProxy: true,
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

## Configuration Options

### baseUrl

**Type**: `string`

The base URL of your n8n instance.

```typescript
{
  baseUrl: 'https://n8n.example.com'
}
```

### useServerProxy

**Type**: `boolean`

**Default**: `false`

When `true`, all requests route through a server-side proxy (Next.js Server Actions). This keeps your n8n URL and credentials hidden from the browser.

```typescript
{
  useServerProxy: true
}
```

See [Security Guide](../guides/security.md) for setup instructions.

### defaultPolling

**Type**: `PollingOptions`

Default polling configuration for all workflows.

```typescript
{
  defaultPolling: {
    enabled: false,     // Enable polling by default
    interval: 2000,     // Poll every 2 seconds
    timeout: 60000,     // Timeout after 60 seconds
  }
}
```

Individual hooks can override these defaults.

## Client Configuration

When using `@n8n-connect/core` directly:

```typescript
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
  headers: {
    'X-Custom-Header': 'value',
  },
  timeout: 30000,
});
```

### Client Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | - | n8n instance URL (required) |
| `headers` | `Record<string, string>` | `{}` | Custom headers for all requests |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |

## Hook-Level Configuration

Override defaults on individual hooks:

```typescript
const { execute } = useWorkflow('my-webhook', {
  // Polling configuration
  polling: {
    enabled: true,
    interval: 5000,
    timeout: 120000,
  },

  // State persistence
  persist: 'session',

  // Callbacks
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
});
```

## Environment Variables

### Next.js

Create a `.env.local` file:

```bash
# Public (accessible in browser)
NEXT_PUBLIC_N8N_BASE_URL=https://n8n.example.com

# Private (server-side only)
N8N_WEBHOOK_URL=https://n8n.example.com/webhook
N8N_API_TOKEN=your-api-token
```

Use in your code:

```tsx
<N8nProvider
  config={{
    baseUrl: process.env.NEXT_PUBLIC_N8N_BASE_URL!,
    useServerProxy: true,
  }}
>
```

### Server Actions

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const executeWorkflow = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN,
});
```

## TypeScript Configuration

For full type safety, configure your workflows:

```typescript
// types/workflows.ts
interface HelloWorldInput {
  name: string;
}

interface HelloWorldOutput {
  message: string;
  timestamp: string;
}

// Usage with types
const { execute, data } = useWorkflow<HelloWorldInput, HelloWorldOutput>('hello-world');

execute({ data: { name: 'World' } }); // Type-checked
data?.message; // Autocomplete works
```

## Related

- [N8nProvider](../react/providers/n8n-provider.md)
- [createN8nClient](../core/client/create-client.md)
- [Polling Options](../core/polling/polling-options.md)
- [Security Guide](../guides/security.md)
