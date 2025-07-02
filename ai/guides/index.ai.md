# AI Documentation Guides

This directory contains core documentation and guides for understanding the system.

## Contents

### Core Documentation

- **[architecture.ai.md](./architecture.ai.md)** - System architecture and design decisions
- **[domain-concepts.ai.md](./domain-concepts.ai.md)** - Domain-specific terminology and concepts

## Note on Removed Files

The following files were removed as they contained outdated or redundant information:

- `contributing.ai.md` - Use methods (multi-pass-development) and patterns instead
- `legacy-patterns.ai.md` - Use scored patterns in `/ai/patterns/` instead

## When to Use These Guides

1. **Starting a new agent**: Read architecture.ai.md for system overview
2. **Confused about terminology**: Check domain-concepts.ai.md
3. **Adding new patterns/standards**: Follow contributing.ai.md
4. **Looking for code examples**: Check legacy-patterns.ai.md (but prefer patterns/)

## Note on Legacy Patterns

The legacy-patterns.ai.md file contains useful code examples but predates our pattern scoring system. When possible, use the scored patterns in `/ai/patterns/` instead, as they have been vetted for quality (4+ scores only).
