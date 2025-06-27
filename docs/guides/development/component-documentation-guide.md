# Component Documentation Guide

This guide explains how to write effective component documentation using our standardized template.

## Why Consistent Documentation Matters

Good component documentation:

- **Reduces support burden** by answering common questions upfront
- **Accelerates adoption** by showing clear examples
- **Prevents misuse** by documenting anti-patterns
- **Improves accessibility** by highlighting built-in features

## Using the Template

### 1. Start with the Template

Copy the [component documentation template](../../templates/component-documentation.md) to create new component docs:

````bash
cp docs/templates/component-documentation.md docs/reference/components/my-component.md
```text
### 2. Structure Overview

The template follows a logical flow from high-level concepts to specific details:

1. **Overview** - What and why
2. **Examples** - Show, don't tell
3. **API Reference** - Complete technical specs
4. **Styling** - Customization options
5. **Accessibility** - Inclusive design features
6. **Guidelines** - Best practices
7. **Patterns** - Common use cases
8. **Troubleshooting** - Problem solving

### 3. Writing Effective Sections

#### Overview Section
- Start with a one-sentence description
- Explain the problem it solves
- Mention key features
- Keep it concise (2-3 paragraphs)

**Good Example:**
> The Button component is the primary way for users to trigger actions in your application. It comes with built-in accessibility features, multiple visual variants, and automatic theme integration.

**Poor Example:**
> This is a button. It can be clicked.

#### Examples Section
- Start with the simplest usage
- Progress to more complex patterns
- Include complete, runnable code
- Explain when to use each pattern

```tsx
// Always provide complete, working examples
import { Button } from '@terroir/react';

function Example() {
  return (
    <Button onClick={() => alert('Clicked!')}>
      Click me
    </Button>
  );
}
```yaml
#### API Reference
- Document ALL props, even obvious ones
- Include TypeScript types
- Specify defaults
- Write clear descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |

#### Accessibility Section
- List keyboard shortcuts
- Document ARIA usage
- Mention screen reader behavior
- Include testing tips

## Documentation Principles

### 1. Show, Don't Just Tell

❌ **Bad**: "The button can have different sizes"

✅ **Good**:
```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```text
### 2. Document the Why

Don't just explain what a prop does, explain when to use it:

❌ **Bad**: "variant: Changes the button appearance"

✅ **Good**: "variant: Visual style variant. Use 'primary' for main actions, 'secondary' for alternative actions, and 'destructive' for dangerous operations like deletion."

### 3. Include Anti-Patterns

Show what NOT to do:

```tsx
// ❌ Don't nest interactive elements
<Button>
  Delete <a href="/help">Learn more</a>
</Button>

// ✅ Do place them separately
<Button>Delete</Button>
<Link href="/help">Learn more about deletion</Link>
```text
### 4. Real-World Examples

Include practical, real-world usage:

```tsx
// Form submission with loading state
function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await api.submitForm(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubmit}
      loading={isLoading}
      disabled={isLoading}
    >
      {isLoading ? 'Submitting...' : 'Submit Form'}
    </Button>
  );
}
```yaml
## Component Categories

Different component types need different documentation focus:

### Input Components
- Form integration examples
- Validation patterns
- Error handling
- Label associations

### Layout Components
- Responsive behavior
- Spacing systems
- Nesting rules
- Grid/flex patterns

### Feedback Components
- Timing and animation
- Dismissal patterns
- Accessibility announcements
- State management

### Navigation Components
- Routing integration
- Active states
- Keyboard navigation
- Mobile patterns

## Quality Checklist

Before publishing component documentation, verify:

- [ ] **Overview** clearly explains the component's purpose
- [ ] **Basic example** works when copy-pasted
- [ ] **All props** are documented with types and defaults
- [ ] **Accessibility** section covers keyboard and screen readers
- [ ] **Do's and Don'ts** provide clear guidance
- [ ] **Common patterns** show real-world usage
- [ ] **Troubleshooting** addresses frequent issues
- [ ] **Related components** are linked
- [ ] **Code examples** are tested and working
- [ ] **TypeScript** examples compile without errors

## Maintaining Documentation

### Version Updates
- Document breaking changes clearly
- Provide migration examples
- Keep old examples for reference
- Date your documentation

### Feedback Loop
- Monitor GitHub issues for documentation gaps
- Add FAQs based on common questions
- Update examples based on usage patterns
- Link to community examples

### Cross-References
- Link to related components
- Reference design principles
- Connect to accessibility guidelines
- Point to working examples

## Examples of Excellence

Study these well-documented components:

1. **[Button](../../reference/components/button.md)** - Comprehensive variant documentation
2. **[Form Field](../../reference/components/form-field.md)** - Excellent accessibility docs
3. **[Modal](../../reference/components/modal.md)** - Great pattern examples
4. **[DataTable](../../reference/components/data-table.md)** - Complex component patterns

## Tools and Resources

### Documentation Tools
- **[TypeDoc](https://typedoc.org/)** - Generate API docs from TypeScript
- **[Storybook](https://storybook.js.org/)** - Interactive component documentation
- **[CodeSandbox](https://codesandbox.io/)** - Embedded live examples

### Writing Resources
- [Writing Style Guide](../writing-style.md)
- [Code Example Standards](../../resources/standards/documentation.md)
- [Accessibility Writing](../../foundations/accessibility.md#documentation)

### Review Process
1. Write initial documentation
2. Test all code examples
3. Review with component author
4. Get feedback from users
5. Iterate based on questions

## Common Pitfalls

### 1. Assuming Knowledge
Don't assume users know your conventions:

❌ **Bad**: "Use standard spacing tokens"
✅ **Good**: "Use spacing tokens like `space-sm` (8px), `space-md` (16px)"

### 2. Incomplete Examples
Always provide full context:

❌ **Bad**:
```tsx
<Button variant={variant}>Click</Button>
```text
✅ **Good**:
```tsx
import { Button } from '@terroir/react';

function Example() {
  return (
    <Button variant="primary">Click</Button>
  );
}
````

### 3. Missing Edge Cases

Document limitations and edge cases:

- Maximum/minimum values
- Performance considerations
- Browser limitations
- Mobile differences

### 4. Outdated Information

- Review docs with each release
- Update examples for new patterns
- Remove deprecated features
- Add migration guides

Remember: Great documentation is as important as great code. It's the bridge between your component's potential and its actual usage.
