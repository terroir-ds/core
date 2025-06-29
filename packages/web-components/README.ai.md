# @terroir/web-components

**Purpose**: Framework-agnostic web components for Terroir Core Design System
**Dependencies**: @terroir/core, @terroir/tokens
**Patterns**: Custom Elements, Shadow DOM, CSS custom properties

## Quick Reference

| Task       | Element            | Example                                                     |
| ---------- | ------------------ | ----------------------------------------------------------- |
| Use Button | `<terroir-button>` | `<terroir-button variant="primary">Click</terroir-button>`  |
| Use Card   | `<terroir-card>`   | `<terroir-card><h2 slot="header">Title</h2></terroir-card>` |
| Set theme  | CSS variables      | `--terroir-theme: light;`                                   |

## Common Tasks

### Using Web Components

```html
<!-- Import the components -->
<script type="module" src="@terroir/web-components"></script>

<!-- Use in HTML -->
<terroir-card>
  <h2 slot="header">Welcome</h2>
  <div slot="body">
    <terroir-button variant="primary" onclick="handleClick()"> Get Started </terroir-button>
  </div>
</terroir-card>
```

### JavaScript Integration

```typescript
import '@terroir/web-components';

// Create elements programmatically
const button = document.createElement('terroir-button');
button.setAttribute('variant', 'primary');
button.textContent = 'Click me';
button.addEventListener('click', handleClick);

document.body.appendChild(button);
```

### Styling with CSS

```yaml
/* Use CSS custom properties */
terroir-button {
  --button-radius: 8px;
  --button-padding: 12px 24px;
}

/* Theme switching */
:root {
  --terroir-theme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    --terroir-theme: dark;
  }
}
```

## Component List

- **terroir-button**: Interactive button
- **terroir-card**: Container component
- **terroir-input**: Form input
- **terroir-select**: Dropdown
- **terroir-modal**: Dialog overlay
- **terroir-tabs**: Tabbed interface
- **terroir-accordion**: Collapsible

## AI Metadata

```text
stability: experimental
token_cost: 400
last_updated: 2025-06-29
```
