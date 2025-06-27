/**
 * @module svgo.config
 * 
 * SVGO (SVG Optimizer) configuration for the Terroir Core Design System.
 * 
 * Configures SVG optimization and token replacement for icon assets:
 * - Preserves viewBox for proper scaling
 * - Maintains IDs for accessibility and targeting
 * - Removes hardcoded fill/stroke colors
 * - Applies currentColor for theme compatibility
 * - Replaces design tokens with CSS custom properties
 * 
 * Optimization features:
 * - Multi-pass optimization for maximum compression
 * - Color attributes removal for theming
 * - Token placeholder replacement (e.g., {color.primary} → var(--color-primary))
 * - Accessibility-friendly output
 * 
 * Custom plugin:
 * - custom-token-replacer: Converts token references in SVG attributes
 *   to CSS custom properties for runtime theming
 */

module.exports = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          cleanupIds: false,
        },
      },
    },
    {
      name: 'removeAttributesBySelector',
      params: {
        selectors: [
          {
            selector: '[fill]',
            attributes: 'fill',
          },
          {
            selector: '[stroke]',
            attributes: 'stroke',
          },
        ],
      },
    },
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [
          {
            fill: 'currentColor',
          },
        ],
      },
    },
    {
      name: 'custom-token-replacer',
      type: 'visitor',
      fn: () => {
        return {
          element: {
            enter: (node, parentNode) => {
              // Replace token references in attributes
              if (node.attributes) {
                Object.keys(node.attributes).forEach((attr) => {
                  const value = node.attributes[attr];
                  if (typeof value === 'string' && value.includes('{')) {
                    // This would be replaced during build with actual token values
                    node.attributes[attr] = value.replace(
                      /\{([^}]+)\}/g,
                      (match, token) => `var(--${token.replace(/\./g, '-')})`
                    );
                  }
                });
              }
            },
          },
        };
      },
    },
  ],
};