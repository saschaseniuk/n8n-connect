# Error Handling

Patterns for handling errors gracefully in n8n-connect applications.

## Overview

Errors in n8n-connect can occur at multiple levels:

- **Network errors**: Connection failures, timeouts
- **Workflow errors**: Failures within n8n workflows
- **Validation errors**: Invalid input data
- **Authentication errors**: Invalid credentials

## The N8nError Class

n8n-connect provides a custom error class with structured information:

```typescript
import { N8nError } from '@n8n-connect/core';

class N8nError extends Error {
  code: N8nErrorCode;       // Error type
  statusCode?: number;      // HTTP status
  details?: object;         // Additional info
  executionId?: string;     // n8n execution ID
  nodeName?: string;        // Failed n8n node
}
```

## Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `NETWORK_ERROR` | Network/connection failure | No internet, n8n down |
| `TIMEOUT` | Request or polling timeout | Long workflow, slow network |
| `WORKFLOW_ERROR` | Error in n8n workflow | Node failure, bad config |
| `VALIDATION_ERROR` | Input validation failed | Invalid data |
| `AUTH_ERROR` | Authentication failed | Invalid token |
| `NOT_FOUND` | Webhook not found | Wrong path, inactive workflow |
| `SERVER_ERROR` | n8n server error | n8n internal error |
| `POLLING_ERROR` | Polling mechanism failed | Status endpoint error |
| `UNKNOWN` | Unknown error | Unexpected issues |

## Basic Error Handling

### With useWorkflow Hook

```tsx
function MyComponent() {
  const { execute, error, status } = useWorkflow('my-webhook');

  return (
    <div>
      <button
        onClick={() => execute({ data: { name: 'Test' } })}
        disabled={status === 'running'}
      >
        Execute
      </button>

      {error && (
        <div className="error">
          <p>{error.message}</p>
          <small>Error code: {error.code}</small>
        </div>
      )}
    </div>
  );
}
```

### With try/catch

```tsx
async function handleSubmit(data: FormData) {
  try {
    const result = await execute({ data });
    toast.success('Success!');
  } catch (error) {
    if (error instanceof N8nError) {
      handleN8nError(error);
    } else {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  }
}
```

## Error Code Handling

```typescript
function handleN8nError(error: N8nError) {
  switch (error.code) {
    case 'NETWORK_ERROR':
      toast.error('Connection failed. Check your internet.');
      break;

    case 'TIMEOUT':
      toast.error('Request timed out. Please try again.');
      // Offer retry
      setShowRetry(true);
      break;

    case 'WORKFLOW_ERROR':
      // Log details for debugging
      console.error('Workflow failed:', {
        node: error.nodeName,
        executionId: error.executionId,
        details: error.details,
      });
      toast.error('Processing failed. Our team has been notified.');
      break;

    case 'VALIDATION_ERROR':
      toast.error('Please check your input and try again.');
      break;

    case 'AUTH_ERROR':
      toast.error('Session expired. Please log in again.');
      router.push('/login');
      break;

    case 'NOT_FOUND':
      toast.error('Service temporarily unavailable.');
      break;

    default:
      toast.error('Something went wrong. Please try again.');
  }
}
```

## User-Friendly Messages

Create a mapping for user-friendly error messages:

```typescript
const errorMessages: Record<N8nErrorCode, string> = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  TIMEOUT: 'The request took too long. Please try again.',
  WORKFLOW_ERROR: 'We encountered an issue processing your request.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Your session has expired. Please log in again.',
  NOT_FOUND: 'The requested service is not available.',
  SERVER_ERROR: 'Our servers are experiencing issues. Please try later.',
  POLLING_ERROR: 'Unable to check status. Please refresh the page.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

function getUserMessage(error: N8nError): string {
  return errorMessages[error.code] || errorMessages.UNKNOWN;
}
```

## Callback-Based Handling

Use the `onError` callback for centralized handling:

```tsx
function MyApp() {
  const { execute, data } = useWorkflow('process-data', {
    onError: (error) => {
      // Log to error tracking service
      errorTracker.captureException(error, {
        extra: {
          code: error.code,
          executionId: error.executionId,
          nodeName: error.nodeName,
        },
      });

      // Show user notification
      toast.error(getUserMessage(error));

      // Handle specific errors
      if (error.code === 'AUTH_ERROR') {
        router.push('/login');
      }
    },
  });

  // Component doesn't need to handle errors directly
  return <button onClick={() => execute()}>Execute</button>;
}
```

## Retry Patterns

### Simple Retry

```tsx
function RetryableWorkflow() {
  const { execute, error, status } = useWorkflow('flaky-service');
  const [retryCount, setRetryCount] = useState(0);

  const handleExecute = async () => {
    try {
      await execute({ data: {} });
    } catch (e) {
      if (e instanceof N8nError && e.code === 'TIMEOUT' && retryCount < 3) {
        setRetryCount(c => c + 1);
        // Auto-retry after delay
        setTimeout(() => handleExecute(), 2000);
      }
    }
  };

  return (
    <button onClick={handleExecute} disabled={status === 'running'}>
      {retryCount > 0 ? `Retrying (${retryCount}/3)...` : 'Execute'}
    </button>
  );
}
```

### Exponential Backoff

```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Only retry on certain errors
      if (error instanceof N8nError) {
        if (!['TIMEOUT', 'NETWORK_ERROR', 'SERVER_ERROR'].includes(error.code)) {
          throw error; // Don't retry validation errors, etc.
        }
      }

      // Wait with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError;
}

// Usage
const result = await executeWithRetry(
  () => execute({ data: formData }),
  { maxRetries: 3, initialDelay: 1000 }
);
```

## Error Boundaries

Use React Error Boundaries for unexpected errors:

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <N8nProvider config={config}>
        <MyWorkflowComponent />
      </N8nProvider>
    </ErrorBoundary>
  );
}
```

## Logging and Monitoring

### Development Logging

```typescript
const { execute } = useWorkflow('my-webhook', {
  onError: (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('n8n Error');
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      console.error('Execution ID:', error.executionId);
      console.error('Node:', error.nodeName);
      console.groupEnd();
    }
  },
});
```

### Production Monitoring

```typescript
import * as Sentry from '@sentry/nextjs';

const { execute } = useWorkflow('my-webhook', {
  onError: (error) => {
    Sentry.captureException(error, {
      tags: {
        errorCode: error.code,
        workflow: 'my-webhook',
      },
      extra: {
        executionId: error.executionId,
        nodeName: error.nodeName,
        details: error.details,
      },
    });
  },
});
```

## n8n Workflow Error Handling

Design your n8n workflows to return structured errors:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "The provided email address is not valid",
    "field": "email"
  }
}
```

Handle in your frontend:

```typescript
const result = await execute({ data: formData });

if (!result.success) {
  // Handle workflow-level error
  setFieldError(result.error.field, result.error.message);
}
```

## Related

- [Error Types](../core/types/errors.md)
- [useWorkflow Hook](../react/hooks/use-workflow.md)
- [Security Guide](./security.md)
