#!/bin/bash
set -e

# Agent initialization script
# Sets up the environment for both container and host contexts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")"
WORKSPACE_ROOT="$(dirname "$AGENTS_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Initializing agent environment...${NC}"

# Function to detect if we're in a container
is_container() {
  if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    return 0
  else
    return 1
  fi
}

# Function to ensure symlink exists
ensure_symlink() {
  local source="$1"
  local target="$2"
  
  if [ ! -e "$target" ]; then
    if [ -L "$target" ]; then
      # Broken symlink, remove it
      rm -f "$target"
    fi
    
    if [ -e "$source" ]; then
      echo -e "${YELLOW}Creating symlink: $target -> $source${NC}"
      ln -s "$source" "$target"
    else
      echo -e "${YELLOW}Creating directory: $source${NC}"
      mkdir -p "$source"
      ln -s "$source" "$target"
    fi
  else
    echo -e "✓ $target already exists"
  fi
}

# 1. Set up shared directories via symlinks
echo -e "\n${GREEN}Setting up shared directories...${NC}"
ensure_symlink "$WORKSPACE_ROOT/.claude" "$WORKSPACE_ROOT/.claude"
ensure_symlink "$WORKSPACE_ROOT/.agent-coordination" "$WORKSPACE_ROOT/.agent-coordination"

# 2. Verify git configuration
echo -e "\n${GREEN}Verifying git configuration...${NC}"
cd "$WORKSPACE_ROOT"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}ERROR: Not in a git repository!${NC}"
  exit 1
fi

# Get current branch/worktree info
BRANCH=$(git branch --show-current)
WORKTREE=$(git rev-parse --show-toplevel)

echo -e "✓ Git repository: $WORKTREE"
echo -e "✓ Current branch: $BRANCH"

# 3. Check for worktree-specific excludes file
EXCLUDES_FILE="$WORKSPACE_ROOT/.git/info/exclude"
if [ -f "$EXCLUDES_FILE" ]; then
  echo -e "\n${GREEN}Checking worktree excludes for duplicates...${NC}"
  
  # Remove duplicate lines while preserving order
  TEMP_FILE=$(mktemp)
  awk '!seen[$0]++' "$EXCLUDES_FILE" > "$TEMP_FILE"
  
  # Check if we removed any duplicates
  ORIG_LINES=$(wc -l < "$EXCLUDES_FILE")
  NEW_LINES=$(wc -l < "$TEMP_FILE")
  
  if [ "$ORIG_LINES" -ne "$NEW_LINES" ]; then
    echo -e "${YELLOW}Removed $(($ORIG_LINES - $NEW_LINES)) duplicate entries${NC}"
    mv "$TEMP_FILE" "$EXCLUDES_FILE"
  else
    echo -e "✓ No duplicates found"
    rm "$TEMP_FILE"
  fi
fi

# 4. Set up agent-specific environment
if [ -n "$AGENT_NUMBER" ]; then
  echo -e "\n${GREEN}Agent $AGENT_NUMBER environment:${NC}"
  
  # Load agent configuration
  source "$AGENTS_DIR/scripts/load-agent-config.sh"
  load_agent_config
  
  PURPOSE="${agent_purposes[$AGENT_NUMBER]:-unknown}"
  BRANCH_NAME="${agent_branches[$AGENT_NUMBER]:-unknown}"
  
  echo -e "✓ Purpose: $PURPOSE"
  echo -e "✓ Expected branch: $BRANCH_NAME"
  
  # Verify we're on the right branch
  if [ "$BRANCH" != "$BRANCH_NAME" ] && [ "$BRANCH_NAME" != "unknown" ]; then
    echo -e "${YELLOW}Warning: Current branch ($BRANCH) doesn't match expected ($BRANCH_NAME)${NC}"
  fi
fi

# 5. Container-specific setup
if is_container; then
  echo -e "\n${GREEN}Container-specific setup...${NC}"
  
  # Ensure proper permissions for git operations
  git config --global --add safe.directory "$WORKSPACE_ROOT"
  echo -e "✓ Git safe directory configured"
  
  # Call common post-create script if it exists
  if [ -f "$WORKSPACE_ROOT/scripts/utils/post-create.sh" ]; then
    echo -e "\n${GREEN}Running common post-create script...${NC}"
    "$WORKSPACE_ROOT/scripts/utils/post-create.sh"
  fi
  
  # Set up shell prompt to show agent info
  if [ -n "$AGENT_NUMBER" ] && [ -z "$AGENT_PROMPT_SET" ]; then
    export AGENT_PROMPT_SET=1
    export PS1="\[\033[1;32m\][Agent $AGENT_NUMBER - $PURPOSE]\[\033[0m\] \w\$ "
    echo -e "✓ Shell prompt configured"
  fi
else
  echo -e "\n${GREEN}Host environment detected${NC}"
fi

# 6. Create necessary directories
echo -e "\n${GREEN}Ensuring required directories exist...${NC}"
mkdir -p "$WORKSPACE_ROOT/.claude/sessions"
mkdir -p "$WORKSPACE_ROOT/.claude/contexts"
mkdir -p "$WORKSPACE_ROOT/.agent-coordination/locks"
echo -e "✓ Required directories created"

# 7. Final checks
echo -e "\n${GREEN}Final checks...${NC}"

# Check if we have the latest scripts
if [ -d "$AGENTS_DIR/.git" ]; then
  cd "$AGENTS_DIR"
  if git diff --quiet HEAD -- scripts/; then
    echo -e "✓ Scripts are up to date"
  else
    echo -e "${YELLOW}Warning: Scripts have uncommitted changes${NC}"
  fi
  cd "$WORKSPACE_ROOT"
fi

echo -e "\n${GREEN}✅ Agent initialization complete!${NC}"

# If in container and no command provided, show helpful info
if is_container && [ $# -eq 0 ]; then
  echo -e "\n${GREEN}Available commands:${NC}"
  echo "  ./prompt.sh [agent_number]  - Generate Claude prompt"
  echo "  ./session.sh               - Manage session files"
  echo "  ./status.sh                - Check agent status"
  echo "  ./sync.sh                  - Sync changes between agents"
  echo "  ./check-conflicts.sh       - Check for merge conflicts"
fi