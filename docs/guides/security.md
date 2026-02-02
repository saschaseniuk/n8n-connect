# Security Best Practices

Secure your n8n integration with these recommended patterns.

## Overview

When integrating n8n with frontend applications, security is critical. This guide covers:

- Protecting API credentials
- Securing webhook endpoints
- Input validation
- Error handling

## Server Proxy Mode

**Always use server proxy mode in production.** This keeps your n8n credentials server-side.

### Without Server Proxy (Insecure)

```
Browser ──────────────────────────▶ n8n
         URL and token visible
         in network requests
```

Anyone can see:
- Your n8n instance URL
- API tokens
- Webhook paths

### With Server Proxy (Secure)

```
Browser ─────▶ Your Server ─────▶ n8n
               Credentials
               stay here
```

Credentials never reach the browser.

## Implementation

### 1. Create Server Action

```typescript
// app/actions.ts
'use server';

import { createN8nAction } from '@n8n-connect/core/server';

export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  apiToken: process.env.N8N_API_TOKEN!,
  // Optional: Restrict allowed paths
  allowedPaths: ['create-order', 'send-notification'],
});
```

### 2. Configure Provider

```tsx
// app/layout.tsx
import { N8nProvider } from '@n8n-connect/react';
import { n8nAction } from './actions';

export default function RootLayout({ children }) {
  return (
    <N8nProvider
      config={{
        useServerProxy: true,
        serverAction: n8nAction,
      }}
    >
      {children}
    </N8nProvider>
  );
}
```

### 3. Use Environment Variables

```bash
# .env.local (never commit this file)

# Server-only (no NEXT_PUBLIC_ prefix)
N8N_WEBHOOK_URL=https://n8n.example.com/webhook
N8N_API_TOKEN=your-secret-token

# Public (if needed for non-sensitive config)
NEXT_PUBLIC_APP_NAME=MyApp
```

## Path Restrictions

Limit which webhook paths can be called from the frontend:

```typescript
export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  allowedPaths: [
    'public-form',
    'newsletter-signup',
    'contact-request',
  ],
});

// These work:
await n8nAction('public-form', { data: {} });
await n8nAction('newsletter-signup', { data: {} });

// This throws an error:
await n8nAction('admin-delete-all', { data: {} });
```

## Input Validation

Validate data before sending to n8n:

### In Server Action

```typescript
export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  validate: (data) => {
    // Reject if missing required fields
    if (!data || typeof data !== 'object') return false;
    if (!('email' in data)) return false;

    // Validate email format
    const email = (data as any).email;
    if (typeof email !== 'string') return false;
    if (!email.includes('@')) return false;

    return true;
  },
});
```

### With Zod

```typescript
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

export const submitContact = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  allowedPaths: ['contact'],
  validate: (data) => {
    const result = ContactSchema.safeParse(data);
    return result.success;
  },
});
```

## n8n Webhook Security

Configure your n8n webhook nodes for security:

### Authentication Options

1. **Header Authentication**
   - Add custom header validation in n8n
   - Check for secret token in request

2. **Basic Auth**
   - Enable basic authentication on webhook
   - Store credentials in environment variables

3. **IP Allowlist**
   - Restrict webhook access to your server IPs
   - Use n8n's security settings

### Webhook Settings

In your n8n Webhook node:

```
Authentication: Header Auth
Header Name: X-Webhook-Secret
Header Value: {{ $env.WEBHOOK_SECRET }}
```

Pass from your server action:

```typescript
export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  headers: {
    'X-Webhook-Secret': process.env.WEBHOOK_SECRET!,
  },
});
```

## Error Handling

Never expose internal error details to clients:

```typescript
// Server action - errors are sanitized
export const n8nAction = createN8nAction({
  webhookUrl: process.env.N8N_WEBHOOK_URL!,
  // Internal errors return generic messages
});

// Client receives:
// "An error occurred" instead of
// "Connection to n8n.internal.example.com:5678 failed"
```

### Custom Error Messages

```typescript
try {
  await execute({ data: formData });
} catch (error) {
  // Show user-friendly message
  if (error instanceof N8nError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        toast.error('Please check your input');
        break;
      case 'TIMEOUT':
        toast.error('Request timed out. Please try again.');
        break;
      default:
        toast.error('Something went wrong. Please try again.');
    }
  }

  // Log details for debugging (server-side only)
  console.error('n8n error:', error);
}
```

## Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export async function rateLimitedN8nAction(
  path: string,
  options: { data: unknown }
) {
  const ip = headers().get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    throw new Error('Too many requests');
  }

  return n8nAction(path, options);
}
```

## Security Checklist

- [ ] Use server proxy mode in production
- [ ] Store credentials in environment variables
- [ ] Never commit `.env` files
- [ ] Restrict allowed webhook paths
- [ ] Validate all input data
- [ ] Configure n8n webhook authentication
- [ ] Implement rate limiting
- [ ] Sanitize error messages
- [ ] Use HTTPS everywhere
- [ ] Review n8n workflow permissions

## Related

- [createN8nAction](../core/server/create-n8n-action.md)
- [N8nProvider](../react/providers/n8n-provider.md)
- [Error Handling Guide](./error-handling.md)
- [Next.js Integration](./nextjs-integration.md)
