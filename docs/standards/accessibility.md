# Accessibility Standards

## Overview

Build an inclusive design system that works for everyone.

## WCAG Compliance

### Target Level

- **Minimum**: WCAG 2.1 AA
- **Preferred**: WCAG 2.1 AAA where possible
- **Future**: WCAG 3.0 readiness

### Key Principles

1. **Perceivable** - Information presented in multiple ways
2. **Operable** - Interface usable by keyboard
3. **Understandable** - Clear and predictable
4. **Robust** - Works with assistive technologies

## Color & Contrast

### Contrast Requirements

````typescript
import { validateContrast } from '@utils/accessibility';

// Text contrast
validateContrast(foreground, background, {
  level: 'AA',
  size: 'normal' // 4.5:1 ratio
});

// Large text (18pt+)
validateContrast(foreground, background, {
  level: 'AA',
  size: 'large' // 3:1 ratio
});

// UI elements
validateContrast(foreground, background, {
  level: 'AA',
  component: true // 3:1 ratio
});
```text
### Color Independence

```css
/* ❌ DON'T rely on color alone */
.error { color: red; }

/* ✅ DO provide multiple indicators */
.error {
  color: red;
  border-left: 3px solid red;
  &::before {
    content: "⚠️ Error: ";
  }
}
```text
## Keyboard Navigation

### Focus Management

```typescript
// Visible focus indicators
button:focus-visible {
  outline: 2px solid ${theme.colors.focus};
  outline-offset: 2px;
}

// Programmatic focus
const firstInput = useRef<HTMLInputElement>(null);
useEffect(() => {
  firstInput.current?.focus();
}, []);
```text
### Keyboard Shortcuts

```typescript
// Implement standard patterns
useKeyboard({
  'Escape': closeModal,
  'Enter': submitForm,
  'Tab': navigateNext,
  'Shift+Tab': navigatePrevious,
  'ArrowDown': selectNext,
  'ArrowUp': selectPrevious
});
```text
### Skip Links

```html
<!-- Skip to main content -->
<a href="#main" class="skip-link">
  Skip to main content
</a>

<nav><!-- navigation --></nav>
<main id="main"><!-- content --></main>
```text
## Screen Reader Support

### Semantic HTML

```typescript
// ❌ DON'T use divs for everything
<div onclick={handleClick}>Click me</div>

// ✅ DO use semantic elements
<button onClick={handleClick}>Click me</button>
```text
### ARIA Labels

```typescript
// When text isn't descriptive enough
<button aria-label="Close dialog" onClick={close}>
  <Icon name="x" />
</button>

// Describe relationships
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
<span id="email-error" role="alert">
  Invalid email format
</span>
```text
### Live Regions

```typescript
// Announce dynamic changes
<div aria-live="polite" aria-atomic="true">
  {status && <p>{status}</p>}
</div>

// Critical announcements
<div role="alert" aria-live="assertive">
  {error && <p>{error}</p>}
</div>
```text
## Form Accessibility

### Label Association

```typescript
// ❌ DON'T use placeholder as label
<input placeholder="Email" />

// ✅ DO use proper labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Or wrap the input
<label>
  Email
  <input type="email" />
</label>
```text
### Error Handling

```typescript
function AccessibleForm() {
  return (
    <form aria-label="Contact form">
      <div role="group" aria-labelledby="email-label">
        <label id="email-label" htmlFor="email">
          Email <span aria-label="required">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          aria-required="true"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>
    </form>
  );
}
```text
## Touch Target Size

### Minimum Sizes

```css
/* Minimum 44x44px (WCAG) */
button, a, input {
  min-height: 44px;
  min-width: 44px;
}

/* Preferred 48x48px (Material Design) */
.touch-target {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    inset: -4px; /* Expand hit area */
  }
}
```text
## Motion & Animation

### Respect Preferences

```css
/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```text
```typescript
// In JavaScript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const animationDuration = prefersReducedMotion ? 0 : 300;
```text
## Testing

### Automated Testing

```typescript
import { axe } from '@axe-core/react';

// In development
if (process.env.NODE_ENV === 'development') {
  axe(React, ReactDOM, 1000);
}

// In tests
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should be accessible', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```text
### Manual Testing

Checklist:
- [ ] Navigate with keyboard only
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Check color contrast
- [ ] Zoom to 200%
- [ ] Test with browser extensions disabled
- [ ] Validate HTML semantics

### Tools

- **axe DevTools** - Browser extension
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Accessibility audit
- **Contrast Checker** - Color contrast validation
- **Screen Readers** - NVDA (Windows), VoiceOver (Mac)

## Common Patterns

### Accessible Modal

```typescript
function AccessibleModal({ isOpen, onClose, children }) {
  const previousFocus = useRef();

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      // Trap focus in modal
    } else {
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      hidden={!isOpen}
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
````

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
