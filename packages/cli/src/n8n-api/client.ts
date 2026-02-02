import type { N8nWorkflow } from './types.js';
import { isWebhookNode } from './types.js';

export class N8nApiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = {
      'X-N8N-API-KEY': apiToken,
      'Content-Type': 'application/json',
    };
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${id}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow ${id}: ${response.statusText}`);
    }

    return response.json() as Promise<N8nWorkflow>;
  }

  async getWorkflows(): Promise<N8nWorkflow[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.statusText}`);
    }

    const data = (await response.json()) as { data?: N8nWorkflow[] };
    return data.data ?? [];
  }

  async getWorkflowsWithWebhooks(): Promise<N8nWorkflow[]> {
    const workflows = await this.getWorkflows();
    return workflows.filter((w) => this.hasWebhookTrigger(w));
  }

  private hasWebhookTrigger(workflow: N8nWorkflow): boolean {
    return workflow.nodes.some((node) => isWebhookNode(node));
  }
}
