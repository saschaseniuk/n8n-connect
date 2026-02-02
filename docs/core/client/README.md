# Client Module

The client module provides the core functionality for communicating with n8n webhooks.

## Overview

The n8n-connect client handles:

- HTTP requests to webhook endpoints
- Automatic FormData construction for file uploads
- Response parsing and error handling
- Request timeout management

## Functions

### [createN8nClient](./create-client.md)

Factory function that creates a configured client instance.

```typescript
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({
  baseUrl: 'https://n8n.example.com',
});
```

### [client.execute](./execute.md)

Execute a workflow via its webhook endpoint.

```typescript
const result = await client.execute('my-webhook', {
  data: { message: 'Hello' },
  files: { attachment: file },
});
```

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Your App   │────▶│  N8nClient       │────▶│  n8n        │
│             │     │  - execute()     │     │  Webhooks   │
│             │◀────│  - FormData      │◀────│             │
│             │     │  - Error handling│     │             │
└─────────────┘     └──────────────────┘     └─────────────┘
```

## Error Handling

The client throws `N8nError` for workflow failures:

```typescript
import { N8nError } from '@n8n-connect/core';

try {
  await client.execute('my-webhook', { data: {} });
} catch (error) {
  if (error instanceof N8nError) {
    console.error('Workflow failed:', error.message);
    console.error('Details:', error.details);
  }
}
```

## Related

- [Binary Upload Handling](../binary/upload.md)
- [Binary Download Handling](../binary/download.md)
- [Error Types](../types/errors.md)
