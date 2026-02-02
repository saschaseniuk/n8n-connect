# N8nProvider

The main context provider for configuring n8n-connect in React applications.

## Import

```tsx
import { N8nProvider } from '@n8n-connect/react';
```

## Usage

```tsx
<N8nProvider
  config={{
    baseUrl: 'https://n8n.example.com',
    useServerProxy: true,
  }}
>
  {children}
</N8nProvider>
```

## Props

### config

**Type**: `N8nProviderConfig`

**Required**: Yes

Configuration object for n8n-connect.

```typescript
interface N8nProviderConfig {
  /**
   * Base URL of your n8n instance.
   * Not required if using server proxy mode.
   */
  baseUrl?: string;

  /**
   * Enable server proxy mode.
   * Requests route through a server action instead of directly to n8n.
   * @default false
   */
  useServerProxy?: boolean;

  /**
   * Server action for proxy mode.
   * Required when useServerProxy is true.
   */
  serverAction?: N8nServerAction;

  /**
   * Default polling configuration.
   * Individual hooks can override these settings.
   */
  defaultPolling?: PollingOptions;

  /**
   * Default persistence mode.
   * @default undefined (no persistence)
   */
  defaultPersist?: 'session' | 'local' | false;
}
```

### children

**Type**: `React.ReactNode`

**Required**: Yes

Child components that will have access to n8n-connect functionality.

## Examples

### Basic Setup

```tsx
import { N8nProvider } from '@n8n-connect/react';

function App() {
  return (
    <N8nProvider config={{ baseUrl: 'https://n8n.example.com' }}>
      <MyApp />
    </N8nProvider>
  );
}
```

### With Server Proxy (Recommended for Production)

```tsx
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN,
});
```

```tsx
// app/layout.tsx
import { N8nProvider } from '@n8n-connect/react';
import { n8nAction } from './actions';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <N8nProvider
          config={{
            useServerProxy: true,
            serverAction: n8nAction,
          }}
        >
          {children}
        </N8nProvider>
      </body>
    </html>
  );
}
```

### With Default Polling

```tsx
<N8nProvider
  config={{
    baseUrl: 'https://n8n.example.com',
    defaultPolling: {
      enabled: false,
      interval: 2000,
      timeout: 60000,
    },
  }}
>
  {children}
</N8nProvider>
```

### With Persistence

```tsx
<N8nProvider
  config={{
    baseUrl: 'https://n8n.example.com',
    defaultPersist: 'session', // Persist workflow state in sessionStorage
  }}
>
  {children}
</N8nProvider>
```

### Full Configuration

```tsx
import { N8nProvider } from '@n8n-connect/react';
import { n8nAction } from './actions';

<N8nProvider
  config={{
    // Direct mode (development)
    baseUrl: process.env.NEXT_PUBLIC_N8N_URL,

    // Or server proxy mode (production)
    useServerProxy: process.env.NODE_ENV === 'production',
    serverAction: n8nAction,

    // Default polling settings
    defaultPolling: {
      enabled: false,
      interval: 2000,
      timeout: 60000,
    },

    // Default persistence
    defaultPersist: 'session',
  }}
>
  {children}
</N8nProvider>
```

### Next.js App Router

```tsx
// app/layout.tsx
import { N8nProvider } from '@n8n-connect/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <N8nProvider
          config={{
            baseUrl: process.env.NEXT_PUBLIC_N8N_URL!,
            useServerProxy: true,
          }}
        >
          {children}
        </N8nProvider>
      </body>
    </html>
  );
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { N8nProvider } from '@n8n-connect/react';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <N8nProvider
      config={{
        baseUrl: process.env.NEXT_PUBLIC_N8N_URL!,
      }}
    >
      <Component {...pageProps} />
    </N8nProvider>
  );
}
```

## Environment-Based Configuration

```tsx
const isDev = process.env.NODE_ENV === 'development';

<N8nProvider
  config={{
    baseUrl: isDev ? 'http://localhost:5678' : undefined,
    useServerProxy: !isDev,
    serverAction: isDev ? undefined : n8nAction,
  }}
>
  {children}
</N8nProvider>
```

## Related

- [Providers Overview](./README.md)
- [useN8nContext Hook](../hooks/use-n8n-context.md)
- [useWorkflow Hook](../hooks/use-workflow.md)
- [Configuration Guide](../../getting-started/configuration.md)
- [Security Guide](../../guides/security.md)
