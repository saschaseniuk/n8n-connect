# useWorkflow

The primary hook for executing n8n workflows in React applications.

## Import

```typescript
import { useWorkflow } from '@n8n-connect/react';
```

## Usage

```typescript
const { execute, status, data, error, progress, isLoading, reset, cancel } =
  useWorkflow('my-webhook');
```

## Parameters

### webhookPath

**Type**: `string`

**Required**: Yes

The webhook path configured in your n8n Webhook node.

```typescript
// If your webhook URL is: https://n8n.example.com/webhook/process-order
const { execute } = useWorkflow('process-order');
```

### options

**Type**: `UseWorkflowOptions<TInput, TOutput>`

**Required**: No

```typescript
interface UseWorkflowOptions<TInput, TOutput> {
  /**
   * Polling configuration for long-running workflows.
   */
  polling?: PollingOptions;

  /**
   * State persistence mode.
   * 'session': sessionStorage (cleared on tab close)
   * 'local': localStorage (persists)
   * false: no persistence
   */
  persist?: 'session' | 'local' | false;

  /**
   * Manual execution mode.
   * When true (default), workflow only runs when execute() is called.
   * When false, auto-executes on mount if initialData is provided.
   * @default true
   */
  manual?: boolean;

  /**
   * Callback when execution succeeds.
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
   * Initial data before first execution.
   * When manual is false, this data is used to auto-execute on mount.
   */
  initialData?: TOutput;
}
```

## Return Value

**Type**: `UseWorkflowReturn<TInput, TOutput>`

```typescript
interface UseWorkflowReturn<TInput, TOutput> {
  /** Execute the workflow */
  execute: (options?: ExecuteOptions<TInput>) => Promise<TOutput>;

  /** Current status: 'idle' | 'running' | 'success' | 'error' */
  status: WorkflowStatus;

  /** Response data from successful execution */
  data: TOutput | null;

  /** Error from failed execution */
  error: N8nError | null;

  /** Progress percentage (0-100) for polling workflows */
  progress: number | null;

  /** True when execution is in progress */
  isLoading: boolean;

  /** Reset state to initial values */
  reset: () => void;

  /** Cancel current execution */
  cancel: () => void;
}
```

## Examples

### Basic Usage

```tsx
function SimpleExample() {
  const { execute, status, data, error } = useWorkflow('hello-world');

  return (
    <div>
      <button
        onClick={() => execute({ data: { name: 'World' } })}
        disabled={status === 'running'}
      >
        {status === 'running' ? 'Loading...' : 'Say Hello'}
      </button>

      {error && <p className="error">{error.message}</p>}
      {data && <p>{data.message}</p>}
    </div>
  );
}
```

### With TypeScript Types

```tsx
interface OrderInput {
  productId: string;
  quantity: number;
}

interface OrderOutput {
  orderId: string;
  total: number;
  status: string;
}

function OrderForm() {
  const { execute, data, error, isLoading } =
    useWorkflow<OrderInput, OrderOutput>('create-order');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    execute({
      data: {
        productId: 'prod_123',
        quantity: 2,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Order'}
      </button>

      {data && (
        <div>
          Order {data.orderId} created! Total: ${data.total}
        </div>
      )}
    </form>
  );
}
```

### With File Upload

```tsx
function FileUploader() {
  const { execute, status, data, error } = useWorkflow('process-document');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file) return;
    execute({
      data: { documentType: 'invoice' },
      files: { document: file },
    });
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button onClick={handleUpload} disabled={!file || status === 'running'}>
        Upload
      </button>

      {data?.extractedData && (
        <pre>{JSON.stringify(data.extractedData, null, 2)}</pre>
      )}
    </div>
  );
}
```

### With Polling

```tsx
function AIGenerator() {
  const { execute, status, data, progress } = useWorkflow('generate-image', {
    polling: {
      enabled: true,
      interval: 2000,
      timeout: 120000,
    },
  });

  return (
    <div>
      <button
        onClick={() => execute({ data: { prompt: 'A sunset' } })}
        disabled={status === 'running'}
      >
        Generate
      </button>

      {status === 'running' && (
        <div>
          <progress value={progress ?? 0} max={100} />
          <span>{progress ?? 0}%</span>
        </div>
      )}

      {data?.imageUrl && <img src={data.imageUrl} alt="Generated" />}
    </div>
  );
}
```

### With Callbacks

```tsx
function CallbackExample() {
  const { execute } = useWorkflow('process-data', {
    onSuccess: (data) => {
      toast.success('Processing complete!');
      router.push(`/results/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
      if (error.code === 'AUTH_ERROR') {
        router.push('/login');
      }
    },
    onStatusChange: (status) => {
      analytics.track('workflow_status', { status });
    },
  });

  return <button onClick={() => execute()}>Process</button>;
}
```

### With Persistence

```tsx
function PersistentWorkflow() {
  const { execute, status, data } = useWorkflow('long-process', {
    persist: 'session',
    polling: { enabled: true },
  });

  // After page reload, if a workflow was running,
  // it automatically resumes polling

  return (
    <div>
      {status === 'running' && <p>Processing... (safe to refresh)</p>}
      {data && <p>Result: {JSON.stringify(data)}</p>}
    </div>
  );
}
```

### Reset and Cancel

```tsx
function ResetExample() {
  const { execute, status, data, error, reset, cancel } =
    useWorkflow('slow-process');

  return (
    <div>
      <button onClick={() => execute()} disabled={status === 'running'}>
        Start
      </button>

      {status === 'running' && (
        <button onClick={cancel}>Cancel</button>
      )}

      {(data || error) && (
        <button onClick={reset}>Reset</button>
      )}

      {data && <div>Result: {JSON.stringify(data)}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Multiple Workflows

```tsx
function MultiWorkflowExample() {
  const orderWorkflow = useWorkflow<OrderInput, OrderOutput>('create-order');
  const notifyWorkflow = useWorkflow('send-notification');

  const handleCreateOrder = async () => {
    const order = await orderWorkflow.execute({
      data: { productId: 'prod_123', quantity: 1 },
    });

    // Chain workflows
    await notifyWorkflow.execute({
      data: {
        type: 'order_created',
        orderId: order.orderId,
      },
    });
  };

  return (
    <button
      onClick={handleCreateOrder}
      disabled={orderWorkflow.isLoading || notifyWorkflow.isLoading}
    >
      Create Order & Notify
    </button>
  );
}
```

## Related

- [Hooks Overview](./README.md)
- [useN8nContext](./use-n8n-context.md)
- [Polling Options](../../core/polling/polling-options.md)
- [Persistence Guide](../../guides/persistence.md)
- [Workflow Types](../../core/types/workflow.md)
