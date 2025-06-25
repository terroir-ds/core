# DevContainer Configuration

This directory contains the development container configuration for the Terroir Core Design System.

## Configuration Files

- [`devcontainer.json`](./devcontainer.json) - Main devcontainer configuration
- [`Dockerfile`](./Dockerfile) - Container image definition

## Post-Create Setup

The post-create setup script has been moved to a shared location:

- **Script**: [`scripts/utils/post-create.sh`](../scripts/utils/post-create.sh)
- **Documentation**: [`scripts/utils/README.md`](../scripts/utils/README.md)

## Quick Start

1. **Install Prerequisites**:
   - Docker Desktop or compatible container runtime
   - VS Code with Remote-Containers extension
   - 1Password CLI (optional, for secret management)

2. **Environment Setup**:
   - Copy `.env.example` to `.env` (if exists)
   - Set `OP_SERVICE_ACCOUNT_TOKEN` for 1Password integration

3. **Open in Container**:
   - Open VS Code
   - Run "Remote-Containers: Open Folder in Container"
   - Wait for container build and post-create setup

## Features

The devcontainer provides:

- **Node.js 22**: Latest LTS with pnpm package manager
- **TypeScript**: Project-level installation (not global)
- **1Password Integration**: Secure secrets management
- **Git Configuration**: Automatic setup from 1Password
- **SSH Key Management**: Automatic loading of SSH keys
- **Playwright**: Browser automation with Chromium, Firefox, WebKit
- **Development Tools**: Pre-configured VS Code extensions

## Customization

To customize the devcontainer:

1. **Add VS Code Extensions**: Edit `customizations.vscode.extensions` in `devcontainer.json`
2. **Change Node Version**: Update the base image in `Dockerfile`
3. **Add System Packages**: Modify the `apt-get install` section in `Dockerfile`
4. **Configure Environment**: Add variables to `remoteEnv` in `devcontainer.json`

## Troubleshooting

For common issues and solutions, see:

- [Post-Create Troubleshooting](../scripts/utils/docs/setup/troubleshooting.md)
- [1Password Setup Guide](../scripts/utils/docs/setup/onepassword-setup.md)

## Security

The devcontainer follows security best practices:

- No hardcoded secrets
- Minimal installed packages
- Non-root user by default
- Secure handling of authentication tokens
- Input validation for all external data

For security details of the post-create script, see the [script documentation](../scripts/utils/README.md).
