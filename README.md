# n8n-connect

**Use n8n as a headless backend for your web applications.**

n8n-connect is a TypeScript SDK that bridges the gap between n8n's powerful workflow automation and modern frontend applications. It abstracts webhook complexity, handles binary data automatically, and manages long-running workflows with built-in polling.

[![npm version](https://img.shields.io/npm/v/@n8n-connect/core.svg)](https://www.npmjs.com/package/@n8n-connect/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

> **Note**: This is an independent community project and is not affiliated with, officially maintained by, or endorsed by [n8n GmbH](https://n8n.io). n8n is a registered trademark of n8n GmbH. This SDK is developed by the community to simplify integration with self-hosted or cloud n8n instances.

## Features

- **Type-Safe**: Full TypeScript support with optional type generation from n8n workflows
- **Security First**: Server proxy mode keeps n8n URLs and API tokens server-side only
- **Automatic Binary Handling**: Files in, blob URLs out - no manual FormData construction
- **Resilient Polling**: Handles workflows that exceed HTTP timeouts gracefully
- **React Integration**: Hooks and components for seamless frontend development
- **Framework Agnostic Core**: Use with any JavaScript framework or Node.js

## Packages

| Package | Description |
|---------|-------------|
| `@n8n-connect/core` | Framework-agnostic core logic |
| `@n8n-connect/react` | React/Next.js integration |
| `n8n-connect` | CLI tools for type generation |

## Installation

```bash
# Core package (required)
npm install @n8n-connect/core

# React integration (optional)
npm install @n8n-connect/react

# CLI tools (optional, for type generation)
npm install -D n8n-connect
```

## Quick Start

### React / Next.js

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

### Node.js / Server-Side

```typescript
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});

const result = await client.execute('my-webhook', {
  data: { message: 'Hello from server' },
});

console.log(result);
```

### Secure Server Proxy (Next.js)

Keep your n8n credentials secure by proxying requests through your server:

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

## Core Concepts

### Workflow Execution

Execute n8n webhooks with automatic response handling:

```typescript
const { execute, status, data, error, progress } = useWorkflow('webhook-path');

// Execute with data
await execute({ data: { name: 'John' } });

// Execute with files
await execute({
  data: { description: 'My document' },
  files: [selectedFile]
});
```

### Long-Running Workflows

For workflows that take longer than typical HTTP timeouts:

```typescript
const { execute, progress } = useWorkflow('long-process', {
  polling: {
    enabled: true,
    interval: 2000,        // Check every 2 seconds
    maxAttempts: 60,       // Give up after 60 attempts
    exponentialBackoff: true,
  },
  persistence: 'session',  // Resume after page reload
});

// Progress updates during polling
console.log(progress); // { attempt: 5, maxAttempts: 60, elapsed: 10000 }
```

### Binary Data

Upload and download files automatically:

```typescript
// Upload files - automatically converted to FormData
await execute({
  data: { title: 'My Photo' },
  files: [photoFile],
});

// Download binary responses - automatically creates blob URLs
const { data } = useWorkflow('generate-pdf');
// data.url is a blob URL ready for download or display
```

## API Reference

### Core Package

- [`createN8nClient(options)`](docs/core/client/create-client.md) - Create a client instance
- [`client.execute(webhook, options)`](docs/core/client/execute.md) - Execute a webhook
- [`createN8nAction(options)`](docs/core/server/create-action.md) - Create a Next.js Server Action

### React Package

- [`<N8nProvider>`](docs/react/providers/n8n-provider.md) - Context provider for configuration
- [`useWorkflow(webhook, options)`](docs/react/hooks/use-workflow.md) - Main hook for workflow execution
- [`useN8nContext()`](docs/react/hooks/use-n8n-context.md) - Access provider configuration
- [`<WorkflowStatus>`](docs/react/components/workflow-status.md) - Status display component
- [`<N8nUploadZone>`](docs/react/components/upload-zone.md) - File upload component

### CLI

```bash
# Generate TypeScript types from n8n workflows
npx n8n-connect sync --url https://n8n.example.com --api-key YOUR_KEY
```

## Documentation

- [Getting Started](docs/getting-started/README.md)
- [Configuration](docs/getting-started/configuration.md)
- [Security Guide](docs/guides/security.md)
- [Error Handling](docs/guides/error-handling.md)
- [Next.js Integration](docs/guides/nextjs-integration.md)

## Requirements

- Node.js >= 18.0.0
- React >= 18.0.0 (for `@n8n-connect/react`)
- n8n instance with webhook-enabled workflows

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project is an independent, community-driven effort. It is **not** affiliated with, officially maintained by, endorsed by, or connected to [n8n GmbH](https://n8n.io) or the official n8n project in any way.

- **n8n** is a registered trademark of n8n GmbH
- This SDK is built by community members to simplify frontend integration with n8n webhooks
- For official n8n support, please refer to [n8n documentation](https://docs.n8n.io)

## Acknowledgments

- The [n8n](https://n8n.io) team for building an amazing workflow automation platform
- All community contributors who help improve this project
