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