# @n8n-connect/react

React and Next.js integration for n8n-connect. Provides hooks, providers, and UI components for seamless workflow execution.

## Installation

```bash
npm install @n8n-connect/react
```

This package includes `@n8n-connect/core` as a dependency.

## Modules

### [Providers](./providers/README.md)

Context providers for global configuration.

- [N8nProvider](./providers/n8n-provider.md) - Main configuration provider

### [Hooks](./hooks/README.md)

React hooks for workflow execution.

- [useWorkflow](./hooks/use-workflow.md) - Primary hook for workflow execution
- [useN8nContext](./hooks/use-n8n-context.md) - Access provider context

### [Components](./components/README.md)

Pre-built UI components.

- [WorkflowStatus](./components/workflow-status.md) - Workflow progress display
- [N8nUploadZone](./components/upload-zone.md) - File upload component

## Quick Start

```tsx
import { N8nProvider, useWorkflow } from '@n8n-connect/react';

// Wrap your app with the provider
function App() {
  return (
    <N8nProvider
      config={{
        baseUrl: 'https://n8n.example.com',
        useServerProxy: true,
      }}
    >
      <WorkflowDemo />
    </N8nProvider>
  );
}

// Use the hook in your components
function WorkflowDemo() {
  const { execute, status, data, error } = useWorkflow('image-generator');

  const handleClick = () => {
    execute({
      data: { prompt: 'A sunset over mountains' },
    });
  };

  if (status === 'running') return <p>Generating...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (data) return <img src={data.imageUrl} alt="Generated" />;

  return <button onClick={handleClick}>Generate Image</button>;
}
```

## Features

- **Declarative API**: Manage workflow state with simple hooks
- **Automatic Binary Handling**: File uploads and blob URL generation
- **Polling Support**: Seamless handling of long-running workflows
- **State Persistence**: Resume workflows after page reloads
- **Server Proxy Mode**: Keep credentials secure with Next.js Server Actions
