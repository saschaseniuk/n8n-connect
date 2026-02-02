# Type Definitions

TypeScript type definitions for n8n-connect.

## Overview

n8n-connect is built with TypeScript and provides comprehensive type definitions for all functionality.

## Type Categories

### [Configuration Types](./config.md)

Types for configuring the SDK.

```typescript
import type { N8nClientOptions, N8nProviderConfig } from '@n8n-connect/core';
```

### [Workflow Types](./workflow.md)

Types related to workflow execution.

```typescript
import type { ExecuteOptions, WorkflowResult, WorkflowStatus } from '@n8n-connect/core';
```

### [Error Types](./errors.md)

Error classes and types for error handling.

```typescript
import { N8nError } from '@n8n-connect/core';
```

## Generic Type Parameters

Many functions accept generic type parameters for input and output types:

```typescript
// Define your workflow types
interface CreateOrderInput {
  productId: string;
  quantity: number;
}

interface CreateOrderOutput {
  orderId: string;
  total: number;
  estimatedDelivery: string;
}

// Use with the hook
const { execute, data } = useWorkflow<CreateOrderInput, CreateOrderOutput>('create-order');

// Type-safe execution
execute({
  data: {
    productId: 'prod_123',  // TypeScript knows this must be a string
    quantity: 2,            // TypeScript knows this must be a number
  },
});

// Type-safe data access
if (data) {
  console.log(data.orderId);           // string
  console.log(data.total);             // number
  console.log(data.estimatedDelivery); // string
}
```

## Type Generation

For even better type safety, use the CLI to generate types from your n8n workflows:

```bash
npx n8n-connect sync --workflow-id 12 --output ./types/workflows.d.ts
```

This generates TypeScript interfaces based on your actual n8n workflow definitions.

## Importing Types

Types can be imported from the main package:

```typescript
import type {
  N8nClientOptions,
  ExecuteOptions,
  PollingOptions,
  WorkflowStatus,
  N8nError,
} from '@n8n-connect/core';
```

Or from specific submodules:

```typescript
import type { N8nClientOptions } from '@n8n-connect/core/client';
import type { PollingOptions } from '@n8n-connect/core/polling';
```

## Related

- [Configuration Types](./config.md)
- [Workflow Types](./workflow.md)
- [Error Types](./errors.md)
- [CLI Sync Command](../../cli/sync.md)
