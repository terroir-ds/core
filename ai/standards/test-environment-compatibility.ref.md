# Test Environment Compatibility Standard References

## Task Usage (WHEN)

- 2025-07-02: Fix all test errors and implement best practices
  - Standard Score: 4/5 (Strong implementation standard)
  - Scoring breakdown (using contextual scoring - Implementation Standard):
    - Correctness: 5/5 - All identified violations fixed correctly
    - Completeness: 4/5 - Core patterns fixed, may need broader codebase scan
    - Quality: 4/5 - Good implementation but could use ESLint enforcement
    - Validation: 5/5 - All tests pass in worker thread environment
    - Impact: 4/5 - Significant improvement to CI reliability
  - Weighted Score: 4.4/5
  - Hash: current
  - Notes: Successfully eliminated process.chdir() from test files

## Implementation Locations (WHERE)

### ✅ Correctly Implemented

| Location | Implementation | Details |
|----------|---------------|---------|
| `scripts/utils/markdown-fixes/fix-markdown-code-blocks.js` | Directory parameter pattern | Accepts targetDirectory parameter, exports main function |
| `scripts/utils/markdown-fixes/fix-markdown-links.js` | Directory parameter pattern | Accepts targetDirectory parameter, exports main function |
| `scripts/utils/markdown-fixes/index.js` | Orchestrator pattern | Passes directory to child scripts via CLI args |
| `scripts/utils/markdown-fixes/__tests__/**/*.test.js` | ExecSync with cwd option | All tests use explicit directory arguments |

### 🔄 Migration Completed

| Location | Before | After | Impact |
|----------|--------|-------|---------|
| 21 test files | Used `process.chdir()` | Use explicit directory arguments | Tests work in worker threads |
| 3 CLI scripts | Relied on current working directory | Accept directory parameters | Scripts are testable and isolated |

### ❌ Violations Found

None currently found in active codebase.

## Enforcement

### ESLint Rules (Recommended)

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.object.name='process'][callee.property.name='chdir']",
        "message": "process.chdir() is not supported in worker threads. Use explicit path parameters instead. See @standard:test-environment-compatibility"
      }
    ]
  }
}
```

### Pre-commit Hooks

```bash
# Check for process.chdir in test files
if grep -r "process\.chdir" **/*.test.* --exclude-dir=node_modules; then
  echo "❌ Found process.chdir() in test files. See @standard:test-environment-compatibility"
  exit 1
fi
```

## Insights

- Worker thread compatibility is critical for modern test runners
- ExecSync with explicit `cwd` option is the preferred pattern for external commands
- Directory parameter pattern enables better testability and isolation
- Migration can be done incrementally without breaking existing functionality

## Audit Notes

- [ ] Scan broader codebase for additional process.chdir() usage
- [ ] Implement ESLint rule to prevent future violations
- [ ] Add pre-commit hook for automated checking
- [ ] Consider adding this to code review checklist

## Related Standards

- [@standard:testing-practices] - General testing guidelines
- [@standard:script-error-handling] - For handling errors in external scripts

## Last Updated

2025-07-02 - Initial standard creation and implementation
