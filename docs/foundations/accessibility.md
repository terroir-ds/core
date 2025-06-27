# Accessibility

Accessibility isn't just compliance—it's the foundation of inclusive design that creates better experiences for everyone. Terroir Core embeds accessibility into every component, token, and workflow.

## Our Accessibility Philosophy

We believe accessibility should be:

- **Automatic**: The default behavior, not an opt-in feature
- **Comprehensive**: Covering all aspects of inclusive design
- **Testable**: With automated validation and clear success criteria
- **Educational**: Helping teams understand why accessibility matters

## WCAG Compliance

All Terroir Core components and tokens meet or exceed WCAG 2.1 AA standards, with AAA support where feasible.

### Color and Contrast

- **Automated contrast validation** for all color combinations
- **Dynamic contrast adjustment** based on user preferences
- **High contrast theme variants** for enhanced visibility
- **Color-blind friendly palettes** tested with simulation tools

### Interactive Elements

- **Minimum touch target size** of 44×44 pixels
- **Focus indicators** with 3:1 contrast ratio minimum
- **Keyboard navigation** for all interactive components
- **Screen reader optimization** with proper ARIA labels

### Content Structure

- **Semantic HTML** as the foundation for all components
- **Logical heading hierarchy** in documentation and examples
- **Alternative text** for all informational images
- **Clear language** with readability optimization

## Automated Testing

Accessibility testing is integrated into our development workflow:

### Build-Time Validation

````bash
# Color contrast validation
pnpm test:contrast

# Accessibility linting
pnpm test:a11y

# Full accessibility audit
pnpm test --filter accessibility
```text
### Runtime Testing
- **axe-core integration** for automated accessibility scanning
- **Playwright tests** for keyboard navigation and focus management
- **Screen reader testing** with automated voice-over simulation

### Visual Regression Testing
- **Focus indicator visibility** across all interactive elements
- **High contrast mode** compatibility testing
- **Motion reduction** preference respect

## Implementation Guidelines

### Color Usage
```typescript
// ✅ Good: Automatic contrast calculation
import { generateColorSystem } from '@terroir/core';

const colors = await generateColorSystem({
  source: '#0066cc',
  contrastLevel: 0.5 // Ensures AA compliance
});

// Colors automatically provide accessible text colors
const backgroundColor = colors.primary.tone(60);
const textColor = colors.primary.tone(10); // Guaranteed contrast
```text
### Component Design
```typescript
// ✅ Good: Built-in accessibility features
import { Button } from '@terroir/core/react';

<Button
  variant="primary"
  // ARIA attributes automatically applied
  // Focus management built-in
  // Keyboard navigation included
>
  Submit Form
</Button>
```text
### Focus Management
All interactive components include:
- **Visible focus indicators** that meet contrast requirements
- **Logical tab order** with proper focus flow
- **Focus trapping** in modal dialogs and overlays
- **Focus restoration** when dialogs close

## Screen Reader Support

### Semantic Markup
All components use proper HTML semantics:
- `<button>` for actions, `<a>` for navigation
- `<fieldset>` and `<legend>` for form groups
- `<main>`, `<nav>`, `<section>` for page structure

### ARIA Implementation
- **aria-label** for buttons with icon-only content
- **aria-describedby** for help text and error messages
- **aria-expanded** for collapsible content
- **aria-live** for dynamic content updates

### Content Strategy
- **Descriptive link text** that makes sense out of context
- **Clear error messages** with specific correction guidance
- **Progress indicators** for multi-step processes

## Motion and Animation

Respecting user preferences for motion:

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```yaml
### Motion Guidelines
- **Essential motion only**: Animations serve a functional purpose
- **Smooth transitions**: Using CSS transforms for better performance
- **Reasonable duration**: 200-500ms for most interface animations
- **Easing functions**: Natural motion curves that feel responsive

## Testing Tools and Resources

### Automated Testing
- **[axe-core](https://github.com/dequelabs/axe-core)** - Automated accessibility testing
- **[Lighthouse](https://lighthouse.web.dev/)** - Accessibility auditing
- **[Pa11y](https://pa11y.org/)** - Command-line accessibility testing

### Manual Testing
- **[NVDA](https://www.nvaccess.org/)** - Free screen reader for Windows
- **[VoiceOver](https://support.apple.com/guide/voiceover/)** - Built-in macOS screen reader
- **[Color Oracle](https://colororacle.org/)** - Color blindness simulator

### Browser Extensions
- **[axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)** - Browser accessibility testing
- **[WAVE](https://wave.webaim.org/extension/)** - Web accessibility evaluation
- **[Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)** - Color contrast validation

## Success Metrics

We measure accessibility through:

### Automated Metrics
- **Zero axe-core violations** in all components
- **100% WCAG AA compliance** for color contrast
- **Complete keyboard navigation** coverage

### User Testing
- **Screen reader user feedback** on component usability
- **Keyboard-only navigation testing** with real users
- **Usability testing** with users who have disabilities

### Performance Indicators
- **Time to interactive** for keyboard users
- **Error recovery rates** in form interactions
- **Task completion rates** across different assistive technologies

## Common Patterns

### Form Accessibility
```typescript
<FormField
  label="Email Address"
  error={emailError}
  required
  aria-describedby="email-help"
>
  <input
    type="email"
    aria-invalid={!!emailError}
    aria-describedby={emailError ? "email-error" : "email-help"}
  />
  <HelpText id="email-help">
    We'll use this to send you notifications
  </HelpText>
  {emailError && (
    <ErrorMessage id="email-error" role="alert">
      {emailError}
    </ErrorMessage>
  )}
</FormField>
```text
### Modal Accessibility
```typescript
<Modal
  isOpen={isModalOpen}
  onClose={closeModal}
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <ModalHeader>
    <h2 id="modal-title">Confirm Action</h2>
  </ModalHeader>
  <ModalBody>
    <p id="modal-description">
      Are you sure you want to delete this item?
    </p>
  </ModalBody>
  <ModalFooter>
    <Button onClick={closeModal}>Cancel</Button>
    <Button variant="destructive" onClick={confirmDelete}>
      Delete
    </Button>
  </ModalFooter>
</Modal>
````

## Related Resources

- **[Design Principles](./design-principles.md)** - How accessibility shapes our design approach
- **[Color System](./color-system.md)** - Accessible color generation and usage
- **[Testing Standards](../resources/standards/testing.md)** - Accessibility testing requirements
- **[WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)** - Official accessibility standards
