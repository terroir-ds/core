# Changesets Setup Note

Changesets is configured and ready to use, but there's currently an issue with recognizing the root package `@terroir/core` as part of the workspace.

## Current Status

- ✅ Changesets CLI installed and configured
- ✅ GitHub Actions workflows created
- ✅ Documentation created
- ⚠️ Root package recognition issue

## Resolution Options

1. **Move core to packages/** (Recommended)
   - Create `/packages/core/` directory
   - Move core library code there
   - Keep root as workspace orchestrator only

2. **Adjust configuration**
   - May need to update changesets config
   - Or use a different versioning strategy for root

## Workaround

For now, you can still:

- Create changesets manually in `.changeset/` directory
- Use `pnpm changeset version` to version packages
- The CI/CD pipeline will work once packages are properly structured

This will be resolved when we restructure the packages for publishing.
