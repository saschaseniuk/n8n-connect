'use client';

import { useCallback } from 'react';
import type { PersistMode, WorkflowStatus } from '@n8n-connect/core';

/**
 * Persisted state structure stored in browser storage.
 */
export interface PersistedState<T> {
  status: WorkflowStatus;
  data: T | null;
  executionId?: string;
  statusEndpoint?: string;
  timestamp: number;
}

/**
 * Internal hook for managing workflow state persistence.
 *
 * Supports sessionStorage and localStorage for persisting workflow state
 * across page reloads.
 *
 * @param webhookPath - The webhook path used as storage key
 * @param mode - Persistence mode: 'session', 'local', or false
 */
export function usePersistence<T>(webhookPath: string, mode: PersistMode) {
  const storageKey = `n8n-connect:${webhookPath}`;

  const getStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (mode === 'session') return sessionStorage;
    if (mode === 'local') return localStorage;
    return null;
  }, [mode]);

  const saveState = useCallback(
    (state: Partial<PersistedState<T>>) => {
      const storage = getStorage();
      if (!storage) return;

      const current = loadStateInternal(storage, storageKey);
      const updated = {
        status: 'idle' as WorkflowStatus,
        data: null,
        ...current,
        ...state,
        timestamp: Date.now(),
      };

      try {
        storage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist workflow state:', e);
      }
    },
    [storageKey, getStorage]
  );

  const loadState = useCallback((): PersistedState<T> | null => {
    const storage = getStorage();
    if (!storage) return null;
    return loadStateInternal(storage, storageKey);
  }, [storageKey, getStorage]);

  const clearState = useCallback(() => {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(storageKey);
  }, [storageKey, getStorage]);

  return { saveState, loadState, clearState };
}

/**
 * Internal helper to load state from storage.
 */
function loadStateInternal<T>(
  storage: Storage,
  key: string
): PersistedState<T> | null {
  try {
    const stored = storage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as PersistedState<T>;
  } catch {
    return null;
  }
}
