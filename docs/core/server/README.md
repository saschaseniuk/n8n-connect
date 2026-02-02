# Server Utilities

Server-side utilities for secure n8n integration, primarily designed for Next.js Server Actions.

## Overview

The server module provides utilities to keep your n8n credentials secure by proxying requests through your backend:

```
┌─────────┐     ┌─────────────────┐     ┌─────────┐
│ Browser │────▶│ Your Server     │────▶│  n8n    │
│         │     │ (Server Action) │     │         │
│         │◀────│ Credentials     │◀────│         │
│         │     │ stay here       │     │         │
└─────────┘     └─────────────────┘     └─────────┘
```

## Why Server Proxy?

Without a server proxy, your n8n webhook URL and API tokens would be visible in browser network requests. This exposes:

- Your n8n instance location
- API credentials
- Internal webhook paths

The server proxy pattern hides all of this, making your n8n integration secure by default.

## Functions

### [createN8nAction](./create-n8n-action.md)

Create a Next.js Server Action that proxies requests to n8n.

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const triggerWorkflow = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN,
});
```

## Usage with React

The server action integrates seamlessly with the React package:

```tsx
// app/layout.tsx
import { N8nProvider } from '@n8n-connect/react';
import { triggerWorkflow } from './actions';

export default function RootLayout({ children }) {
  return (
    <N8nProvider
      config={{
        useServerProxy: true,
        serverAction: triggerWorkflow,
      }}
    >
      {children}
    </N8nProvider>
  );
}
```

```tsx
// app/page.tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

function MyComponent() {
  // Automatically uses the server action
  const { execute } = useWorkflow('my-webhook');

  return (
    <button onClick={() => execute({ data: { foo: 'bar' } })}>
      Execute
    </button>
  );
}
```

## Security Considerations

1. **Environment Variables**: Store credentials in server-only environment variables (without `NEXT_PUBLIC_` prefix).

2. **Input Validation**: The server action should validate incoming data before forwarding to n8n.

3. **Rate Limiting**: Consider adding rate limiting to prevent abuse.

4. **Error Sanitization**: Don't expose internal error details to clients.

## Related

- [createN8nAction](./create-n8n-action.md) - Full function documentation
- [Security Guide](../../guides/security.md) - Security best practices
- [Next.js Integration](../../guides/nextjs-integration.md) - Complete setup guide
