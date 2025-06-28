# Multi-Agent Setup Simplification Options

## Current Complexity Issues

1. **Merge Conflicts**: Core-only files cause conflicts in both directions
2. **Git Tracking**: Hard to keep agent-specific files out of git
3. **Symlinks**: Can be fragile and confusing
4. **Manual Cleanup**: Every merge needs manual intervention

## Option 1: Sparse Checkout (Recommended)

Use git's sparse-checkout feature to exclude files at the git level:

```bash
# In agent worktree
git sparse-checkout init --cone
git sparse-checkout set --no-cone '/*' '!/.claude' '!/.devcontainer/devcontainer.json' '!/.vscode/settings.json'
```

**Pros:**

- Files don't exist in agent worktrees at all
- No merge conflicts for excluded files
- Git handles everything automatically

**Cons:**

- Requires Git 2.25+
- Less intuitive for newcomers
- Need to remember to set up for each worktree

## Option 2: Post-Checkout Hook

Automatically clean up after every checkout:

```bash
# .git/hooks/post-checkout
#!/bin/bash
if [[ $(git branch --show-current) =~ ^feat/(utilities|infrastructure|documentation)$ ]]; then
    rm -rf .claude
    ln -sf /workspaces/terroir-core/.claude .claude
    # Reset other agent-specific files
fi
```

**Pros:**

- Automatic cleanup
- Works with normal git workflow

**Cons:**

- Hooks aren't versioned
- Can be surprising behavior
- Still have merge issues

## Option 3: Separate Config Branch

Keep all agent configs in a separate branch:

```text
main
├── (all code)
├── .devcontainer/Dockerfile
└── .vscode/extensions.json

config/agents (orphan branch)
├── .claude/
├── devcontainer-templates/
└── vscode-settings/
```

**Pros:**

- Complete separation
- No merge conflicts ever
- Can version agent configs separately

**Cons:**

- More complex mental model
- Need tooling to apply configs
- Harder to keep in sync

## Option 4: Build-Time Configuration

Generate agent-specific files at container build time:

```dockerfile
# In Dockerfile
ARG AGENT_ROLE
RUN /scripts/configure-agent.sh $AGENT_ROLE
```

**Pros:**

- No git tracking issues
- Configs always fresh
- Single source of truth

**Cons:**

- Can't easily customize per-agent
- Requires rebuild for changes
- Harder to debug

## Option 5: External Configuration

Store agent configs outside the repo:

```bash
~/.terroir-agents/
├── agent1/
│   ├── devcontainer.json
│   └── settings.json
├── agent2/
└── agent3/
```

**Pros:**

- Completely outside git
- No merge issues
- Easy to customize

**Cons:**
- Not versioned
- Need to document setup
- Can get out of sync

## Recommended Approach: Hybrid Solution

1. **Use Sparse Checkout** for excluding .claude/ directory
2. **Keep merge scripts** as safety net
3. **Add setup automation** in host setup script
4. **Document clearly** in README

### Implementation Steps:

1. Update `setup.sh` to configure sparse checkout:
```bash
git sparse-checkout init --cone
git sparse-checkout set --no-cone '/*' '!/.claude'
```

2. Use `.gitignore` for agent-specific files:
```
# In agent worktrees
.devcontainer/devcontainer.json
.vscode/settings.json
```

3. Keep current symlink approach for .claude access

4. Simplify merge scripts to handle fewer edge cases

This reduces complexity while maintaining the benefits of the current approach.