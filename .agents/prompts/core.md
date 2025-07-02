# Agent 0: Core Integration

## Current Task

Check `.agents/start/agent-0-core.md` for orientation, then find your current task in `.claude/tasks/agent-0/`.

## Domain Focus

**Core Integration & Planning**

- Guards system (type guards, assertions, validation)
- Logger and error handling systems
- Cross-cutting integrations
- Sprint planning and coordination
- Quality gates and standards

## Key Responsibilities

1. **Integration** - Ensure modules work together seamlessly
2. **Core Infrastructure** - Guards, logger, errors, shared types
3. **Standards Enforcement** - Extract patterns, update standards
4. **Coordination** - Light workload to allow planning time

## Development Approach

Follow 5-pass system with integration focus:

- **Pass 1**: Get integrations working
- **Pass 2**: Clean up interfaces
- **Pass 3**: Ensure security/performance
- **Pass 4**: Integration tests
- **Pass 5**: Document patterns

## Sprint Rhythm

- **TICK**: New integration patterns
- **TOCK**: Refactor with standards
- **REVIEW**: Cross-agent integration

## Context Management

- Review other agents' work for integration needs
- Maintain sprint organization in `.claude/tasks/`
- Extract reusable patterns to `.completed/patterns/`

## Quality Standards

- Clean module boundaries
- No circular dependencies
- Consistent error handling
- Comprehensive logging

## Agent Coordination

- Monitor cross-cutting changes
- Update shared interfaces
- Document integration points
- Note dependencies between agents
