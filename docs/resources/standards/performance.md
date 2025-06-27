# Performance Standards

## Overview

Performance best practices for a fast, efficient design system.

## Build Performance

### Code Splitting

````typescript
// Dynamic imports for large components
const ColorPicker = lazy(() => import('./ColorPicker'));

// Route-based splitting
const AdminPanel = lazy(() => import('./routes/AdminPanel'));
```text
### Tree Shaking

```typescript
// ❌ DON'T import entire library
import * as utils from '@terroir/core';

// ✅ DO import specific functions
import { generateColors, validateContrast } from '@terroir/core';
```text
### Bundle Size Monitoring

```json
{
  "scripts": {
    "analyze": "webpack-bundle-analyzer build/stats.json"
  }
}
```text
Set size budgets:
```javascript
// webpack.config.js
performance: {
  maxAssetSize: 250000, // 250kb
  maxEntrypointSize: 250000,
  hints: 'error'
}
```text
## Runtime Performance

### Memoization

```typescript
import { useMemo, memo } from 'react';

// Memoize expensive calculations
const processedData = useMemo(() => {
  return expensiveProcess(rawData);
}, [rawData]);

// Memoize components
export const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* render */}</div>;
});
```text
### Debouncing & Throttling

```typescript
import { debounce, throttle } from '@utils/performance';

// Debounce search input
const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// Throttle scroll events
const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 16); // 60fps
```text
### Virtual Scrolling

```typescript
// For large lists
import { VirtualList } from '@tanstack/react-virtual';

function LargeList({ items }) {
  return (
    <VirtualList
      height={600}
      itemCount={items.length}
      itemSize={50}
      renderItem={({ index }) => (
        <ListItem item={items[index]} />
      )}
    />
  );
}
```text
## Asset Optimization

### Image Optimization

```typescript
// Use next-gen formats
import { optimizeImage } from '@utils/assets';

await optimizeImage('logo.png', {
  formats: ['webp', 'avif'],
  sizes: [320, 640, 1280],
  quality: 85
});
```text
### Font Loading

```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>

/* Font display swap */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;
}
```text
### SVG Optimization

```typescript
// Optimize with SVGO
import { optimize } from 'svgo';

const result = optimize(svgString, {
  plugins: [
    'preset-default',
    'prefixIds',
    'removeViewBox'
  ]
});
```text
## CSS Performance

### Critical CSS

```typescript
// Extract critical CSS
import { extractCritical } from '@emotion/server';

const { css, ids } = extractCritical(html);
```text
### CSS-in-JS Optimization

```typescript
// Static extraction where possible
const styles = css`
  color: ${theme.colors.primary};
  padding: ${theme.spacing.md};
`;

// Avoid dynamic styles in loops
// ❌ BAD
items.map(item => css`color: ${item.color}`)

// ✅ GOOD
items.map(item => ({ color: item.color }))
```text
## Measurement

### Performance Tracking

```typescript
import { measureTime } from '@utils/logger';

// Measure operations
await measureTime('generate-palette', async () => {
  await generateColorPalette(sourceColor);
});

// Browser Performance API
performance.mark('myFeature-start');
// ... feature code ...
performance.mark('myFeature-end');
performance.measure('myFeature', 'myFeature-start', 'myFeature-end');
```text
### Web Vitals

```typescript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getLCP(console.log);  // Largest Contentful Paint
```text
## Caching Strategies

### Computation Caching

```typescript
import { memoize } from '@utils/performance';

const expensiveOperation = memoize((input: string) => {
  // Complex calculation
  return result;
});
```text
### HTTP Caching

```typescript
// Set cache headers
res.set({
  'Cache-Control': 'public, max-age=31536000', // 1 year for assets
  'ETag': generateETag(content)
});

// Service Worker caching
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```text
## Performance Budgets

### Set Targets

```javascript
// performance.config.js
export const budgets = {
  javascript: 150 * 1024,      // 150kb
  css: 50 * 1024,              // 50kb
  images: 500 * 1024,          // 500kb
  fonts: 100 * 1024,           // 100kb
  total: 800 * 1024,           // 800kb

  // Runtime metrics
  fcp: 1800,                   // First Contentful Paint < 1.8s
  lcp: 2500,                   // Largest Contentful Paint < 2.5s
  fid: 100,                    // First Input Delay < 100ms
  cls: 0.1,                    // Cumulative Layout Shift < 0.1
};
```text
### Continuous Monitoring

```json
{
  "scripts": {
    "perf:check": "bundlesize",
    "perf:analyze": "webpack-bundle-analyzer",
    "perf:lighthouse": "lighthouse http://localhost:3000"
  }
}
````

## Best Practices

1. **Measure First**: Profile before optimizing
2. **Set Budgets**: Define performance goals
3. **Lazy Load**: Split code and load on demand
4. **Cache Wisely**: Cache expensive operations
5. **Monitor Continuously**: Track metrics in production

## Tools

- `webpack-bundle-analyzer` - Bundle analysis
- `bundlesize` - Size monitoring
- `lighthouse` - Performance auditing
- `web-vitals` - Core metrics tracking
- Chrome DevTools - Profiling
