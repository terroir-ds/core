# @terroir/core

Core design tokens and utilities for the Terroir Design System.

## Installation

```bash
npm install @terroir/core
# or
pnpm add @terroir/core
# or
yarn add @terroir/core
```

## Features

- **Material Color Utilities**: Advanced color system generation
- **Design Tokens**: Comprehensive token system for consistent design
- **Async Utilities**: Robust async operations with cancellation support
- **Error Handling**: Typed error system with retry logic
- **Logging**: Structured logging with Pino (optional)
- **TypeScript**: Full type safety and IntelliSense support

## Usage

### Color System

```typescript
import { generateColorSystem } from '@terroir/core/colors';

const colors = await generateColorSystem({
  source: '#0066cc',
  variant: 'tonalSpot'
});

// Access color palettes
console.log(colors.primary[50]); // Light tone
console.log(colors.primary[90]); // Dark tone
```

### Async Utilities

```typescript
import { withTimeout, delay, retry } from '@terroir/core/utils';

// Add timeout to any promise
const result = await withTimeout(fetchData(), 5000);

// Retry with exponential backoff
const data = await retry(
  () => fetchFromAPI(),
  { retries: 3, factor: 2 }
);
```

### Error Handling

```typescript
import { ValidationError, handleError } from '@terroir/core/utils';

try {
  validateInput(data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.context);
  }
  await handleError(error);
}
```

## API Documentation

See the [full API documentation](https://terroir-ds.github.io/core/api/) for detailed usage information.

## License

MIT © Terroir Design System Contributors