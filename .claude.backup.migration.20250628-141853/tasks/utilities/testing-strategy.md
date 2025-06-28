# Utility Testing Strategy

## Overview

This document defines the testing approach for all utilities in the Terroir Core Design System. Each utility type has specific testing requirements to ensure reliability, performance, and correctness.

## General Testing Principles

1. **Test in Isolation**: Each utility should be tested independently
2. **Edge Cases First**: Focus on boundary conditions and error cases
3. **Performance Matters**: Include benchmarks for performance-critical utilities
4. **Type Safety**: Verify TypeScript types are correctly narrowed/inferred
5. **Real-World Scenarios**: Include tests that mirror actual usage patterns

## Test Requirements by Utility Type

### Type Guards

**Focus**: Type narrowing and runtime safety

```typescript
// Example test structure
describe('isNonNullable', () => {
  it('should narrow type correctly', () => {
    const values: (string | null | undefined)[] = ['a', null, 'b', undefined];
    const filtered = values.filter(isNonNullable);
    // TypeScript should know filtered is string[]
    expectTypeOf(filtered).toEqualTypeOf<string[]>();
  });

  it('should handle edge cases', () => {
    expect(isNonNullable(0)).toBe(true);
    expect(isNonNullable('')).toBe(true);
    expect(isNonNullable(false)).toBe(true);
    expect(isNonNullable(null)).toBe(false);
    expect(isNonNullable(undefined)).toBe(false);
  });
});
```

**Required Tests**:
- ✅ Type narrowing verification
- ✅ Falsy value handling
- ✅ Object and array inputs
- ✅ Custom type compatibility
- ✅ Performance with large datasets

### Async Utilities

**Focus**: Cleanup, cancellation, and timing

```typescript
describe('withTimeout', () => {
  it('should cleanup on success', async () => {
    const cleanup = vi.fn();
    const promise = withTimeout(
      Promise.resolve('value'),
      1000,
      { cleanup }
    );
    
    await expect(promise).resolves.toBe('value');
    expect(cleanup).toHaveBeenCalled();
  });

  it('should handle cancellation', async () => {
    const controller = new AbortController();
    const promise = withTimeout(
      delay(1000),
      2000,
      { signal: controller.signal }
    );
    
    controller.abort();
    await expect(promise).rejects.toThrow('AbortError');
  });
});
```

**Required Tests**:
- ✅ Success path with cleanup
- ✅ Timeout behavior
- ✅ Cancellation via AbortSignal
- ✅ Error propagation
- ✅ Memory leak prevention
- ✅ Race condition handling

### Security Utilities

**Focus**: Data protection and pattern validation

```typescript
describe('redact', () => {
  it('should redact sensitive patterns', () => {
    const input = {
      password: 'secret123',
      apiKey: 'sk_live_abc123',
      email: 'user@example.com',
      safe: 'public-info'
    };
    
    const redacted = redact(input);
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.email).toMatch(/u\*\*\*@example.com/);
    expect(redacted.safe).toBe('public-info');
  });

  it('should handle circular references', () => {
    const obj: any = { a: 1 };
    obj.circular = obj;
    
    expect(() => redact(obj)).not.toThrow();
  });
});
```

**Required Tests**:
- ✅ Pattern matching accuracy
- ✅ Deep object traversal
- ✅ Circular reference handling
- ✅ Performance with large objects
- ✅ Custom redaction rules
- ✅ Binary data handling

### String Utilities

**Focus**: Unicode handling and edge cases

```typescript
describe('truncate', () => {
  it('should handle unicode correctly', () => {
    const emoji = '👨‍👩‍👧‍👦🏳️‍🌈';
    expect(truncate(emoji, 5)).toBe('👨‍👩‍👧‍👦...');
    expect(truncate(emoji, 5).length).toBeLessThanOrEqual(8); // 5 + '...'
  });

  it('should not break surrogate pairs', () => {
    const text = '𝐇𝐞𝐥𝐥𝐨'; // Mathematical bold text
    const truncated = truncate(text, 3);
    expect(() => Buffer.from(truncated)).not.toThrow();
  });
});
```

**Required Tests**:
- ✅ ASCII text handling
- ✅ Unicode and emoji support
- ✅ Surrogate pair preservation
- ✅ Multi-byte character handling
- ✅ RTL text support
- ✅ Word boundary detection

### Performance Utilities

**Focus**: Accuracy and overhead

```typescript
describe('measureTime', () => {
  it('should measure accurately', async () => {
    const duration = await measureTime(async () => {
      await delay(100);
    });
    
    expect(duration).toBeGreaterThan(90);
    expect(duration).toBeLessThan(110);
  });

  it('should have minimal overhead', async () => {
    const measurements = await Promise.all(
      Array(1000).fill(0).map(() => 
        measureTime(() => Promise.resolve())
      )
    );
    
    const avg = measurements.reduce((a, b) => a + b) / measurements.length;
    expect(avg).toBeLessThan(1); // Sub-millisecond overhead
  });
});
```

**Required Tests**:
- ✅ Measurement accuracy
- ✅ Overhead benchmarking
- ✅ High-resolution timing
- ✅ Async vs sync operations
- ✅ Memory profiling
- ✅ Statistical validity

### Environment Utilities

**Focus**: Cross-platform compatibility

```typescript
describe('environment detection', () => {
  it('should detect Node.js correctly', () => {
    // Mock different environments
    const originalProcess = global.process;
    
    expect(isNode()).toBe(true);
    
    // @ts-ignore
    delete global.process;
    expect(isNode()).toBe(false);
    
    global.process = originalProcess;
  });

  it('should handle edge cases', () => {
    // Electron, React Native, etc.
    const scenarios = [
      { window: {}, process: { versions: { electron: '1.0' } } },
      { window: { ReactNativeWebView: {} } },
      { navigator: { product: 'ReactNative' } }
    ];
    
    // Test each scenario
  });
});
```

**Required Tests**:
- ✅ Node.js detection
- ✅ Browser detection
- ✅ Deno compatibility
- ✅ Worker environments
- ✅ React Native detection
- ✅ Electron detection

## Performance Benchmarking

### Setup

```typescript
import { bench, describe } from 'vitest';

describe('utility benchmarks', () => {
  bench('isNonNullable - small array', () => {
    const arr = [1, null, 2, undefined, 3];
    arr.filter(isNonNullable);
  });

  bench('isNonNullable - large array', () => {
    const arr = Array(10000).fill(0).map((_, i) => 
      i % 3 === 0 ? null : i
    );
    arr.filter(isNonNullable);
  });
});
```

### Performance Targets

| Utility Type | Operation | Target |
|-------------|-----------|---------|
| Type Guards | Simple check | < 0.001ms |
| Type Guards | Array filter (1000 items) | < 1ms |
| String Utils | Truncate (100 chars) | < 0.01ms |
| String Utils | Format (template) | < 0.1ms |
| Async Utils | Timer creation | < 0.1ms |
| Security | Redact (small object) | < 1ms |
| Security | Redact (large object) | < 10ms |

## Test Patterns

### 1. Type Safety Pattern

```typescript
import { expectTypeOf } from 'vitest';

test('type narrowing', () => {
  const value: unknown = 'test';
  
  if (isString(value)) {
    expectTypeOf(value).toEqualTypeOf<string>();
    expect(value.length).toBe(4); // TypeScript knows it's a string
  }
});
```

### 2. Cleanup Pattern

```typescript
test('cleanup on all paths', async () => {
  const cleanup = vi.fn();
  
  // Success path
  await withCleanup(Promise.resolve(), cleanup);
  expect(cleanup).toHaveBeenCalledTimes(1);
  
  // Error path
  cleanup.mockClear();
  await expect(
    withCleanup(Promise.reject(new Error()), cleanup)
  ).rejects.toThrow();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
```

### 3. Edge Case Pattern

```typescript
describe.each([
  ['empty string', ''],
  ['null', null],
  ['undefined', undefined],
  ['zero', 0],
  ['false', false],
  ['NaN', NaN],
  ['Infinity', Infinity],
])('edge case: %s', (name, value) => {
  test('handles correctly', () => {
    expect(() => utility(value)).not.toThrow();
    // Specific assertions for each case
  });
});
```

### 4. Performance Pattern

```typescript
test('performance characteristics', () => {
  const iterations = 10000;
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    utility(testData);
  }
  
  const duration = performance.now() - start;
  const opsPerSecond = iterations / (duration / 1000);
  
  expect(opsPerSecond).toBeGreaterThan(100000); // 100k ops/sec
});
```

## Coverage Requirements

### Minimum Coverage Targets

- **Line Coverage**: 90%
- **Branch Coverage**: 85%
- **Function Coverage**: 95%
- **Statement Coverage**: 90%

### Critical Path Coverage

Utilities used in error handling or logging must have:
- **Line Coverage**: 100%
- **Branch Coverage**: 100%
- **Error Path Testing**: All error cases covered

## Test Organization

```
packages/core/src/utils/
├── async/
│   ├── __tests__/
│   │   ├── retry.test.ts
│   │   ├── timeout.test.ts
│   │   ├── delay.test.ts
│   │   └── benchmarks/
│   │       └── async.bench.ts
│   ├── retry.ts
│   ├── timeout.ts
│   └── delay.ts
├── guards/
│   ├── __tests__/
│   │   ├── type-guards.test.ts
│   │   ├── type-narrowing.test-d.ts  # Type tests
│   │   └── benchmarks/
│   │       └── guards.bench.ts
│   └── index.ts
```

## Integration Testing

### Cross-Utility Testing

```typescript
describe('utility integration', () => {
  test('combines correctly', async () => {
    // Test utilities that work together
    const result = await withTimeout(
      retry(() => fetch('/api'), { times: 3 }),
      5000
    );
    
    expect(result).toBeDefined();
  });
});
```

### Real-World Scenarios

```typescript
describe('real-world usage', () => {
  test('logger scenario', () => {
    const sensitive = { password: 'secret', user: 'john' };
    const redacted = redact(sensitive);
    const formatted = truncate(JSON.stringify(redacted), 50);
    
    expect(formatted).not.toContain('secret');
    expect(formatted.length).toBeLessThanOrEqual(53); // 50 + '...'
  });
});
```

## Continuous Integration

### Test Matrix

Run tests across:
- **Node.js**: 18.x, 20.x, 22.x
- **Operating Systems**: Ubuntu, macOS, Windows
- **Architectures**: x64, arm64 (if applicable)

### Performance Regression

```yaml
# .github/workflows/benchmark.yml
- name: Run benchmarks
  run: pnpm bench
  
- name: Compare with base
  uses: benchmark-action/github-action-benchmark@v1
  with:
    tool: 'vitest'
    output-file-path: bench-results.json
    fail-on-alert: true
    alert-threshold: '110%'  # Fail if 10% slower
```

## Documentation Requirements

Each utility must include:
1. **JSDoc** with examples
2. **Type definitions** with generics explained
3. **Performance notes** if applicable
4. **Edge cases** documented
5. **Migration guide** from old implementations

## Checklist for New Utilities

- [ ] Unit tests with >90% coverage
- [ ] Type safety tests
- [ ] Performance benchmarks
- [ ] Edge case handling
- [ ] Error scenario tests
- [ ] Integration tests
- [ ] Documentation with examples
- [ ] Cross-platform verification
- [ ] Memory leak tests (if applicable)
- [ ] Security review (if applicable)