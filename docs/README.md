# n8n-connect SDK Documentation

**n8n-connect** is a TypeScript SDK for using n8n as a headless backend for modern web applications. It abstracts the complexity of webhooks, binary data handling, and long-running workflows.

## Philosophy

n8n excels at workflow automation but can be cumbersome to integrate with frontends. n8n-connect bridges this gap:

- **Type Safety**: Full TypeScript support with optional schema generation
- **Process-Oriented**: Designed around workflow executions, not raw API endpoints
- **Batteries Included**: Integrated polling, automatic file handling, and Next.js optimization

## Packages

| Package | Description |
|---------|-------------|
| [@n8n-connect/core](./core/README.md) | Framework-agnostic core logic |
| [@n8n-connect/react](./react/README.md) | React/Next.js integration |

## Documentation

### Getting Started

- [Installation](./getting-started/installation.md) - Package installation
- [Quick Start](./getting-started/quick-start.md) - Minimal working example
- [Configuration](./getting-started/configuration.md) - Configuration options

### Core Package

- [Client](./core/client/README.md) - Webhook client for triggering workflows
- [Server Utilities](./core/server/README.md) - Next.js Server Action helpers
- [Polling](./core/polling/README.md) - Long-running workflow support
- [Binary Handling](./core/binary/README.md) - File uploads and downloads
- [Types](./core/types/README.md) - TypeScript type definitions

### React Package

- [Providers](./react/providers/README.md) - Context providers
- [Hooks](./react/hooks/README.md) - React hooks for workflow execution
- [Components](./react/components/README.md) - Pre-built UI components

### CLI

- [CLI Overview](./cli/README.md) - Command-line tools
- [Sync Command](./cli/sync.md) - Type generation from workflows

### Guides

- [Security](./guides/security.md) - Security best practices
- [Error Handling](./guides/error-handling.md) - Error handling patterns
- [Persistence](./guides/persistence.md) - State persistence across reloads
- [Next.js Integration](./guides/nextjs-integration.md) - Complete Next.js guide

## Quick Example

```typescript
import { N8nProvider, useWorkflow } from '@n8n-connect/react';

function App() {
  return (
    <N8nProvider config={{ baseUrl: 'https://n8n.example.com', useServerProxy: true }}>
      <MyComponent />
    </N8nProvider>
  );
}

function MyComponent() {
  const { execute, status, data, error } = useWorkflow('my-webhook');

  return (
    <button onClick={() => execute({ data: { message: 'Hello' } })}>
      {status === 'running' ? 'Processing...' : 'Run Workflow'}
    </button>
  );
}
```

## Status

This project is in early development. APIs may change before the 1.0 release.
