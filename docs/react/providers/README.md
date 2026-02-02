# Providers

React context providers for n8n-connect configuration.

## Overview

Providers manage global configuration and state for n8n-connect in React applications. They use React Context to make configuration available throughout your component tree.

## Providers

### [N8nProvider](./n8n-provider.md)

The main provider that configures n8n-connect for your application.

```tsx
import { N8nProvider } from '@n8n-connect/react';

function App() {
  return (
    <N8nProvider
      config={{
        baseUrl: 'https://n8n.example.com',
        useServerProxy: true,
      }}
    >
      {children}
    </N8nProvider>
  );
}
```

## Usage Pattern

Wrap your application (or the relevant portion) with the provider:

```tsx
// app/layout.tsx (Next.js App Router)
import { N8nProvider } from '@n8n-connect/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
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

Then use hooks anywhere in your component tree:

```tsx
// app/components/MyComponent.tsx
'use client';

import { useWorkflow } from '@n8n-connect/react';

function MyComponent() {
  // Automatically uses configuration from N8nProvider
  const { execute, data } = useWorkflow('my-webhook');

  return <button onClick={() => execute()}>Execute</button>;
}
```

## Nested Providers

You can nest providers to override configuration for specific parts of your app:

```tsx
<N8nProvider config={{ baseUrl: 'https://n8n-main.example.com' }}>
  <MainApp />

  {/* Different n8n instance for admin section */}
  <N8nProvider config={{ baseUrl: 'https://n8n-admin.example.com' }}>
    <AdminSection />
  </N8nProvider>
</N8nProvider>
```

## Related

- [N8nProvider](./n8n-provider.md) - Full provider documentation
- [useN8nContext](../hooks/use-n8n-context.md) - Access provider context
- [Configuration Guide](../../getting-started/configuration.md)
