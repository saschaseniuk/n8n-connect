import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWorkflow } from '../useWorkflow';
import { N8nProvider } from '../../context';
import { N8nError } from '@n8n-connect/core';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockServerAction = vi.fn();

interface WrapperProps {
  children: React.ReactNode;
}

const createWrapper = (config = {}) => {
  return function Wrapper({ children }: WrapperProps) {
    return (
      <N8nProvider
        config={{
          baseUrl: 'https://test.com',
          ...config,
        }}
      >
        {children}
      </N8nProvider>
    );
  };
};

// Helper to create successful fetch response
const createSuccessResponse = (data: unknown) => {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
};

// Helper to create error fetch response
const createErrorResponse = (status: number, message: string) => {
  return Promise.resolve(
    new Response(JSON.stringify({ message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
  mockFetch.mockImplementation(() => createSuccessResponse({ success: true }));
  mockServerAction.mockReset();
  mockServerAction.mockResolvedValue({ success: true });
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useWorkflow', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return execute function', () => {
      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.execute).toBe('function');
    });

    it('should return reset and cancel functions', () => {
      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
    });
  });

  describe('Workflow Execution', () => {
    it('should execute workflow and update status', async () => {
      mockFetch.mockImplementationOnce(() => createSuccessResponse({ result: 'ok' }));

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      expect(result.current.status).toBe('idle');

      await act(async () => {
        await result.current.execute({ test: true });
      });

      expect(result.current.status).toBe('success');
      expect(result.current.data).toEqual({ result: 'ok' });
      expect(result.current.isLoading).toBe(false);
    });

    it('should set status to "running" during execution', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve(
                  new Response(JSON.stringify({ done: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                  })
                ),
              100
            );
          })
      );

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      act(() => {
        void result.current.execute();
      });

      // Status should be "running" immediately
      expect(result.current.status).toBe('running');
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });

    it('should call fetch with correct URL', async () => {
      const { result } = renderHook(() => useWorkflow('/upload'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.execute({ name: 'doc' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/upload',
        expect.any(Object)
      );
    });
  });

  describe('Server Proxy Mode', () => {
    it('should use serverAction when useServerProxy=true', async () => {
      mockServerAction.mockResolvedValueOnce({ fromServer: true });

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper({
          useServerProxy: true,
          serverAction: mockServerAction,
        }),
      });

      await act(async () => {
        await result.current.execute({ input: 'value' });
      });

      expect(mockServerAction).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          data: { input: 'value' },
        })
      );
      expect(result.current.data).toEqual({ fromServer: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error when serverAction is missing', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper({
          useServerProxy: true,
          // serverAction intentionally missing
        }),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(result.current.status).toBe('error');
      expect(result.current.error).not.toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should set error state on failure', async () => {
      mockFetch.mockImplementationOnce(() => createErrorResponse(500, 'Server error'));

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBeInstanceOf(N8nError);
      expect(result.current.data).toBeNull();
    });

    it('should wrap network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeInstanceOf(N8nError);
      expect(result.current.error?.code).toBe('NETWORK_ERROR');
    });

    it('should throw error from execute()', async () => {
      mockFetch.mockImplementationOnce(() => createErrorResponse(400, 'Bad request'));

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          caughtError = e as Error;
        }
      });

      expect(caughtError).not.toBeNull();
      expect(caughtError).toBeInstanceOf(N8nError);
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess on completion', async () => {
      const onSuccess = vi.fn();
      mockFetch.mockImplementationOnce(() => createSuccessResponse({ success: true }));

      const { result } = renderHook(() => useWorkflow('/test', { onSuccess }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith({ success: true });
    });

    it('should call onError on failure', async () => {
      const onError = vi.fn();
      mockFetch.mockImplementationOnce(() => createErrorResponse(500, 'Failed'));

      const { result } = renderHook(() => useWorkflow('/test', { onError }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith(expect.any(N8nError));
    });

    it('should call onStatusChange on each change', async () => {
      const onStatusChange = vi.fn();
      mockFetch.mockImplementationOnce(() => createSuccessResponse({ done: true }));

      const { result } = renderHook(() => useWorkflow('/test', { onStatusChange }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.execute();
      });

      expect(onStatusChange).toHaveBeenCalledWith('running');
      expect(onStatusChange).toHaveBeenCalledWith('success');
    });
  });

  describe('Polling Integration', () => {
    it('should pass abort signal to fetch', async () => {
      const { result } = renderHook(
        () =>
          useWorkflow('/test', {
            polling: {
              enabled: true,
              interval: 5000,
              timeout: 60000,
            },
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('Reset', () => {
    it('should reset all state values', async () => {
      mockFetch.mockImplementationOnce(() => createSuccessResponse({ result: 'data' }));

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      // First, execute successfully
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.data).not.toBeNull();

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBeNull();
    });

    it('should abort running execution on reset', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve(
                  new Response(JSON.stringify({ late: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                  })
                ),
              1000
            );
          })
      );

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      act(() => {
        void result.current.execute();
      });

      expect(result.current.status).toBe('running');

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
    });
  });

  describe('Cancel', () => {
    it('should cancel running execution', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve(
                  new Response(JSON.stringify({ shouldNotSee: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                  })
                ),
              1000
            );
          })
      );

      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      act(() => {
        void result.current.execute();
      });

      expect(result.current.status).toBe('running');

      act(() => {
        result.current.cancel();
      });

      expect(result.current.status).toBe('idle');
    });

    it('should do nothing when not running', () => {
      const { result } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.cancel();
      });

      expect(result.current.status).toBe('idle');
    });
  });

  describe('Persistence', () => {
    describe('Session Storage', () => {
      it('should clear state on success', async () => {
        mockFetch.mockImplementationOnce(() => createSuccessResponse({ data: 'test' }));

        const { result } = renderHook(
          () => useWorkflow('/test-session', { persist: 'session' }),
          { wrapper: createWrapper() }
        );

        await act(async () => {
          await result.current.execute();
        });

        // State is cleared on success
        expect(sessionStorage.getItem('n8n-connect:/test-session')).toBeNull();
      });

      it('should restore state from sessionStorage', async () => {
        // Pre-populate sessionStorage
        sessionStorage.setItem(
          'n8n-connect:/test-restore',
          JSON.stringify({
            status: 'success',
            data: { restored: true },
            timestamp: Date.now(),
          })
        );

        const { result } = renderHook(
          () => useWorkflow('/test-restore', { persist: 'session' }),
          { wrapper: createWrapper() }
        );

        // Should restore state on mount
        await waitFor(() => {
          expect(result.current.data).toEqual({ restored: true });
          expect(result.current.status).toBe('success');
        });
      });
    });

    describe('Local Storage', () => {
      it('should clear state on success', async () => {
        mockFetch.mockImplementationOnce(() => createSuccessResponse({ data: 'test' }));

        const { result } = renderHook(
          () => useWorkflow('/test-local', { persist: 'local' }),
          { wrapper: createWrapper() }
        );

        await act(async () => {
          await result.current.execute();
        });

        // State is cleared on success
        expect(localStorage.getItem('n8n-connect:/test-local')).toBeNull();
      });
    });

    describe('No Persistence', () => {
      it('should not save when persist=false', async () => {
        mockFetch.mockImplementationOnce(() => createSuccessResponse({ data: 'test' }));

        const { result } = renderHook(
          () => useWorkflow('/test-no-persist', { persist: false }),
          { wrapper: createWrapper() }
        );

        await act(async () => {
          await result.current.execute();
        });

        expect(sessionStorage.getItem('n8n-connect:/test-no-persist')).toBeNull();
        expect(localStorage.getItem('n8n-connect:/test-no-persist')).toBeNull();
      });
    });

    it('should clear persisted state on reset', async () => {
      // First persist some state
      sessionStorage.setItem(
        'n8n-connect:/test-clear',
        JSON.stringify({
          status: 'success',
          data: { test: true },
          timestamp: Date.now(),
        })
      );

      const { result } = renderHook(
        () => useWorkflow('/test-clear', { persist: 'session' }),
        { wrapper: createWrapper() }
      );

      // Wait for restore
      await waitFor(() => {
        expect(result.current.data).toEqual({ test: true });
      });

      // Reset should clear storage
      act(() => {
        result.current.reset();
      });

      expect(sessionStorage.getItem('n8n-connect:/test-clear')).toBeNull();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should not cause errors after unmount', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve(
                  new Response(JSON.stringify({ afterUnmount: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                  })
                ),
              100
            );
          })
      );

      const { result, unmount } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      act(() => {
        void result.current.execute();
      });

      // Unmount before promise resolves
      unmount();

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not have caused any errors
      consoleSpy.mockRestore();
    });

    it('should abort on unmount', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result, unmount } = renderHook(() => useWorkflow('/test'), {
        wrapper: createWrapper(),
      });

      act(() => {
        void result.current.execute();
      });

      expect(result.current.status).toBe('running');

      // Unmount should trigger abort - no errors expected
      unmount();
    });
  });

  describe('TypeScript Generics', () => {
    it('should correctly infer input and output types', async () => {
      interface Input {
        email: string;
      }
      interface Output {
        userId: string;
      }

      mockFetch.mockImplementationOnce(() => createSuccessResponse({ userId: 'u123' }));

      const { result } = renderHook(() => useWorkflow<Input, Output>('/create-user'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const response = await result.current.execute({ email: 'test@test.com' });
        // TypeScript should recognize response.userId
        expect(response.userId).toBe('u123');
      });

      // data should be typed as Output | null
      expect(result.current.data?.userId).toBe('u123');
    });
  });

  describe("'use client' Directive", () => {
    it('should have "use client" directive in useWorkflow', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const hookPath = path.resolve(__dirname, '../useWorkflow.ts');
      const content = await fs.readFile(hookPath, 'utf-8');

      expect(content.startsWith("'use client'") || content.startsWith('"use client"')).toBe(
        true
      );
    });
  });
});
