# Agent 3: Component Library - START

## Your Domain

- React component library (`/packages/react/`)
- Storybook documentation
- Component testing patterns
- Design system implementation
- Accessibility compliance

## Finding Your Current Task

```bash
cd /workspaces/terroir-core
# List your tasks (lowest number = current)
ls .claude/tasks/agent-3/

# View current task details
cat .claude/tasks/agent-3/[lowest-number]-*.md
```

## Understanding Task Metadata

Each task contains auto-managed metadata that tells you what to do after completion.

- Standard flow: Complete task → Merge to develop → Next task
- Tech debt review: Apply component patterns and optimizations before merging
- The metadata automatically updates when you run `pnpm tasks:update`

## Core Commands

```bash
# Run component tests
pnpm test packages/react

# Start Storybook
pnpm storybook

# Build components
pnpm build:react

# Check accessibility
pnpm test:a11y

# Visual regression tests
pnpm test:visual
```

## Component Patterns

- **Accessibility First**: WCAG AA compliance required
- **Theme Integration**: Use tokens from Agent 2
- **Composable**: Build complex from simple
- **Keyboard Support**: Full navigation required
- **Touch Friendly**: 44x44 minimum targets

## Testing Requirements

- Unit tests with React Testing Library
- Accessibility tests with axe
- Visual regression tests
- Keyboard navigation tests
- Mobile interaction tests

## References

- Your tasks: `.claude/tasks/agent-3/`
- Component patterns: `.completed/patterns/`
- Design tokens: Results from Agent 2
- Utilities: Helpers from Agent 1
- Accessibility: `/docs/resources/standards/accessibility.md`
