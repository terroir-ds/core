# Common Patterns in Terroir Core

## Error Handling Pattern

### Standard Error Creation

```typescript
import { ValidationError, NetworkError, wrapError } from '@terroir/core';

// Always include context
throw new ValidationError('Invalid input', {
  field: 'email',
  value: input,
  expected: 'valid email format'
});

// Wrap lower-level errors
try {
  await fetch(url);
} catch (err) {
  throw wrapError(err, 'Failed to fetch user data', { url });
}
```

### Error Recovery

```typescript
import { retry, isRetryableError } from '@terroir/core';

const data = await retry(
  async () => {
    const response = await fetch(url);
    if (!response.ok) throw new NetworkError('Failed', { status: response.status });
    return response.json();
  },
  { 
    maxAttempts: 3,
    shouldRetry: (err) => isRetryableError(err)
  }
);
```

## Validation Pattern

### Input Validation Flow

```typescript
import { assertDefined, isString, validateEmail } from '@terroir/core';

function processUserInput(data: unknown): User {
  // 1. Assert existence
  assertDefined(data, 'User data required');
  
  // 2. Type guards
  if (!isString(data.email)) {
    throw new ValidationError('Email must be string');
  }
  
  // 3. Format validation
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    throw new ValidationError('Invalid email', emailResult.error);
  }
  
  return { email: data.email };
}
```

## Logging Pattern

### Structured Logging

```typescript
import { logger } from '@terroir/core';

// Create scoped logger
const userLogger = logger.child({ module: 'user-service' });

// Log with context
userLogger.info({ userId, action: 'login' }, 'User logged in');

// Error logging
try {
  await operation();
} catch (error) {
  userLogger.error({ error, userId }, 'Operation failed');
  throw error;
}
```

## Token Usage Pattern

### Design Token Access

```typescript
import { tokens } from '@terroir/tokens';

// Direct token access
const primaryColor = tokens.color.primary.value;

// Theme-aware usage
const buttonBg = tokens.button.background.default.value;
const buttonHover = tokens.button.background.hover.value;

// Responsive tokens
const spacing = {
  small: tokens.spacing.small.value,
  medium: tokens.spacing.medium.value,
  large: tokens.spacing.large.value
};
```

## Component Pattern

### React Component Structure

```typescript
import { type ComponentProps } from '@terroir/react';
import { tokens } from '@terroir/tokens';

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export function Button({ 
  variant = 'primary', 
  size = 'medium',
  ...props 
}: ButtonProps) {
  // Use design tokens
  const styles = {
    backgroundColor: tokens.button[variant].background.value,
    padding: tokens.spacing[size].value
  };
  
  return <button style={styles} {...props} />;
}
```

## Async Pattern

### Timeout and Cancellation

```typescript
import { withTimeout, createAbortable } from '@terroir/core';

// Simple timeout
const data = await withTimeout(
  fetch(url).then(r => r.json()),
  5000 // 5 second timeout
);

// With cancellation
const { promise, abort } = createAbortable(async (signal) => {
  const response = await fetch(url, { signal });
  return response.json();
});

// Later: abort()
```

## Configuration Pattern

### Type-Safe Config

```typescript
import { assertDefined } from '@terroir/core';

interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

function loadConfig(): Config {
  const apiUrl = process.env.API_URL;
  assertDefined(apiUrl, 'API_URL env var required');
  
  return {
    apiUrl,
    timeout: Number(process.env.TIMEOUT) || 5000,
    retries: Number(process.env.RETRIES) || 3
  };
}
```

## Testing Pattern

### Component Testing

```bash
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary" />);
    // Test primary styles
    
    rerender(<Button variant="secondary" />);
    // Test secondary styles
  });
});
```

## AI Metadata

```text
stability: stable
token_cost: 800
last_updated: 2025-06-29
```
