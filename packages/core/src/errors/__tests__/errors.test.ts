import { describe, it, expect } from 'vitest';
import { N8nError } from '../N8nError';
import {
  isN8nError,
  createErrorFromResponse,
  mapStatusCodeToErrorCode,
  wrapError,
  createTimeoutError,
  createPollingError,
} from '../utils';
import type { N8nErrorCode } from '../../types/errors';

describe('N8nError', () => {
  describe('Konstruktor', () => {
    it('sollte Error mit message und default code erstellen', () => {
      const error = new N8nError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('UNKNOWN');
      expect(error.name).toBe('N8nError');
    });

    it('sollte Error mit allen Optionen erstellen', () => {
      const error = new N8nError('Workflow failed', {
        code: 'WORKFLOW_ERROR',
        statusCode: 500,
        details: { nodeId: 'node1' },
        executionId: 'exec123',
        nodeName: 'HTTP Request',
      });

      expect(error.code).toBe('WORKFLOW_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ nodeId: 'node1' });
      expect(error.executionId).toBe('exec123');
      expect(error.nodeName).toBe('HTTP Request');
    });

    it('sollte instanceof Error sein', () => {
      const error = new N8nError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof N8nError).toBe(true);
    });

    it('sollte korrekten Stack Trace haben', () => {
      const error = new N8nError('Test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('N8nError');
    });
  });

  describe('toJSON', () => {
    it('sollte alle Properties serialisieren', () => {
      const error = new N8nError('Test error', {
        code: 'TIMEOUT',
        statusCode: 408,
        details: { timeout: 30000 },
        executionId: 'exec123',
        nodeName: 'Wait',
      });

      const json = error.toJSON();

      expect(json).toEqual({
        message: 'Test error',
        code: 'TIMEOUT',
        statusCode: 408,
        details: { timeout: 30000 },
        executionId: 'exec123',
        nodeName: 'Wait',
      });
    });

    it('sollte undefined Properties nicht einschliessen', () => {
      const error = new N8nError('Simple error', { code: 'UNKNOWN' });
      const json = error.toJSON();

      expect(json.message).toBe('Simple error');
      expect(json.code).toBe('UNKNOWN');
      expect(json.statusCode).toBeUndefined();
    });

    it('sollte JSON.stringify unterstuetzen', () => {
      const error = new N8nError('Test', { code: 'NETWORK_ERROR' });
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized) as { message: string; code: string };

      expect(parsed.message).toBe('Test');
      expect(parsed.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Error Codes', () => {
    const errorCodes: N8nErrorCode[] = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'WORKFLOW_ERROR',
      'VALIDATION_ERROR',
      'AUTH_ERROR',
      'NOT_FOUND',
      'SERVER_ERROR',
      'POLLING_ERROR',
      'UNKNOWN',
    ];

    it.each(errorCodes)('sollte Error mit Code %s erstellen', (code) => {
      const error = new N8nError(`Error: ${code}`, { code });
      expect(error.code).toBe(code);
    });
  });
});

describe('isN8nError', () => {
  it('sollte true fuer N8nError zurueckgeben', () => {
    const error = new N8nError('Test');
    expect(isN8nError(error)).toBe(true);
  });

  it('sollte false fuer normalen Error zurueckgeben', () => {
    const error = new Error('Test');
    expect(isN8nError(error)).toBe(false);
  });

  it('sollte false fuer null zurueckgeben', () => {
    expect(isN8nError(null)).toBe(false);
  });

  it('sollte false fuer undefined zurueckgeben', () => {
    expect(isN8nError(undefined)).toBe(false);
  });

  it('sollte false fuer string zurueckgeben', () => {
    expect(isN8nError('error message')).toBe(false);
  });

  it('sollte false fuer Objekt mit aehnlichen Properties zurueckgeben', () => {
    const fakeError = {
      message: 'Test',
      code: 'UNKNOWN',
      name: 'N8nError',
    };
    expect(isN8nError(fakeError)).toBe(false);
  });
});

describe('createErrorFromResponse', () => {
  it('sollte N8nError aus 404 Response erstellen', async () => {
    const response = new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });

    const error = await createErrorFromResponse(response);

    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });

  it('sollte N8nError aus 401 Response erstellen', async () => {
    const response = new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

    const error = await createErrorFromResponse(response);

    expect(error.code).toBe('AUTH_ERROR');
    expect(error.statusCode).toBe(401);
  });

  it('sollte N8nError aus 403 Response erstellen', async () => {
    const response = new Response('Forbidden', { status: 403 });

    const error = await createErrorFromResponse(response);

    expect(error.code).toBe('AUTH_ERROR');
    expect(error.statusCode).toBe(403);
  });

  it('sollte N8nError aus 408 Response erstellen', async () => {
    const response = new Response('Timeout', { status: 408 });

    const error = await createErrorFromResponse(response);

    expect(error.code).toBe('TIMEOUT');
  });

  it('sollte N8nError aus 422 Response erstellen', async () => {
    const response = new Response(
      JSON.stringify({
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Invalid email' }],
      }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const error = await createErrorFromResponse(response);

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details?.errors).toBeDefined();
  });

  it('sollte N8nError aus 500 Response erstellen', async () => {
    const response = new Response('Internal Server Error', { status: 500 });

    const error = await createErrorFromResponse(response);

    expect(error.code).toBe('SERVER_ERROR');
    expect(error.statusCode).toBe(500);
  });

  it('sollte executionId und nodeName aus Response extrahieren', async () => {
    const response = new Response(
      JSON.stringify({
        message: 'Node failed',
        executionId: 'exec456',
        nodeName: 'HTTP Request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const error = await createErrorFromResponse(response);

    expect(error.executionId).toBe('exec456');
    expect(error.nodeName).toBe('HTTP Request');
  });

  it('sollte mit non-JSON Response umgehen', async () => {
    const response = new Response('Plain text error', { status: 500 });

    const error = await createErrorFromResponse(response);

    expect(error.message).toContain('500');
    expect(error.code).toBe('SERVER_ERROR');
  });
});

describe('mapStatusCodeToErrorCode', () => {
  it('sollte AUTH_ERROR fuer 401 zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(401)).toBe('AUTH_ERROR');
  });

  it('sollte AUTH_ERROR fuer 403 zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(403)).toBe('AUTH_ERROR');
  });

  it('sollte NOT_FOUND fuer 404 zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(404)).toBe('NOT_FOUND');
  });

  it('sollte TIMEOUT fuer 408 zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(408)).toBe('TIMEOUT');
  });

  it('sollte VALIDATION_ERROR fuer 422 zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(422)).toBe('VALIDATION_ERROR');
  });

  it('sollte SERVER_ERROR fuer 5xx zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(500)).toBe('SERVER_ERROR');
    expect(mapStatusCodeToErrorCode(502)).toBe('SERVER_ERROR');
    expect(mapStatusCodeToErrorCode(503)).toBe('SERVER_ERROR');
  });

  it('sollte WORKFLOW_ERROR fuer andere 4xx zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(400)).toBe('WORKFLOW_ERROR');
    expect(mapStatusCodeToErrorCode(409)).toBe('WORKFLOW_ERROR');
  });

  it('sollte UNKNOWN fuer andere Status Codes zurueckgeben', () => {
    expect(mapStatusCodeToErrorCode(200)).toBe('UNKNOWN');
    expect(mapStatusCodeToErrorCode(301)).toBe('UNKNOWN');
  });
});

describe('wrapError', () => {
  it('sollte N8nError unveraendert zurueckgeben', () => {
    const original = new N8nError('Original', { code: 'TIMEOUT' });
    const wrapped = wrapError(original);

    expect(wrapped).toBe(original);
    expect(wrapped.code).toBe('TIMEOUT');
  });

  it('sollte TypeError mit fetch Message als NETWORK_ERROR wrappen', () => {
    const error = new TypeError('Failed to fetch');
    const wrapped = wrapError(error);

    expect(wrapped.code).toBe('NETWORK_ERROR');
    expect(wrapped.message).toBe('Network request failed');
  });

  it('sollte AbortError als TIMEOUT wrappen', () => {
    const error = new DOMException('Aborted', 'AbortError');
    const wrapped = wrapError(error);

    expect(wrapped.code).toBe('TIMEOUT');
    expect(wrapped.message).toBe('Request was cancelled');
  });

  it('sollte normalen Error als UNKNOWN wrappen', () => {
    const error = new Error('Something went wrong');
    const wrapped = wrapError(error);

    expect(wrapped.code).toBe('UNKNOWN');
    expect(wrapped.message).toBe('Something went wrong');
    expect(wrapped.details?.originalError).toBe('Error');
  });

  it('sollte string als UNKNOWN wrappen', () => {
    const wrapped = wrapError('String error');

    expect(wrapped.code).toBe('UNKNOWN');
    expect(wrapped.message).toBe('String error');
  });

  it('sollte null/undefined als UNKNOWN wrappen', () => {
    expect(wrapError(null).code).toBe('UNKNOWN');
    expect(wrapError(undefined).code).toBe('UNKNOWN');
  });
});

describe('createTimeoutError', () => {
  it('sollte TIMEOUT Error mit korrekter Message erstellen', () => {
    const error = createTimeoutError(30000);

    expect(error.code).toBe('TIMEOUT');
    expect(error.message).toBe('Request timed out after 30000ms');
    expect(error.details?.timeout).toBe(30000);
  });

  it('sollte mit verschiedenen Timeout-Werten funktionieren', () => {
    const error1 = createTimeoutError(5000);
    const error2 = createTimeoutError(60000);

    expect(error1.message).toContain('5000ms');
    expect(error2.message).toContain('60000ms');
  });
});

describe('createPollingError', () => {
  it('sollte POLLING_ERROR mit Message erstellen', () => {
    const error = createPollingError('Polling failed');

    expect(error.code).toBe('POLLING_ERROR');
    expect(error.message).toBe('Polling failed');
  });

  it('sollte executionId einschliessen wenn angegeben', () => {
    const error = createPollingError('Max attempts exceeded', 'exec789');

    expect(error.code).toBe('POLLING_ERROR');
    expect(error.executionId).toBe('exec789');
  });

  it('sollte ohne executionId funktionieren', () => {
    const error = createPollingError('Timeout');

    expect(error.executionId).toBeUndefined();
  });
});
