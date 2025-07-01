# Bash/Zsh Script Testing Framework

This directory contains tests for the agent management scripts to ensure they work correctly and securely across different shells and environments.

## Testing Strategy

### 1. Unit Tests

- Test individual functions in isolation
- Mock external dependencies (docker, git, etc.)
- Verify error handling and edge cases

### 2. Integration Tests

- Test complete workflows
- Use Docker containers for isolation
- Verify actual command execution

### 3. Security Tests

- Input validation testing
- Injection attack prevention
- Permission and access control verification

### 4. Cross-Shell Compatibility

- Test with bash 4.x, bash 5.x, and zsh
- Verify POSIX compliance where needed
- Test macOS vs Linux differences

## Test Frameworks

We use multiple approaches:

1. **BATS (Bash Automated Testing System)** - For unit testing
2. **ShellSpec** - For BDD-style testing
3. **Custom security harness** - For security-specific tests
4. **Docker-based integration tests** - For full system testing

## Running Tests

```bash
# Run all tests
./run-tests.sh

# Run specific test suite
./run-tests.sh unit
./run-tests.sh integration
./run-tests.sh security

# Run with specific shell
SHELL=zsh ./run-tests.sh
SHELL=bash ./run-tests.sh
```

## Test Coverage

- agent-manager.sh: Full coverage of all commands
- setup-git-ssh.sh: Security-focused testing
- load-agent-config.sh: Configuration parsing tests
- Common utilities: Cross-shell compatibility

## Security Testing Focus

1. **Input Validation**
   - Command injection prevention
   - Path traversal prevention
   - Environment variable sanitization

2. **File Operations**
   - Permission verification
   - Atomic operations
   - Secure temp file handling

3. **Process Management**
   - Signal handling
   - Lock file security
   - Resource cleanup

4. **Cryptographic Operations**
   - SSH key validation
   - Secure deletion
   - Memory scrubbing
