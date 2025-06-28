# Component Documentation Strategy

## Overview

This document outlines our approach to documenting components in the Terroir Core Design System using Storybook and related tools.

## Documentation Goals

1. **Discoverability**: Easy to find components and patterns
2. **Usability**: Clear examples and implementation guides
3. **Interactivity**: Live playground for experimentation
4. **Completeness**: All props, states, and variants documented
5. **Accessibility**: A11y guidelines and testing built-in

## Storybook Configuration

### Initial Setup
```bash
npx storybook@latest init
```

### Addons to Install
```json
{
  "devDependencies": {
    "@storybook/addon-essentials": "^7.x",
    "@storybook/addon-a11y": "^7.x",
    "@storybook/addon-docs": "^7.x",
    "@storybook/addon-controls": "^7.x",
    "@storybook/addon-viewport": "^7.x",
    "@storybook/addon-measure": "^7.x",
    "@storybook/addon-outline": "^7.x",
    "storybook-addon-designs": "^6.x",
    "storybook-dark-mode": "^3.x"
  }
}
```

### Configuration Structure
```
.storybook/
├── main.ts              # Main configuration
├── preview.ts           # Global decorators and parameters
├── manager.ts           # UI configuration
└── themes/
    ├── light.ts         # Light theme
    └── dark.ts          # Dark theme
```

## Component Story Structure

### Basic Story Template
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Base button component with multiple variants and states.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' }
      }
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' }
      }
    }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary story
export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary'
  }
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
    </div>
  )
};

// Interactive states
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  )
};

// With icons
export const WithIcons: Story = {
  args: {
    children: 'Save',
    startIcon: <SaveIcon />,
    variant: 'primary'
  }
};
```

### Advanced Documentation
```typescript
// Button.mdx
import { Canvas, Meta, Story, ArgsTable } from '@storybook/addon-docs';
import { Button } from './Button';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

Buttons are used to trigger actions. They communicate calls to action to the user and allow users to interact with pages in a variety of ways.

## When to use

- **Primary actions**: Use primary buttons for the most important action on a page
- **Secondary actions**: Use secondary buttons for supporting actions
- **Tertiary actions**: Use tertiary buttons for less prominent actions

## Anatomy

```
┌─────────────────────────┐
│ [icon] Label [icon]     │
└─────────────────────────┘
```

## Props

<ArgsTable of={Button} />

## Examples

### Basic Usage

<Canvas>
  <Story of={ButtonStories.Primary} />
</Canvas>

### All Variants

<Canvas>
  <Story of={ButtonStories.AllVariants} />
</Canvas>

### Accessibility

- All buttons have a minimum touch target of 44x44 pixels
- Focus indicators are clearly visible
- Disabled buttons have `aria-disabled` attribute
- Loading buttons announce state changes to screen readers

### Keyboard Navigation

- `Tab`: Move focus to button
- `Space` or `Enter`: Activate button
- Focus trap when in loading state

## Design Decisions

### Why these variants?

1. **Primary**: High emphasis, should be used sparingly (1-2 per page)
2. **Secondary**: Medium emphasis, for supporting actions
3. **Tertiary**: Low emphasis, for optional actions

### Color Considerations

- Colors meet WCAG AA contrast requirements
- Tested for color blindness accessibility
- Dark mode variants maintain same hierarchy

## Related Components

- [IconButton](/?path=/docs/components-iconbutton--docs) - For icon-only actions
- [ButtonGroup](/?path=/docs/components-buttongroup--docs) - For grouped actions
- [Link](/?path=/docs/components-link--docs) - For navigation
```

## Documentation Categories

### 1. Component Documentation
```
components/
├── actions/
│   ├── Button
│   ├── IconButton
│   └── ButtonGroup
├── inputs/
│   ├── TextField
│   ├── Select
│   └── Checkbox
├── feedback/
│   ├── Alert
│   ├── Toast
│   └── Progress
├── layout/
│   ├── Box
│   ├── Grid
│   └── Stack
└── navigation/
    ├── Tabs
    ├── Breadcrumb
    └── Pagination
```

### 2. Pattern Documentation
```
patterns/
├── forms/
│   ├── Login Form
│   ├── Multi-step Form
│   └── Form Validation
├── layouts/
│   ├── Dashboard
│   ├── Marketing Page
│   └── Settings Page
└── workflows/
    ├── Onboarding
    ├── Data Entry
    └── Error Handling
```

### 3. Foundation Documentation
```
foundations/
├── colors/
│   ├── Palette
│   ├── Semantic Colors
│   └── Color Usage
├── typography/
│   ├── Type Scale
│   ├── Font Families
│   └── Text Styles
├── spacing/
│   ├── Scale
│   ├── Layout Grid
│   └── Component Spacing
└── motion/
    ├── Transitions
    ├── Animations
    └── Timing Functions
```

## Interactive Features

### 1. Live Code Editor
```typescript
// In story
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: 'code'
      }
    }
  },
  render: (args) => <Button {...args} />
};
```

### 2. Design Specs Integration
```typescript
// Connect to Figma
export const WithDesign: Story = {
  parameters: {
    design: {
      type: 'figma',
      url: 'https://figma.com/file/xxx'
    }
  }
};
```

### 3. Accessibility Testing
```typescript
// Automatic a11y checks
export const AccessibilityTest: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  }
};
```

## Documentation Quality Checklist

### For Each Component
- [ ] Description explains what and why
- [ ] All props documented with types
- [ ] Default values specified
- [ ] Interactive examples for all variants
- [ ] Accessibility guidelines included
- [ ] Keyboard navigation documented
- [ ] Related components linked
- [ ] Design rationale explained

### Code Examples
- [ ] Import statements included
- [ ] TypeScript types shown
- [ ] Common patterns demonstrated
- [ ] Anti-patterns highlighted
- [ ] Performance considerations noted

### Visual Documentation
- [ ] All states shown (hover, focus, active, disabled)
- [ ] Responsive behavior demonstrated
- [ ] Dark mode variants included
- [ ] Animation/transitions visible
- [ ] Spacing and alignment guides

## Build & Deployment

### Build Configuration
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test-storybook": "test-storybook",
    "chromatic": "chromatic --project-token=$CHROMATIC_PROJECT_TOKEN"
  }
}
```

### Deployment Strategy
1. **Development**: Local Storybook for development
2. **Preview**: Deploy PR previews to Chromatic
3. **Production**: Deploy to custom domain
4. **Versioning**: Maintain version history

### Performance Optimization
- Lazy load stories
- Optimize asset loading
- Enable caching
- Minimize bundle size

## Metrics & Analytics

### Usage Tracking
- Component view counts
- Example copy events
- Search queries
- Time on page

### Quality Metrics
- Documentation coverage
- Example completeness
- Build time
- Bundle size

### Feedback Collection
- Inline feedback widget
- GitHub discussions
- User surveys
- Analytics insights

## Maintenance

### Regular Updates
- [ ] Weekly: Update examples for new features
- [ ] Monthly: Review and improve descriptions
- [ ] Quarterly: Audit for completeness
- [ ] Yearly: Major reorganization if needed

### Version Management
- Tag stories with version introduced
- Show deprecation warnings
- Maintain compatibility examples
- Document breaking changes

## Next Steps

1. **Week 1**: Set up Storybook with essential addons
2. **Week 2**: Document first 5 components
3. **Week 3**: Add interactive examples
4. **Week 4**: Deploy to production

## Resources

### Storybook
- [Official Docs](https://storybook.js.org/docs)
- [Best Practices](https://storybook.js.org/docs/react/writing-docs/docs-page)
- [Addon Gallery](https://storybook.js.org/addons)

### Examples
- [BBC Psammead](https://bbc.github.io/psammead/)
- [Shopify Polaris](https://polaris.shopify.com/)
- [IBM Carbon](https://react.carbondesignsystem.com/)

### Tools
- [Chromatic](https://www.chromatic.com/) - Visual testing
- [Percy](https://percy.io/) - Visual regression
- [Happo](https://happo.io/) - Cross-browser testing