/**
 * @module commitlint.config
 * 
 * Commitlint configuration for the Terroir Core Design System.
 * 
 * Enforces conventional commit message format to:
 * - Maintain consistent commit history
 * - Enable automated changelog generation
 * - Improve project maintainability
 * - Support semantic versioning
 * 
 * Commit types:
 * - feat: New features (triggers minor version)
 * - fix: Bug fixes (triggers patch version)
 * - docs: Documentation changes
 * - style: Code formatting (no logic changes)
 * - refactor: Code restructuring (no behavior changes)
 * - perf: Performance improvements
 * - test: Test additions or modifications
 * - build: Build system changes
 * - ci: CI/CD configuration changes
 * - chore: Maintenance tasks
 * - revert: Reverting previous commits
 * 
 * Rules:
 * - Maximum header length: 100 characters
 * - Scope required for feat and fix commits
 * - Follows @commitlint/config-conventional standards
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, missing semicolons, etc
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvements
        'test',     // Adding missing tests
        'build',    // Changes to build process
        'ci',       // Changes to CI configuration
        'chore',    // Other changes that don't modify src or test files
        'revert'    // Reverts a previous commit
      ]
    ],
    // Allow longer commit messages for detailed descriptions
    'header-max-length': [2, 'always', 100],
    // Require scope for certain types (optional but recommended)
    'scope-empty': [2, 'never', ['feat', 'fix']]
  }
};