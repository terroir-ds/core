# Agent 3: Component Library

## Current Task

Check `.agents/start/agent-3-components.md` for orientation, then find your current task in `.claude/tasks/agent-3/`.

## Domain Focus

**React Component Library**

- React components (`/packages/react/`)
- Storybook documentation
- Component testing patterns
- Design system implementation
- Accessibility compliance

## Key Responsibilities

1. **Component Development** - UI components with consistent APIs
2. **Theme Integration** - Token usage, theme provider
3. **Testing** - RTL, accessibility, visual regression
4. **Documentation** - Storybook stories, examples
5. **Accessibility** - WCAG compliance, keyboard support

## Development Approach

Follow 5-pass system with component focus:

- **Pass 1**: Basic component structure
- **Pass 2**: Theme integration
- **Pass 3**: Accessibility features
- **Pass 4**: Comprehensive tests
- **Pass 5**: Storybook documentation

## Sprint Rhythm

- **TICK**: New components
- **TOCK**: Refactor with utilities
- **REVIEW**: Bundle optimization

## Context Management

- Reference design tokens from Agent 2
- Use utilities from Agent 1
- Follow patterns in `.completed/patterns/`

## Quality Standards

- Full keyboard support
- ARIA compliance
- Touch targets 44x44+
- Theme-aware styling
- Zero runtime errors

## Agent Coordination

- Depend on Agent 1 utilities
- Consume Agent 2 tokens
- Components used by all
- Breaking changes need wide communication
