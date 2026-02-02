# Binary Download Handling

Automatic conversion of binary responses to usable blob URLs.

## Overview

When n8n returns binary data (images, PDFs, files), n8n-connect automatically:

1. Detects the binary response
2. Creates a blob from the data
3. Generates a blob URL for browser use

This lets you use returned files directly in `<img>`, `<a>`, or other elements.

## Usage

### With useWorkflow Hook

```tsx
function ImageGenerator() {
  const { execute, data } = useWorkflow('generate-image');

  return (
    <div>
      <button onClick={() => execute({ data: { prompt: 'A sunset' } })}>
        Generate
      </button>

      {data?.imageUrl && (
        <img src={data.imageUrl} alt="Generated" />
      )}
    </div>
  );
}
```

### With Core Client

```typescript
const client = createN8nClient({ baseUrl: 'https://n8n.example.com' });

const result = await client.execute('generate-pdf', {
  data: { reportType: 'monthly' },
});

// result.pdfUrl is a blob URL
window.open(result.pdfUrl);
```

## Response Format

n8n-connect detects binary responses based on content-type headers. The workflow should return binary data using the "Respond to Webhook" node with binary mode.

### JSON with Binary URL

If your workflow returns a URL to the binary:

```json
{
  "imageUrl": "blob:http://localhost:3000/abc123"
}
```

### Direct Binary Response

If the workflow returns binary data directly (content-type: `image/png`, `application/pdf`, etc.), the SDK wraps it:

```typescript
// Result object
{
  binaryUrl: "blob:http://localhost:3000/abc123",
  contentType: "image/png",
  filename: "generated.png"
}
```

## Examples

### Display Generated Image

```tsx
function AIImageGenerator() {
  const { execute, data, status, error } = useWorkflow('ai-image');

  return (
    <div>
      <button
        onClick={() => execute({ data: { prompt: 'A mountain landscape' } })}
        disabled={status === 'running'}
      >
        {status === 'running' ? 'Generating...' : 'Generate Image'}
      </button>

      {error && <p className="error">{error.message}</p>}

      {data?.imageUrl && (
        <figure>
          <img src={data.imageUrl} alt="AI Generated" />
          <figcaption>
            <a href={data.imageUrl} download="generated.png">
              Download
            </a>
          </figcaption>
        </figure>
      )}
    </div>
  );
}
```

### Download PDF

```tsx
function ReportDownloader() {
  const { execute, data, status } = useWorkflow('generate-report');

  return (
    <div>
      <button
        onClick={() => execute({ data: { month: '2024-01' } })}
        disabled={status === 'running'}
      >
        Generate Report
      </button>

      {data?.pdfUrl && (
        <a
          href={data.pdfUrl}
          download="monthly-report.pdf"
          className="download-button"
        >
          Download PDF
        </a>
      )}
    </div>
  );
}
```

### Preview and Download

```tsx
function DocumentViewer() {
  const { execute, data } = useWorkflow('render-document');

  return (
    <div>
      {data?.documentUrl && (
        <>
          {/* Preview in iframe */}
          <iframe
            src={data.documentUrl}
            style={{ width: '100%', height: '500px' }}
            title="Document Preview"
          />

          {/* Download link */}
          <a href={data.documentUrl} download={data.filename}>
            Download {data.filename}
          </a>
        </>
      )}
    </div>
  );
}
```

### Multiple Files

```tsx
function BatchDownloader() {
  const { execute, data } = useWorkflow('batch-generate');

  // data.files might be an array of file objects
  return (
    <div>
      <button onClick={() => execute({ data: { count: 5 } })}>
        Generate Files
      </button>

      {data?.files && (
        <ul>
          {data.files.map((file, index) => (
            <li key={index}>
              <a href={file.url} download={file.name}>
                {file.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Memory Management

Blob URLs consume memory until they're revoked. n8n-connect handles cleanup automatically when:

- The component using `useWorkflow` unmounts
- A new execution starts (previous blob URLs are revoked)

### Manual Cleanup

If needed, you can manually revoke blob URLs:

```typescript
// Revoke a specific URL
URL.revokeObjectURL(data.imageUrl);

// Revoke after download
const link = document.createElement('a');
link.href = data.pdfUrl;
link.download = 'file.pdf';
link.click();
URL.revokeObjectURL(data.pdfUrl);
```

## n8n Workflow Configuration

To return binary data from n8n:

### Option 1: Binary Mode Response

1. Add "Respond to Webhook" node
2. Set Response Mode to "Binary"
3. Connect the binary output from your processing node

### Option 2: Upload and Return URL

For persistence, upload the file within n8n:

1. Use a storage node (S3, Cloudflare R2, etc.)
2. Return the public URL in the JSON response

```json
{
  "imageUrl": "https://storage.example.com/images/abc123.png"
}
```

This approach is recommended for:
- Large files
- Files that need to persist beyond the session
- Files that will be shared or accessed multiple times

## Related

- [Binary Handling Overview](./README.md)
- [Upload Handling](./upload.md)
- [Persistence Guide](../../guides/persistence.md)
