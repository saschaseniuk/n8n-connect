# client.execute

Execute an n8n workflow via its webhook endpoint.

## Import

```typescript
import { createN8nClient } from '@n8n-connect/core';

const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });
```

## Usage

```typescript
const result = await client.execute('my-webhook', {
  data: { name: 'John', email: 'john@example.com' },
});
```

## Parameters

### webhookPath

**Type**: `string`

The webhook path configured in your n8n Webhook node (without the base URL).

```typescript
// If your webhook URL is: https://n8n.example.com/webhook/process-order
client.execute('process-order', { data: {} });
```

### options

**Type**: `ExecuteOptions<TInput>`

```typescript
interface ExecuteOptions<TInput> {
  /**
   * Data to send in the request body.
   * Will be JSON-encoded unless files are provided.
   */
  data?: TInput;

  /**
   * Files to upload with the request.
   * Keys become field names in the FormData.
   */
  files?: Record<string, File | Blob>;

  /**
   * HTTP method to use.
   * @default 'POST'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * Additional headers for this request only.
   */
  headers?: Record<string, string>;

  /**
   * Override the default timeout for this request.
   */
  timeout?: number;
}
```

## Return Value

**Type**: `Promise<TOutput>`

Returns a Promise that resolves with the workflow response data.

The response type depends on your n8n workflow's "Respond to Webhook" node configuration.

## Examples

### Simple Data Request

```typescript
interface OrderInput {
  productId: string;
  quantity: number;
}

interface OrderResult {
  orderId: string;
  total: number;
  status: string;
}

const result = await client.execute<OrderInput, OrderResult>('create-order', {
  data: {
    productId: 'prod_123',
    quantity: 2,
  },
});

console.log(`Order created: ${result.orderId}`);
```

### With File Upload

```typescript
const file = document.querySelector('input[type="file"]').files[0];

const result = await client.execute('process-document', {
  data: {
    documentType: 'invoice',
    extractFields: ['total', 'date', 'vendor'],
  },
  files: {
    document: file,
  },
});
```

### Multiple Files

```typescript
const images = document.querySelector('input[type="file"]').files;

const result = await client.execute('batch-process-images', {
  data: {
    outputFormat: 'webp',
    quality: 80,
  },
  files: {
    image1: images[0],
    image2: images[1],
    image3: images[2],
  },
});
```

### GET Request with Query Parameters

```typescript
const result = await client.execute('get-status', {
  method: 'GET',
  data: {
    orderId: 'ord_123', // Sent as query parameters for GET
  },
});
```

### With Custom Headers

```typescript
const result = await client.execute('authenticated-webhook', {
  data: { action: 'sync' },
  headers: {
    'X-Webhook-Secret': 'my-secret-token',
  },
});
```

### With Timeout Override

```typescript
// Long-running workflow with extended timeout
const result = await client.execute('generate-report', {
  data: { reportType: 'annual' },
  timeout: 120000, // 2 minutes
});
```

## Error Handling

```typescript
import { N8nError } from '@n8n-connect/core';

try {
  const result = await client.execute('my-webhook', { data: {} });
} catch (error) {
  if (error instanceof N8nError) {
    // Workflow-level error from n8n
    console.error('Workflow error:', error.message);
    console.error('Error code:', error.code);
    console.error('Details:', error.details);
  } else if (error instanceof Error) {
    // Network or other error
    console.error('Request failed:', error.message);
  }
}
```

## Request Behavior

### Content-Type Handling

- **Without files**: Request body is JSON (`application/json`)
- **With files**: Request body is FormData (`multipart/form-data`), with data fields JSON-stringified

### File Upload Details

When files are provided:

```typescript
// This call:
client.execute('upload', {
  data: { title: 'My Document' },
  files: { attachment: file },
});

// Produces a FormData like:
// - attachment: [File content]
// - data: '{"title":"My Document"}'
```

## Related

- [createN8nClient](./create-client.md) - Create client instance
- [Binary Upload](../binary/upload.md) - File upload handling details
- [Binary Download](../binary/download.md) - Handling file responses
- [Error Types](../types/errors.md) - N8nError documentation
