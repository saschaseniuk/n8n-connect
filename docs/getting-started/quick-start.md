# Quick Start

Get n8n-connect running in your project with a minimal example.

## Prerequisites

1. An n8n instance running and accessible
2. A workflow with a Webhook trigger node
3. The webhook configured to respond (using "Respond to Webhook" node)

## n8n Workflow Setup

Create a simple workflow in n8n:

1. **Webhook node** (trigger)
   - Authentication: None (for testing)
   - HTTP Method: POST
   - Path: `hello-world`

2. **Set node** (process data)
   - Add field: `message` = `Hello, {{ $json.name }}!`
   - Add field: `timestamp` = `{{ $now }}`

3. **Respond to Webhook node** (return data)
   - Response Mode: Last Node

This creates a webhook at: `https://your-n8n.com/webhook/hello-world`

## React/Next.js Integration

### 1. Set Up the Provider

```tsx
// app/layout.tsx (Next.js App Router)
import { N8nProvider } from '@n8n-connect/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <N8nProvider
          config={{
            baseUrl: 'https://your-n8n.com',
          }}
        >
          {children}
        </N8nProvider>
      </body>
    </html>
  );
}
```

### 2. Create a Component

```tsx
// app/page.tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

export default function HomePage() {
  const { execute, status, data, error } = useWorkflow('hello-world');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    execute({
      data: { name: formData.get('name') },
    });
  };

  return (
    <div>
      <h1>n8n-connect Demo</h1>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Enter your name" required />
        <button type="submit" disabled={status === 'running'}>
          {status === 'running' ? 'Processing...' : 'Say Hello'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      {data && (
        <div>
          <p>{data.message}</p>
          <small>Generated at: {data.timestamp}</small>
        </div>
      )}
    </div>
  );
}
```

### 3. Run Your App

```bash
npm run dev
```

Visit `http://localhost:3000`, enter a name, and click "Say Hello".

## Core Package (Non-React)

For server-side or non-React usage:

```typescript
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://your-n8n.com',
});

async function main() {
  const result = await client.execute('hello-world', {
    data: { name: 'World' },
  });

  console.log(result);
  // { message: 'Hello, World!', timestamp: '2024-01-15T10:30:00.000Z' }
}

main();
```

## Common Issues

### CORS Errors

If you see CORS errors in the browser console:

1. Use [Server Proxy mode](../guides/security.md) (recommended)
2. Or configure CORS on your n8n instance

### Webhook Not Found (404)

Ensure your workflow is:

1. Active (toggle in n8n UI)
2. Using the correct webhook path
3. Accessible from your application's network

### No Response Data

Ensure your n8n workflow includes a "Respond to Webhook" node at the end.

## Next Steps

- [Configuration](./configuration.md) - Configure polling, persistence, and more
- [Security Guide](../guides/security.md) - Set up secure server proxy mode
- [useWorkflow Hook](../react/hooks/use-workflow.md) - Full hook documentation

## Related

- [N8nProvider](../react/providers/n8n-provider.md)
- [createN8nClient](../core/client/create-client.md)
