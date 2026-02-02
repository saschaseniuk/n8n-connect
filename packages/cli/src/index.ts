#!/usr/bin/env node

import { Command } from 'commander';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('n8n-connect')
  .description('CLI tools for n8n-connect SDK')
  .version('0.1.0');

program.addCommand(syncCommand);

program.parse();
