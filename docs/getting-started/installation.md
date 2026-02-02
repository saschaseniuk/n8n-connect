# Installation

Install n8n-connect packages for your project.

## Packages

The SDK is modular. Install only what you need:

### React/Next.js Projects

```bash
npm install @n8n-connect/react
```

This includes `@n8n-connect/core` as a dependency.

### Framework-Agnostic / Server-Side

```bash
npm install @n8n-connect/core
```

## Package Managers

### npm

```bash
npm install @n8n-connect/react
```

### yarn

```bash
yarn add @n8n-connect/react
```

### pnpm

```bash
pnpm add @n8n-connect/react
```

### bun

```bash
bun add @n8n-connect/react
```

## Requirements

- **Node.js**: 18.0.0 or later
- **TypeScript**: 5.0 or later (recommended)
- **React**: 18.0.0 or later (for @n8n-connect/react)
- **Next.js**: 13.4 or later (for Server Actions support)

## Peer Dependencies

### @n8n-connect/react

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## TypeScript Configuration

For optimal type inference, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

## Verifying Installation

After installation, verify the packages are correctly installed:

```typescript
// Test core import
import { createN8nClient } from '@n8n-connect/core';

// Test react import
import { N8nProvider, useWorkflow } from '@n8n-connect/react';
```

## Next Steps

- [Quick Start](./quick-start.md) - Get a minimal example running
- [Configuration](./configuration.md) - Configure the SDK

## Related

- [Core Package Overview](../core/README.md)
- [React Package Overview](../react/README.md)
