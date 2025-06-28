# i18n Migration Plan for Terroir Core Design System

## Overview
This document outlines the migration plan for implementing full internationalization (i18n) support in the Terroir Core Design System. The system is already partially prepared with centralized error messages.

## Current State
- ✅ Centralized error messages in `lib/utils/errors/messages.ts`
- ✅ `getMessage()` function for consistent message retrieval
- ✅ Template support for dynamic values
- ✅ Placeholder i18n interfaces (`I18nErrorMessages`, `createLocalizedMessages`)
- ❌ No actual translation files
- ❌ No locale detection/switching
- ❌ No i18n for UI components (future)
- ❌ No number/date formatting

## Recommended Package: typesafe-i18n

### Why typesafe-i18n?
1. **100% Type Safety** - Critical for a design system
2. **Zero Runtime Overhead** - Translations are compiled
3. **Framework Agnostic** - Works with React, Vue, vanilla JS
4. **Small Bundle Size** - ~3KB core
5. **Great DX** - Auto-completion for all translation keys

### Alternative: i18next
- More mature ecosystem
- Better plugin support
- Larger community
- Consider if needing advanced features like:
  - Language detection
  - Backend loading
  - Caching strategies

## Migration Tasks

### Phase 1: Foundation (Week 1)
- [ ] Install typesafe-i18n and dev dependencies
  ```bash
  pnpm add typesafe-i18n
  pnpm add -D @typesafe-i18n/generator
  ```
- [ ] Set up typesafe-i18n configuration
  - Create `.typesafe-i18n.json` config
  - Set up base locale structure
  - Configure TypeScript generation
- [ ] Create locale directory structure
  ```
  locales/
  ├── en/
  │   ├── index.ts
  │   ├── errors.ts
  │   ├── components.ts
  │   └── tokens.ts
  ├── es/
  ├── fr/
  ├── de/
  └── i18n-types.ts (generated)
  ```
- [ ] Set up build scripts for i18n
  ```json
  "scripts": {
    "i18n:generate": "typesafe-i18n",
    "i18n:watch": "typesafe-i18n --watch"
  }
  ```

### Phase 2: Error Message Migration (Week 2)
- [ ] Convert `ERROR_MESSAGES` to i18n format
  ```typescript
  // Before: lib/utils/errors/messages.ts
  OPERATION_FAILED: (attempts: number) => `Operation failed after ${attempts} attempt(s)`
  
  // After: locales/en/errors.ts
  export default {
    operation: {
      failed: 'Operation failed after {attempts:number} attempt{attempts|plural}'
    }
  }
  ```
- [ ] Update `getMessage()` to use i18n
  ```typescript
  import { i18n } from '@lib/i18n';
  
  export function getMessage(key: MessageKey, ...args: any[]) {
    return i18n.errors[key](...args);
  }
  ```
- [ ] Create migration map for existing keys
- [ ] Update all error classes to use new system
- [ ] Ensure backward compatibility during migration

### Phase 3: Component Labels (Week 3)
- [ ] Define component translation structure
  ```typescript
  // locales/en/components.ts
  export default {
    button: {
      loading: 'Loading...',
      submit: 'Submit',
      cancel: 'Cancel'
    },
    form: {
      required: 'Required',
      optional: 'Optional'
    }
  }
  ```
- [ ] Create i18n context provider for React
- [ ] Add locale switching mechanism
- [ ] Implement RTL support detection

### Phase 4: Token Descriptions (Week 4)
- [ ] Translate design token descriptions
- [ ] Update Style Dictionary to use i18n
- [ ] Generate locale-specific documentation
- [ ] Add token name translations for non-English speakers

### Phase 5: Formatting & Pluralization
- [ ] Implement number formatting
  ```typescript
  i18n.format.number(1234.56) // "1,234.56" or "1.234,56"
  ```
- [ ] Implement date/time formatting
  ```typescript
  i18n.format.date(new Date()) // locale-specific format
  ```
- [ ] Set up pluralization rules
- [ ] Add currency formatting
- [ ] Handle relative time (e.g., "2 hours ago")

### Phase 6: Testing & Quality
- [ ] Add i18n-specific tests
  - [ ] Test all locales load correctly
  - [ ] Test fallback behavior
  - [ ] Test interpolation
  - [ ] Test pluralization
- [ ] Set up translation linting
  - [ ] Check for missing translations
  - [ ] Check for unused translations
  - [ ] Validate interpolation variables
- [ ] Create visual regression tests for RTL
- [ ] Performance testing with multiple locales

### Phase 7: Documentation & Tooling
- [ ] Document i18n architecture
- [ ] Create translation guide for contributors
- [ ] Set up translation management workflow
  - [ ] Export/import for translators
  - [ ] Review process
  - [ ] Version control strategy
- [ ] Add Storybook locale switcher
- [ ] Create locale detection utility

### Phase 8: Advanced Features (Optional)
- [ ] Lazy loading for locale bundles
- [ ] Automatic locale detection
- [ ] Translation caching strategy
- [ ] Integration with translation services (Crowdin, Lokalise)
- [ ] Create CLI for translation management
- [ ] Add locale-specific assets (images, icons)

## Implementation Example

### Current Code
```typescript
// lib/utils/errors/retry.ts
throw new NetworkError(getMessage('OPERATION_TIMEOUT', timeoutMs));
```

### Future i18n Code
```typescript
// lib/utils/errors/retry.ts
import { i18n } from '@lib/i18n';

throw new NetworkError(i18n.errors.operation.timeout({ ms: timeoutMs }));
```

### React Component Example
```tsx
// packages/react/Button.tsx
import { useI18n } from '@terroir/react/i18n';

export function Button({ loading, children }) {
  const { t } = useI18n();
  
  return (
    <button>
      {loading ? t.components.button.loading() : children}
    </button>
  );
}
```

## Performance Considerations

1. **Bundle Size**
   - Use dynamic imports for locale data
   - Only load active locale
   - Tree-shake unused translations

2. **Runtime Performance**
   - Compile translations at build time
   - Cache formatted messages
   - Avoid re-parsing on every render

3. **Build Time**
   - Generate types during build
   - Validate translations in CI
   - Optimize locale file size

## Success Criteria

- [ ] All error messages support i18n
- [ ] Component labels are translatable
- [ ] Documentation available in multiple languages
- [ ] No performance regression
- [ ] Type safety maintained
- [ ] Easy for contributors to add translations
- [ ] Seamless upgrade path

## Estimated Timeline

- **Phase 1-2**: 2 weeks (Foundation + Error Messages)
- **Phase 3-4**: 2 weeks (Components + Tokens)
- **Phase 5-6**: 2 weeks (Formatting + Testing)
- **Phase 7**: 1 week (Documentation)
- **Total**: ~7 weeks for full implementation

## Notes

1. Start with English + one other language (Spanish/French) to validate the system
2. Consider hiring professional translators for production use
3. Plan for ongoing translation maintenance
4. Set up automated checks for translation completeness
5. Consider cultural adaptations beyond just language

## References

- [typesafe-i18n Documentation](https://github.com/ivanhofer/typesafe-i18n)
- [i18next Documentation](https://www.i18next.com/)
- [FormatJS Guide](https://formatjs.io/docs/getting-started/installation)
- [Mozilla i18n Best Practices](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization)