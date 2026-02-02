# Workflow Types

TypeScript types for workflow execution.

## Import

```typescript
import type {
  ExecuteOptions,
  WorkflowStatus,
  WorkflowResult,
  UseWorkflowOptions,
  UseWorkflowReturn,
} from '@n8n-connect/core';
```

## Types

### ExecuteOptions

Options for executing a workflow.

```typescript
interface ExecuteOptions<TInput = unknown> {
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

  /**
   * Polling options for this execution.
   * Overrides hook-level and provider-level defaults.
   */
  polling?: PollingOptions;
}
```

### WorkflowStatus

The current status of a workflow execution.

```typescript
type WorkflowStatus =
  | 'idle'      // No execution in progress
  | 'running'   // Execution in progress
  | 'success'   // Execution completed successfully
  | 'error';    // Execution failed
```

### UseWorkflowOptions

Options for the useWorkflow hook.

```typescript
interface UseWorkflowOptions<TInput, TOutput> {
  /**
   * Polling configuration for long-running workflows.
   */
  polling?: PollingOptions;

  /**
   * State persistence mode.
   * 'session': Persist to sessionStorage
   * 'local': Persist to localStorage
   * false: No persistence (default)
   */
  persist?: PersistMode;

  /**
   * Callback when execution completes successfully.
   */
  onSuccess?: (data: TOutput) => void;

  /**
   * Callback when execution fails.
   */
  onError?: (error: N8nError) => void;

  /**
   * Callback when status changes.
   */
  onStatusChange?: (status: WorkflowStatus) => void;

  /**
   * Skip initial execution.
   * Useful when you want to control when execution starts.
   * @default true
   */
  manual?: boolean;

  /**
   * Initial data to use before first execution.
   */
  initialData?: TInput;
}
```

### UseWorkflowReturn

Return value from the useWorkflow hook.

```typescript
interface UseWorkflowReturn<TInput, TOutput> {
  /**
   * Execute the workflow.
   */
  execute: (data?: TInput, files?: Record<string, File | Blob>) => Promise<TOutput>;

  /**
   * Current execution status.
   */
  status: WorkflowStatus;

  /**
   * Response data from the last successful execution.
   */
  data: TOutput | null;

  /**
   * Error from the last failed execution.
   */
  error: N8nError | null;

  /**
   * Progress percentage (0-100) for polling workflows.
   */
  progress: number;

  /**
   * Whether an execution is currently in progress.
   */
  isLoading: boolean;

  /**
   * Reset the hook state to initial values.
   */
  reset: () => void;

  /**
   * Cancel the current execution (if supported).
   */
  cancel: () => void;
}
```

### WorkflowResult

Result from a workflow execution (core package).

```typescript
interface WorkflowResult<TOutput = unknown> {
  /**
   * Response data from the workflow.
   */
  data: TOutput;

  /**
   * Execution metadata.
   */
  meta: {
    /**
     * n8n execution ID.
     */
    executionId: string;

    /**
     * Execution start time.
     */
    startedAt: Date;

    /**
     * Execution end time.
     */
    finishedAt: Date;

    /**
     * Execution duration in milliseconds.
     */
    duration: number;
  };
}
```

## Usage Examples

### Typed Workflow Execution

```typescript
interface UserInput {
  name: string;
  email: string;
}

interface UserOutput {
  id: string;
  created: boolean;
  welcomeEmailSent: boolean;
}

const { execute, data, error } = useWorkflow<UserInput, UserOutput>('create-user');

// TypeScript enforces correct input shape
await execute({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});

// TypeScript knows the output shape
if (data) {
  console.log(data.id);               // string
  console.log(data.created);          // boolean
  console.log(data.welcomeEmailSent); // boolean
}
```

### With All Hook Options

```typescript
const {
  execute,
  status,
  data,
  error,
  progress,
  isLoading,
  reset,
  cancel,
} = useWorkflow<InputType, OutputType>('my-webhook', {
  polling: {
    enabled: true,
    interval: 2000,
    timeout: 60000,
  },
  persist: 'session',
  onSuccess: (data) => {
    toast.success(`Created: ${data.id}`);
  },
  onError: (error) => {
    toast.error(error.message);
  },
  onStatusChange: (status) => {
    analytics.track('workflow_status', { status });
  },
});
```

### Status Handling

```tsx
function WorkflowComponent() {
  const { execute, status, data, error } = useWorkflow('my-webhook');

  switch (status) {
    case 'idle':
      return <button onClick={() => execute()}>Start</button>;

    case 'running':
      return <Spinner>Processing...</Spinner>;

    case 'success':
      return <Result data={data} />;

    case 'error':
      return <ErrorMessage error={error} />;
  }
}
```

## Type Utilities

### Extracting Input/Output Types

```typescript
// If you have a workflow function type
type MyWorkflow = (input: { name: string }) => Promise<{ id: string }>;

// Extract input and output types
type MyInput = Parameters<MyWorkflow>[0];   // { name: string }
type MyOutput = Awaited<ReturnType<MyWorkflow>>;  // { id: string }
```

## Related

- [Configuration Types](./config.md)
- [Error Types](./errors.md)
- [useWorkflow Hook](../../react/hooks/use-workflow.md)
