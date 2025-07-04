# Script Utilities

This directory contains reusable utility scripts for the Terroir Core Design System.

## Scripts

### post-create.sh

**Version**: 3.2.0  
**Purpose**: Development environment setup script for Git, SSH, and 1Password integration  
**Usage**: Called automatically by devcontainer or manually for local setup

```bash
# Devcontainer usage (automatic)
# Configured in .devcontainer/devcontainer.json

# Manual usage
bash scripts/utils/post-create.sh
```

**Features**:

- 1Password integration for secure secrets management
- Automatic Git user configuration from 1Password
- SSH key loading and agent management
- Git SSH signing configuration
- Enhanced security with input validation and sanitization
- Comprehensive error handling and logging

**Documentation**:

- [1Password Setup Guide](./docs/setup/onepassword-setup.md)
- [Troubleshooting Guide](./docs/setup/troubleshooting.md)
- [Version History](./docs/history/version-history.md)

**Environment Variables**:

- `OP_SERVICE_ACCOUNT_TOKEN` - Required for 1Password authentication
- `OP_ACCOUNT` - Optional 1Password account identifier
- `GIT_SIGNING_KEY_ITEM` - Optional item name for Git signing key
- `GIT_CONFIG_ITEM` - Optional item name for Git configuration

**Security Features**:

- Command injection prevention
- Secure temporary file handling
- Input sanitization for all 1Password values
- Memory scrubbing for sensitive data
- Atomic file operations
- Network timeout protection

## Contributing

When adding new utility scripts:

1. Place the script in this directory
2. Add documentation to this README
3. Create detailed docs in `./docs/` if needed
4. Follow the existing security patterns
5. Include proper error handling and logging

## Script Standards

All utility scripts should:

- Use `set -euo pipefail` for safety
- Include comprehensive error handling
- Use the structured logger (when in TypeScript/Node)
- Follow the project's security guidelines
- Include inline documentation
- Support both automated and manual usage

## Security Documentation

### setup-git-ssh.sh Security

- [Security Hardening v3.5.0](./security-hardening-v3.5.0.md) - Latest security enhancements (rate limiting, enhanced validation)
- [Security Hardening v3.4.0](./security-hardening-v3.4.0.md) - Initial comprehensive security implementation
- [Security Recommendations](./setup-git-ssh-security-recommendations.md) - Future security improvements and research
