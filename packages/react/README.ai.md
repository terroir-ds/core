# @terroir/react

**Purpose**: React component library for Terroir Core Design System
**Dependencies**: react, @terroir/core, @terroir/tokens
**Patterns**: Compound components, TypeScript-first, accessible by default

## Quick Reference

| Task       | Import          | Example                                            |
| ---------- | --------------- | -------------------------------------------------- |
| Use Button | `Button`        | `<Button variant="primary">Click</Button>`         |
| Use Card   | `Card`          | `<Card><Card.Header>Title</Card.Header></Card>`    |
| Use theme  | `ThemeProvider` | `<ThemeProvider theme="light">...</ThemeProvider>` |

## Common Tasks

### Using Components

```typescript
import { Button, Card, ThemeProvider } from '@terroir/react';

function App() {
  return (
    <ThemeProvider theme="light">
      <Card>
        <Card.Header>Welcome</Card.Header>
        <Card.Body>
          <Button variant="primary" onClick={handleClick}>
            Get Started
          </Button>
        </Card.Body>
      </Card>
    </ThemeProvider>
  );
}
```

### Creating Custom Components

```typescript
import { type ComponentProps } from '@terroir/react';
import { tokens } from '@terroir/tokens';

interface CustomProps extends ComponentProps {
  // Your props
}

export function Custom({ className, ...props }: CustomProps) {
  // Use design tokens
  const styles = {
    color: tokens.color.primary.value,
    padding: tokens.spacing.medium.value
  };

  return <div style={styles} {...props} />;
}
```

## Component List

- **Button**: Interactive button with variants
- **Card**: Container with header/body/footer
- **Input**: Form input with validation
- **Select**: Dropdown selection
- **Modal**: Overlay dialog
- **Toast**: Notification messages
- **Tabs**: Tabbed interface
- **Accordion**: Collapsible sections

## AI Metadata

```text
stability: beta
token_cost: 350
last_updated: 2025-06-29
```
