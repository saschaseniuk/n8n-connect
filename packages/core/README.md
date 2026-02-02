# @n8n-connect/core

**Framework-agnostic core SDK for n8n workflow integration.**

Part of the [n8n-connect](https://github.com/saschaseniuk/n8n-connect) project.

[![npm version](https://img.shields.io/npm/v/@n8n-connect/core.svg)](https://www.npmjs.com/package/@n8n-connect/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/saschaseniuk/n8n-connect/blob/main/LICENSE)

## Features

- Webhook client for triggering n8n workflows
- Automatic binary data handling (file uploads via FormData, blob URL generation for downloads)
- Polling mechanism for long-running workflows
- Server-side proxy utilities for Next.js Server Actions
- Full TypeScript support

## Installation

```bash
npm install @n8n-connect/core
# or
pnpm add @n8n-connect/core
# or
yarn add @n8n-connect/core
```

## Quick Start

### Basic Client Usage

```typescript
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});

// Execute a webhook
const result = await client.execute('my-webhook', {
  data: { message: 'Hello from server' },
});

console.log(result);
```

### With File Uploads

```typescript
const result = await client.execute('upload-webhook', {
  data: { title: 'My Document' },
  files: [fileObject],
});
```

### Server Proxy (Next.js)

Keep n8n credentials secure by proxying requests through your server:

```typescript
// app/actions/n8n.ts
'use server';
import { createN8nAction } from '@n8n-connect/core/server';

export const executeWorkflow = createN8nAction({
  baseUrl: process.env.N8N_URL!,
  apiKey: process.env.N8N_API_KEY,
});
```

### Long-Running Workflows with Polling

```typescript
const result = await client.execute('long-process', {
  data: { task: 'generate-report' },
  polling: {
    enabled: true,
    interval: 2000,
    maxAttempts: 60,
  },
});
```

## API Reference

### `createN8nClient(options)`

Creates a new n8n client instance.

**Options:**
- `baseUrl` - n8n instance URL
- `apiKey` - Optional API key for authentication
- `timeout` - Request timeout in milliseconds

### `client.execute(webhook, options)`

Executes a webhook and returns the result.

**Options:**
- `data` - Payload to send to the webhook
- `files` - Array of files to upload
- `polling` - Polling configuration for long-running workflows

### `createN8nAction(options)`

Creates a Next.js Server Action for secure server-side webhook execution.

## Requirements

- Node.js >= 18.0.0
- n8n instance with webhook-enabled workflows

## Related Packages

- [@n8n-connect/react](https://www.npmjs.com/package/@n8n-connect/react) - React/Next.js integration

## License

MIT - see [LICENSE](https://github.com/saschaseniuk/n8n-connect/blob/main/LICENSE)
