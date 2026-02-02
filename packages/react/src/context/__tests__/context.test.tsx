import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { N8nProvider, N8nContext } from '../index';
import { useN8nContext } from '../../hooks/useN8nContext';
import { createN8nClient } from '@n8n-connect/core';

// Mock core package
vi.mock('@n8n-connect/core', async () => {
  const actual = await vi.importActual('@n8n-connect/core');
  return {
    ...actual,
    createN8nClient: vi.fn(() => ({
      execute: vi.fn(),
    })),
  };
});

// Test Consumer Component
function TestConsumer({ testId = 'consumer' }: { testId?: string }) {
  const { config, client } = useN8nContext();
  return (
    <div data-testid={testId}>
      <span data-testid={`${testId}-baseUrl`}>{config.baseUrl || 'none'}</span>
      <span data-testid={`${testId}-hasClient`}>{client ? 'yes' : 'no'}</span>
      <span data-testid={`${testId}-useServerProxy`}>{config.useServerProxy ? 'yes' : 'no'}</span>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('N8nProvider', () => {
  describe('Rendering Tests', () => {
    it('should render children', () => {
      render(
        <N8nProvider config={{ baseUrl: 'https://test.com' }}>
          <div data-testid="child">Child Content</div>
        </N8nProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
    });

    it('should render multiple children', () => {
      render(
        <N8nProvider config={{ baseUrl: 'https://test.com' }}>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </N8nProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });

    it('should work with empty config', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <N8nProvider config={{}}>
          <TestConsumer />
        </N8nProvider>
      );

      expect(screen.getByTestId('consumer')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('Direct Mode', () => {
    it('should create client when baseUrl is provided', () => {
      render(
        <N8nProvider config={{ baseUrl: 'https://n8n.example.com' }}>
          <TestConsumer />
        </N8nProvider>
      );

      expect(createN8nClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: 'https://n8n.example.com',
        })
      );
      expect(screen.getByTestId('consumer-hasClient')).toHaveTextContent('yes');
    });

    it('should pass config to createN8nClient', () => {
      render(
        <N8nProvider
          config={{
            baseUrl: 'https://n8n.example.com',
            apiToken: 'test-token',
            headers: { 'X-Custom': 'value' },
            timeout: 60000,
          }}
        >
          <TestConsumer />
        </N8nProvider>
      );

      expect(createN8nClient).toHaveBeenCalledWith({
        baseUrl: 'https://n8n.example.com',
        apiToken: 'test-token',
        headers: { 'X-Custom': 'value' },
        timeout: 60000,
      });
    });

    it('should log warning when no baseUrl and not serverProxy', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <N8nProvider config={{}}>
          <TestConsumer />
        </N8nProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No baseUrl provided'));
      expect(screen.getByTestId('consumer-hasClient')).toHaveTextContent('no');

      consoleSpy.mockRestore();
    });
  });

  describe('Server Proxy Mode', () => {
    it('should not create client when useServerProxy is true', () => {
      const mockServerAction = vi.fn();

      render(
        <N8nProvider
          config={{
            useServerProxy: true,
            serverAction: mockServerAction,
          }}
        >
          <TestConsumer />
        </N8nProvider>
      );

      expect(createN8nClient).not.toHaveBeenCalled();
      expect(screen.getByTestId('consumer-hasClient')).toHaveTextContent('no');
      expect(screen.getByTestId('consumer-useServerProxy')).toHaveTextContent('yes');
    });

    it('should log warning when useServerProxy without serverAction', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <N8nProvider config={{ useServerProxy: true }}>
          <TestConsumer />
        </N8nProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('no serverAction provided'));

      consoleSpy.mockRestore();
    });

    it('should make serverAction available in config', () => {
      const mockServerAction = vi.fn();

      function ServerActionConsumer() {
        const { config } = useN8nContext();
        return (
          <span data-testid="hasServerAction">{config.serverAction ? 'yes' : 'no'}</span>
        );
      }

      render(
        <N8nProvider
          config={{
            useServerProxy: true,
            serverAction: mockServerAction,
          }}
        >
          <ServerActionConsumer />
        </N8nProvider>
      );

      expect(screen.getByTestId('hasServerAction')).toHaveTextContent('yes');
    });
  });

  describe('Config Propagation', () => {
    it('should make baseUrl available in context', () => {
      render(
        <N8nProvider config={{ baseUrl: 'https://custom.n8n.com' }}>
          <TestConsumer />
        </N8nProvider>
      );

      expect(screen.getByTestId('consumer-baseUrl')).toHaveTextContent('https://custom.n8n.com');
    });

    it('should make defaultPolling available in config', () => {
      function PollingConsumer() {
        const { config } = useN8nContext();
        return (
          <span data-testid="pollingInterval">
            {config.defaultPolling?.interval || 'default'}
          </span>
        );
      }

      render(
        <N8nProvider
          config={{
            baseUrl: 'https://test.com',
            defaultPolling: { interval: 5000, timeout: 30000 },
          }}
        >
          <PollingConsumer />
        </N8nProvider>
      );

      expect(screen.getByTestId('pollingInterval')).toHaveTextContent('5000');
    });

    it('should make defaultPersist available in config', () => {
      function PersistConsumer() {
        const { config } = useN8nContext();
        return <span data-testid="persist">{config.defaultPersist || 'none'}</span>;
      }

      render(
        <N8nProvider
          config={{
            baseUrl: 'https://test.com',
            defaultPersist: 'session',
          }}
        >
          <PersistConsumer />
        </N8nProvider>
      );

      expect(screen.getByTestId('persist')).toHaveTextContent('session');
    });
  });

  describe('Memoization', () => {
    it('should maintain config between re-renders with same config', () => {
      const contextValues: ReturnType<typeof useN8nContext>[] = [];

      function ContextCapture() {
        const context = useN8nContext();
        contextValues.push(context);
        return null;
      }

      const { rerender } = render(
        <N8nProvider config={{ baseUrl: 'https://test.com' }}>
          <ContextCapture />
        </N8nProvider>
      );

      // Re-render with same config (new object reference)
      rerender(
        <N8nProvider config={{ baseUrl: 'https://test.com' }}>
          <ContextCapture />
        </N8nProvider>
      );

      // Config values should be the same
      expect(contextValues[0]?.config.baseUrl).toBe(contextValues[1]?.config.baseUrl);
    });

    it('should create new client when baseUrl changes', () => {
      const { rerender } = render(
        <N8nProvider config={{ baseUrl: 'https://first.com' }}>
          <TestConsumer />
        </N8nProvider>
      );

      vi.clearAllMocks();

      rerender(
        <N8nProvider config={{ baseUrl: 'https://second.com' }}>
          <TestConsumer />
        </N8nProvider>
      );

      expect(createN8nClient).toHaveBeenCalledWith(
        expect.objectContaining({ baseUrl: 'https://second.com' })
      );
    });
  });

  describe('Nested Providers', () => {
    it('should use inner provider context', () => {
      render(
        <N8nProvider config={{ baseUrl: 'https://outer.com' }}>
          <TestConsumer testId="outer" />
          <N8nProvider config={{ baseUrl: 'https://inner.com' }}>
            <TestConsumer testId="inner" />
          </N8nProvider>
        </N8nProvider>
      );

      expect(screen.getByTestId('outer-baseUrl')).toHaveTextContent('https://outer.com');
      expect(screen.getByTestId('inner-baseUrl')).toHaveTextContent('https://inner.com');
    });

    it('should support different modes in nested providers', () => {
      const mockServerAction = vi.fn();

      render(
        <N8nProvider config={{ baseUrl: 'https://direct.com' }}>
          <TestConsumer testId="direct" />
          <N8nProvider
            config={{
              useServerProxy: true,
              serverAction: mockServerAction,
            }}
          >
            <TestConsumer testId="proxy" />
          </N8nProvider>
        </N8nProvider>
      );

      expect(screen.getByTestId('direct-hasClient')).toHaveTextContent('yes');
      expect(screen.getByTestId('proxy-hasClient')).toHaveTextContent('no');
    });
  });
});

describe('useN8nContext', () => {
  it('should throw error outside provider', () => {
    // Suppress console.error for expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useN8nContext must be used within an N8nProvider');

    consoleSpy.mockRestore();
  });

  it('should have helpful error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(<TestConsumer />);
    } catch (error: unknown) {
      expect((error as Error).message).toContain('N8nProvider');
      expect((error as Error).message).toContain('<N8nProvider config={...}>');
    }

    consoleSpy.mockRestore();
  });

  it('should return config and client', () => {
    let contextValue: ReturnType<typeof useN8nContext> | null = null;

    function ContextCapture() {
      contextValue = useN8nContext();
      return null;
    }

    render(
      <N8nProvider config={{ baseUrl: 'https://test.com' }}>
        <ContextCapture />
      </N8nProvider>
    );

    expect(contextValue).toHaveProperty('config');
    expect(contextValue).toHaveProperty('client');
    expect(contextValue!.config.baseUrl).toBe('https://test.com');
  });
});

describe('N8nContext', () => {
  it('should have displayName for DevTools', () => {
    expect(N8nContext.displayName).toBe('N8nContext');
  });
});

describe('TypeScript Types', () => {
  it('should have correct N8nContextValue type', () => {
    // These are primarily compile-time tests
    function TypeTest() {
      const { config, client } = useN8nContext();

      // TypeScript should allow these accesses
      const _baseUrl: string | undefined = config.baseUrl;
      const _useProxy: boolean | undefined = config.useServerProxy;
      const _polling = config.defaultPolling;
      const _persist = config.defaultPersist;

      // Client can be null
      const _client: typeof client | null = client;

      // Suppress unused variable warnings
      void _baseUrl;
      void _useProxy;
      void _polling;
      void _persist;
      void _client;

      return null;
    }

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <N8nProvider config={{}}>
        <TypeTest />
      </N8nProvider>
    );

    consoleSpy.mockRestore();
  });
});

describe("'use client' Directive", () => {
  it('should have "use client" directive in N8nProvider', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const providerPath = path.resolve(__dirname, '../N8nProvider.tsx');

    const content = await fs.readFile(providerPath, 'utf-8');

    expect(content.startsWith("'use client'") || content.startsWith('"use client"')).toBe(
      true
    );
  });

  it('should have "use client" directive in useN8nContext', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const hookPath = path.resolve(__dirname, '../../hooks/useN8nContext.ts');

    const content = await fs.readFile(hookPath, 'utf-8');

    expect(content.startsWith("'use client'") || content.startsWith('"use client"')).toBe(
      true
    );
  });
});
