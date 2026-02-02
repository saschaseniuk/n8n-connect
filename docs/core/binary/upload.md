# File Upload Handling

Automatic FormData construction for file uploads.

## Overview

n8n-connect handles all the complexity of file uploads:

- Automatic FormData construction
- Proper content-type headers
- Multiple file support
- Metadata alongside files

## Usage

### With useWorkflow Hook

```typescript
const { execute } = useWorkflow('upload-handler');

function handleUpload(file: File) {
  execute({
    data: { description: 'My document' },
    files: { document: file },
  });
}
```

### With Core Client

```typescript
const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });

await client.execute('upload-handler', {
  data: { description: 'My document' },
  files: { document: file },
});
```

## Parameters

### files

**Type**: `Record<string, File | Blob>`

An object mapping field names to File or Blob objects.

```typescript
{
  files: {
    avatar: avatarFile,         // File from input
    thumbnail: thumbnailBlob,   // Generated Blob
  }
}
```

The keys become the field names in FormData and correspond to the field names expected by n8n's binary input nodes.

## Examples

### Single File Upload

```tsx
function FileUploader() {
  const { execute, status, error } = useWorkflow('process-file');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    execute({
      files: { document: file },
    });
  };

  return (
    <div>
      <input type="file" ref={inputRef} />
      <button onClick={handleSubmit} disabled={status === 'running'}>
        Upload
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Multiple Files

```tsx
function MultiFileUploader() {
  const { execute } = useWorkflow('batch-process');

  const handleFiles = (files: FileList) => {
    const fileMap: Record<string, File> = {};
    Array.from(files).forEach((file, i) => {
      fileMap[`file_${i}`] = file;
    });

    execute({
      data: { count: files.length },
      files: fileMap,
    });
  };

  return (
    <input
      type="file"
      multiple
      onChange={(e) => e.target.files && handleFiles(e.target.files)}
    />
  );
}
```

### With Metadata

```typescript
execute({
  data: {
    userId: 'user_123',
    tags: ['important', 'reviewed'],
    processOptions: {
      extractText: true,
      generateThumbnail: true,
    },
  },
  files: {
    document: pdfFile,
  },
});
```

### From Canvas/Generated Content

```typescript
// Convert canvas to blob and upload
const canvas = document.querySelector('canvas');
canvas.toBlob(async (blob) => {
  if (!blob) return;

  await execute({
    data: { source: 'canvas-editor' },
    files: { image: blob },
  });
});
```

### Drag and Drop

```tsx
function DropZone() {
  const { execute } = useWorkflow('upload');
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      execute({ files: { dropped: file } });
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? 'blue' : 'gray'}`,
        padding: '2rem',
      }}
    >
      Drop a file here
    </div>
  );
}
```

## How FormData is Constructed

When you provide files, n8n-connect constructs FormData like this:

```typescript
// Your call:
execute({
  data: { title: 'My Doc', tags: ['a', 'b'] },
  files: { document: file },
});

// Internally becomes:
const formData = new FormData();
formData.append('document', file, file.name);
formData.append('data', JSON.stringify({ title: 'My Doc', tags: ['a', 'b'] }));
```

The `data` field is JSON-stringified and included alongside the files.

## n8n Workflow Configuration

In your n8n workflow, configure the Webhook node:

1. Set **HTTP Method** to `POST`
2. The binary data will be available in subsequent nodes
3. Access the JSON data via `$json.data` (after parsing)

## File Validation

Consider validating files before upload:

```typescript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE) {
    return `File too large. Max size: ${MAX_SIZE / 1024 / 1024}MB`;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`;
  }
  return null;
}

// Usage
const error = validateFile(selectedFile);
if (error) {
  setErrorMessage(error);
  return;
}
execute({ files: { document: selectedFile } });
```

## Related

- [Binary Handling Overview](./README.md)
- [Download Handling](./download.md)
- [N8nUploadZone Component](../../react/components/upload-zone.md)
