# Refactoring Opportunities

This document tracks identified opportunities for code improvement and refactoring across the Terroir Core Design System. These are patterns or code segments that could be extracted, generalized, or improved when the time is right.

## Tracking Guidelines

- Document opportunities as they're discovered during development
- Wait for 2-3 concrete use cases before extracting (Rule of Three)
- Include context about where the pattern appears
- Note any performance or maintainability benefits
- Update when refactorings are completed

---

## Current Opportunities

### 1. Async Helpers with Broader Utility

**Status:** 🟡 Monitoring  
**Identified:** 2024-01-27  
**Modules:** `@utils/async/helpers/*`

Several helpers in the async utilities have potential utility beyond asynchronous contexts:

#### Message Formatting (`async/helpers/messages.ts`)
- **Pattern:** Error message templates and formatting
- **Current Use:** Async error messages
- **Potential:** Could be used for all error formatting across utils
- **Extraction Target:** `@utils/shared/formatting/messages.ts`

#### Progress Display (`async/helpers/progress.ts`)
- **Pattern:** `createProgressBar()` - pure formatting function
- **Current Use:** Displaying async operation progress
- **Potential:** Any progress display (builds, tests, etc.)
- **Extraction Target:** `@utils/shared/formatting/progress.ts`

#### Cleanup Management (`async/helpers/cleanup.ts`)
- **Pattern:** Resource cleanup composition
- **Current Use:** Async resource cleanup
- **Potential:** Any cleanup scenario (file handles, connections, etc.)
- **Extraction Target:** `@utils/shared/cleanup.ts`

**Decision:** Keep in async module until we have 2-3 concrete external use cases.

### 2. Guards Module Duplication

**Status:** 🔴 Ready for Refactoring  
**Identified:** 2024-01-27  
**Modules:** `@utils/guards/*`

Significant duplication identified across guard utilities:

#### Pattern Validation
- **Duplication:** Email, URL, phone validation follow identical patterns
- **Files:** `validation.ts` (lines 313-582)
- **Solution:** Create pattern validation factory
- **Benefits:** 60% code reduction, consistent error messages

#### Length/Range Validation
- **Duplication:** Similar patterns in assertions, validation, and predicates
- **Files:** `assertions.ts`, `validation.ts`, `predicates.ts`
- **Solution:** Shared length/range validators
- **Benefits:** Consistent behavior, single source of truth

#### Empty Checks
- **Duplication:** Multiple implementations of emptiness checking
- **Files:** `type-guards.ts`, `predicates.ts`
- **Solution:** Generic `isEmpty` helper with type-specific logic
- **Benefits:** Consistent empty definitions

#### Deep Equality
- **Location:** `predicates.ts` (lines 899-922)
- **Issue:** Complex algorithm that should be shared
- **Solution:** Move to `@utils/shared/comparison.ts`
- **Benefits:** Reusable across entire codebase

#### Error Creation
- **Pattern:** Similar error context creation across all modules
- **Solution:** Standardized error factory
- **Benefits:** Consistent error shapes, easier debugging

**Decision:** Ready to refactor - clear duplication with immediate benefits.

### 3. Complex Algorithms in Domain Modules

**Status:** 🟡 Monitoring  
**Identified:** 2024-01-27  

#### Luhn Algorithm (`validation.ts`)
- **Location:** Lines 882-902
- **Use:** Credit card validation
- **Potential:** Could be used for other checksum validations
- **Extraction Target:** `@utils/shared/algorithms/luhn.ts`

**Decision:** Wait for second use case before extracting.

---

## Completed Refactorings

_None yet - this is a new tracking document_

---

## Anti-Patterns to Avoid

1. **Premature Extraction:** Don't extract until you have 2-3 real use cases
2. **Over-Generalization:** Keep abstractions focused on actual needs
3. **Breaking Module Boundaries:** Maintain clear separation of concerns
4. **Performance Degradation:** Measure impact of abstractions

---

## Review Schedule

- Review quarterly or when starting new major features
- Update status as patterns emerge or are addressed
- Archive completed items after 6 months