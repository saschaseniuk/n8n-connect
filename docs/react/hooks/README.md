# Hooks

React hooks for workflow execution and context access.

## Overview

n8n-connect provides React hooks that handle the full lifecycle of workflow execution, including state management, error handling, and polling.

## Hooks

### [useWorkflow](./use-workflow.md)

The primary hook for executing n8n workflows.

```typescript
const { execute, status, data, error, progress } = useWorkflow('my-webhook');
```

### [useN8nContext](./use-n8n-context.md)

Access the n8n-connect context directly.

```typescript
const { config, client } = useN8nContext();
```

## Quick Start

```tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

function MyComponent() {
  const { execute, status, data, error } = useWorkflow('process-data');

  const handleSubmit = (formData: FormData) => {
    execute({
      data: {
        name: formData.get('name'),
        email: formData.get('email'),
      },
    });
  };

  if (status === 'running') return <p>Processing...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (data) return <p>Result: {JSON.stringify(data)}</p>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }}>
      <input name="name" />
      <input name="email" type="email" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Hook Requirements

All hooks require the component to be wrapped in an `N8nProvider`:

```tsx
import { N8nProvider } from '@n8n-connect/react';

function App() {
  return (
    <N8nProvider config={{ baseUrl: 'https://n8n.example.com' }}>
      <MyComponent /> {/* Hooks work here */}
    </N8nProvider>
  );
}
```

## Client vs Server Components

In Next.js App Router, hooks can only be used in Client Components:

```tsx
// This component uses hooks, so it must be a Client Component
'use client';

import { useWorkflow } from '@n8n-connect/react';

export function WorkflowButton() {
  const { execute } = useWorkflow('my-webhook');
  return <button onClick={() => execute()}>Execute</button>;
}
```

Server Components should use the core client directly:

```tsx
// Server Component - no 'use client' directive
import { createN8nClient } from '@n8n-connect/core';

export async function ServerDataFetcher() {
  const client = createN8nClient({
    baseUrl: process.env.N8N_URL!,
  });

  const data = await client.execute('get-data', {});
  return <div>{JSON.stringify(data)}</div>;
}
```

## Related

- [useWorkflow](./use-workflow.md) - Main workflow hook
- [useN8nContext](./use-n8n-context.md) - Context access hook
- [N8nProvider](../providers/n8n-provider.md) - Required provider
