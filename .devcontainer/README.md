# DevContainer Configuration

This directory contains the development container configuration for the Terroir Core Design System.

## Configuration Files

- [`devcontainer.json`](./devcontainer.json) - Main devcontainer configuration
- [`Dockerfile`](./Dockerfile) - Container image definition  
- [`post-create.sh`](./post-create.sh) - Post-creation setup script (v3.2.0 - current)

## Documentation

For detailed documentation, setup guides, troubleshooting, and version history, see [`/docs`](./docs/).

## Quick Start

1. **For new setups**: The devcontainer will automatically run the v3.2.0 post-create script
2. **Language-specific setup**: Add commands like `npm install` to your `devcontainer.json` postCreateCommand

## Key Features

The devcontainer setup provides:

- **1Password Integration**: Secure secrets management
- **Git Configuration**: Automatic user setup from 1Password  
- **SSH Key Management**: Automatic loading of SSH keys
- **Git Signing**: SSH-based commit signing
- **Language Agnostic**: No language-specific dependencies (add as needed)

## Security & Reliability

The v3.2.0 `post-create.sh` script includes:

- Command injection prevention
- Secure temporary file handling
- Atomic file operations
- Comprehensive error handling with timeouts
- Enhanced SSH agent management
- Detailed logging and health checks
- **NEW**: Enhanced JSON validation and SSH key format validation
- **NEW**: Improved memory handling for sensitive data
- **NEW**: Better network error detection and recovery

For complete version history and technical details, see [`docs/history/`](./docs/history/).
