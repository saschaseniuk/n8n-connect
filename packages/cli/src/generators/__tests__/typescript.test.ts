import { describe, it, expect } from 'vitest';
import { generateTypes, toTypeName } from '../typescript.js';
import type { N8nWorkflow } from '../../n8n-api/types.js';

describe('TypeScript Generator', () => {
  describe('generateTypes', () => {
    it('should generate TypeScript declarations', () => {
      const workflows: N8nWorkflow[] = [
        {
          id: '1',
          name: 'User Registration',
          active: true,
          nodes: [
            {
              id: 'webhook1',
              name: 'Webhook',
              type: 'n8n-nodes-base.webhook',
              position: [0, 0],
              parameters: { path: 'register-user' },
            },
          ],
          connections: {},
        },
      ];

      const result = generateTypes(workflows);

      expect(result).toContain('// Auto-generated');
      expect(result).toContain("'register-user'");
      expect(result).toContain('RegisterUserInput');
      expect(result).toContain('RegisterUserOutput');
    });

    it('should handle multiple webhooks', () => {
      const workflows: N8nWorkflow[] = [
        {
          id: '1',
          name: 'Multi Webhook',
          active: true,
          nodes: [
            {
              id: 'w1',
              name: 'First',
              type: 'n8n-nodes-base.webhook',
              position: [0, 0],
              parameters: { path: 'first-hook' },
            },
            {
              id: 'w2',
              name: 'Second',
              type: 'n8n-nodes-base.webhook',
              position: [0, 0],
              parameters: { path: 'second-hook' },
            },
          ],
          connections: {},
        },
      ];

      const result = generateTypes(workflows);

      expect(result).toContain("'first-hook'");
      expect(result).toContain("'second-hook'");
      expect(result).toContain('FirstHookInput');
      expect(result).toContain('SecondHookInput');
    });

    it('should include workflow metadata as comments', () => {
      const workflows: N8nWorkflow[] = [
        {
          id: '42',
          name: 'Important Workflow',
          active: true,
          nodes: [
            {
              id: 'w1',
              name: 'Webhook',
              type: 'n8n-nodes-base.webhook',
              position: [0, 0],
              parameters: {
                path: 'important',
                httpMethod: 'POST',
              },
            },
          ],
          connections: {},
        },
      ];

      const result = generateTypes(workflows);

      expect(result).toContain('Workflow: Important Workflow');
      expect(result).toContain('Path: important');
      expect(result).toContain('Method: POST');
    });

    it('should generate valid TypeScript code', () => {
      const workflows: N8nWorkflow[] = [
        {
          id: '1',
          name: 'Test',
          active: true,
          nodes: [
            {
              id: 'w1',
              name: 'W',
              type: 'n8n-nodes-base.webhook',
              position: [0, 0],
              parameters: { path: 'test' },
            },
          ],
          connections: {},
        },
      ];

      const result = generateTypes(workflows);

      expect(result).toContain('interface');
      expect(result).toContain('declare module');
    });

    it('should handle empty array', () => {
      const result = generateTypes([]);

      expect(result).toContain('// Auto-generated');
      expect(result).toContain('// No webhooks found');
    });

    it('should filter out non-webhook nodes', () => {
      const workflows: N8nWorkflow[] = [
        {
          id: '1',
          name: 'Mixed',
          active: true,
          nodes: [
            {
              id: 'w1',
              name: 'Webhook',
              type: 'n8n-nodes-base.webhook',
              position: [0, 0],
              parameters: { path: 'test' },
            },
            {
              id: 'c1',
              name: 'Code',
              type: 'n8n-nodes-base.code',
              position: [100, 0],
              parameters: {},
            },
          ],
          connections: {},
        },
      ];

      const result = generateTypes(workflows);

      expect(result).toContain('TestInput');
      expect(result).not.toContain('CodeInput');
    });

    it('should default to POST method when httpMethod not specified', () => {
      const workflows: N8nWorkflow[] = [
        {
          id: '1',
          name: 'Test',
          active: true,
          nodes: [
            {
              id: 'w1',
              name: 'W',
              type: 'n8n-nodes-base.webhook',
              position: [0, 0],
              parameters: { path: 'test' },
            },
          ],
          connections: {},
        },
      ];

      const result = generateTypes(workflows);

      expect(result).toContain('Method: POST');
    });
  });

  describe('toTypeName', () => {
    it('should convert path to PascalCase', () => {
      const testCases = [
        { input: 'test-webhook', expected: 'TestWebhook' },
        { input: '/api/users', expected: 'ApiUsers' },
        { input: 'my_cool_endpoint', expected: 'MyCoolEndpoint' },
        { input: '/register-user', expected: 'RegisterUser' },
        { input: 'simple', expected: 'Simple' },
        { input: 'with--double', expected: 'WithDouble' },
        { input: '///multiple/slashes', expected: 'MultipleSlashes' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(toTypeName(input)).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      expect(toTypeName('')).toBe('');
      expect(toTypeName('/')).toBe('');
      expect(toTypeName('---')).toBe('');
    });
  });
});
