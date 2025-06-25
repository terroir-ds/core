# Post-Create Script Version History

## Version 3.2.0 (Current)

**Released**: 2025-06-25

### New Features

- Enhanced JSON parsing with validation
- Improved SSH key format validation
- Better memory handling for sensitive data
- More granular error codes
- Enhanced network error recovery
- Stricter input validation for edge cases
- Added process monitoring for SSH agent

### Security Improvements

- Enhanced JSON validation with size limits and content checks
- Better SSH key validation with format and size constraints
- Improved memory handling to prevent sensitive data leaks
- More robust network timeout handling

### Bug Fixes in 3.2.0

- Fixed edge cases in JSON parsing
- Improved SSH key validation logic
- Better error recovery for network issues

## Version 3.1.0

**Released**: 2025-06-25

### Improvements

- Enhanced SSH agent setup with better error handling
- Fixed duplicate function definitions
- Added shellcheck directives for cleaner static analysis
- Improved error messages with more context
- Optimized health check execution
- Better handling of stale SSH agents

### Bug Fixes in 3.1.0

- Fixed duplicate `get_file_size` function
- Fixed stat command duplication in op binary check
- Fixed `wc -l` output with extra spaces
- Fixed variable scoping in health check subshells

### Code Quality Improvements

- Added `LOCK_RETRY_DIVISOR` constant
- Extracted `display_setup_summary` function
- Added timeout to health checks (5 seconds)
- Better SSH agent PID validation

## Version 3.0.0

**Released**: 2025-06-25

### Breaking Changes

- Removed language-specific setup (NPM) - now handled in devcontainer.json
- Script focuses solely on developer environment setup

### Major Features

- Complete separation of concerns
- Language-agnostic implementation
- Simplified architecture

## Version 2.3.0

**Released**: 2025-06-25

### Final Improvements

- Performance optimizations
- Enhanced user experience
- Comprehensive security hardening

## Version 2.0.0

**Released**: 2025-06-25

### Major Changes

- Complete security hardening
- Comprehensive error handling with stack traces
- Atomic file operations
- Detailed logging system
- Health checks and verification
- Retry logic for network operations
- Input validation for all user data

### Security Fixes

- Command injection prevention
- Secure temporary file handling
- Race condition prevention
- No sensitive data in logs
- Proper cleanup on exit

### Features

- Configurable log levels (LOG_LEVEL environment variable)
- Graceful degradation when 1Password unavailable
- SSH agent persistence across sessions
- Automatic shell RC file updates

## Version 1.0.0 (Historical)

**Released**: Previous version

### Original Features

- Basic 1Password integration
- Git configuration from 1Password
- SSH key loading
- Git SSH signing
- NPM dependency installation

### Known Issues (Fixed in v2.0)

- Command injection vulnerabilities
- Insecure temporary files
- Race conditions
- Poor error handling
- Silent failures
- No health checks

## Migration Notes

The v2.0 script is backward compatible and can be used as a drop-in replacement.
The only configuration change needed is to ensure proper log directory permissions.
