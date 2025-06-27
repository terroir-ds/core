#!/bin/bash
# post-create.sh - Main post-create script for devcontainer
# This script orchestrates all post-create tasks and prevents duplicate execution

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Simple logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Check if post-create has already completed
POST_CREATE_MARKER="/tmp/.post-create-completed"
if [ -f "$POST_CREATE_MARKER" ]; then
    log "Post-create has already completed in this container session. Skipping."
    exit 0
fi

log "Starting post-create setup..."

# 1. Run git/SSH setup
log "Setting up Git and SSH..."
if [ -f "$SCRIPT_DIR/setup-git-ssh.sh" ]; then
    bash "$SCRIPT_DIR/setup-git-ssh.sh" || {
        log "Warning: Git/SSH setup failed, but continuing..."
    }
else
    log "Warning: setup-git-ssh.sh not found"
fi

# 2. Install dependencies
log "Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm install --force || {
        log "Warning: pnpm install failed"
    }
else
    log "Warning: pnpm not found, skipping dependency installation"
fi

# 3. Install Playwright browsers
log "Installing Playwright browsers..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm exec playwright install chromium firefox webkit || {
        log "Warning: Playwright browser installation failed"
    }
fi

# 4. Handle multi-agent coordination setup for agent worktrees
# This sets up symbolic links to terroir-core directories
if [[ "${PWD}" =~ terroir-agent[0-9]+ ]] || [[ "${WORKSPACE_FOLDER:-}" =~ terroir-agent[0-9]+ ]]; then
    log "Detected agent worktree environment, setting up coordination links..."
    
    # Create symbolic links to terroir-core's coordination directories
    if [ -d "/workspaces/terroir-core/.claude" ] && [ ! -e ".claude" ]; then
        ln -sf /workspaces/terroir-core/.claude .claude
        log "Created symbolic link to terroir-core's .claude directory"
    fi
    
    if [ -d "/workspaces/terroir-core/.agent-coordination" ] && [ ! -e ".agent-coordination" ]; then
        # Create the directory in terroir-core if it doesn't exist
        mkdir -p /workspaces/terroir-core/.agent-coordination
        ln -sf /workspaces/terroir-core/.agent-coordination .agent-coordination
        log "Created symbolic link to terroir-core's .agent-coordination directory"
    fi
fi

# Mark completion
touch "$POST_CREATE_MARKER"
log "Post-create setup completed successfully!"

# Show environment info
log "Environment:"
log "  Node: $(node --version 2>/dev/null || echo 'not found')"
log "  pnpm: $(pnpm --version 2>/dev/null || echo 'not found')"
log "  Git: $(git --version 2>/dev/null || echo 'not found')"

# Check if we're in a git repository
if git rev-parse --git-dir >/dev/null 2>&1; then
    log "  Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
fi

exit 0