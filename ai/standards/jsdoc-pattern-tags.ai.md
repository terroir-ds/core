# JSDoc Pattern & Standard Tags

## Quick Context

Use JSDoc tags to mark where patterns and standards are implemented in code, enabling automated reference tracking and compliance checking.

## Tag Definitions

### @implements-pattern

Marks where a pattern is implemented in code.

```typescript
/**
 * Process color tokens through validation pipeline
 * @implements-pattern async-pipeline-pattern
 */
export async function processColorTokens(tokens: Token[]): Promise<ProcessedTokens> {
  // implementation
}
```

### @implements-standard

Marks where a standard is followed.

```typescript
/**
 * @implements-standard structured-logging
 * @implements-standard error-handling
 */
export function validateInput(data: unknown): ValidationResult {
  logger.info({ data }, 'Validating input'); // structured-logging
  
  try {
    // validation logic
  } catch (error) {
    throw new ValidationError('Invalid input', { // error-handling
      code: 'INVALID_INPUT',
      context: { data }
    });
  }
}
```

### @pattern-instance

Marks a specific instance of a pattern with quality score.

```typescript
/**
 * @pattern-instance error-handling-pattern
 * @pattern-score 5
 * @pattern-notes Comprehensive error context with recovery
 */
class RobustProcessor {
  // exemplary implementation
}
```

### @standard-compliance

Marks standard compliance with score.

```typescript
/**
 * @standard-compliance structured-logging
 * @compliance-score 4
 * @compliance-notes Good implementation, missing performance metrics
 */
function processRequest(req: Request): Response {
  // implementation
}
```

## Tag Placement Rules

### Function/Method Level

Place tags on the function that implements the pattern/standard:

```typescript
/**
 * Fetches user data with proper error handling
 * @implements-pattern retry-pattern
 * @implements-standard error-handling
 */
async function fetchUser(id: string): Promise<User> {
  // implementation
}
```

### Class Level

Place tags on the class when the entire class follows a pattern:

```typescript
/**
 * Repository implementing unit of work pattern
 * @implements-pattern unit-of-work-pattern
 * @implements-standard data-access
 */
export class UserRepository {
  // class implementation
}
```

### Inline Comments

For specific lines implementing a standard:

```typescript
function processData(input: string): Result {
  // @implements-standard input-validation
  if (!isValid(input)) {
    throw new ValidationError('Invalid input');
  }
  
  // @implements-pattern transformation-pipeline
  return input
    .trim()
    .toLowerCase()
    .split(',')
    .map(transform);
}
```

## Automation Integration

### Reference Scanner

The reference scanner will:

1. Parse all TypeScript/JavaScript files
2. Extract JSDoc tags and inline comments
3. Update .ref.md files automatically
4. Track line numbers and git commits

### Example Scanner Output

```javascript
// scripts/scan-references.js
{
  "patterns": {
    "async-pipeline-pattern": [
      {
        "file": "lib/colors/processor.ts",
        "line": 45,
        "function": "processColorTokens",
        "score": 5,
        "commit": "a3f2c1d"
      }
    ]
  },
  "standards": {
    "structured-logging": [
      {
        "file": "lib/utils/validator.ts",
        "line": 23,
        "function": "validateInput",
        "score": 4,
        "commit": "b4e5f2a"
      }
    ]
  }
}
```

## Best Practices

### 1. Tag at the Right Level

- Function level for specific implementations
- Class level for architectural patterns
- Inline for specific lines

### 2. Include Scores When Known

- Add scores during phase transitions
- Update scores when code changes
- Document why score changed

### 3. Use Consistent Naming

- Pattern tags: kebab-case ending in `-pattern`
- Standard tags: kebab-case descriptive names
- Match exact names in `/ai/patterns/` and `/ai/standards/`

### 4. Avoid Over-Tagging

- Tag significant implementations only
- Don't tag trivial uses
- Focus on examples worth learning from

## Examples

### Complete Function Documentation

```typescript
/**
 * Processes design tokens with validation and transformation
 * 
 * @param tokens - Raw design tokens
 * @returns Processed and validated tokens
 * 
 * @implements-pattern async-pipeline-pattern
 * @pattern-score 5
 * @pattern-notes Clean separation of stages with error recovery
 * 
 * @implements-standard structured-logging
 * @implements-standard error-handling
 * @standard-compliance structured-logging
 * @compliance-score 5
 * 
 * @example
 * const processed = await processTokens(rawTokens);
 * 
 * @throws {ValidationError} When tokens are invalid
 * @throws {ProcessingError} When transformation fails
 */
export async function processTokens(tokens: RawToken[]): Promise<ProcessedToken[]> {
  logger.info({ count: tokens.length }, 'Processing tokens');
  
  try {
    const validated = await validate(tokens);
    const transformed = await transform(validated);
    const optimized = await optimize(transformed);
    
    logger.info({ count: optimized.length }, 'Tokens processed successfully');
    return optimized;
  } catch (error) {
    logger.error({ error, tokens }, 'Token processing failed');
    throw new ProcessingError('Failed to process tokens', {
      code: 'PROCESSING_FAILED',
      context: { tokenCount: tokens.length },
      cause: error
    });
  }
}
```

### Class with Multiple Patterns

```typescript
/**
 * Service implementing multiple architectural patterns
 * 
 * @implements-pattern repository-pattern
 * @implements-pattern unit-of-work-pattern
 * @implements-standard dependency-injection
 * @pattern-score 4
 * @pattern-notes Good implementation, could use better caching
 */
@injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly uow: UnitOfWork,
    private readonly logger: Logger
  ) {}
  
  /**
   * @implements-standard structured-logging
   * @implements-pattern retry-pattern
   */
  async createUser(data: CreateUserDto): Promise<User> {
    // implementation
  }
}
```

## Migration from Existing Code

### Step 1: Identify Patterns/Standards

```bash
# Find error handling patterns
grep -r "try.*catch" --include="*.ts" | grep -E "(logger|throw)"

# Find logging statements
grep -r "logger\." --include="*.ts"
```

### Step 2: Add Tags

During code review or phase transitions, add appropriate tags.

### Step 3: Run Scanner

```bash
pnpm scan-references
```

### Step 4: Verify Updates

Check that .ref.md files are updated correctly.

## Future Enhancements

1. **IDE Integration**: Autocomplete for pattern/standard names
2. **Linting Rules**: Ensure tags reference valid patterns/standards
3. **Score Validation**: Ensure scores are 1-5
4. **Coverage Reports**: Show which patterns lack examples
5. **Automatic Scoring**: AI-assisted score suggestions

## Related Standards

- [JSDoc Standards](./jsdoc-standards.ai.md)
- [Documentation Standards](./documentation.ai.md)
- [Code Quality Standards](./code-quality.ai.md)
