# CLI Tools

n8n-connect provides command-line tools for developer productivity.

## Status

The CLI is currently **experimental**. APIs and commands may change.

## Commands

### [sync](./sync.md)

Generate TypeScript type definitions from n8n workflow schemas.

```bash
npx n8n-connect sync --workflow-id 12 --output ./types/n8n.d.ts
```

## Installation

The CLI is included with `@n8n-connect/core`:

```bash
npm install @n8n-connect/core
npx n8n-connect --help
```

## Usage

```bash
# Show available commands
npx n8n-connect --help

# Generate types for a specific workflow
npx n8n-connect sync --workflow-id 12

# Specify output location
npx n8n-connect sync --workflow-id 12 --output ./types/workflows.d.ts
```

## Environment Variables

The CLI reads configuration from environment variables:

| Variable | Description |
|----------|-------------|
| `N8N_BASE_URL` | Your n8n instance URL |
| `N8N_API_TOKEN` | API token for authentication |

## Benefits

Type generation provides:

- **Autocompletion**: IDE suggestions for webhook input fields
- **Type Safety**: Compile-time validation of workflow inputs
- **Documentation**: Generated types serve as API documentation
