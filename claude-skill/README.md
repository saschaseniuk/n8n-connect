# Claude Code Skill for n8n-connect

A [Claude Code](https://claude.ai/code) skill that helps you work with the n8n-connect SDK.

## Features

- **Setup Assistant** - Guides through installation and configuration
- **Workflow Generator** - Generates `useWorkflow` hooks and Server Actions
- **Debugging Helper** - Diagnoses common issues (CORS, 404s, timeouts)
- **Documentation Lookup** - Answers API questions with code examples

## Installation

Run this command in your project root:

```bash
curl -fsSL https://raw.githubusercontent.com/saschaseniuk/n8n-connect/main/claude-skill/install.sh | bash
```

Or manually:

```bash
mkdir -p .claude/skills/n8n-connect
curl -fsSL https://raw.githubusercontent.com/saschaseniuk/n8n-connect/main/claude-skill/n8n-connect/SKILL.md \
  -o .claude/skills/n8n-connect/SKILL.md
```

## Usage

Once installed, use the skill in Claude Code:

```
/n8n-connect how do I set up the provider?
/n8n-connect generate a file upload component
/n8n-connect I'm getting a CORS error
```

Claude will also automatically use the skill when you ask about n8n-connect topics.

## Updating

Re-run the install command to get the latest version.

## Requirements

- [Claude Code](https://claude.ai/code) CLI
- A project using `@n8n-connect/core` or `@n8n-connect/react`

## Learn More

- [n8n-connect Documentation](https://github.com/saschaseniuk/n8n-connect/tree/main/docs)
- [Claude Code Skills](https://docs.anthropic.com/claude-code/skills)
