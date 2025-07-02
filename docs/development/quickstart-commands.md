# 🚀 Terroir Core Quick Start Commands

## Most Used Commands (Copy & Paste)

```bash
# Before commits - ALWAYS
pnpm fix

# Commit with message
git add . && git commit -m "feat(scope): description"

# Test specific module
pnpm test:watch packages/core/src/utils/strings

# Build everything
pnpm build

# Check what changed
git status && git diff

# Find TODOs
grep -r "TODO" packages/ | grep -v node_modules
```

## By Task Type

### 🧪 Testing

```bash
pnpm test                    # Run all tests
pnpm test:watch [path]       # Watch specific path
pnpm test:coverage           # Check coverage
```

### 🔨 Building

```bash
pnpm build                   # Build all packages
pnpm tokens:build            # Build tokens only
pnpm fix                     # Fix lint/format
```

### 📝 Git Operations

```bash
git add -p                   # Interactive staging
git commit --amend           # Fix last commit
git push origin HEAD         # Push current branch
```

### 🔍 Finding Things

```bash
find . -name "*.ts" -type f | grep -v node_modules | grep [pattern]
grep -r "ClassName" packages/ --include="*.ts"
```

## Agent-Specific

### Agent 0 (Core)

```bash
pnpm test packages/core/src/utils/guards
pnpm test packages/core/src/utils/logger
```

### Agent 1 (Utilities)

```bash
pnpm test:watch packages/core/src/utils/strings
```

### Agent 2 (Tokens)

```bash
pnpm tokens:build
pnpm tokens:watch
```

### Agent 3 (Components)

```bash
pnpm storybook:dev
pnpm test packages/react
```

## Standards Reminder

- ✅ Use `pnpm` not `npm`
- ✅ Use `@utils/logger` not `console.log`
- ✅ Use typed errors from `@utils/errors`
- ✅ Run `pnpm fix` before commits
