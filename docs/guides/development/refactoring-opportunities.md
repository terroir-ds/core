# Refactoring Opportunities

This document tracks potential refactoring opportunities discovered during development. These are not immediate needs but rather improvements that could be made if/when the code is needed in other contexts.

## Format

Each entry includes:

- **Component**: What could be refactored
- **Current Location**: Where it currently lives
- **Proposed Location**: Where it could move to
- **Rationale**: Why this refactoring would be beneficial
- **Trigger**: When to consider this refactoring
- **Date Added**: When this was identified

---

## Async Module Extractions

### 1. Abort Signal/Controller Factories

**Component**: Signal and controller creation utilities

- `manualSignal()` - Creates manually controllable abort signal
- `createTimeoutAbortController()` - Creates auto-aborting controller
- `createAbortError()` - Standardized abort error creation

**Current Location**:

- `/lib/utils/async/signals.ts`
- `/lib/utils/async/helpers/abort.ts`

**Proposed Location**: `@utils/factories/abort.ts`

**Rationale**: Abort handling is common across many contexts beyond async operations (API calls, UI interactions, etc.)

**Trigger**: When abort handling is needed outside async contexts

**Date Added**: 2024-06-26

### 2. Deferred Promise Factory

**Component**: `defer<T>()` function - Creates externally controllable promises

**Current Location**: `/lib/utils/async/promise.ts`

**Proposed Location**: `@utils/factories/promise.ts`

**Rationale**: The deferred pattern is useful for bridging callback-based APIs to promises in many contexts

**Trigger**: When deferred promises are needed outside async module

**Date Added**: 2024-06-26

### 3. Async Error Messages Consolidation

**Component**: Async-specific error messages and utilities

**Current Location**: `/lib/utils/async/helpers/messages.ts`

**Proposed Location**: Merge into `@utils/errors/messages.ts`

**Rationale**:

- Reduce duplication
- Centralize all error messages
- Easier i18n management

**Trigger**: When implementing i18n or when error message management becomes complex

**Date Added**: 2024-06-26

---

## Testing Utilities

### 1. Promise State Tracking Pattern

**Component**: Pattern for tracking promise resolution state (from async tests)

**Current Location**: Implemented inline in various test files

**Proposed Location**: Could be added to `@test/helpers/async-test-utils.ts`

**Rationale**: Common pattern that could be standardized

**Trigger**: If the pattern is used in 3+ test files

**Date Added**: 2024-06-26

---

## Type Definitions

### 1. Generic Factory Types

**Component**: Factory function type patterns

- `AsyncFactory<T>`
- Similar factory patterns

**Current Location**: `/lib/utils/types/async.types.ts`

**Proposed Location**: `@utils/types/factory.types.ts`

**Rationale**: Factory patterns are common across the codebase, not just async

**Trigger**: When non-async factories need similar type definitions

**Date Added**: 2024-06-26

---

## How to Use This Document

1. **During Development**: When you notice code that could be reused elsewhere, add it here
2. **Before Creating Similar Code**: Check here first to see if something similar already exists
3. **During Refactoring Sprints**: Use this as a backlog of improvements
4. **When Triggered**: If a trigger condition is met, consider the refactoring

## Guidelines for Adding Entries

1. Be specific about what code would move
2. Explain the benefit clearly
3. Define a clear trigger condition
4. Keep entries actionable
5. Remove entries after refactoring is complete

## Refactoring Principles

1. **Don't refactor prematurely** - Wait for actual need
2. **Consider the trade-off** - Extraction adds complexity
3. **Keep cohesion** - Related code should stay together
4. **Document the change** - Update imports and references
5. **Test thoroughly** - Ensure nothing breaks

---

Last reviewed: 2024-06-26
