# Next.js Integration

Complete guide to using n8n-connect with Next.js applications.

## Overview

n8n-connect provides first-class support for Next.js, including:

- App Router integration
- Server Actions for secure proxy
- Server Components support
- Environment configuration

## Quick Setup

### 1. Install Package

```bash
npm install @n8n-connect/react
```

### 2. Create Server Action

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN,
});
```

### 3. Configure Provider

```tsx
// app/layout.tsx
import { N8nProvider } from '@n8n-connect/react';
import { n8nAction } from './actions';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <N8nProvider
          config={{
            useServerProxy: true,
            serverAction: n8nAction,
          }}
        >
          {children}
        </N8nProvider>
      </body>
    </html>
  );
}
```

### 4. Use in Components

```tsx
// app/page.tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

export default function HomePage() {
  const { execute, status, data, error } = useWorkflow('hello-world');

  return (
    <main>
      <button
        onClick={() => execute({ data: { name: 'World' } })}
        disabled={status === 'running'}
      >
        Say Hello
      </button>

      {data && <p>{data.message}</p>}
      {error && <p className="error">{error.message}</p>}
    </main>
  );
}
```

## Environment Variables

```bash
# .env.local

# Server-only (secure)
N8N_WEBHOOK_URL=https://n8n.example.com/webhook
N8N_API_TOKEN=your-api-token

# Client-safe (only for development/debugging)
NEXT_PUBLIC_N8N_URL=https://n8n.example.com
```

## App Router vs Pages Router

### App Router (Recommended)

```
app/
├── layout.tsx       # Provider setup
├── page.tsx         # Client component with hooks
├── actions.ts       # Server Action
└── components/
    └── Workflow.tsx # Client component
```

### Pages Router

```
pages/
├── _app.tsx         # Provider setup
├── index.tsx        # Page component
└── api/
    └── n8n.ts       # API route (alternative to Server Action)
```

## Server Components

Server Components can use the core client directly:

```tsx
// app/server-data/page.tsx (Server Component - no 'use client')
import { createN8nClient } from '@n8n-connect/core';

export default async function ServerDataPage() {
  const client = createN8nClient({
    baseUrl: process.env.N8N_WEBHOOK_URL!,
    apiToken: process.env.N8N_API_TOKEN,
  });

  const data = await client.execute('get-public-data', {});

  return (
    <div>
      <h1>Server-Fetched Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## Client Components

Hooks require Client Components:

```tsx
// app/components/WorkflowButton.tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

export function WorkflowButton() {
  const { execute, status } = useWorkflow('trigger-action');

  return (
    <button
      onClick={() => execute()}
      disabled={status === 'running'}
    >
      {status === 'running' ? 'Running...' : 'Execute'}
    </button>
  );
}
```

Use in Server Components:

```tsx
// app/page.tsx (Server Component)
import { WorkflowButton } from './components/WorkflowButton';

export default function Page() {
  return (
    <div>
      <h1>My App</h1>
      <WorkflowButton />
    </div>
  );
}
```

## API Routes (Alternative)

If you prefer API routes over Server Actions:

```typescript
// app/api/n8n/route.ts
import { createN8nClient } from '@n8n-connect/core';
import { NextRequest, NextResponse } from 'next/server';

const client = createN8nClient({
  baseUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN,
});

export async function POST(request: NextRequest) {
  const { path, data, files } = await request.json();

  try {
    const result = await client.execute(path, { data });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Workflow execution failed' },
      { status: 500 }
    );
  }
}
```

## File Uploads

### With Server Action

```tsx
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const uploadAction = createN8nAction({
  webhookUrl: process.env.N8N_UPLOAD_URL!,
});
```

```tsx
// app/components/Uploader.tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

export function Uploader() {
  const { execute, status } = useWorkflow('process-file');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      execute({
        data: { description: 'My upload' },
        files: { document: file },
      });
    }
  };

  return (
    <input
      type="file"
      onChange={handleFile}
      disabled={status === 'running'}
    />
  );
}
```

## Middleware Integration

Add n8n-related headers or auth:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add tracking header for n8n requests
  if (request.nextUrl.pathname.startsWith('/api/n8n')) {
    const response = NextResponse.next();
    response.headers.set('X-Request-Id', crypto.randomUUID());
    return response;
  }
}
```

## Error Handling

### Global Error Boundary

```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Component-Level

```tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

export function SafeWorkflow() {
  const { execute, error } = useWorkflow('risky-operation', {
    onError: (error) => {
      // Log to error service
      console.error('Workflow failed:', error);
    },
  });

  if (error) {
    return (
      <div role="alert">
        <p>Operation failed: {error.message}</p>
        <button onClick={() => execute()}>Retry</button>
      </div>
    );
  }

  return <button onClick={() => execute()}>Execute</button>;
}
```

## Caching Considerations

### Disable Caching for Dynamic Workflows

```typescript
// In Server Component
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getData() {
  const client = createN8nClient({ /* ... */ });
  return client.execute('dynamic-data', {});
}
```

### Cache Static Data

```typescript
// Cache for 1 hour
export const revalidate = 3600;

async function getStaticData() {
  const client = createN8nClient({ /* ... */ });
  return client.execute('static-config', {});
}
```

## Production Checklist

- [ ] Use Server Actions or API routes (never expose credentials)
- [ ] Set environment variables in Vercel/hosting platform
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Test file upload size limits
- [ ] Configure appropriate timeouts
- [ ] Set up rate limiting
- [ ] Test polling behavior with slow connections
- [ ] Verify persistence works across deployments

## Example Project Structure

```
app/
├── layout.tsx              # N8nProvider setup
├── page.tsx                # Home page
├── actions.ts              # Server Actions
│
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── dashboard/
│   ├── page.tsx            # Dashboard (Server Component)
│   └── components/
│       ├── ReportGenerator.tsx   # Client Component
│       └── DataProcessor.tsx     # Client Component
│
├── api/
│   └── n8n/
│       └── route.ts        # Optional API route
│
└── components/
    ├── providers.tsx       # Client-side providers wrapper
    └── ui/                 # UI components
```

## Related

- [Security Guide](./security.md)
- [N8nProvider](../react/providers/n8n-provider.md)
- [createN8nAction](../core/server/create-n8n-action.md)
- [Configuration](../getting-started/configuration.md)
