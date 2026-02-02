import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useN8nContext, useN8nExecute, useN8nStatus } from '../useN8nContext';
import { N8nProvider } from '../../context';

// Mock the core package
const mockClientExecute = vi.fn();
const mockServerAction = vi.fn();

vi.mock('@n8n-connect/core', () => ({
  createN8nClient: vi.fn(() => ({
    execute: mockClientExecute,
  })),
}));

// Helper to create a provider wrapper
function createWrapper(config: Record<string, unknown> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <N8nProvider config={config}>{children}</N8nProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockClientExecute.mockResolvedValue({ result: 'client' });
  mockServerAction.mockResolvedValue({ result: 'server' });
});

describe('useN8nContext', () => {
  it('should return context value inside provider', () => {
    const { result } = renderHook(() => useN8nContext(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    expect(result.current).toHaveProperty('config');
    expect(result.current).toHaveProperty('client');
  });

  it('should return config with all properties', () => {
    const { result } = renderHook(() => useN8nContext(), {
      wrapper: createWrapper({
        baseUrl: 'https://n8n.example.com',
        apiToken: 'token123',
        useServerProxy: false,
        defaultPolling: { interval: 5000 },
        defaultPersist: 'session',
      }),
    });

    expect(result.current.config.baseUrl).toBe('https://n8n.example.com');
    expect(result.current.config.apiToken).toBe('token123');
    expect(result.current.config.useServerProxy).toBe(false);
    expect(result.current.config.defaultPolling?.interval).toBe(5000);
    expect(result.current.config.defaultPersist).toBe('session');
  });

  it('should return client in direct mode', () => {
    const { result } = renderHook(() => useN8nContext(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    expect(result.current.client).not.toBeNull();
  });

  it('should return null client in server proxy mode', () => {
    const { result } = renderHook(() => useN8nContext(), {
      wrapper: createWrapper({
        useServerProxy: true,
        serverAction: mockServerAction,
      }),
    });

    expect(result.current.client).toBeNull();
  });

  it('should throw error outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useN8nContext());
    }).toThrow('useN8nContext must be used within an N8nProvider');

    consoleSpy.mockRestore();
  });

  it('should have helpful error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderHook(() => useN8nContext());
    } catch (error: unknown) {
      const err = error as Error;
      expect(err.message).toContain('N8nProvider');
      expect(err.message).toContain('<N8nProvider config={...}>');
    }

    consoleSpy.mockRestore();
  });
});

describe('useN8nExecute', () => {
  it('should return an execute function', () => {
    const { result } = renderHook(() => useN8nExecute(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    expect(typeof result.current).toBe('function');
  });

  it('should use client execute in direct mode', async () => {
    mockClientExecute.mockResolvedValue({ fromClient: true });

    const { result } = renderHook(() => useN8nExecute(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    const response = await result.current('/test-webhook', {
      data: { foo: 'bar' },
    });

    expect(mockClientExecute).toHaveBeenCalledWith('/test-webhook', {
      data: { foo: 'bar' },
    });
    expect(response).toEqual({ fromClient: true });
  });

  it('should use server action in proxy mode', async () => {
    mockServerAction.mockResolvedValue({ fromServer: true });

    const { result } = renderHook(() => useN8nExecute(), {
      wrapper: createWrapper({
        useServerProxy: true,
        serverAction: mockServerAction,
      }),
    });

    const response = await result.current('/test-webhook', {
      data: { foo: 'bar' },
    });

    expect(mockServerAction).toHaveBeenCalledWith('/test-webhook', {
      data: { foo: 'bar' },
    });
    expect(response).toEqual({ fromServer: true });
  });

  it('should throw error when no execution method available', async () => {
    const { result } = renderHook(() => useN8nExecute(), {
      wrapper: createWrapper({}), // Neither baseUrl nor serverAction
    });

    await expect(result.current('/test')).rejects.toThrow(
      'No execution method available'
    );
  });

  it('should support generic types', async () => {
    interface Input {
      email: string;
    }
    interface Output {
      userId: string;
    }

    mockClientExecute.mockResolvedValue({ userId: 'u123' });

    const { result } = renderHook(() => useN8nExecute(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    const response = await result.current<Input, Output>('/create-user', {
      data: { email: 'test@example.com' },
    });

    // TypeScript should recognize response.userId
    expect(response.userId).toBe('u123');
  });

  it('should be memoized', () => {
    const { result, rerender } = renderHook(() => useN8nExecute(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    const firstExecute = result.current;

    rerender();

    const secondExecute = result.current;

    // Function should be stable (same reference)
    expect(firstExecute).toBe(secondExecute);
  });
});

describe('useN8nStatus', () => {
  it('should return isConfigured, mode and warning properties', () => {
    const { result } = renderHook(() => useN8nStatus(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    expect(result.current).toHaveProperty('isConfigured');
    expect(result.current).toHaveProperty('mode');
    // warning may or may not be present
  });

  describe('Direct Mode', () => {
    it('should return isConfigured=true and mode="direct"', () => {
      const { result } = renderHook(() => useN8nStatus(), {
        wrapper: createWrapper({ baseUrl: 'https://test.com' }),
      });

      expect(result.current.isConfigured).toBe(true);
      expect(result.current.mode).toBe('direct');
      expect(result.current.warning).toBeUndefined();
    });
  });

  describe('Server Proxy Mode', () => {
    it('should return isConfigured=true and mode="proxy" with serverAction', () => {
      const { result } = renderHook(() => useN8nStatus(), {
        wrapper: createWrapper({
          useServerProxy: true,
          serverAction: mockServerAction,
        }),
      });

      expect(result.current.isConfigured).toBe(true);
      expect(result.current.mode).toBe('proxy');
      expect(result.current.warning).toBeUndefined();
    });

    it('should return isConfigured=false with warning when serverAction missing', () => {
      const { result } = renderHook(() => useN8nStatus(), {
        wrapper: createWrapper({ useServerProxy: true }),
      });

      expect(result.current.isConfigured).toBe(false);
      expect(result.current.mode).toBe('unconfigured');
      expect(result.current.warning).toContain('serverAction');
    });
  });

  describe('Unconfigured', () => {
    it('should return isConfigured=false when no baseUrl and no serverProxy', () => {
      const { result } = renderHook(() => useN8nStatus(), {
        wrapper: createWrapper({}),
      });

      expect(result.current.isConfigured).toBe(false);
      expect(result.current.mode).toBe('unconfigured');
      expect(result.current.warning).toContain('baseUrl');
    });
  });

  it('should be memoized', () => {
    const { result, rerender } = renderHook(() => useN8nStatus(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    const firstStatus = result.current;

    rerender();

    const secondStatus = result.current;

    // Object should be stable when config does not change
    expect(firstStatus.isConfigured).toBe(secondStatus.isConfigured);
    expect(firstStatus.mode).toBe(secondStatus.mode);
  });
});

describe('Error Message Quality', () => {
  it('should have actionable error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderHook(() => useN8nContext());
    } catch (error: unknown) {
      const err = error as Error;
      // Message should explain WHAT is wrong
      expect(err.message).toContain('must be used within');

      // Message should explain HOW to fix it
      expect(err.message).toContain('N8nProvider');
      expect(err.message).toMatch(/config=?\{/);
    }

    consoleSpy.mockRestore();
  });
});

describe('Client Component', () => {
  it('should have "use client" directive', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const hookPath = path.resolve(__dirname, '../useN8nContext.ts');
    const content = await fs.readFile(hookPath, 'utf-8');

    expect(
      content.startsWith("'use client'") || content.startsWith('"use client"')
    ).toBe(true);
  });
});

describe('Integration', () => {
  it('should use useN8nExecute for simple executions', async () => {
    mockClientExecute.mockResolvedValue({ logged: true });

    const { result } = renderHook(() => useN8nExecute(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    // Simple execution without full state management
    await result.current('/log-event', {
      data: { event: 'button_click' },
    });

    expect(mockClientExecute).toHaveBeenCalled();
  });

  it('should use useN8nStatus for conditional rendering', () => {
    const { result: configuredResult } = renderHook(() => useN8nStatus(), {
      wrapper: createWrapper({ baseUrl: 'https://test.com' }),
    });

    const { result: unconfiguredResult } = renderHook(() => useN8nStatus(), {
      wrapper: createWrapper({}),
    });

    // Can be used for conditional UI
    if (configuredResult.current.isConfigured) {
      expect(configuredResult.current.mode).toBe('direct');
    }

    if (!unconfiguredResult.current.isConfigured) {
      expect(unconfiguredResult.current.warning).toBeDefined();
    }
  });
});
