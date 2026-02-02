# createN8nAction

Create a Next.js Server Action that securely proxies requests to n8n.

## Import

```typescript
import { createN8nAction } from '@n8n-connect/core/server';
```

## Usage

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const triggerWorkflow = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN,
});
```

## Parameters

### options

**Type**: `CreateN8nActionOptions`

```typescript
interface CreateN8nActionOptions {
  /**
   * The full webhook URL including path.
   * @example 'https://n8n.example.com/webhook/my-workflow'
   */
  webhookUrl: string;

  /**
   * Optional API token for n8n authentication.
   */
  apiToken?: string;

  /**
   * Custom headers to include in requests.
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Allowed webhook paths (for multi-workflow actions).
   * If not specified, any path is allowed.
   */
  allowedPaths?: string[];

  /**
   * Custom validation function for incoming requests.
   * Receives the webhook path and the data payload.
   */
  validate?: (path: string, data: unknown) => boolean | Promise<boolean>;
}
```

## Return Value

**Type**: `N8nServerAction`

Returns an async function that can be used as a Server Action:

```typescript
type N8nServerAction = <TInput, TOutput>(
  webhookPath: string,
  options?: ExecuteOptions<TInput>
) => Promise<TOutput>;

// ExecuteOptions includes:
interface ExecuteOptions<TInput> {
  data?: TInput;
  files?: Record<string, File | Blob>;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
}
```

## Examples

### Basic Usage

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
});

// Client usage
const result = await n8nAction('process-data', {
  data: { message: 'Hello' },
});
```

### With Authentication

```typescript
export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN!,
});
```

### With Path Restrictions

```typescript
// Only allow specific webhook paths
export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  allowedPaths: [
    'create-order',
    'process-payment',
    'send-notification',
  ],
});

// This will work:
await n8nAction('create-order', { data: {} });

// This will throw an error:
await n8nAction('delete-all-data', { data: {} });
```

### With Validation

```typescript
export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  validate: (path, data) => {
    // Path-specific validation
    if (path === '/create-user') {
      if (typeof data !== 'object' || data === null) return false;
      if (!('email' in data)) return false;
    }
    return true;
  },
});
```

### Multiple Actions for Different Workflows

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

// Order-related workflows
export const orderAction = createN8nAction({
  webhookUrl: process.env.N8N_ORDER_WEBHOOK_URL!,
  allowedPaths: ['create', 'update', 'cancel'],
});

// Notification workflows
export const notificationAction = createN8nAction({
  webhookUrl: process.env.N8N_NOTIFICATION_WEBHOOK_URL!,
  allowedPaths: ['email', 'sms', 'push'],
});
```

### With File Upload

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const uploadAction = createN8nAction({
  webhookUrl: process.env.N8N_UPLOAD_WEBHOOK_URL!,
  timeout: 60000, // Longer timeout for uploads
});

// Client component
'use client';

async function handleUpload(file: File) {
  const result = await uploadAction('process-document', {
    data: { documentType: 'invoice' },
    files: { document: file },
  });
}
```

### Integration with N8nProvider

```tsx
// app/layout.tsx
import { N8nProvider } from '@n8n-connect/react';
import { n8nAction } from './actions';

export default function RootLayout({ children }) {
  return (
    <N8nProvider
      config={{
        useServerProxy: true,
        serverAction: n8nAction,
      }}
    >
      {children}
    </N8nProvider>
  );
}
```

## Error Handling

```typescript
// The action throws errors that should be caught client-side
try {
  const result = await n8nAction('my-webhook', { data: {} });
} catch (error) {
  if (error instanceof Error) {
    // Handle error - message is sanitized for client
    console.error(error.message);
  }
}
```

## Security Features

1. **Credential Isolation**: API tokens never reach the browser
2. **Path Validation**: Optionally restrict allowed webhook paths
3. **Input Validation**: Custom validation before forwarding requests
4. **Error Sanitization**: Internal errors are not exposed to clients

## Related

- [Server Utilities Overview](./README.md)
- [Security Guide](../../guides/security.md)
- [Next.js Integration Guide](../../guides/nextjs-integration.md)
- [N8nProvider](../../react/providers/n8n-provider.md)
