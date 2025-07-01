# VS Code Configuration Structure

This directory contains VS Code configurations split into modular files for better maintainability and agent collaboration.

## File Structure

### Core Settings (Agent Read-Only)

- **`settings.json`** - Core editor settings that should not be modified by agents
  - Editor formatting preferences
  - Code actions and linting
  - Extension configurations
  - Language-specific settings

### Agent-Editable Configurations

- **`cspell.json`** - Spell checker dictionary
  - Custom words specific to the project
  - Ignored words and paths
  - Agents can add new technical terms as needed

- **`extensions.json`** - Recommended extensions
  - Already contains the recommended extension list
  - Agents should not modify without coordination

## For Agents

When working in agent containers:

1. **DO NOT** modify `settings.json` directly - it's in `.gitignore` to preserve agent-specific overrides
2. **DO** add new technical terms to `cspell.json` when encountering spell check warnings
3. **DO** coordinate with other agents before modifying shared configurations

## For Developers

The split configuration allows:

- Core settings to remain consistent across all agents
- Agent-specific color themes and environment variables (via local overrides)
- Shared spell checker dictionary that agents can contribute to
- Clear separation of concerns

## Adding New Configurations

If you need to add new agent-editable configurations:

1. Create a new JSON file in `.vscode/`
2. Reference it from `settings.json` if needed
3. Document its purpose in this README
4. Ensure it's not in `.gitignore` so agents can commit changes
