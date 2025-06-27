# JSDoc Standards

## Overview

Comprehensive JSDoc standards for the Terroir Core Design System. All public APIs must be documented following these guidelines.

## General Principles

1. **Document the "why", not just the "what"**
2. **Include real-world examples**
3. **Link related functionality**
4. **Specify edge cases and errors**
5. **Keep docs synchronized with code**

## Required Documentation

### File Headers

Every TypeScript/JavaScript file should start with a file header:

````typescript
/**
 * @fileoverview Brief description of the file's purpose
 * @module @terroir/core/path/to/module
 * @category Category Name
 */
```text
### Functions

All exported functions must be documented:

```typescript
/**
 * Brief description of what the function does (one line)
 *
 * Detailed description explaining:
 * - Purpose and use cases
 * - Important behavior details
 * - Performance considerations
 * - Side effects (if any)
 *
 * @category Utils
 * @param {string} input - Parameter description with constraints
 * @param {Options} [options] - Optional parameters (note the brackets)
 * @param {number} [options.timeout=5000] - Nested options with defaults
 * @returns {Promise<Result>} What the function returns and when
 * @throws {ValidationError} When validation fails - include specific conditions
 * @throws {TimeoutError} When operation times out after options.timeout ms
 *
 * @example <caption>Basic usage</caption>
 * ```typescript
 * import { functionName } from '@terroir/core';
 *
 * const result = await functionName('input', {
 *   timeout: 3000
 * });
 * console.log(result); // Expected output
 * ```
 *
 * @example <caption>Error handling</caption>
 * ```typescript
 * try {
 *   await functionName('invalid');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     // Handle validation error
 *   }
 * }
 * ```
 *
 * @see {@link relatedFunction} - For similar functionality
 * @see {@link https://example.com/docs} - External documentation
 *
 * @since 1.0.0
 */
export async function functionName(
  input: string,
  options?: Options
): Promise<Result> {
  // Implementation
}
```text
### Classes

Document classes and their methods:

```typescript
/**
 * Brief description of the class purpose
 *
 * Detailed description including:
 * - When to use this class
 * - Key features and benefits
 * - Important implementation notes
 *
 * @category Core
 * @example
 * ```typescript
 * const instance = new ClassName({
 *   option1: 'value',
 *   option2: 42
 * });
 *
 * await instance.doSomething();
 * ```
 *
 * @since 1.0.0
 */
export class ClassName {
  /**
   * Creates a new instance
   *
   * @param {Config} config - Configuration options
   * @param {string} config.option1 - Description of option1
   * @param {number} [config.option2=0] - Optional with default
   * @throws {ConfigError} When configuration is invalid
   */
  constructor(config: Config) {
    // Implementation
  }

  /**
   * Method description
   *
   * @param {string} param - Parameter description
   * @returns {Promise<void>} Return description
   * @throws {OperationError} When operation fails
   *
   * @example
   * ```typescript
   * await instance.doSomething('value');
   * ```
   */
  async doSomething(param: string): Promise<void> {
    // Implementation
  }
}
```text
### Interfaces and Types

Document all exported types:

```typescript
/**
 * Configuration options for the feature
 *
 * @category Types
 * @example
 * ```typescript
 * const config: FeatureConfig = {
 *   enabled: true,
 *   timeout: 5000,
 *   retries: 3
 * };
 * ```
 */
export interface FeatureConfig {
  /**
   * Whether the feature is enabled
   * @defaultValue true
   */
  enabled?: boolean;

  /**
   * Operation timeout in milliseconds
   * @defaultValue 5000
   * @minimum 0
   * @maximum 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts
   * @defaultValue 3
   * @minimum 0
   */
  retries?: number;
}

/**
 * Possible states for the component
 *
 * @category Types
 */
export type ComponentState =
  /** Component is idle and ready */
  | 'idle'
  /** Component is processing */
  | 'loading'
  /** Component encountered an error */
  | 'error'
  /** Component completed successfully */
  | 'success';
```text
### Enums

Document enums and their members:

```typescript
/**
 * Log levels for the logging system
 *
 * @category Logging
 * @example
 * ```typescript
 * logger.setLevel(LogLevel.DEBUG);
 * ```
 */
export enum LogLevel {
  /** Detailed debug information */
  DEBUG = 0,
  /** General informational messages */
  INFO = 1,
  /** Warning messages */
  WARN = 2,
  /** Error messages */
  ERROR = 3,
  /** Critical errors that require immediate attention */
  FATAL = 4
}
```text
### React Components

Use specialized tags for components:

```typescript
/**
 * Button component with multiple variants and states
 *
 * @component
 * @category Components
 *
 * @example <caption>Basic button</caption>
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 *
 * @example <caption>Loading state</caption>
 * ```tsx
 * <Button loading loadingText="Processing...">
 *   Submit
 * </Button>
 * ```
 *
 * @prop {ButtonVariant} variant - Visual style variant
 * @prop {ButtonSize} [size='medium'] - Size variant
 * @prop {boolean} [loading=false] - Shows loading state
 * @prop {string} [loadingText='Loading...'] - Text during loading
 * @prop {() => void} onClick - Click handler
 *
 * @slot default - Button content
 * @slot icon - Optional icon slot
 *
 * @cssProperties
 * `--button-padding` - Internal padding (default: var(--spacing-3))
 * `--button-radius` - Border radius (default: var(--radius-md))
 * `--button-font-size` - Font size (default: var(--font-size-base))
 *
 * @accessibility
 * - Keyboard: Space/Enter to activate
 * - Screen reader: Announces state changes
 * - Focus: Visible focus indicator (4px ring)
 * - ARIA: Uses button role with proper states
 *
 * @since 1.0.0
 */
export const Button: React.FC<ButtonProps> = (props) => {
  // Implementation
};
```text
## Categories

Use consistent categories for organization:

- **Core** - Core functionality and utilities
- **Components** - UI components
- **Colors** - Color system utilities
- **Typography** - Typography utilities
- **Spacing** - Spacing system
- **Utils** - General utilities
- **Types** - Type definitions
- **Errors** - Error classes
- **Hooks** - React hooks
- **Theming** - Theme utilities
- **Animation** - Animation utilities

## Tags Reference

### Visibility Tags

- `@public` - Explicitly public API (default for exports)
- `@internal` - Internal use only, hidden from public docs
- `@private` - Private member
- `@protected` - Protected member
- `@alpha` - Experimental API, may change
- `@beta` - Beta API, stabilizing
- `@deprecated` - Deprecated API with migration path

### Documentation Tags

- `@category` - Categorize for navigation
- `@group` - Group related items
- `@module` - Module declaration
- `@namespace` - Namespace documentation
- `@example` - Code examples (can have multiple)
- `@see` - Cross-references
- `@since` - Version introduced
- `@todo` - Future improvements

### Parameter Tags

- `@param` - Function parameters
- `@returns` - Return value
- `@throws` - Exceptions thrown
- `@typeParam` - Generic type parameters
- `@defaultValue` - Default values
- `@override` - Overridden method

### Component Tags

- `@component` - React/Vue component
- `@prop` - Component properties
- `@slot` - Component slots
- `@cssProperties` - CSS custom properties
- `@accessibility` - Accessibility notes

## Examples Standards

### Example Requirements

1. **Complete and runnable** - Include all imports
2. **Show expected output** - Use comments
3. **Cover common use cases** - Basic and advanced
4. **Demonstrate error handling** - When applicable
5. **Use realistic scenarios** - Not just "foo/bar"

### Example Template

```typescript
/**
 * @example <caption>Descriptive caption</caption>
 * ```typescript
 * // Import statement
 * import { feature } from '@terroir/core';
 *
 * // Setup (if needed)
 * const config = { option: 'value' };
 *
 * // Usage
 * const result = await feature(input, config);
 *
 * // Expected output
 * console.log(result); // { success: true, data: {...} }
 * ```
 */
```text
## Best Practices

### Do's

1. **Write for your audience** - Assume TypeScript knowledge, not domain expertise
2. **Be specific** - "Validates email format per RFC 5321" not "Validates email"
3. **Document edge cases** - Null, undefined, empty arrays, etc.
4. **Include performance notes** - O(n) complexity, memory usage
5. **Link dependencies** - Reference related functions, types, guides
6. **Use proper grammar** - Complete sentences, proper punctuation

### Don'ts

1. **Don't state the obvious** - Avoid "Gets the user ID" for `getUserId()`
2. **Don't use ambiguous terms** - "Process" without explaining what processing
3. **Don't skip error documentation** - Always document thrown errors
4. **Don't use outdated examples** - Keep synchronized with API changes
5. **Don't mix concerns** - Keep implementation details out of public docs

## Validation

Use TypeDoc validation to ensure quality:

```json
{
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": false
  }
}
```text
## Template Files

### Function Template

```typescript
/**
 * [Brief description]
 *
 * [Detailed description]
 *
 * @category [Category]
 * @param {Type} name - [Description]
 * @returns {Type} [Description]
 * @throws {ErrorType} [When/why]
 *
 * @example
 * ```typescript
 * [Example code]
 * ```
 *
 * @see {@link relatedItem}
 * @since 1.0.0
 */
```text
### Class Template

```typescript
/**
 * [Brief description]
 *
 * [Detailed description]
 *
 * @category [Category]
 * @example
 * ```typescript
 * [Example code]
 * ```
 *
 * @since 1.0.0
 */
```text
### Component Template

```typescript
/**
 * [Brief description]
 *
 * @component
 * @category Components
 *
 * @example
 * ```tsx
 * [Example code]
 * ```
 *
 * @prop {Type} name - [Description]
 *
 * @cssProperties
 * [CSS custom properties]
 *
 * @accessibility
 * [Accessibility notes]
 *
 * @since 1.0.0
 */
````

## Review Checklist

Before merging, ensure:

- [ ] All exports have JSDoc comments
- [ ] Examples are complete and tested
- [ ] Categories are assigned
- [ ] Links are valid
- [ ] Error conditions documented
- [ ] Since tags for new APIs
- [ ] Deprecation notices with migration paths
- [ ] No grammar or spelling errors
