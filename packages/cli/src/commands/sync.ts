import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { N8nApiClient } from '../n8n-api/client.js';
import { generateTypes } from '../generators/typescript.js';

interface SyncOptions {
  workflowId?: string;
  all?: boolean;
  output: string;
  url?: string;
  token?: string;
  watch?: boolean;
}

export const syncCommand = new Command('sync')
  .description('Generate TypeScript types from n8n workflow definitions')
  .option('-w, --workflow-id <id>', 'Workflow ID to sync')
  .option('--all', 'Sync all workflows with webhooks')
  .option('-o, --output <path>', 'Output file path', './types/n8n.d.ts')
  .option('--url <url>', 'n8n instance URL (overrides N8N_BASE_URL)')
  .option('--token <token>', 'n8n API token (overrides N8N_API_TOKEN)')
  .option('--watch', 'Watch for changes and regenerate')
  .action(async (options: SyncOptions) => {
    const baseUrl = options.url ?? process.env['N8N_BASE_URL'];
    const apiToken = options.token ?? process.env['N8N_API_TOKEN'];

    if (!baseUrl) {
      console.error(
        chalk.red('Error: n8n URL required. Set N8N_BASE_URL or use --url')
      );
      process.exit(1);
    }

    if (!apiToken) {
      console.error(
        chalk.red('Error: API token required. Set N8N_API_TOKEN or use --token')
      );
      process.exit(1);
    }

    if (!options.workflowId && !options.all) {
      console.error(chalk.red('Error: Specify --workflow-id or --all'));
      process.exit(1);
    }

    const client = new N8nApiClient(baseUrl, apiToken);

    const runSync = async () => {
      const spinner = ora('Fetching workflows...').start();

      try {
        let workflows;
        if (options.all) {
          workflows = await client.getWorkflowsWithWebhooks();
          spinner.text = `Found ${workflows.length} workflows with webhooks`;
        } else {
          const workflow = await client.getWorkflow(options.workflowId!);
          workflows = [workflow];
        }

        if (workflows.length === 0) {
          spinner.warn('No workflows found');
          return;
        }

        spinner.text = 'Generating TypeScript types...';
        const typeDefinitions = generateTypes(workflows);

        const outputPath = path.resolve(options.output);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, typeDefinitions, 'utf-8');

        spinner.succeed(
          `Generated types for ${workflows.length} workflow(s) at ${chalk.cyan(outputPath)}`
        );
      } catch (error) {
        spinner.fail('Failed to sync workflows');
        console.error(
          chalk.red(error instanceof Error ? error.message : String(error))
        );
        process.exit(1);
      }
    };

    await runSync();

    if (options.watch) {
      console.log(chalk.blue('\nWatching for changes... (Ctrl+C to stop)'));

      setInterval(async () => {
        console.log(
          chalk.gray(
            `\n[${new Date().toLocaleTimeString()}] Checking for updates...`
          )
        );
        await runSync();
      }, 30000);
    }
  });
