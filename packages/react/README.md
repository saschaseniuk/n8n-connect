# @n8n-connect/react

**React hooks and components for n8n workflow integration.**

Part of the [n8n-connect](https://github.com/saschaseniuk/n8n-connect) project.

[![npm version](https://img.shields.io/npm/v/@n8n-connect/react.svg)](https://www.npmjs.com/package/@n8n-connect/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/saschaseniuk/n8n-connect/blob/main/LICENSE)

## Features

- `N8nProvider` - Context provider for global configuration
- `useWorkflow` hook - Main interface for workflow execution lifecycle
- UI components for status display and file uploads
- State persistence for resuming after page reloads
- Full TypeScript support

## Installation

```bash
npm install @n8n-connect/core @n8n-connect/react
# or
pnpm add @n8n-connect/core @n8n-connect/react
# or
yarn add @n8n-connect/core @n8n-connect/react
```

## Quick Start

### Basic Usage

```tsx
import { N8nProvider, useWorkflow } from '@n8n-connect/react';

function App() {
  return (
    <N8nProvider config={{ baseUrl: 'https://n8n.example.com' }}>
      <MyComponent />
    </N8nProvider>
  );
}

function MyComponent() {
  const { execute, status, data, error } = useWorkflow('my-webhook');

  return (
    <div>
      <button
        onClick={() => execute({ data: { message: 'Hello' } })}
        disabled={status === 'running'}
      >
        {status === 'running' ? 'Processing...' : 'Run Workflow'}
      </button>

      {error && <p>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### Secure Server Proxy (Next.js)

Keep n8n credentials secure:

```typescript
// app/actions/n8n.ts
'use server';
import { createN8nAction } from '@n8n-connect/core/server';

export const executeWorkflow = createN8nAction({
  baseUrl: process.env.N8N_URL!,
  apiKey: process.env.N8N_API_KEY,
});
```

```tsx
// app/page.tsx
'use client';
import { N8nProvider, useWorkflow } from '@n8n-connect/react';
import { executeWorkflow } from './actions/n8n';

function App() {
  return (
    <N8nProvider config={{ serverAction: executeWorkflow }}>
      <MyComponent />
    </N8nProvider>
  );
}
```

### Long-Running Workflows

```tsx
const { execute, progress } = useWorkflow('long-process', {
  polling: {
    enabled: true,
    interval: 2000,
    maxAttempts: 60,
  },
  persistence: 'session',
});

// Access progress during execution
console.log(progress); // { attempt: 5, maxAttempts: 60, elapsed: 10000 }
```

### File Uploads

```tsx
const { execute } = useWorkflow('upload-webhook');

const handleUpload = async (files: File[]) => {
  await execute({
    data: { title: 'My Upload' },
    files,
  });
};
```

## API Reference

### `<N8nProvider>`

Context provider for global configuration.

**Props:**
- `config.baseUrl` - n8n instance URL (for direct mode)
- `config.serverAction` - Server Action function (for proxy mode)
- `config.apiKey` - Optional API key

### `useWorkflow(webhook, options)`

Main hook for workflow execution.

**Returns:**
- `execute(options)` - Function to trigger the workflow
- `status` - Current status: `'idle' | 'running' | 'success' | 'error'`
- `data` - Response data from the workflow
- `error` - Error object if execution failed
- `progress` - Progress info for polling workflows
- `reset()` - Reset state to idle

**Options:**
- `polling` - Polling configuration
- `persistence` - State persistence: `'none' | 'session'`
- `onSuccess` - Callback on successful execution
- `onError` - Callback on error

### `useN8nContext()`

Access the provider configuration.

## Requirements

- React >= 18.0.0
- @n8n-connect/core >= 0.1.0

## Related Packages

- [@n8n-connect/core](https://www.npmjs.com/package/@n8n-connect/core) - Framework-agnostic core

## License

MIT - see [LICENSE](https://github.com/saschaseniuk/n8n-connect/blob/main/LICENSE)
