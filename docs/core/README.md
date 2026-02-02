# @n8n-connect/core

The core package provides framework-agnostic functionality for interacting with n8n workflows.

## Installation

```bash
npm install @n8n-connect/core
```

## Modules

### [Client](./client/README.md)

The webhook client for triggering n8n workflows and receiving responses.

- [createN8nClient](./client/create-client.md) - Create a configured client instance
- [client.execute](./client/execute.md) - Execute a workflow

### [Server Utilities](./server/README.md)

Server-side helpers for secure n8n integration.

- [createN8nAction](./server/create-n8n-action.md) - Create Next.js Server Actions

### [Polling](./polling/README.md)

Handle long-running workflows that exceed HTTP timeouts.

- [Polling Options](./polling/polling-options.md) - Configure polling behavior

### [Binary Handling](./binary/README.md)

Automatic file upload and download handling.

- [Upload](./binary/upload.md) - File upload handling
- [Download](./binary/download.md) - Binary response handling

### [Types](./types/README.md)

TypeScript type definitions.

- [Config Types](./types/config.md) - Configuration types
- [Workflow Types](./types/workflow.md) - Workflow-related types
- [Error Types](./types/errors.md) - Error types and handling

## Basic Usage

```typescript
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});

const result = await client.execute('my-webhook', {
  data: { message: 'Hello from n8n-connect' },
});
```

## When to Use Core vs React

Use `@n8n-connect/core` when:

- Building a non-React application (Vue, Svelte, vanilla JS)
- Writing server-side code (Node.js scripts, API routes)
- Need fine-grained control over the execution lifecycle

Use `@n8n-connect/react` when:

- Building a React or Next.js application
- Want declarative hooks and state management
- Need pre-built UI components
