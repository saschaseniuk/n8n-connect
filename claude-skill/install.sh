#!/bin/bash
#
# n8n-connect Claude Code Skill Installer
#
# Remote usage (recommended):
#   curl -fsSL https://raw.githubusercontent.com/saschaseniuk/n8n-connect/main/claude-skill/install.sh | bash
#
# Local usage:
#   ./install.sh
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

REPO_RAW="https://raw.githubusercontent.com/saschaseniuk/n8n-connect/main"
SKILL_DIR=".claude/skills/n8n-connect"

echo -e "${BLUE}n8n-connect Claude Code Skill Installer${NC}"
echo ""

# Check if we're in a project directory
if [ ! -f "package.json" ] && [ ! -f "tsconfig.json" ] && [ ! -d ".git" ]; then
    echo -e "${YELLOW}Warning: This doesn't look like a project directory.${NC}"
    echo -e "Run this from your project root."
    echo ""
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create directory
mkdir -p "$SKILL_DIR"

# Download SKILL.md
echo -e "Downloading skill..."
curl -fsSL "$REPO_RAW/claude-skill/n8n-connect/SKILL.md" -o "$SKILL_DIR/SKILL.md"

echo ""
echo -e "${GREEN}Done!${NC} Skill installed to $SKILL_DIR"
echo ""
echo -e "Usage in Claude Code:"
echo -e "  ${BLUE}/n8n-connect${NC} how do I set up the provider?"
echo -e "  ${BLUE}/n8n-connect${NC} generate a file upload component"
echo -e "  ${BLUE}/n8n-connect${NC} debug my CORS error"
echo ""
