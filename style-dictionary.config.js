/**
 * @module style-dictionary.config
 * 
 * Legacy CommonJS wrapper for Style Dictionary configuration.
 * The actual configuration is in style-dictionary.config.mjs
 * 
 * This file exists for backwards compatibility with tools that
 * expect a CommonJS config file.
 */

// Note: Style Dictionary v5 is ESM-first
// This file exists only for backwards compatibility
console.warn('Using legacy CommonJS config. Please update to use style-dictionary.config.mjs directly.');

module.exports = {
  // Minimal config that points to the ESM config
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/tokens/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables'
      }]
    }
  }
};