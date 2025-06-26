# Utility Modules

This directory contains shared utility modules for the Terroir Core Design System.

## Available Utilities

### Logger (`logger.ts`)

High-performance structured logging with Pino.

```typescript
import { logger, logStart, logSuccess, measureTime } from '@terroir/core/lib/utils/logger';
```bash
**Features:**

- Environment-aware configuration
- Automatic security redaction
- Performance tracking
- Request correlation
- TypeScript support

**Documentation:** [Logging Guide](./docs/logging.md)

## Adding New Utilities

When creating new utility modules:

1. **Create the module** in this directory
2. **Add TypeScript types** for all exports
3. **Write unit tests** with >80% coverage
4. **Document usage** in this README
5. **Export from** `lib/index.ts`

## Design Principles

All utilities should:

- Be **focused** on a single responsibility
- Have **zero runtime dependencies** (where possible)
- Be **fully typed** with TypeScript
- Include **comprehensive tests**
- Follow **security best practices**
- Be **performant** and lightweight

## Testing

Run tests for all utilities:

```bash
pnpm test lib/utils/**/*.test.ts
```bash
Run tests with coverage:

```bash
pnpm test:coverage lib/utils
```
