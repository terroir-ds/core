# Security Hardening Recommendations for setup-git-ssh.sh

> **Note**: Many of these recommendations have been implemented in v3.4.0.
> This document is retained for reference and future enhancements.

## Implementation Status

### ✅ Implemented in v3.4.0

- Process injection hardening (exact ssh-agent matching)
- Username sanitization with POSIX compliance
- Signal masking during critical operations
- Cleanup registry for temp files
- SSH agent socket validation
- Network error message sanitization
- Audit logging functionality
- Basic memory scrubbing

### ⏳ Future Enhancements

## 1. Process Injection Hardening

### SSH Agent Process Validation

Replace loose pattern matching with exact process name validation:

```bash
# Current (vulnerable to "fake-ssh-agent"):
if [[ "$agent_cmd" == *"ssh-agent"* ]]; then

# Recommended:
if [[ "$agent_cmd" =~ ^ssh-agent$ ]] || [[ "$agent_cmd" =~ ^/usr/bin/ssh-agent$ ]]; then
```

### Username Sanitization

Add sanitization before using environment variables:

```bash
# Add function:
sanitize_username() {
    local username="$1"
    # Remove all but alphanumeric, dash, underscore
    username="${username//[^a-zA-Z0-9_-]/}"
    # Limit length
    username="${username:0:32}"
    # Ensure not empty
    [ -z "$username" ] && username="user"
    echo "$username"
}

# Use in fallback:
local fallback_name=$(sanitize_username "${USER:-${USERNAME:-Developer}}")
```

## 2. TOCTOU Prevention

### Atomic File Operations

Use file descriptors to prevent TOCTOU:

```bash
# For temp key files:
exec 3>"$temp_key"  # Open file descriptor
flock -x 3          # Exclusive lock
# ... write key data ...
shred -vfzu /dev/fd/3 2>/dev/null
exec 3>&-           # Close descriptor
```

### Directory Operations

Use atomic operations for directory validation:

```bash
# Create and validate in one operation:
if temp_dir=$(mktemp -d -t "post-create-XXXXXX" 2>&1); then
    # Immediately set permissions before any other operation
    chmod 700 "$temp_dir" || { rmdir "$temp_dir"; return 1; }
fi
```

## 3. Resource Exhaustion Protection

### Rate Limit Random Number Generation

Cache rotation check decisions:

```bash
# Add at script start:
LAST_ROTATION_CHECK=0
ROTATION_CHECK_INTERVAL_TIME=60  # seconds

# In log function:
current_time=$(date +%s)
if [ $((current_time - LAST_ROTATION_CHECK)) -gt $ROTATION_CHECK_INTERVAL_TIME ]; then
    rotate_log_if_needed
    LAST_ROTATION_CHECK=$current_time
fi
```

### Limit .env File Processing

Add protection against malicious .env files:

```bash
# Add variable definition limits:
local vars_defined=0
local MAX_ENV_VARS=50

# In parsing loop:
if [ $vars_defined -ge $MAX_ENV_VARS ]; then
    log_warn "Reached maximum environment variable limit"
    break
fi
((vars_defined++))

# Prevent recursive variable expansion:
value="${value//\$/\\$}"  # Escape dollar signs
```

## 4. Signal Protection

### Mask Signals During Critical Operations

Add signal masking for sensitive operations:

```bash
# Function to run with signals masked:
with_signals_masked() {
    local saved_traps=$(trap -p)
    trap '' INT TERM HUP  # Mask signals
    "$@"
    local result=$?
    eval "$saved_traps"   # Restore traps
    return $result
}

# Use for key operations:
with_signals_masked process_ssh_key "$key_json" "$key_title"
```

## 5. Comprehensive Temp File Cleanup

### Guaranteed Cleanup Pattern

Use a cleanup registry:

```bash
# Global cleanup registry
CLEANUP_FILES=()
CLEANUP_DIRS=()

# Register for cleanup:
register_cleanup_file() {
    CLEANUP_FILES+=("$1")
}

# In cleanup function:
cleanup() {
    # Clean all registered files
    for file in "${CLEANUP_FILES[@]}"; do
        [ -f "$file" ] && rm -f "$file"
    done

    # Clean all registered directories
    for dir in "${CLEANUP_DIRS[@]}"; do
        [ -d "$dir" ] && rm -rf "$dir"
    done
}

# Usage:
temp_out=$(mktemp)
register_cleanup_file "$temp_out"
```

## 6. Enhanced SSH Agent Socket Validation

### Stricter Path Validation

Replace broad patterns with specific checks:

```bash
validate_ssh_socket_path() {
    local socket_path="$1"

    # Must be absolute path
    [[ "$socket_path" != /* ]] && return 1

    # Check against whitelist of valid directories
    case "$socket_path" in
        /tmp/ssh-????????????????/agent.[0-9]*)
            # Valid systemd-style path
            ;;
        /var/run/ssh-agent.pid-*)
            # Valid system agent path
            ;;
        "$HOME"/.ssh/agent.sock)
            # Valid user agent path
            ;;
        *)
            return 1
            ;;
    esac

    # Verify parent directory ownership
    local parent_dir=$(dirname "$socket_path")
    [ -O "$parent_dir" ] || return 1

    return 0
}
```

## 7. Adaptive Network Timeouts

### Implement Progressive Timeouts

Add network condition detection:

```bash
# Global timeout adjustment
NETWORK_TIMEOUT_BASE=15
NETWORK_TIMEOUT_CURRENT=$NETWORK_TIMEOUT_BASE
NETWORK_FAILURES=0

adjust_network_timeout() {
    local success=$1

    if [ "$success" -eq 0 ]; then
        # Successful operation, reduce timeout
        NETWORK_FAILURES=0
        NETWORK_TIMEOUT_CURRENT=$((NETWORK_TIMEOUT_CURRENT - 5))
        [ $NETWORK_TIMEOUT_CURRENT -lt $NETWORK_TIMEOUT_BASE ] && \
            NETWORK_TIMEOUT_CURRENT=$NETWORK_TIMEOUT_BASE
    else
        # Failed operation, increase timeout
        ((NETWORK_FAILURES++))
        NETWORK_TIMEOUT_CURRENT=$((NETWORK_TIMEOUT_BASE + NETWORK_FAILURES * 5))
        [ $NETWORK_TIMEOUT_CURRENT -gt 60 ] && NETWORK_TIMEOUT_CURRENT=60
    fi
}
```

## 8. Minimize Information Leakage

### Sanitize Error Messages

Remove specific network details:

```bash
# Instead of:
if ! ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1; then
    log_error "No internet connectivity detected"

# Use:
if ! check_network_connectivity >/dev/null 2>&1; then
    log_error "Network connectivity check failed"

# Where check_network_connectivity is:
check_network_connectivity() {
    # Try multiple methods silently
    curl -s --connect-timeout 5 https://1.1.1.1 >/dev/null 2>&1 || \
    nc -zw5 1.1.1.1 443 >/dev/null 2>&1
}
```

### Generic Error Responses

Replace specific error details with generic messages:

```bash
# Add error code mapping:
map_error_to_generic() {
    local error_code=$1
    case $error_code in
        124) echo "Operation timed out" ;;
        127) echo "Required tool not found" ;;
        *)   echo "Operation failed" ;;
    esac
}
```

## Additional Recommendations

### 1. Add Integrity Checking

Verify script hasn't been tampered with:

```bash
# At script start:
SCRIPT_HASH="sha256:expected_hash_here"
if ! echo "$SCRIPT_HASH  $0" | shasum -a 256 -c >/dev/null 2>&1; then
    echo "ERROR: Script integrity check failed" >&2
    exit 1
fi
```

### 2. Implement Audit Logging

Add security event logging:

```bash
audit_log() {
    local event_type="$1"
    local details="$2"
    local timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    echo "[$timestamp] AUDIT: $event_type - $details" >> "$LOG_FILE.audit"
}

# Usage:
audit_log "SSH_KEY_LOAD" "Loaded key: ${key_fingerprint:0:16}..."
audit_log "FAILED_AUTH" "1Password authentication failed"
```

### 3. Add Memory Scrubbing

Clear sensitive data more thoroughly:

```bash
secure_clear_var() {
    local var_name="$1"
    local var_value="${!var_name}"
    local var_len=${#var_value}

    # Overwrite with random data
    printf -v "$var_name" '%*s' "$var_len" | tr ' ' 'X'
    unset "$var_name"
}

# Usage:
secure_clear_var "private_key"
secure_clear_var "OP_SERVICE_ACCOUNT_TOKEN"
```

### 4. Implement Command Allowlisting

Restrict which commands can be executed:

```bash
ALLOWED_COMMANDS=(
    "/usr/bin/git"
    "/usr/bin/ssh-add"
    "/usr/bin/ssh-agent"
    "/usr/local/bin/op"
    "/usr/bin/jq"
)

validate_command() {
    local cmd="$1"
    local resolved_cmd=$(which "$cmd" 2>/dev/null)

    for allowed in "${ALLOWED_COMMANDS[@]}"; do
        [ "$resolved_cmd" = "$allowed" ] && return 0
    done

    return 1
}
```

### 5. Add Canary Tokens

Detect if sensitive files are accessed:

```bash
# Create canary file in .ssh
touch ~/.ssh/.canary
chmod 000 ~/.ssh/.canary

# Check periodically
check_canary() {
    if [ ! -f ~/.ssh/.canary ] || [ -r ~/.ssh/.canary ]; then
        audit_log "SECURITY_BREACH" "Canary file tampered"
        exit 1
    fi
}
```

## Implementation Priority

1. **High Priority**: Signal masking, TOCTOU fixes, process validation
2. **Medium Priority**: Resource exhaustion protection, temp file cleanup
3. **Low Priority**: Adaptive timeouts, audit logging

These enhancements would significantly improve the security posture of the script while maintaining usability.
