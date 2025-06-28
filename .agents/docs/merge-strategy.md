# Multi-Agent Merge Strategy

## The Problem

The multi-agent setup creates a complex merge scenario:

1. **Core Branch** (main/feat/initial-setup) contains:
   - `.claude/` - Multi-agent tooling and documentation
   - `.devcontainer/` - Shared devcontainer configuration
   - `.vscode/` - Shared VS Code settings
   - All project code

2. **Agent Branches** (feat/utilities, feat/infrastructure, feat/documentation) should:
   - NOT have `.claude/` directory (uses symlink to core)
   - NOT track `.devcontainer/devcontainer.json` (uses agent-specific version)
   - NOT track `.vscode/settings.json` (has agent-specific colors)
   - ONLY contain their specific code changes

## Files That Cause Merge Conflicts

### Always Excluded from Agent Branches

- `.claude/` - Entire directory (agent coordination, scripts, prompts)
- `.devcontainer/devcontainer.json` - Agent-specific resource limits
- `.vscode/settings.json` - Agent-specific colors and environment

### Shared Files (should merge normally)

- `.devcontainer/Dockerfile` - Shared container definition
- `.devcontainer/README.md` - Shared documentation
- `.vscode/extensions.json` - Shared extensions
- `.vscode/cspell.json` - Shared spell check
- All project code files

## Merge Strategies

### 1. Merging Core → Agent (Updating agents with core changes)

````bash
# On agent branch
git merge feat/initial-setup --no-commit
git reset HEAD .claude/
git checkout HEAD -- .devcontainer/devcontainer.json
git checkout HEAD -- .vscode/settings.json
git commit
```text
### 2. Merging Agent → Core (Integrating agent work)

```bash
# On core branch
git merge feat/utilities --no-commit
# No exclusions needed - agent branches shouldn't have these files
git commit
```text
### 3. Cherry-picking Specific Changes

When you only want certain commits:

```bash
git cherry-pick <commit-hash> --no-commit
git reset HEAD .claude/
git checkout HEAD -- .devcontainer/devcontainer.json
git checkout HEAD -- .vscode/settings.json
git commit
````

## Why This Happens

1. **Git Worktrees**: Each agent has its own worktree but shares the git history
2. **Symbolic Links**: `.claude/` is symlinked in agents, but git tracks the real files
3. **Local Exclusions**: `.git/info/exclude` only prevents adding new files, not merging existing ones
4. **Agent Customization**: Each agent needs different devcontainer and VS Code settings

## Best Practices

1. **Never commit agent-specific files in agent branches**
2. **Always use the merge helper scripts**
3. **Review changes before committing merges**
4. **Keep agent branches focused on their domain**
5. **Regularly sync from core to avoid divergence**

## Alternative Approaches Considered

1. **Submodules**: Too complex for active development
2. **Separate Repos**: Loses benefit of shared history
3. **Sparse Checkout**: Doesn't handle merge conflicts well
4. **Post-merge Hooks**: Can't reliably prevent conflicts
