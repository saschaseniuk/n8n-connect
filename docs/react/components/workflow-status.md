# WorkflowStatus

A component that displays the current status and progress of a workflow execution.

## Import

```tsx
import { WorkflowStatus } from '@n8n-connect/react';
```

## Usage

```tsx
const { status, progress, error } = useWorkflow('my-webhook');

<WorkflowStatus
  status={status}
  progress={progress}
  error={error}
/>
```

## Props

### status

**Type**: `WorkflowStatus`

**Required**: Yes

The current workflow status.

```typescript
type WorkflowStatus = 'idle' | 'running' | 'success' | 'error';
```

### progress

**Type**: `number | null`

**Required**: No

Progress percentage (0-100) for polling workflows.

### error

**Type**: `N8nError | null`

**Required**: No

Error object if the workflow failed.

### className

**Type**: `string`

**Required**: No

Additional CSS classes for styling.

### showSteps

**Type**: `boolean`

**Default**: `true`

Show step-by-step progress visualization.

### steps

**Type**: `string[]`

**Default**: `['Triggered', 'Processing', 'Complete']`

Custom step labels.

### variant

**Type**: `'default' | 'minimal' | 'detailed'`

**Default**: `'default'`

Visual style variant.

## Examples

### Basic Usage

```tsx
function MyComponent() {
  const { execute, status, progress, error } = useWorkflow('process-data');

  return (
    <div>
      <button onClick={() => execute()}>Start</button>
      <WorkflowStatus status={status} progress={progress} error={error} />
    </div>
  );
}
```

### With Custom Steps

```tsx
<WorkflowStatus
  status={status}
  progress={progress}
  steps={['Uploading', 'Analyzing', 'Generating', 'Done']}
/>
```

### Minimal Variant

```tsx
<WorkflowStatus
  status={status}
  variant="minimal"
/>
```

### Detailed Variant

```tsx
<WorkflowStatus
  status={status}
  progress={progress}
  error={error}
  variant="detailed"
/>
```

### With Custom Styling

```tsx
<WorkflowStatus
  status={status}
  className="bg-gray-50 rounded-xl p-6 shadow-sm"
/>
```

### Hide Step Visualization

```tsx
<WorkflowStatus
  status={status}
  progress={progress}
  showSteps={false}
/>
```

### Full Example

```tsx
import { useWorkflow, WorkflowStatus } from '@n8n-connect/react';

function ImageGenerator() {
  const { execute, status, data, progress, error } = useWorkflow(
    'generate-image',
    {
      polling: {
        enabled: true,
        interval: 2000,
      },
    }
  );

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const prompt = new FormData(e.currentTarget).get('prompt');
          execute({ data: { prompt } });
        }}
      >
        <input name="prompt" placeholder="Describe your image..." />
        <button type="submit" disabled={status === 'running'}>
          Generate
        </button>
      </form>

      <WorkflowStatus
        status={status}
        progress={progress}
        error={error}
        steps={['Queued', 'Generating', 'Enhancing', 'Complete']}
        className="mt-4"
      />

      {data?.imageUrl && (
        <img src={data.imageUrl} alt="Generated" className="rounded-lg" />
      )}
    </div>
  );
}
```

## Styling Reference

Default classes applied to each status:

| Status | Default Classes |
|--------|-----------------|
| `idle` | `text-gray-500` |
| `running` | `text-blue-500` |
| `success` | `text-green-500` |
| `error` | `text-red-500` |

Override with className prop or Tailwind utilities.

## Accessibility

The component includes:

- `role="status"` for screen readers
- `aria-live="polite"` for status updates
- `aria-busy` when running
- Proper color contrast ratios

## Related

- [Components Overview](./README.md)
- [N8nUploadZone](./upload-zone.md)
- [useWorkflow Hook](../hooks/use-workflow.md)
