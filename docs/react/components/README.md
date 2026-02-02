# Components

Pre-built React components for common n8n integration patterns.

## Overview

n8n-connect provides accessible, customizable UI components that integrate with Tailwind CSS and Shadcn/UI.

## Components

### [WorkflowStatus](./workflow-status.md)

Display workflow execution progress visually.

```tsx
import { WorkflowStatus } from '@n8n-connect/react';

<WorkflowStatus
  status={status}
  progress={progress}
  error={error}
/>
```

### [N8nUploadZone](./upload-zone.md)

Drag-and-drop file upload component.

```tsx
import { N8nUploadZone } from '@n8n-connect/react';

<N8nUploadZone
  onFilesSelected={(files) => handleFiles(files)}
  accept={['image/*', 'application/pdf']}
  maxSize={10 * 1024 * 1024}
/>
```

## Design Philosophy

The components follow these principles:

1. **Accessible**: Built with ARIA attributes and keyboard navigation
2. **Customizable**: Accept className props for styling
3. **Composable**: Work well with other UI libraries
4. **Headless Option**: Core logic available as hooks

## Styling

Components use minimal default styles and accept Tailwind classes:

```tsx
<WorkflowStatus
  status={status}
  className="bg-gray-100 rounded-lg p-4"
/>

<N8nUploadZone
  onFilesSelected={handleFiles}
  className="border-2 border-dashed border-gray-300 hover:border-blue-500"
/>
```

## With Shadcn/UI

Components integrate seamlessly with Shadcn/UI:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowStatus, N8nUploadZone } from '@n8n-connect/react';

function UploadCard() {
  const { execute, status, progress, error } = useWorkflow('process-file');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <N8nUploadZone
          onFilesSelected={(files) => {
            execute({ files: { document: files[0] } });
          }}
        />
        <WorkflowStatus
          status={status}
          progress={progress}
          error={error}
        />
      </CardContent>
    </Card>
  );
}
```

## Headless Usage

If you prefer complete control over the UI, use the hooks directly:

```tsx
import { useWorkflow } from '@n8n-connect/react';

function CustomUploader() {
  const { execute, status, progress, error } = useWorkflow('upload');
  const [isDragging, setIsDragging] = useState(false);

  // Build your own UI with full control
  return (
    <div
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        execute({ files: { upload: file } });
      }}
      onDragOver={(e) => e.preventDefault()}
      className={isDragging ? 'bg-blue-50' : 'bg-white'}
    >
      {/* Custom UI */}
    </div>
  );
}
```

## Related

- [WorkflowStatus](./workflow-status.md) - Progress display
- [N8nUploadZone](./upload-zone.md) - File upload
- [useWorkflow Hook](../hooks/use-workflow.md)
