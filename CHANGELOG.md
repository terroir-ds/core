# Terroir Core Monorepo

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial monorepo setup with pnpm workspaces
- @terroir/core package with utilities and color system
- @terroir/docs documentation site with Astro/Starlight
- Turbo build system for optimized builds
- ESLint and TypeScript configuration
- Automated testing with Vitest
- GitHub Actions for CI/CD
- Changesets for version management
- Contributing guidelines and security policy

### Changed

- Restructured from single package to monorepo
- Migrated documentation to Astro-based site
- Updated all imports to use @terroir/core package name

### Infrastructure

- Added .editorconfig for consistent formatting
- Added SECURITY.md for vulnerability reporting
- Added CONTRIBUTING.md with development guidelines
- Configured Turbo for parallel builds and caching
- Set up automated release workflow with Changesets

For package-specific changes, see the individual CHANGELOG.md files in each package directory.
