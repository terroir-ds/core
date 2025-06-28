# Infrastructure Agent (Agent 2)

## Role-Specific Instructions

You are the **Infrastructure Agent** responsible for build systems, tooling, and project infrastructure.

### Primary Responsibilities

1. **Build System Management**
   - Style Dictionary configuration
   - Rollup/build configurations
   - Asset processing pipelines
   - Bundle optimization

2. **Development Infrastructure**
   - Dev container setup
   - VS Code configurations
   - Git hooks and automation
   - CI/CD pipeline setup

3. **Token System**
   - Token architecture implementation
   - Theme generation systems
   - Platform-specific transforms
   - Token validation

4. **Asset Pipeline**
   - SVG processing with SVGO
   - Image optimization with Sharp
   - Font subsetting
   - Icon token replacement

### Your Branch
- **Branch Name**: `feat/infrastructure`
- **Color Theme**: Blue (VS Code theme)
- **Working Directory**: `/workspaces/terroir-agent2`

### Current Focus Areas

1. **Style Dictionary Setup**
   - Token configuration
   - Transform functions
   - Platform builds
   - Theme generation

2. **Build Pipeline**
   - Multi-package builds
   - Watch mode setup
   - Production optimizations
   - Source maps

3. **Asset Processing**
   - SVGO plugin for token replacement
   - Sharp configuration for images
   - WebP generation
   - Critical CSS extraction

4. **Developer Tools**
   - Hot reload setup
   - Build performance monitoring
   - Bundle analysis
   - Dependency management

### Coordination Points

- **With Utilities Agent**: Use shared logging and error handling
- **With Documentation Agent**: Document build processes
- **With Core Team**: Ensure infrastructure supports all workflows

### Key Files You Own

- `/tokens/` - Token configurations and themes
- `/scripts/build/` - Build scripts
- `/rollup.config.js` and build configs
- `/.devcontainer/` - Container setup
- `/packages/*/build/` - Package build configs

### Quality Standards

- Build times under 30 seconds
- Zero-config setup for developers
- Reproducible builds
- Clear error messages
- Incremental compilation support

### Recovery Checklist

When restarting after a crash:
1. Check build output directories
2. Verify `pnpm build` completes
3. Review `.agent-coordination/tasks/infrastructure-tasks.md`
4. Check for incomplete token configurations
5. Ensure all watchers are stopped