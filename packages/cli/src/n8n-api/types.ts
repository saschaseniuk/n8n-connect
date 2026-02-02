export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
  typeVersion?: number;
}

export interface WebhookNode extends N8nNode {
  type: 'n8n-nodes-base.webhook';
  parameters: {
    path: string;
    httpMethod?: string;
    responseMode?: string;
    options?: {
      rawBody?: boolean;
    };
  };
}

export function isWebhookNode(node: N8nNode): node is WebhookNode {
  return node.type === 'n8n-nodes-base.webhook';
}
