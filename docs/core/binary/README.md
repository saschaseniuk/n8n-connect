# Binary Handling

Automatic handling of file uploads and binary responses.

## Overview

n8n-connect simplifies working with files:

- **Uploads**: Pass `File` objects directly; the SDK handles FormData construction
- **Downloads**: Binary responses are automatically converted to blob URLs

No manual FormData construction or blob handling required.

## Modules

### [Upload](./upload.md)

Automatic file upload handling.

```typescript
// Just pass files - FormData is handled automatically
const result = await client.execute('process-document', {
  data: { documentType: 'invoice' },
  files: {
    document: selectedFile,
  },
});
```

### [Download](./download.md)

Automatic binary response handling.

```typescript
// If n8n returns a binary response, you get a blob URL
const { data } = useWorkflow('generate-pdf');

// data.fileUrl is a blob URL ready for use
<a href={data.fileUrl} download="report.pdf">Download</a>
```

## How It Works

### Upload Flow

```
┌───────────┐     ┌─────────────────┐     ┌─────────┐
│ Your Code │────▶│ n8n-connect     │────▶│  n8n    │
│           │     │                 │     │         │
│ files: {  │     │ Constructs      │     │ Binary  │
│   doc: f  │     │ FormData with   │     │ Input   │
│ }         │     │ proper encoding │     │ Node    │
└───────────┘     └─────────────────┘     └─────────┘
```

### Download Flow

```
┌─────────┐     ┌─────────────────┐     ┌───────────┐
│  n8n    │────▶│ n8n-connect     │────▶│ Your Code │
│         │     │                 │     │           │
│ Binary  │     │ Detects binary  │     │ data: {   │
│ Response│     │ Creates blob    │     │   url:    │
│         │     │ Returns URL     │     │   'blob:' │
└─────────┘     └─────────────────┘     └───────────┘
```

## Examples

### Image Upload and Processing

```typescript
function ImageProcessor() {
  const { execute, data } = useWorkflow('process-image');
  const [file, setFile] = useState<File | null>(null);

  const handleProcess = () => {
    if (!file) return;
    execute({
      data: { filters: ['grayscale', 'resize'] },
      files: { image: file },
    });
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button onClick={handleProcess}>Process</button>

      {data?.processedImage && (
        <img src={data.processedImage} alt="Processed" />
      )}
    </div>
  );
}
```

### PDF Generation

```typescript
function ReportGenerator() {
  const { execute, data, status } = useWorkflow('generate-report');

  const handleGenerate = () => {
    execute({
      data: {
        reportType: 'monthly',
        month: '2024-01',
      },
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={status === 'running'}>
        Generate Report
      </button>

      {data?.pdfUrl && (
        <a href={data.pdfUrl} download="report.pdf">
          Download PDF
        </a>
      )}
    </div>
  );
}
```

### Multiple File Upload

```typescript
const { execute } = useWorkflow('batch-upload');

function handleUpload(files: FileList) {
  const fileMap: Record<string, File> = {};
  Array.from(files).forEach((file, index) => {
    fileMap[`file${index}`] = file;
  });

  execute({
    data: { batchId: Date.now() },
    files: fileMap,
  });
}
```

## Best Practices

1. **File Size Limits**: Consider implementing client-side file size validation before upload.

2. **Progress Feedback**: Use polling for large file processing to provide progress updates.

3. **Cleanup**: Blob URLs consume memory. They're automatically revoked when the component unmounts, but you can manually revoke with `URL.revokeObjectURL()`.

4. **Type Validation**: Validate file types client-side before upload.

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function validateFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type);
}
```

## Related

- [Upload Documentation](./upload.md)
- [Download Documentation](./download.md)
- [N8nUploadZone Component](../../react/components/upload-zone.md)
