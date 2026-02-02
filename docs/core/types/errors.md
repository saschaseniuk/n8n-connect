# Error Types

Error handling types and the N8nError class.

## Import

```typescript
import { N8nError } from '@n8n-connect/core';
```

## N8nError Class

A custom error class for n8n-related errors.

```typescript
class N8nError extends Error {
  /**
   * Error code for programmatic handling.
   */
  code: N8nErrorCode;

  /**
   * HTTP status code (if applicable).
   */
  statusCode?: number;

  /**
   * Additional error details from n8n.
   */
  details?: Record<string, unknown>;

  /**
   * n8n execution ID (if available).
   */
  executionId?: string;

  /**
   * The node in n8n that caused the error (if available).
   */
  nodeName?: string;

  constructor(message: string, options?: N8nErrorDetails);
}
```

### N8nErrorCode

Error codes for different failure types.

```typescript
type N8nErrorCode =
  | 'NETWORK_ERROR'      // Network or connection failure
  | 'TIMEOUT'            // Request or polling timeout
  | 'WORKFLOW_ERROR'     // Error within the n8n workflow
  | 'VALIDATION_ERROR'   // Input validation failed
  | 'AUTH_ERROR'         // Authentication failed
  | 'NOT_FOUND'          // Webhook or workflow not found
  | 'SERVER_ERROR'       // n8n server error
  | 'POLLING_ERROR'      // Error during polling
  | 'UNKNOWN';           // Unknown error
```

### N8nErrorDetails

Options for creating an N8nError.

```typescript
interface N8nErrorDetails {
  code: N8nErrorCode;
  statusCode?: number;
  details?: Record<string, unknown>;
  executionId?: string;
  nodeName?: string;
}
```

## Usage Examples

### Basic Error Handling

```typescript
import { N8nError } from '@n8n-connect/core';

try {
  await client.execute('my-webhook', { data: {} });
} catch (error) {
  if (error instanceof N8nError) {
    console.error('n8n Error:', error.message);
    console.error('Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Handling Specific Error Codes

```typescript
try {
  await execute({ data: formData });
} catch (error) {
  if (!(error instanceof N8nError)) {
    throw error; // Re-throw unexpected errors
  }

  switch (error.code) {
    case 'NETWORK_ERROR':
      toast.error('Network error. Please check your connection.');
      break;

    case 'TIMEOUT':
      toast.error('Request timed out. Please try again.');
      break;

    case 'WORKFLOW_ERROR':
      toast.error(`Workflow failed: ${error.message}`);
      // Log details for debugging
      console.error('Details:', error.details);
      console.error('Node:', error.nodeName);
      break;

    case 'VALIDATION_ERROR':
      toast.error('Invalid input. Please check your data.');
      break;

    case 'AUTH_ERROR':
      toast.error('Authentication failed. Please log in again.');
      break;

    case 'NOT_FOUND':
      toast.error('Workflow not found.');
      break;

    default:
      toast.error('An unexpected error occurred.');
  }
}
```

### With useWorkflow Hook

```tsx
function MyComponent() {
  const { execute, error, status } = useWorkflow('my-webhook', {
    onError: (error) => {
      // Handle error in callback
      if (error.code === 'TIMEOUT') {
        // Offer retry option
        setShowRetry(true);
      }
    },
  });

  // Error is also available in the return value
  if (error) {
    return (
      <div className="error">
        <p>{error.message}</p>
        {error.code === 'WORKFLOW_ERROR' && error.nodeName && (
          <small>Failed at: {error.nodeName}</small>
        )}
      </div>
    );
  }

  return <button onClick={() => execute()}>Execute</button>;
}
```

### Accessing Error Details

```typescript
try {
  await execute({ data });
} catch (error) {
  if (error instanceof N8nError) {
    // Basic info
    console.log('Message:', error.message);
    console.log('Code:', error.code);

    // HTTP info
    if (error.statusCode) {
      console.log('HTTP Status:', error.statusCode);
    }

    // n8n-specific info
    if (error.executionId) {
      console.log('Execution ID:', error.executionId);
      console.log(`View in n8n: ${n8nUrl}/execution/${error.executionId}`);
    }

    if (error.nodeName) {
      console.log('Failed Node:', error.nodeName);
    }

    // Additional details
    if (error.details) {
      console.log('Details:', JSON.stringify(error.details, null, 2));
    }
  }
}
```

### Creating Custom Errors

For advanced use cases, you can create N8nError instances:

```typescript
throw new N8nError('Custom validation failed', {
  code: 'VALIDATION_ERROR',
  statusCode: 400,
  details: {
    field: 'email',
    reason: 'Invalid format',
  },
});
```

## Error Handling Patterns

### Retry on Timeout

```typescript
async function executeWithRetry<T>(
  execute: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: N8nError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await execute();
    } catch (error) {
      if (error instanceof N8nError && error.code === 'TIMEOUT') {
        lastError = error;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
```

### User-Friendly Messages

```typescript
function getUserMessage(error: N8nError): string {
  const messages: Record<N8nErrorCode, string> = {
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    TIMEOUT: 'The request took too long. Please try again.',
    WORKFLOW_ERROR: 'Something went wrong processing your request.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUTH_ERROR: 'Please log in to continue.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
    POLLING_ERROR: 'Error checking status. Please refresh the page.',
    UNKNOWN: 'An unexpected error occurred.',
  };

  return messages[error.code] || messages.UNKNOWN;
}
```

## Related

- [Configuration Types](./config.md)
- [Workflow Types](./workflow.md)
- [Error Handling Guide](../../guides/error-handling.md)
