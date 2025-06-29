# Documentation Standards

## File Naming Conventions

### General Documentation Files

Use **kebab-case** (lowercase with hyphens) for all documentation files:

- ✅ `token-architecture.md`
- ✅ `api-reference.md`
- ✅ `getting-started.md`
- ❌ `token_architecture.md` (avoid underscores)
- ❌ `TokenArchitecture.md` (avoid PascalCase)
- ❌ `SECURITY-GUIDE.md` (avoid all caps except for special files)

### Special Root-Level Files

Use **UPPERCASE** for standard project files that tools expect:

- `README.md` - Project overview
- `LICENSE` - License information
- `CHANGELOG.md` - Version history
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community standards
- `SECURITY.md` - Security policies

### Directory Structure

```markdown
project/
├── README.md                    # UPPERCASE - standard file
├── LICENSE                      # UPPERCASE - standard file
├── CLAUDE.md                    # UPPERCASE - project-specific important file
├── docs/
│   ├── getting-started.md      # kebab-case
│   ├── api-reference.md        # kebab-case
│   ├── architecture/
│   │   ├── system-overview.md  # kebab-case
│   │   └── data-flow.md        # kebab-case
│   └── guides/
│       ├── deployment.md       # kebab-case
│       └── troubleshooting.md  # kebab-case
└── .devcontainer/
    ├── devcontainer.json       # lowercase - config file
    └── post-create.sh          # kebab-case - script file
```

## Why Kebab-Case?

1. **URL-friendly**: No encoding needed in web URLs
2. **Readable**: Easy to parse visually
3. **Cross-platform**: Works on all filesystems
4. **Standard**: Most common in open source projects
5. **SEO-friendly**: Search engines handle hyphens well

## Migration Checklist

When renaming existing files:

1. Use `git mv` to preserve history
2. Update all references in other files
3. Update any links in README or docs
4. Check for hardcoded paths in scripts
5. Update CI/CD configurations if needed

## Examples

### Good Examples

- `docs/api-reference.md`
- `docs/guides/getting-started.md`
- `docs/architecture/token-system.md`
- `.devcontainer/security-audit.md`

### Bad Examples

- `docs/API_Reference.md` (avoid underscores and caps)
- `docs/GettingStarted.md` (avoid PascalCase)
- `docs/ARCHITECTURE.md` (avoid all caps)
- `docs/token system.md` (avoid spaces)
