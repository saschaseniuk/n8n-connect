'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type UseWorkflowOptions,
  type UseWorkflowReturn,
  type WorkflowStatus,
  type N8nError,
  wrapError,
} from '@n8n-connect/core';
import { useN8nContext } from './useN8nContext';
import { usePersistence } from './usePersistence';

/**
 * Hook for executing n8n workflows with full state management.
 *
 * This hook provides a complete solution for triggering workflows,
 * tracking their status, handling errors, and managing results.
 *
 * Note: For long-running workflows with polling, use the core package's
 * `executeAndPoll` function with `ExecutionsClient` directly.
 *
 * @typeParam TInput - The input data type for the workflow
 * @typeParam TOutput - The expected output data type from the workflow
 *
 * @param webhookPath - The webhook path to execute (e.g., '/contact-form')
 * @param options - Configuration options for the hook
 *
 * @returns An object with execute function, status, data, error, and control functions
 *
 * @example
 * ```tsx
 * function ContactForm() {
 *   const { execute, status, data, error, isLoading } = useWorkflow<
 *     { email: string; message: string },
 *     { ticketId: string }
 *   >('/contact-form');
 *
 *   const handleSubmit = async (formData) => {
 *     try {
 *       const result = await execute(formData);
 *       console.log('Ticket created:', result.ticketId);
 *     } catch (err) {
 *       console.error('Failed:', err);
 *     }
 *   };
 *
 *   if (status === 'success') {
 *     return <div>Ticket created: {data.ticketId}</div>;
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div className="error">{error.message}</div>}
 *       <button disabled={isLoading}>Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useWorkflow<TInput = unknown, TOutput = unknown>(
  webhookPath: string,
  options: UseWorkflowOptions<TInput, TOutput> = {}
): UseWorkflowReturn<TInput, TOutput> {
  const { config, client } = useN8nContext();

  // Merge options with provider defaults
  const mergedOptions = {
    persist: options.persist ?? config.defaultPersist ?? false,
    manual: options.manual ?? true, // Default to manual mode
  };

  // State
  const [status, setStatus] = useState<WorkflowStatus>('idle');
  const [data, setData] = useState<TOutput | null>(null);
  const [error, setError] = useState<N8nError | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Persistence
  const { saveState, loadState, clearState } = usePersistence<TOutput>(
    webhookPath,
    mergedOptions.persist
  );

  // Update status with callback
  const updateStatus = useCallback(
    (newStatus: WorkflowStatus) => {
      if (!mountedRef.current) return;
      setStatus(newStatus);
      options.onStatusChange?.(newStatus);
    },
    [options.onStatusChange]
  );

  // Execute workflow
  const execute = useCallback(
    async (inputData?: TInput, files?: Record<string, File | Blob>): Promise<TOutput> => {
      // Cancel any existing execution
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Reset state
      setError(null);
      setProgress(0);
      updateStatus('running');

      try {
        let result: TOutput;

        if (config.useServerProxy && config.serverAction) {
          // Server proxy mode
          result = await config.serverAction<TInput, TOutput>(webhookPath, {
            data: inputData,
            files,
          });
        } else if (client) {
          // Direct mode
          result = await client.execute<TInput, TOutput>(webhookPath, {
            data: inputData,
            files,
          });
        } else {
          throw new Error(
            'No n8n client available. ' +
              'Configure baseUrl or useServerProxy in N8nProvider.'
          );
        }

        if (mountedRef.current) {
          setData(result);
          setProgress(100);
          updateStatus('success');
          options.onSuccess?.(result);

          // Persist success state
          if (mergedOptions.persist) {
            saveState({ status: 'success', data: result });
          }
        }

        return result;
      } catch (err) {
        const wrappedError = wrapError(err);

        if (mountedRef.current) {
          setError(wrappedError);
          updateStatus('error');
          options.onError?.(wrappedError);
        }

        throw wrappedError;
      }
    },
    [
      client,
      config.useServerProxy,
      config.serverAction,
      webhookPath,
      mergedOptions.persist,
      options.onSuccess,
      options.onError,
      updateStatus,
      saveState,
    ]
  );

  // Reset state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setData(null);
    setError(null);
    setProgress(null);
    clearState();
  }, [clearState]);

  // Cancel execution
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (status === 'running') {
      updateStatus('idle');
    }
  }, [status, updateStatus]);

  // Restore persisted state on mount
  useEffect(() => {
    if (!mergedOptions.persist) return;

    const persisted = loadState();
    if (!persisted) return;

    // Restore completed data
    if (persisted.data) {
      setData(persisted.data);
      setStatus('success');
    }
    // Only run on mount - using JSON.stringify to detect actual changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookPath, JSON.stringify(mergedOptions.persist)]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-execute if not manual and initialData provided
  useEffect(() => {
    if (!mergedOptions.manual && options.initialData !== undefined) {
      void execute(options.initialData);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    execute,
    status,
    data,
    error,
    progress,
    isLoading: status === 'running',
    reset,
    cancel,
  };
}
