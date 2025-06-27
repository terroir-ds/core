# @terroir/core

## 0.1.0

### Initial Release

This is the first release of @terroir/core, providing core utilities and design tokens for the Terroir Design System.

#### Features

- **Color System**: Material Color Utilities integration for perceptually uniform color generation
- **Structured Logging**: High-performance logging with Pino, featuring:
  - Security-focused redaction of sensitive data
  - Request correlation with AsyncLocalStorage
  - Rate limiting to prevent log flooding
  - OpenTelemetry trace support
- **Error Handling**: Comprehensive error system with typed errors and retry logic
- **Async Utilities**: Promise helpers, timing utilities, and async flow control
- **Type Safety**: Full TypeScript support with detailed type definitions
- **Tree Shaking**: Optimized for bundle size with `sideEffects: false`

#### Infrastructure

- ESM-only package with modern JavaScript
- Monorepo structure with pnpm workspaces
- Automated testing with Vitest
- Documentation with TypeDoc

For more details, see the [README](./README.md) and [API documentation](https://terroir-ds.github.io/core/api/).
