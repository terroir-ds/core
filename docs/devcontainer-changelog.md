# DevContainer Post-Create Script Changelog

## Version 3.2.0 (2025-06-25)

### Security Enhancements

- **Enhanced JSON validation**: Added `validate_json()` function with size limits and dangerous content detection
- **SSH key format validation**: Added `validate_ssh_key()` with proper format checks and size limits (up to 32KB)
- **Secure JSON extraction**: Added `extract_json_field()` with validation and length limits
- **Memory cleanup**: Added explicit cleanup of sensitive variables from memory
- **Input sanitization**: Enhanced validation for all user inputs and API responses

### Error Handling Improvements

- **Network diagnostics**: Added connectivity tests for network failures (ping, DNS resolution)
- **JSON response validation**: All JSON responses now validated before processing
- **Better error context**: More specific error messages for different failure modes
- **Null handling**: Improved handling of null/empty responses from 1Password

### Robustness Improvements

- **Bounds checking**: Better validation of vault IDs, item names, and field lengths
- **Secure cleanup**: Enhanced secure deletion of temporary files containing sensitive data
- **Edge case handling**: Better handling of malformed data and unexpected responses

### Technical Details

- Maximum SSH key size increased to 32KB (from 16KB)
- JSON response size limited to 1MB for security
- All field extractions now go through validated helper functions
- Added protection against JSON injection attacks
- Enhanced temporary file security with proper cleanup

---

## Version 3.1.0 (Previous)

### Features

- Enhanced SSH agent setup with better error handling
- Fixed duplicate function definitions
- Added shellcheck directives for cleaner static analysis
- Improved error messages with more context
- Optimized health check execution
- Better handling of stale SSH agents

### Security

- Command injection prevention
- Secure temporary file handling
- Atomic file operations
- Comprehensive error handling with timeouts
- Detailed logging and health checks

---

## Migration Notes

### From 3.1.x to 3.2.0

- No breaking changes
- Enhanced security and validation (backward compatible)
- Better error reporting for troubleshooting
- All existing .env files and configurations continue to work

### Recommended Actions

- No action required for existing setups
- New setups automatically use v3.2.0
- Review logs for any new validation warnings
