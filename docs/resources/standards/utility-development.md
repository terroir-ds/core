# Utility Development Standards

## Overview

This document establishes standards and best practices for developing utility modules within the Terroir Core Design System. These principles ensure consistency, performance, maintainability, and developer experience across all utility implementations.

## Core Architectural Principles

### 1. TypeScript-First Design

**Principle**: All utilities must be designed with TypeScript as the primary consideration, not an afterthought.

**Implementation**:

- Write utilities in TypeScript, not JavaScript with added types
- Leverage TypeScript's type system for compile-time safety
- Provide proper type narrowing in type guards and assertions
- Use generic types where appropriate for flexibility
- Ensure excellent IntelliSense and developer experience

**Example**:

```typescript
// ✅ Good: TypeScript-first design
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

// ❌ Bad: JavaScript with types bolted on
export function isArray(value: any): boolean {
  return Array.isArray(value);
}
```yaml
### 2. Dependency Evaluation Framework

**Principle**: Every potential dependency must be thoroughly researched and evaluated before implementation.

**Required Research Process**:

1. **Need Assessment**
   - Is this functionality core to our use case?
   - Can we implement it efficiently ourselves?
   - What's the maintenance burden vs. dependency risk?

2. **Market Research**
   - What are the leading solutions in 2024/2025?
   - What are the trade-offs between options?
   - Which libraries are gaining vs. losing traction?

3. **Technical Evaluation**
   - Bundle size impact
   - Performance benchmarks
   - TypeScript support quality
   - API design and developer experience
   - Maintenance status and community health

4. **Decision Matrix**
   - **No dependency**: Implement ourselves if lightweight and core functionality
   - **Micro-dependency**: Add if battle-tested, focused, and high-value
   - **Major dependency**: Only if significant functionality that would be error-prone to reimplement

**Documentation Requirement**: All dependency decisions must be documented with:
- Research findings
- Alternatives considered
- Decision rationale
- Performance/bundle size impact

### 3. Shared Utilities Architecture

**Principle**: Extract common patterns into shared utilities to reduce duplication and improve consistency.

**Implementation Standards**:

#### Shared Module Structure
```text
utils/
├── shared/           # Common utilities used across modules
│   ├── index.ts     # Performance helpers, type patterns
│   └── README.md    # Usage guidelines
├── [module]/        # Specific utility modules
│   ├── index.ts     # Main exports
│   ├── [feature].ts # Feature implementations
│   └── __tests__/   # Tests
└── index.ts         # Convenience re-exports
```yaml
#### Required Shared Utilities
- **Performance optimizations**: Cached prototype methods, object pooling
- **Common type patterns**: `isObjectLike`, `getObjectType`, `hasOwnProp`
- **Development helpers**: `devWarn`, `isDevelopment`
- **Error utilities**: `createErrorMessage`, `toError`

#### Usage Guidelines
```typescript
// ✅ Good: Use shared utilities
import { isObjectLike, getObjectType } from '@utils/shared';

export function isDate(value: unknown): value is Date {
  return isObjectLike(value) && getObjectType(value) === '[object Date]';
}

// ❌ Bad: Duplicate implementation
export function isDate(value: unknown): value is Date {
  return typeof value === 'object' && value !== null && 
         Object.prototype.toString.call(value) === '[object Date]';
}
```yaml
### 4. Performance-First Implementation

**Principle**: Utilities must be optimized for performance, especially in hot paths.

**Performance Standards**:

#### Hot Path Optimization
- Use cached prototype methods
- Minimize object allocation
- Prefer native methods where available
- Use efficient algorithms (O(1) vs O(n) operations)

#### Benchmarking Requirements
- Performance tests for critical utilities
- Comparison with popular alternatives
- Bundle size impact measurement
- Memory usage analysis

#### Example Optimizations
```typescript
// Cached for performance
const { toString: objectToString, hasOwnProperty } = Object.prototype;

// ✅ Good: Optimized type checking
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ✅ Good: Cached method usage
export function hasOwnProp(obj: unknown, key: string): boolean {
  return isObjectLike(obj) && hasOwnProperty.call(obj, key);
}
```yaml
### 5. Battle-Tested Pattern Integration

**Principle**: Leverage proven implementations from established libraries while maintaining our architectural goals.

**Pattern Sources**:
- **Lodash**: Object type checking, utility patterns
- **Remeda**: TypeScript-first functional utilities
- **Zod**: Validation patterns and error handling
- **Industry standards**: RFC specifications, WHATWG standards

**Integration Standards**:
```typescript
// ✅ Good: Adapt proven patterns to our architecture
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  // Based on Lodash's isPlainObject implementation
  if (!isObjectLike(value) || getObjectType(value) !== '[object Object]') {
    return false;
  }
  // ... rest of proven logic
}
```yaml
#### Documentation Requirements
- Credit original source/inspiration
- Document any modifications made
- Explain why the pattern was chosen

### 6. Consistent API Design

**Principle**: All utilities must follow consistent naming, parameter order, and return patterns.

**API Standards**:

#### Naming Conventions
- Type guards: `is*` (e.g., `isString`, `isValidEmail`)
- Assertions: `assert*` (e.g., `assertDefined`, `assertType`)
- Validation: `validate*` (e.g., `validateEmail`, `validateUrl`)
- Predicates: Descriptive names (e.g., `isPositive`, `hasMinLength`)

#### Parameter Patterns
```typescript
// ✅ Consistent: value first, options second
export function validateEmail(email: string, options?: EmailOptions): ValidationResult;
export function isInRange(value: number, min: number, max: number): boolean;
```text
#### Return Type Consistency
```typescript
// Type guards: boolean with type predicate
export function isString(value: unknown): value is string;

// Validation: Result object pattern
export interface ValidationResult<T = unknown> {
  valid: boolean;
  value?: T;
  errors?: ValidationError[];
}

// Assertions: void (throws on failure)
export function assertDefined<T>(value: T | undefined): asserts value is T;
```

## Implementation Workflow

### 1. Planning Phase

1. **Research existing solutions**
   - Document current industry standards
   - Evaluate 3-5 top alternatives
   - Analyze performance and bundle size

2. **Architecture design**
   - Identify shared patterns
   - Plan module structure
   - Define API surface

3. **Create documentation**
   - Document decision rationale
   - Plan implementation phases
   - Define success criteria

### 2. Implementation Phase

1. **Create shared utilities first**
   - Implement common patterns
   - Add performance optimizations
   - Write comprehensive tests

2. **Implement core functionality**
   - Use shared utilities
   - Follow consistent patterns
   - Include extensive documentation

3. **Add comprehensive testing**
   - Unit tests (>95% coverage)
   - TypeScript type tests
   - Performance benchmarks
   - Integration tests

### 3. Integration Phase

1. **Update existing code**
   - Replace duplicate implementations
   - Use new utilities where appropriate
   - Maintain backward compatibility

2. **Documentation updates**
   - Update main utility exports
   - Add usage examples
   - Update migration guides

3. **Performance validation**
   - Run benchmarks
   - Verify bundle size impact
   - Test in realistic scenarios

## Quality Gates

### Required Before Merge

- [ ] All dependencies evaluated and documented
- [ ] Shared utilities extracted and tested
- [ ] Performance benchmarks completed
- [ ] TypeScript type tests passing
- [ ] Unit test coverage >95%
- [ ] Integration tests passing
- [ ] Documentation complete with examples
- [ ] No duplication of existing functionality
- [ ] Consistent API design
- [ ] Bundle size impact acceptable

### Performance Requirements

- Type guards: <1ms for 1000 operations
- Validation: <10ms for complex schema
- Bundle size: <5KB gzipped per major utility
- Memory: No memory leaks in long-running tests

## Example: Decision Documentation

### Email Validation Implementation Decision

### Research Summary (2025-01-xx)

- **Validator.js**: 13.15.15, 7k+ dependents, mature but not TypeScript-first
- **Zod**: Already in project, excellent for schema validation
- **Custom regex**: Battle-tested patterns, zero dependencies

### Benchmarks

- Custom regex: 0.05ms per validation
- Validator.js: 0.12ms per validation  
- Zod: 0.8ms per validation

### Decision: Custom Implementation

- Use battle-tested RFC 5322 regex pattern
- Leverage shared utilities for consistency
- Provide Zod-compatible result format
- Zero additional dependencies

## Maintenance Standards

### Regular Reviews

- **Monthly**: Review new dependencies in ecosystem
- **Quarterly**: Performance benchmarks and bundle analysis
- **Annually**: Major architecture review and updates

### Success Metrics

- Consistent API across all utilities
- Excellent TypeScript support and IntelliSense
- Utilities perform better than or equal to alternatives
- Bundle size remains minimal
- Shared utilities reduce code duplication

---

**Last Updated**: 2025-01-xx  
**Next Review**: Quarterly  
**Owner**: Core Development Team
