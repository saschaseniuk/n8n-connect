import { describe, it, expect, vi, beforeEach } from 'vitest';
import { N8nApiClient } from '../client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('N8nApiClient', () => {
  const client = new N8nApiClient('https://n8n.example.com', 'test-token');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWorkflow', () => {
    it('should fetch a single workflow', async () => {
      const mockWorkflow = {
        id: '1',
        name: 'Test Workflow',
        active: true,
        nodes: [],
        connections: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWorkflow),
      });

      const result = await client.getWorkflow('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/api/v1/workflows/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-N8N-API-KEY': 'test-token',
          }),
        })
      );
      expect(result).toEqual(mockWorkflow);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(client.getWorkflow('999')).rejects.toThrow('Not Found');
    });
  });

  describe('getWorkflows', () => {
    it('should fetch all workflows', async () => {
      const mockWorkflows = {
        data: [
          { id: '1', name: 'Workflow 1', active: true, nodes: [], connections: {} },
          { id: '2', name: 'Workflow 2', active: true, nodes: [], connections: {} },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWorkflows),
      });

      const result = await client.getWorkflows();

      expect(result).toHaveLength(2);
    });

    it('should handle empty data array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await client.getWorkflows();

      expect(result).toHaveLength(0);
    });

    it('should handle missing data property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await client.getWorkflows();

      expect(result).toHaveLength(0);
    });
  });

  describe('getWorkflowsWithWebhooks', () => {
    it('should filter workflows with webhook triggers only', async () => {
      const mockWorkflows = {
        data: [
          {
            id: '1',
            name: 'With Webhook',
            active: true,
            nodes: [
              {
                id: 'w1',
                name: 'Webhook',
                type: 'n8n-nodes-base.webhook',
                position: [0, 0] as [number, number],
                parameters: { path: 'test' },
              },
            ],
            connections: {},
          },
          {
            id: '2',
            name: 'Without Webhook',
            active: true,
            nodes: [
              {
                id: 'c1',
                name: 'Cron',
                type: 'n8n-nodes-base.cron',
                position: [0, 0] as [number, number],
                parameters: {},
              },
            ],
            connections: {},
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWorkflows),
      });

      const result = await client.getWorkflowsWithWebhooks();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('With Webhook');
    });
  });

  describe('URL handling', () => {
    it('should strip trailing slash from base URL', async () => {
      const clientWithSlash = new N8nApiClient(
        'https://n8n.example.com/',
        'test-token'
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'Test', active: true, nodes: [], connections: {} }),
      });

      await clientWithSlash.getWorkflow('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/api/v1/workflows/1',
        expect.any(Object)
      );
    });
  });
});
