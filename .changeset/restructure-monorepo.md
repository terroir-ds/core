---
'@terroir/core': patch
---

Restructure monorepo for proper package organization

- Move core library from root `/lib` to `/packages/core/src`
- Update all import paths and configurations
- Set up proper package.json for @terroir/core package
- Configure build and test scripts for monorepo structure

This change establishes a scalable monorepo structure that supports
multiple packages and proper changesets integration.
