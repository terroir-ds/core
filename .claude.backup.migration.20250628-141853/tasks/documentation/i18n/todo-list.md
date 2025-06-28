# i18n Implementation Todo List

Quick reference checklist for implementing internationalization in Terroir Core.

## Prerequisites
- [ ] Evaluate and choose i18n package (recommended: typesafe-i18n)
- [ ] Get stakeholder buy-in on supported locales
- [ ] Define translation workflow and responsibilities

## Implementation Tasks

### 1. Setup & Configuration
- [ ] Install i18n package and dependencies
- [ ] Create locale directory structure
- [ ] Configure TypeScript generation
- [ ] Set up build scripts
- [ ] Add locale detection utility

### 2. Error System Migration
- [ ] Convert ERROR_MESSAGES to i18n format
- [ ] Update getMessage() function
- [ ] Migrate all error usage points
- [ ] Maintain backward compatibility
- [ ] Update error tests

### 3. Component Internationalization
- [ ] Define component message structure
- [ ] Create React i18n context/hooks
- [ ] Add locale switching
- [ ] Implement RTL support
- [ ] Update component documentation

### 4. Design Token i18n
- [ ] Translate token descriptions
- [ ] Update Style Dictionary integration
- [ ] Generate locale-specific docs
- [ ] Add translated token names

### 5. Formatting Support
- [ ] Number formatting
- [ ] Date/time formatting
- [ ] Currency formatting
- [ ] Pluralization rules
- [ ] Relative time

### 6. Testing Infrastructure
- [ ] Unit tests for all locales
- [ ] Translation completeness checks
- [ ] Visual regression for RTL
- [ ] Performance benchmarks
- [ ] Accessibility testing per locale

### 7. Developer Experience
- [ ] Translation guidelines
- [ ] Contributor documentation
- [ ] Storybook locale switcher
- [ ] VSCode extension setup
- [ ] Translation linting

### 8. Production Readiness
- [ ] Lazy loading strategy
- [ ] Caching implementation
- [ ] Bundle size optimization
- [ ] Translation management process
- [ ] Monitoring and analytics

## Quick Start Commands

```bash
# When starting implementation:
pnpm add typesafe-i18n
pnpm add -D @typesafe-i18n/generator

# Add to package.json scripts:
"i18n:generate": "typesafe-i18n",
"i18n:watch": "typesafe-i18n --watch",
"i18n:check": "typesafe-i18n --check"
```

## Key Files to Create

```
locales/
├── en/
│   ├── index.ts      # Main locale exports
│   ├── errors.ts     # Error messages
│   ├── components.ts # UI strings
│   └── tokens.ts     # Design token descriptions
├── .typesafe-i18n.json
└── i18n-types.ts     # Generated types
```

## Migration Priority

1. **High Priority**: Error messages (already centralized)
2. **Medium Priority**: Component labels and ARIA text
3. **Low Priority**: Documentation and token descriptions

## Remember

- Start with 2 languages max for initial implementation
- Keep English as source of truth
- Use professional translators for production
- Plan for ongoing maintenance
- Consider cultural differences, not just translation