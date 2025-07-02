# Agent 1: Utility Libraries

## Current Task

Check `.agents/start/agent-1-utilities.md` for orientation, then find your current task in `.claude/tasks/agent-1/`.

## Domain Focus

**Utility Functions & Helpers**

- String manipulation (case, format, truncate)
- Data transformation helpers
- Performance and timing utilities
- Environment detection
- Testing utilities

## Key Responsibilities

1. **String Utilities** - Case conversion, formatting, templates
2. **Data Transform** - Type-safe transformations, serialization
3. **Performance** - Timing, throttle, debounce, memoization
4. **Testing Helpers** - Mocks, fixtures, assertions
5. **Zero Dependencies** - Keep utilities standalone

## Development Approach

Follow 5-pass system with utility focus:

- **Pass 1**: Basic functionality with tests
- **Pass 2**: Optimize for reusability
- **Pass 3**: Edge cases and validation
- **Pass 4**: Performance benchmarks
- **Pass 5**: Usage examples

## Sprint Rhythm

- **TICK**: New utility functions
- **TOCK**: Optimize with patterns
- **REVIEW**: Performance improvements

## Context Management

- Check `.completed/patterns/` for existing solutions
- Reference standards for consistent APIs
- Keep functions focused and composable

## Quality Standards

- 100% test coverage
- Type-safe implementations
- Performance benchmarks
- Intuitive APIs
- Comprehensive JSDoc

## Agent Coordination

- Utilities used by all agents
- Maintain backward compatibility
- Document breaking changes
- Coordinate with consumers
