const StyleDictionary = require('style-dictionary');

// Custom transforms
StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: (token) => token.attributes.category === 'size',
  transformer: (token) => `${token.value}px`
});

// Custom formats
StyleDictionary.registerFormat({
  name: 'css/variables-themed',
  formatter: function({ dictionary, options }) {
    const theme = options.theme || 'light';
    return `:root[data-theme="${theme}"] {\n` +
      dictionary.allTokens.map(token => {
        return `  --${token.name}: ${token.value};`;
      }).join('\n') +
      '\n}';
  }
});

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true
          }
        },
        {
          destination: 'tokens-light.css',
          format: 'css/variables-themed',
          options: {
            theme: 'light'
          },
          filter: (token) => !token.filePath.includes('dark')
        },
        {
          destination: 'tokens-dark.css',
          format: 'css/variables-themed',
          options: {
            theme: 'dark'
          },
          filter: (token) => !token.filePath.includes('light')
        }
      ]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6'
        },
        {
          destination: 'tokens.d.ts',
          format: 'typescript/es6-declarations'
        }
      ]
    },
    json: {
      transformGroup: 'js',
      buildPath: 'dist/json/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested'
        },
        {
          destination: 'tokens-flat.json',
          format: 'json/flat'
        }
      ]
    }
  }
};