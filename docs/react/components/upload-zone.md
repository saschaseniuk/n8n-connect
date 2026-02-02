# N8nUploadZone

A drag-and-drop file upload component optimized for n8n binary input nodes.

## Import

```tsx
import { N8nUploadZone } from '@n8n-connect/react';
```

## Usage

```tsx
<N8nUploadZone
  onFilesSelected={(files) => {
    execute({ files: { document: files[0] } });
  }}
/>
```

## Props

### onFilesSelected

**Type**: `(files: File[]) => void`

**Required**: Yes

Callback when files are selected (via drag-drop or file picker).

### accept

**Type**: `string | string[]`

**Required**: No

Accepted file types. Uses standard accept attribute format.

```tsx
// Single type
accept="image/*"

// Multiple types
accept={['image/*', 'application/pdf', '.doc', '.docx']}
```

### maxSize

**Type**: `number`

**Required**: No

Maximum file size in bytes.

```tsx
maxSize={10 * 1024 * 1024} // 10MB
```

### maxFiles

**Type**: `number`

**Default**: `1`

Maximum number of files to accept.

### multiple

**Type**: `boolean`

**Default**: `false`

Allow multiple file selection.

### disabled

**Type**: `boolean`

**Default**: `false`

Disable the upload zone.

### className

**Type**: `string`

**Required**: No

Additional CSS classes.

### children

**Type**: `React.ReactNode`

**Required**: No

Custom content inside the drop zone.

### onError

**Type**: `(error: UploadError) => void`

**Required**: No

Callback for validation errors.

```typescript
interface UploadError {
  type: 'file-too-large' | 'invalid-type' | 'too-many-files';
  message: string;
  file?: File;
}
```

## Examples

### Basic Usage

```tsx
function BasicUpload() {
  const { execute } = useWorkflow('process-file');

  return (
    <N8nUploadZone
      onFilesSelected={(files) => {
        execute({ files: { document: files[0] } });
      }}
    />
  );
}
```

### With File Type Restrictions

```tsx
<N8nUploadZone
  accept={['image/jpeg', 'image/png', 'image/webp']}
  onFilesSelected={handleFiles}
/>
```

### With Size Limit

```tsx
<N8nUploadZone
  maxSize={5 * 1024 * 1024} // 5MB
  onFilesSelected={handleFiles}
  onError={(error) => {
    if (error.type === 'file-too-large') {
      toast.error('File must be under 5MB');
    }
  }}
/>
```

### Multiple Files

```tsx
<N8nUploadZone
  multiple
  maxFiles={5}
  onFilesSelected={(files) => {
    const fileMap: Record<string, File> = {};
    files.forEach((f, i) => { fileMap[`file_${i}`] = f; });
    execute({ files: fileMap });
  }}
/>
```

### Custom Content

```tsx
<N8nUploadZone onFilesSelected={handleFiles}>
  <div className="text-center p-8">
    <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
    <p className="mt-2 text-sm text-gray-600">
      Drag and drop your invoice here
    </p>
    <p className="text-xs text-gray-400">PDF or image, max 10MB</p>
  </div>
</N8nUploadZone>
```

### With Preview

```tsx
function UploadWithPreview() {
  const [preview, setPreview] = useState<string | null>(null);
  const { execute, status } = useWorkflow('analyze-image');

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    }
    execute({ files: { image: file } });
  };

  return (
    <div>
      <N8nUploadZone
        accept="image/*"
        onFilesSelected={handleFiles}
        disabled={status === 'running'}
      />

      {preview && (
        <img src={preview} alt="Preview" className="mt-4 max-w-xs rounded" />
      )}
    </div>
  );
}
```

### With Workflow Integration

```tsx
function DocumentProcessor() {
  const { execute, status, data, error } = useWorkflow('process-document', {
    polling: { enabled: true },
  });

  return (
    <div className="space-y-4">
      <N8nUploadZone
        accept={['application/pdf', '.doc', '.docx']}
        maxSize={10 * 1024 * 1024}
        disabled={status === 'running'}
        onFilesSelected={(files) => {
          execute({
            data: { extractTables: true },
            files: { document: files[0] },
          });
        }}
        onError={(error) => toast.error(error.message)}
        className="border-2 border-dashed rounded-lg p-8 hover:border-blue-400 transition-colors"
      >
        <div className="text-center">
          <DocumentIcon className="w-10 h-10 mx-auto text-gray-400" />
          <p className="mt-2">Drop your document here</p>
          <p className="text-sm text-gray-500">PDF, DOC, DOCX up to 10MB</p>
        </div>
      </N8nUploadZone>

      {status === 'running' && <p>Processing document...</p>}
      {error && <p className="text-red-500">{error.message}</p>}
      {data && <DocumentResults data={data} />}
    </div>
  );
}
```

### Styled with Tailwind

```tsx
<N8nUploadZone
  onFilesSelected={handleFiles}
  className={`
    relative
    border-2 border-dashed border-gray-300
    rounded-xl
    p-8
    transition-all
    hover:border-blue-400 hover:bg-blue-50
    focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200
    ${isDragging ? 'border-blue-500 bg-blue-50' : ''}
  `}
>
  {/* Content */}
</N8nUploadZone>
```

## Keyboard Support

- **Tab**: Focus the upload zone
- **Enter/Space**: Open file picker
- **Escape**: Cancel drag operation

## Accessibility

The component includes:

- `role="button"` for the clickable area
- `aria-label` describing the action
- Focus indicators
- Screen reader announcements for drag states

## Related

- [Components Overview](./README.md)
- [WorkflowStatus](./workflow-status.md)
- [Binary Upload Handling](../../core/binary/upload.md)
