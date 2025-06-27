#!/bin/bash
set -euo pipefail

# shellcheck disable=SC2155  # Declare and assign separately to avoid masking return values
# shellcheck disable=SC1090  # Can't follow non-constant source
# shellcheck disable=SC2086  # Double quote to prevent globbing (used intentionally)

# Secure Post-Create Script for Devcontainer
# Version: 3.2.0
# 
# Purpose: Configure developer environment (Git, SSH, 1Password)
# Language-specific setup should be handled in devcontainer.json
# 
# Security hardened implementation with:
# - Command injection prevention
# - Secure temporary file handling
# - Atomic operations
# - Comprehensive error handling
# - Detailed logging
# - Health checks
# 
# Version 3.2.0 improvements:
# - Enhanced JSON parsing with validation
# - Improved SSH key format validation
# - Better memory handling for sensitive data
# - More granular error codes
# - Enhanced network error recovery
# - Stricter input validation for edge cases
# - Added process monitoring for SSH agent

# ============================================================================
# CONFIGURATION
# ============================================================================

readonly SCRIPT_VERSION="3.2.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Load environment variables from .env file early
if [ -f "/workspaces/core/.env" ]; then
    # Parse .env file securely for critical variables needed early
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^#.*$ ]] && continue
        [[ -z "$line" ]] && continue
        
        # Parse key=value pairs
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Remove quotes from value
            value="${value%\"}"
            value="${value#\"}"
            value="${value%\'}"
            value="${value#\'}"
            
            # Only set specific variables needed early
            case "$key" in
                OP_SERVICE_ACCOUNT_TOKEN)
                    export "$key=$value"
                    ;;
            esac
        fi
    done < "/workspaces/core/.env"
fi

# Network and retry configuration
readonly MAX_RETRIES=3
readonly RETRY_DELAY=2
readonly NETWORK_TIMEOUT=15  # Reduced from 30s for better UX
readonly HEALTH_CHECK_TIMEOUT=5  # Timeout for individual health checks

# SSH and security constants
readonly SSH_KEY_BATCH_SIZE=5  # Process SSH keys in batches
readonly SSH_KEY_BATCH_DELAY=0.5  # Delay between batches
readonly MIN_DISK_SPACE=$((10 * 1024 * 1024))  # 10MB minimum free space
readonly LOG_ROTATION_CHECK_INTERVAL=100  # Check every N log entries
readonly MIN_EMAIL_LENGTH=3  # Minimum valid email length
readonly MAX_EMAIL_LENGTH=254
readonly MAX_JSON_SIZE=$((1024 * 1024))  # 1MB max JSON response size
readonly SSH_KEY_MIN_LENGTH=200  # Minimum SSH key length in bytes
readonly SSH_KEY_MAX_LENGTH=32768  # Maximum SSH key length in bytes (32KB)

# ============================================================================
# EARLY LOGGING SETUP (needed for error reporting)
# ============================================================================

# Log levels
readonly LOG_ERROR=0
readonly LOG_WARN=1
readonly LOG_INFO=2
readonly LOG_DEBUG=3

# Default log level
LOG_LEVEL=${LOG_LEVEL:-$LOG_INFO}

# Simple early logging function (before colors are set up)
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local level_str=""
    
    case $level in
        $LOG_ERROR) level_str="ERROR" ;;
        $LOG_WARN)  level_str="WARN " ;;
        $LOG_INFO)  level_str="INFO " ;;
        $LOG_DEBUG) level_str="DEBUG" ;;
    esac
    
    # Early logging to stderr only
    if [ $level -le $LOG_LEVEL ]; then
        echo "[$timestamp] [$level_str] $message" >&2
    fi
}

log_error() { log $LOG_ERROR "$@"; }
log_warn()  { log $LOG_WARN "$@"; }
log_info()  { log $LOG_INFO "$@"; }
log_debug() { log $LOG_DEBUG "$@"; }

# Create secure log directory
readonly LOG_DIR="${TMPDIR:-/tmp}/post-create-logs-$$"

# Check disk space before creating log directory
check_disk_space() {
    local path="${1:-/tmp}"
    local available=$(df -k "$path" 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
    if [ "$available" -lt $((MIN_DISK_SPACE / 1024)) ]; then
        log_error "Insufficient disk space in $path (need ${MIN_DISK_SPACE} bytes)"
        return 1
    fi
    return 0
}

# Ensure we have disk space
if ! check_disk_space "${TMPDIR:-/tmp}"; then
    exit 1
fi

mkdir -p "$LOG_DIR"
chmod 700 "$LOG_DIR"
readonly LOG_FILE="$LOG_DIR/post-create-$(date +%Y%m%d-%H%M%S).log"
readonly MAX_LOG_SIZE=$((1024 * 1024))  # 1MB max log size

# Initialize log file with restricted permissions
touch "$LOG_FILE"
chmod 600 "$LOG_FILE"

# Get file size in bytes (cross-platform)
get_file_size() {
    local file="$1"
    if [ -f "$file" ]; then
        stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Log rotation function
rotate_log_if_needed() {
    if [ -f "$LOG_FILE" ] && [ $(get_file_size "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
        local rotated_log="${LOG_FILE}.1"
        mv "$LOG_FILE" "$rotated_log"
        gzip "$rotated_log" 2>/dev/null || true
        touch "$LOG_FILE"
        chmod 600 "$LOG_FILE"
        log_info "Rotated log file (size exceeded ${MAX_LOG_SIZE} bytes)"
    fi
}

# Instance locking
readonly LOCK_FILE="${TMPDIR:-/tmp}/.post-create-${USER:-$(whoami)}.lock"
readonly LOCK_TIMEOUT=300  # 5 minutes
readonly LOCK_RETRY_DIVISOR=2  # Divisor for calculating max lock retries

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        Linux*)     echo "linux" ;;
        Darwin*)    echo "macos" ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}
readonly PLATFORM=$(detect_platform)

# Security settings
umask 077  # Restrictive file permissions
# Verify umask is properly set
if [ "$(umask)" != "0077" ]; then
    log_error "Failed to set restrictive umask (current: $(umask))"
    exit 1
fi
# set -o noclobber  # Disabled - conflicts with mktemp usage

# Set secure IFS (Internal Field Separator)
IFS=$' \t\n'

# Sanitize PATH
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Clear potentially dangerous environment variables
unset LD_PRELOAD LD_LIBRARY_PATH DYLD_INSERT_LIBRARIES
unset LD_AUDIT LD_DEBUG BASH_ENV ENV CDPATH
unset PERL5LIB PERL5OPT PYTHONPATH PYTHONHOME

# ============================================================================
# ENHANCED LOGGING (with colors and file output)
# ============================================================================

# Color support for interactive terminals
if [ -t 1 ] && [ "${TERM:-}" != "dumb" ]; then
    readonly COLOR_RED='\033[0;31m'
    readonly COLOR_YELLOW='\033[0;33m'
    readonly COLOR_GREEN='\033[0;32m'
    readonly COLOR_BLUE='\033[0;34m'
    readonly COLOR_RESET='\033[0m'
else
    readonly COLOR_RED=''
    readonly COLOR_YELLOW=''
    readonly COLOR_GREEN=''
    readonly COLOR_BLUE=''
    readonly COLOR_RESET=''
fi

# Enhanced log function with colors and file output
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local level_str_plain=""
    local level_str_color=""
    
    case $level in
        $LOG_ERROR) 
            level_str_plain="ERROR"
            level_str_color="${COLOR_RED}ERROR${COLOR_RESET}"
            ;;
        $LOG_WARN)  
            level_str_plain="WARN "
            level_str_color="${COLOR_YELLOW}WARN ${COLOR_RESET}"
            ;;
        $LOG_INFO)  
            level_str_plain="INFO "
            level_str_color="${COLOR_GREEN}INFO ${COLOR_RESET}"
            ;;
        $LOG_DEBUG) 
            level_str_plain="DEBUG"
            level_str_color="${COLOR_BLUE}DEBUG${COLOR_RESET}"
            ;;
    esac
    
    # Check log rotation periodically
    if [ -f "$LOG_FILE" ] && [ $((RANDOM % LOG_ROTATION_CHECK_INTERVAL)) -eq 0 ]; then
        rotate_log_if_needed
    fi
    
    # Write to log file (plain text, no colors)
    if [ -f "$LOG_FILE" ]; then
        echo "[$timestamp] [$level_str_plain] $message" >> "$LOG_FILE"
    fi
    
    # Write to console if appropriate level
    if [ $level -le $LOG_LEVEL ]; then
        if [ -n "$COLOR_RESET" ]; then
            echo -e "[$timestamp] [$level_str_color] $message" >&2
        else
            echo "[$timestamp] [$level_str_plain] $message" >&2
        fi
    fi
}

# Progress indicator for long operations
show_progress() {
    local message="$1"
    local current="${2:-0}"
    local total="${3:-100}"
    
    if [ "$total" -gt 0 ]; then
        local percent=$((current * 100 / total))
        printf "\r%-50s [%3d%%]" "$message" "$percent" >&2
        if [ "$current" -eq "$total" ]; then
            echo "" >&2  # New line when complete
        fi
    else
        printf "\r%-50s" "$message" >&2
    fi
}

# ============================================================================
# ERROR HANDLING
# ============================================================================

# Comprehensive signal handling
trap 'cleanup_and_exit $? $LINENO' ERR
trap 'signal_handler SIGINT' INT
trap 'signal_handler SIGTERM' TERM
trap 'signal_handler SIGHUP' HUP

cleanup_and_exit() {
    local exit_code=$1
    local line_number=$2
    log_error "Script failed with exit code $exit_code at line $line_number"
    log_error "Stack trace:"
    
    local frame=0
    while caller $frame; do
        frame=$((frame + 1))
    done | while read line func file; do
        log_error "  at $func ($file:$line)"
    done
    
    cleanup_on_error
    exit $exit_code
}

signal_handler() {
    local signal=$1
    log_warn "Received signal: $signal"
    log_warn "Performing graceful shutdown..."
    cleanup_on_error
    exit 130  # 128 + SIGINT(2)
}

# Normal cleanup function
cleanup() {
    # Remove any temporary files
    if [ -n "${TEMP_DIR:-}" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    
    # Clear sensitive variables
    unset OP_SERVICE_ACCOUNT_TOKEN
    unset GIT_CONFIG_ITEM
    unset GIT_SIGNING_KEY_ITEM
    
    # Release lock
    release_lock
}

# Cleanup function for errors
cleanup_on_error() {
    log_info "Performing emergency cleanup..."
    
    cleanup
    
    # Remove log directory if empty
    if [ -n "${LOG_DIR:-}" ] && [ -d "$LOG_DIR" ]; then
        rmdir "$LOG_DIR" 2>/dev/null || true
    fi
    
    # Show recovery suggestions
    log_info ""
    log_info "Recovery suggestions:"
    log_info "  1. Check the log file for details: $LOG_FILE"
    log_info "  2. Ensure you have internet connectivity"
    log_info "  3. Verify your 1Password service account token is valid"
    log_info "  4. Try running the script again: $SCRIPT_DIR/$SCRIPT_NAME"
    log_info "  5. For manual setup instructions, see: /workspaces/core/docs/manual-setup.md"
}

# ============================================================================
# LOCKING FUNCTIONS
# ============================================================================

# Acquire exclusive lock
acquire_lock() {
    local lock_acquired=false
    local lock_start=$(date +%s)
    local retry_count=0
    local max_lock_retries=$((LOCK_TIMEOUT / LOCK_RETRY_DIVISOR))  # Maximum retries based on timeout
    
    while ! $lock_acquired; do
        if (set -C; echo $$ > "$LOCK_FILE") 2>/dev/null; then
            lock_acquired=true
            log_debug "Acquired lock (PID: $$)"
        else
            retry_count=$((retry_count + 1))
            
            # Check if lock is stale
            if [ -f "$LOCK_FILE" ]; then
                local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "0")
                
                # Validate PID format
                if [[ ! "$lock_pid" =~ ^[0-9]+$ ]]; then
                    log_warn "Invalid PID in lock file, removing"
                    rm -f "$LOCK_FILE"
                    continue
                fi
                
                if ! kill -0 "$lock_pid" 2>/dev/null; then
                    log_warn "Removing stale lock from PID $lock_pid"
                    rm -f "$LOCK_FILE"
                    continue
                fi
            fi
            
            # Check timeout
            local current_time=$(date +%s)
            if [ $((current_time - lock_start)) -gt $LOCK_TIMEOUT ] || [ $retry_count -gt $max_lock_retries ]; then
                log_error "Failed to acquire lock after ${LOCK_TIMEOUT}s (${retry_count} attempts)"
                return 1
            fi
            
            log_debug "Waiting for lock (held by PID: ${lock_pid:-unknown})... (attempt $retry_count/$max_lock_retries)"
            sleep 2
        fi
    done
    
    return 0
}

# Release lock
release_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "0")
        if [ "$lock_pid" = "$$" ]; then
            rm -f "$LOCK_FILE"
            log_debug "Released lock"
        fi
    fi
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Check if running in CI/CD environment
is_ci_environment() {
    [ -n "${CI:-}" ] || [ -n "${CONTINUOUS_INTEGRATION:-}" ] || \
    [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${GITLAB_CI:-}" ] || \
    [ -n "${JENKINS_URL:-}" ] || [ -n "${TEAMCITY_VERSION:-}" ]
}

# Check if running in container
is_container() {
    [ -f /.dockerenv ] || [ -n "${KUBERNETES_SERVICE_HOST:-}" ] || \
    grep -q '/docker/' /proc/1/cgroup 2>/dev/null || \
    grep -q '/lxc/' /proc/1/cgroup 2>/dev/null
}

# Note: get_file_size is already defined earlier in the script

# ============================================================================
# SECURITY FUNCTIONS
# ============================================================================

# Create secure temporary directory
create_secure_temp() {
    local temp_dir
    
    # Check available disk space (need at least 10MB)
    local available_space
    available_space=$(df "${TMPDIR:-/tmp}" | awk 'NR==2 {print $4}')
    if [ "${available_space:-0}" -lt 10240 ]; then
        log_error "Insufficient disk space in temp directory"
        return 1
    fi
    
    temp_dir=$(mktemp -d -t "post-create-XXXXXX") || {
        log_error "Failed to create temporary directory"
        return 1
    }
    
    chmod 700 "$temp_dir" || {
        rm -rf "$temp_dir"
        log_error "Failed to set permissions on temporary directory"
        return 1
    }
    
    echo "$temp_dir"
}

# Validate string contains only safe characters
validate_safe_string() {
    local input="$1"
    local allowed_pattern="$2"
    
    if [[ ! "$input" =~ $allowed_pattern ]]; then
        return 1
    fi
    return 0
}

# Validate vault ID format (alphanumeric and hyphens only)
validate_vault_id() {
    local vault="$1"
    validate_safe_string "$vault" '^[a-zA-Z0-9-]+$'
}

# Validate item name (alphanumeric, spaces, hyphens, underscores)
validate_item_name() {
    local item="$1"
    validate_safe_string "$item" '^[a-zA-Z0-9 _-]+$'
}

# Validate email format (RFC 5322 simplified)
validate_email() {
    local email="$1"
    # More comprehensive regex that handles edge cases
    local email_regex='^[a-zA-Z0-9][a-zA-Z0-9._%+-]{0,63}@[a-zA-Z0-9][a-zA-Z0-9.-]{0,62}\.[a-zA-Z]{2,}$'
    
    # Additional checks
    if [[ ${#email} -lt $MIN_EMAIL_LENGTH ]]; then
        return 1  # Email too short
    fi
    
    if [[ ${#email} -gt $MAX_EMAIL_LENGTH ]]; then
        return 1  # Email too long
    fi
    
    if [[ "$email" =~ \.\.  ]] || [[ "$email" =~ ^\. ]] || [[ "$email" =~ \.$  ]]; then
        return 1  # Invalid dot placement
    fi
    
    # Check for common typos and suspicious patterns
    if [[ "$email" =~ @.*@ ]] || [[ "$email" =~ ^@ ]] || [[ "$email" =~ @$ ]]; then
        return 1  # Multiple @ or @ at start/end
    fi
    
    [[ "$email" =~ $email_regex ]]
}

# Validate JSON format and size
validate_json() {
    local json_data="$1"
    local max_size="${2:-$MAX_JSON_SIZE}"
    
    # Check size
    if [ ${#json_data} -gt $max_size ]; then
        log_error "JSON data exceeds maximum size ($max_size bytes)"
        return 1
    fi
    
    # Validate JSON format using jq
    if ! echo "$json_data" | jq empty 2>/dev/null; then
        log_error "Invalid JSON format"
        return 1
    fi
    
    # Check for potentially dangerous content (avoid false positives on normal JSON)
    if echo "$json_data" | grep -qE '(\$\(|`|<script[^>]*>|javascript:[^"'\'']*[^"'\''])'; then
        log_error "JSON contains potentially dangerous content"
        return 1
    fi
    
    return 0
}

# Validate SSH key format and content
validate_ssh_key() {
    local key_data="$1"
    local key_type="${2:-any}"
    
    # Check key length
    if [ ${#key_data} -lt $SSH_KEY_MIN_LENGTH ]; then
        log_error "SSH key too short (minimum $SSH_KEY_MIN_LENGTH bytes)"
        return 1
    fi
    
    if [ ${#key_data} -gt $SSH_KEY_MAX_LENGTH ]; then
        log_error "SSH key too long (maximum $SSH_KEY_MAX_LENGTH bytes)"
        return 1
    fi
    
    # Check for valid SSH key format (public or private)
    if ! echo "$key_data" | grep -qE '^(ssh-rsa|ssh-dss|ssh-ed25519|ecdsa-sha2-nistp(256|384|521)|sk-ssh-ed25519|sk-ecdsa-sha2-nistp256|-----BEGIN)'; then
        log_error "Invalid SSH key format (must start with valid key type or -----BEGIN)"
        return 1
    fi
    
    # Check for BEGIN/END markers (private key detection)
    if echo "$key_data" | grep -qE '(BEGIN|END).*(PRIVATE KEY|RSA PRIVATE KEY|DSA PRIVATE KEY|EC PRIVATE KEY|OPENSSH PRIVATE KEY)'; then
        # This is expected for private keys
        if ! echo "$key_data" | grep -qE '^-----BEGIN'; then
            log_error "Malformed private key format"
            return 1
        fi
    fi
    
    # Validate base64 content (skip header and comments)
    local key_body
    key_body=$(echo "$key_data" | grep -v '^-----' | grep -v '^Comment:' | tr -d '\n\r ')
    if [ -n "$key_body" ] && ! echo "$key_body" | grep -qE '^[A-Za-z0-9+/=]+$'; then
        log_error "SSH key contains invalid base64 characters"
        return 1
    fi
    
    return 0
}

# Secure JSON field extraction with validation
extract_json_field() {
    local json_data="$1"
    local field_path="$2"
    local default_value="${3:-}"
    local max_length="${4:-1024}"
    
    # Validate JSON first
    if ! validate_json "$json_data"; then
        echo "$default_value"
        return 1
    fi
    
    # Extract field value
    local value
    value=$(echo "$json_data" | jq -r "$field_path // empty" 2>/dev/null)
    
    # Handle extraction errors
    if [ $? -ne 0 ]; then
        log_warn "Failed to extract field: $field_path"
        echo "$default_value"
        return 1
    fi
    
    # Check if value is null or empty
    if [ -z "$value" ] || [ "$value" = "null" ]; then
        echo "$default_value"
        return 0
    fi
    
    # Check length
    if [ ${#value} -gt $max_length ]; then
        log_warn "Field value exceeds maximum length: $field_path"
        echo "$default_value"
        return 1
    fi
    
    echo "$value"
    return 0
}

# Secure command execution with validation
secure_op_command() {
    local op_command="$1"
    shift
    local args=("$@")
    
    # Validate op is available
    if ! command -v op >/dev/null 2>&1; then
        log_error "1Password CLI (op) not found. Please ensure 'op' is installed and in PATH"
        return 1
    fi
    
    # Verify op binary location (should be in standard paths)
    local op_path=$(command -v op)
    case "$op_path" in
        /usr/bin/op|/usr/local/bin/op|/opt/1password/op|/home/*/.local/bin/op)
            log_debug "Using op from: $op_path"
            # Verify binary is not writable by others
            local op_owner=$(stat -c '%U' "$op_path" 2>/dev/null || stat -f '%Su' "$op_path" 2>/dev/null)
            if [ -w "$op_path" ] && [ "$op_owner" != "root" ] && [ "$op_owner" != "$USER" ]; then
                log_error "Security warning: op binary is writable by non-owner"
                return 1
            fi
            ;;
        *)
            log_error "Refused: op binary in unexpected location: $op_path"
            return 1
            ;;
    esac
    
    # Execute with timeout and capture both stdout and stderr
    local temp_out temp_err
    temp_out=$(mktemp)
    temp_err=$(mktemp)
    
    if timeout $NETWORK_TIMEOUT op "$op_command" "${args[@]}" >"$temp_out" 2>"$temp_err"; then
        local output
        output=$(cat "$temp_out")
        
        # Validate JSON output if it looks like JSON
        if [[ "$output" =~ ^\s*[\{\[] ]]; then
            if ! validate_json "$output"; then
                log_error "Invalid JSON response from 1Password CLI"
                rm -f "$temp_out" "$temp_err"
                return 1
            fi
        fi
        
        echo "$output"
        rm -f "$temp_out" "$temp_err"
        return 0
    else
        local exit_code=$?
        local error_msg=$(cat "$temp_err" 2>/dev/null || echo "Unknown error")
        
        # Handle specific error cases
        case $exit_code in
            124) # Timeout
                log_error "op command timed out after ${NETWORK_TIMEOUT}s: $op_command"
                ;;
            *)
                log_error "op command failed (exit code $exit_code): $error_msg"
                ;;
        esac
        
        # Check for common network issues
        if echo "$error_msg" | grep -qiE "(connection refused|network unreachable|name resolution|timeout)"; then
            log_warn "Network connectivity issue detected. Check your internet connection."
            # Test basic connectivity
            if ! ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1; then
                log_error "No internet connectivity detected"
            elif ! nslookup my.1password.com >/dev/null 2>&1; then
                log_error "Cannot resolve 1Password domain. Check DNS settings."
            fi
        fi
        
        rm -f "$temp_out" "$temp_err"
        return $exit_code
    fi
}

# ============================================================================
# ATOMIC FILE OPERATIONS
# ============================================================================

# Write file atomically
atomic_write() {
    local target_file="$1"
    local content="$2"
    local mode="${3:-644}"
    
    local temp_file
    temp_file=$(mktemp "${target_file}.XXXXXX")
    
    # Write content to temporary file
    echo "$content" > "$temp_file"
    chmod "$mode" "$temp_file"
    
    # Atomically move to target
    mv -f "$temp_file" "$target_file"
}

# Append to file atomically
atomic_append() {
    local target_file="$1"
    local content="$2"
    
    local temp_file
    temp_file=$(mktemp "${target_file}.XXXXXX")
    
    # Copy existing content if file exists
    if [ -f "$target_file" ]; then
        cp "$target_file" "$temp_file"
    fi
    
    # Append new content
    echo "$content" >> "$temp_file"
    
    # Atomically move to target
    mv -f "$temp_file" "$target_file"
}

# ============================================================================
# 1PASSWORD FUNCTIONS
# ============================================================================

# Load environment variables from .env file
load_env_file() {
    # Load environment variables securely
    if [ -f "/workspaces/core/.env" ]; then
        log_info "Loading environment variables from .env file"
        
        # Parse .env file securely
        while IFS= read -r line; do
            # Skip comments and empty lines
            [[ "$line" =~ ^#.*$ ]] && continue
            [[ -z "$line" ]] && continue
            
            # Parse key=value pairs
            if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                
                # Remove quotes from value
                value="${value%\"}"
                value="${value#\"}"
                value="${value%\'}"
                value="${value#\'}"
                
                # Only set specific variables
                case "$key" in
                    OP_SERVICE_ACCOUNT_TOKEN|GIT_CONFIG_ITEM|GIT_SIGNING_KEY_ITEM)
                        export "$key=$value"
                        log_debug "Set $key"
                        ;;
                esac
            fi
        done < "/workspaces/core/.env"
    fi
}

# Initialize 1Password
init_onepassword() {
    log_info "Initializing 1Password integration..."
    
    # Validate token exists
    if [ -z "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]; then
        log_error "OP_SERVICE_ACCOUNT_TOKEN not set. Please set this environment variable or add it to .env file"
        return 1
    fi
    
    # Test authentication
    if ! secure_op_command "vault" "list" "--format=json" >/dev/null; then
        log_error "Failed to authenticate with 1Password. Please verify your service account token is valid"
        return 1
    fi
    
    # Get default vault
    local vaults
    vaults=$(secure_op_command "vault" "list" "--format=json")
    DEFAULT_VAULT=$(extract_json_field "$vaults" '.[0].id' "" 128)
    
    if ! validate_vault_id "$DEFAULT_VAULT"; then
        log_error "Invalid vault ID format: $DEFAULT_VAULT"
        return 1
    fi
    
    export DEFAULT_VAULT
    log_info "Successfully initialized 1Password with vault: $DEFAULT_VAULT"
    return 0
}

# Get item from 1Password with retry logic
op_get_item() {
    local item_name="$1"
    local vault="${2:-$DEFAULT_VAULT}"
    local retry_count=0
    
    # Validate inputs
    if ! validate_item_name "$item_name"; then
        log_error "Invalid item name: $item_name"
        return 1
    fi
    
    if ! validate_vault_id "$vault"; then
        log_error "Invalid vault ID: $vault"
        return 1
    fi
    
    # Retry logic
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if result=$(secure_op_command "item" "get" "$item_name" "--vault" "$vault" "--format=json"); then
            echo "$result"
            return 0
        fi
        
        ((retry_count++))
        log_warn "Failed to get item '$item_name' (attempt $retry_count/$MAX_RETRIES)"
        sleep $RETRY_DELAY
    done
    
    log_error "Failed to get item '$item_name' after $MAX_RETRIES attempts"
    return 1
}

# ============================================================================
# GIT CONFIGURATION
# ============================================================================

# Extract name from 1Password item with multiple pattern support
extract_name_from_item() {
    local item_json="$1"
    local name=""
    
    # Pattern 1: Try first_name + last_name combination
    local first_name last_name
    first_name=$(extract_json_field "$item_json" '.fields[] | select(.label | ascii_downcase | test("^first[ _-]?name$")).value' "" 100)
    last_name=$(extract_json_field "$item_json" '.fields[] | select(.label | ascii_downcase | test("^last[ _-]?name$")).value' "" 100)
    
    if [ -n "$first_name" ] && [ -n "$last_name" ]; then
        name="$first_name $last_name"
        log_debug "Found name from first/last fields: $name"
        echo "$name"
        return 0
    fi
    
    # Pattern 2: Look for various full name field patterns
    local name_patterns=(
        "name"
        "full_name"
        "fullname"
        "full-name"
        "display_name"
        "displayname"
        "user_name"
        "username"
        "real_name"
        "realname"
    )
    
    for pattern in "${name_patterns[@]}"; do
        # Use case-insensitive matching with spaces/underscores/hyphens
        local found_name
        found_name=$(extract_json_field "$item_json" ".fields[] | select(.label | ascii_downcase | test(\"^${pattern//_/[ _-]?}\$\")).value" "" 200)
        if [ -n "$found_name" ]; then
            name="$found_name"
            log_debug "Found name from field pattern '$pattern': $name"
            echo "$name"
            return 0
        fi
    done
    
    # Pattern 3: Try to extract from title if it looks like a name
    local title
    title=$(extract_json_field "$item_json" '.title' "" 200)
    if [ -n "$title" ] && [[ "$title" =~ ^[A-Za-z][A-Za-z\'\ \-\.]+$ ]] && [ ${#title} -le 100 ]; then
        name="$title"
        log_debug "Using title as name: $name"
        echo "$name"
        return 0
    fi
    
    # No name found
    echo ""
    return 1
}

# Extract email from 1Password item with multiple pattern support
extract_email_from_item() {
    local item_json="$1"
    local email=""
    
    # Pattern 1: Look for EMAIL type field
    email=$(extract_json_field "$item_json" '.fields[] | select(.type == "EMAIL").value' "" 254)
    if [ -n "$email" ]; then
        log_debug "Found email from EMAIL type field: $email"
        echo "$email"
        return 0
    fi
    
    # Pattern 2: Look for various email field label patterns
    local email_patterns=(
        "email"
        "e-mail"
        "email_address"
        "email-address"
        "emailaddress"
        "mail"
        "email_addr"
        "primary_email"
        "work_email"
        "user_email"
    )
    
    for pattern in "${email_patterns[@]}"; do
        # Use case-insensitive matching with spaces/underscores/hyphens
        local found_email
        found_email=$(extract_json_field "$item_json" ".fields[] | select(.label | ascii_downcase | test(\"^${pattern//_/[ _-]?}\$\")).value" "" 254)
        if [ -n "$found_email" ]; then
            email="$found_email"
            log_debug "Found email from field pattern '$pattern': $email"
            echo "$email"
            return 0
        fi
    done
    
    # Pattern 3: Look for any field value that looks like an email
    local all_values
    all_values=$(echo "$item_json" | jq -r '.fields[].value // empty' 2>/dev/null || true)
    while IFS= read -r value; do
        # Basic email pattern check
        if [[ "$value" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] && [ ${#value} -le 254 ]; then
            email="$value"
            log_debug "Found email from field value scan: $email"
            echo "$email"
            return 0
        fi
    done <<< "$all_values"
    
    # No email found
    echo ""
    return 1
}

# Sanitize Git user name
sanitize_git_name() {
    local name="$1"
    
    # Remove leading/trailing whitespace
    name=$(echo "$name" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    
    # Remove control characters and non-printable characters
    name=$(echo "$name" | tr -d '[:cntrl:]')
    
    # Replace multiple spaces with single space
    name=$(echo "$name" | tr -s ' ')
    
    # Limit length to reasonable maximum (128 characters)
    if [ ${#name} -gt 128 ]; then
        name="${name:0:128}"
    fi
    
    # Ensure name contains at least one letter
    if ! [[ "$name" =~ [A-Za-z] ]]; then
        log_warn "Name contains no letters: '$name'"
        echo ""
        return 1
    fi
    
    # Remove dangerous characters that could cause issues
    name=$(echo "$name" | sed 's/[<>|;&$`\\]//g')
    
    echo "$name"
}

# Sanitize email address
sanitize_email() {
    local email="$1"
    
    # Remove leading/trailing whitespace
    email=$(echo "$email" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    
    # Remove mailto: prefix if present
    email="${email#mailto:}"
    
    # Convert to lowercase for consistency
    email=$(echo "$email" | tr '[:upper:]' '[:lower:]')
    
    # Remove control characters
    email=$(echo "$email" | tr -d '[:cntrl:]')
    
    # Remove dangerous characters but keep valid email chars
    email=$(echo "$email" | sed 's/[^a-zA-Z0-9._%+-@]//g')
    
    # Ensure single @ symbol
    local at_count=$(echo "$email" | tr -cd '@' | wc -c)
    if [ "$at_count" -ne 1 ]; then
        log_warn "Email has $at_count @ symbols: '$email'"
        echo ""
        return 1
    fi
    
    echo "$email"
}

configure_git_user() {
    log_info "Configuring Git user..."
    
    if [ -z "${GIT_CONFIG_ITEM:-}" ]; then
        log_warn "GIT_CONFIG_ITEM not set, skipping Git user configuration"
        return 0
    fi
    
    local item_json
    if ! item_json=$(op_get_item "$GIT_CONFIG_ITEM"); then
        log_error "Failed to get Git config from 1Password (item: $GIT_CONFIG_ITEM). Verify the item exists and is accessible"
        return 1
    fi
    
    # Extract user information using secure extraction
    local name email
    
    # Enhanced name extraction with multiple patterns
    name=$(extract_name_from_item "$item_json")
    
    # Enhanced email extraction with multiple patterns
    email=$(extract_email_from_item "$item_json")
    
    # Validate and set name
    if [ -z "$name" ]; then
        log_warn "No name found in Git config item"
    else
        # Sanitize name (remove control characters, limit length)
        name=$(sanitize_git_name "$name")
        if [ -n "$name" ]; then
            git config --global user.name "$name"
            log_info "Set Git user.name: $name"
        else
            log_warn "Name sanitization resulted in empty value"
        fi
    fi
    
    # Validate and set email
    if [ -z "$email" ]; then
        log_warn "No email found in Git config item"
    else
        # Sanitize email
        email=$(sanitize_email "$email")
        if [ -n "$email" ] && validate_email "$email"; then
            git config --global user.email "$email"
            log_info "Set Git user.email: $email"
        else
            log_error "Invalid email format after sanitization: '$email'"
        fi
    fi
    
    return 0
}

# ============================================================================
# SSH AGENT MANAGEMENT
# ============================================================================

setup_ssh_agent() {
    log_info "Setting up SSH agent..."
    
    # Check for existing agent
    if [ -n "${SSH_AUTH_SOCK:-}" ]; then
        if ssh-add -l &>/dev/null; then
            log_info "Using existing SSH agent with $(ssh-add -l | wc -l | tr -d ' ') keys"
            return 0
        elif [ $? -eq 1 ]; then
            log_debug "SSH agent exists but has no keys"
            return 0
        else
            log_debug "SSH agent socket exists but agent is not responding"
            unset SSH_AUTH_SOCK SSH_AGENT_PID
        fi
    fi
    
    # Start new agent
    local agent_env="$HOME/.ssh/agent.env"
    
    # Use file locking to prevent race conditions
    # Check if flock is available (Linux/BSD)
    if command -v flock >/dev/null 2>&1; then
        (
            flock -x 200
        
        # Check again inside lock
        if [ -f "$agent_env" ]; then
            # shellcheck disable=SC1090
            source "$agent_env" >/dev/null 2>&1 || true
            if [ -n "${SSH_AGENT_PID:-}" ] && kill -0 "$SSH_AGENT_PID" 2>/dev/null; then
                if ssh-add -l &>/dev/null || [ $? -eq 1 ]; then
                    log_info "Loaded existing SSH agent (PID: $SSH_AGENT_PID)"
                    return 0
                fi
            fi
            # Clean up stale environment file
            rm -f "$agent_env"
        fi
        
        # Start new agent
        log_info "Starting new SSH agent"
        local agent_output
        agent_output=$(ssh-agent -s) || {
            log_error "Failed to start SSH agent"
            return 1
        }
        echo "$agent_output" > "$agent_env"
        chmod 600 "$agent_env"
        
        ) 200>"$agent_env.lock"
    else
        # Fallback without flock (macOS/other)
        log_debug "flock not available, using simple check"
        if [ -f "$agent_env" ]; then
            # shellcheck disable=SC1090
            source "$agent_env" >/dev/null 2>&1 || true
            if [ -n "${SSH_AGENT_PID:-}" ] && ps -p "$SSH_AGENT_PID" >/dev/null 2>&1; then
                if ssh-add -l &>/dev/null || [ $? -eq 1 ]; then
                    log_info "Loaded existing SSH agent (PID: $SSH_AGENT_PID)"
                    return 0
                fi
            fi
            # Clean up stale environment file
            rm -f "$agent_env"
        fi
        
        # Start new agent
        log_info "Starting new SSH agent"
        local agent_output
        agent_output=$(ssh-agent -s) || {
            log_error "Failed to start SSH agent"
            return 1
        }
        echo "$agent_output" > "$agent_env"
        chmod 600 "$agent_env"
    fi
    
    # Source the agent environment
    # shellcheck disable=SC1090
    source "$agent_env" || {
        log_error "Failed to source SSH agent environment"
        return 1
    }
    export SSH_AUTH_SOCK SSH_AGENT_PID
    
    # Verify agent is working
    if ! ssh-add -l &>/dev/null && [ $? -ne 1 ]; then
        log_error "SSH agent started but not responding"
        return 1
    fi
    
    log_info "SSH agent started successfully (PID: $SSH_AGENT_PID)"
    
    # Update shell RC files
    setup_ssh_agent_persistence
    
    return 0
}

setup_ssh_agent_persistence() {
    log_info "Setting up SSH agent persistence..."
    
    local agent_script='
# SSH agent environment
if [ -f ~/.ssh/agent.env ]; then
    . ~/.ssh/agent.env >/dev/null
    # Verify agent is still running
    if ! ps -p $SSH_AGENT_PID >/dev/null 2>&1; then
        # Agent died, start a new one
        # This can happen after system restarts or crashes
        ssh-agent -s > ~/.ssh/agent.env
        . ~/.ssh/agent.env >/dev/null
    fi
    export SSH_AUTH_SOCK SSH_AGENT_PID
fi
'
    
    # Update shell RC files safely
    for rc_file in ~/.bashrc ~/.zshrc ~/.profile ~/.bash_profile; do
        if [ -f "$rc_file" ]; then
            # Create backup
            cp "$rc_file" "$rc_file.backup.$$"
            
            # Remove existing agent setup safely
            local temp_rc=$(mktemp)
            grep -v -F "# SSH agent environment" "$rc_file" | \
            awk '/^$/ && ssh_block {next} {print; if (/# SSH agent environment/) ssh_block=1; else if (/^$/) ssh_block=0}' > "$temp_rc"
            
            # Add new setup
            echo "$agent_script" >> "$temp_rc"
            
            # Replace atomically
            mv "$temp_rc" "$rc_file"
            rm -f "$rc_file.backup.$$"
            
            log_debug "Updated $rc_file"
        fi
    done
    
    # System-wide setup (if permitted)
    if [ -d /etc/profile.d ] && [ -w /etc/profile.d ]; then
        atomic_write "/etc/profile.d/ssh-agent.sh" "$agent_script" 755
        log_info "Created /etc/profile.d/ssh-agent.sh"
    fi
}

# ============================================================================
# SSH KEY MANAGEMENT
# ============================================================================

# Process a single SSH key
process_ssh_key() {
    local key_json="$1"
    local key_title="$2"
    
    # Create secure temporary file
    local temp_key
    temp_key=$(mktemp -p "$TEMP_DIR")
    chmod 600 "$temp_key"
    
    # Extract private key using secure extraction
    local private_key
    private_key=$(extract_json_field "$key_json" '.fields[] | select(.label == "private key").ssh_formats.openssh.value' "" $SSH_KEY_MAX_LENGTH)
    
    if [ -z "$private_key" ]; then
        private_key=$(extract_json_field "$key_json" '.fields[] | select(.type == "SSHKEY").value' "" $SSH_KEY_MAX_LENGTH)
    fi
    
    if [ -z "$private_key" ]; then
        log_warn "No private key found for: $key_title"
        return 1
    fi
    
    # Validate SSH key format
    if ! validate_ssh_key "$private_key"; then
        log_error "Invalid SSH key format for: $key_title"
        return 1
    fi
    
    # Write key to temp file
    echo "$private_key" > "$temp_key"
    
    # Add to agent
    local add_output
    add_output=$(ssh-add "$temp_key" 2>&1)
    local add_result=$?
    
    # Clean up immediately with secure deletion
    if command -v shred >/dev/null 2>&1; then
        shred -vfz -n 3 "$temp_key" 2>/dev/null
    else
        # Fallback: overwrite with random data before deletion
        dd if=/dev/urandom of="$temp_key" bs=1k count=10 2>/dev/null || true
        rm -f "$temp_key"
    fi
    
    # Clear sensitive variable from memory
    unset private_key
    
    # Check result
    if [ $add_result -eq 0 ]; then
        log_info "Added SSH key: $key_title"
        return 0
    elif echo "$add_output" | grep -q "already added"; then
        log_debug "SSH key already loaded: $key_title"
        return 0
    else
        log_error "Failed to add SSH key: $key_title - $add_output"
        return 1
    fi
}

# Load all SSH keys from 1Password
load_ssh_keys() {
    log_info "Loading SSH keys from 1Password..."
    
    local keys_json
    if ! keys_json=$(secure_op_command "item" "list" "--categories" "SSH Key" "--vault" "$DEFAULT_VAULT" "--format=json"); then
        log_error "Failed to list SSH keys from vault '$DEFAULT_VAULT'. Check vault permissions and connectivity"
        return 1
    fi
    
    local key_count=0
    local loaded_count=0
    local failed_count=0
    
    # Get all key IDs with validation
    local key_ids=()
    while IFS= read -r key_id; do
        [ -z "$key_id" ] && continue
        [ "$key_id" = "null" ] && continue
        if validate_safe_string "$key_id" '^[a-zA-Z0-9-]+$' && [ ${#key_id} -le 128 ]; then
            key_ids+=("$key_id")
            key_count=$((key_count + 1))
        else
            log_warn "Skipping key with invalid ID format: ${key_id:0:20}..."
        fi
    done < <(echo "$keys_json" | jq -r '.[].id // empty' 2>/dev/null || true)
    
    # Process keys with progress indicator and batch optimization
    if [ "$key_count" -gt 0 ]; then
        log_info "Found $key_count SSH keys to process"
        
        local i=0
        local batch_count=0
        
        for key_id in "${key_ids[@]}"; do
            i=$((i + 1))
            show_progress "Loading SSH keys" "$i" "$key_count"
            
            # Batch processing optimization
            if [ $batch_count -ge $SSH_KEY_BATCH_SIZE ] && [ $batch_count -gt 0 ]; then
                log_debug "Pausing between batches to avoid rate limits"
                sleep $SSH_KEY_BATCH_DELAY
                batch_count=0
            fi
            
            local key_json
            if ! key_json=$(op_get_item "$key_id"); then
                log_warn "Failed to get key: $key_id"
                failed_count=$((failed_count + 1))
                continue
            fi
            
            local key_title
            key_title=$(extract_json_field "$key_json" '.title' "Unnamed Key" 100)
            
            if process_ssh_key "$key_json" "$key_title"; then
                loaded_count=$((loaded_count + 1))
            else
                failed_count=$((failed_count + 1))
            fi
            
            batch_count=$((batch_count + 1))
        done
        
        show_progress "Loading SSH keys" "$key_count" "$key_count"  # Complete
    fi
    
    # Report summary
    log_info "SSH key loading complete: $loaded_count loaded, $failed_count failed, $key_count total"
    
    # Return success if at least one key was loaded
    [ $loaded_count -gt 0 ]
}

# ============================================================================
# GIT SIGNING CONFIGURATION
# ============================================================================

configure_git_signing() {
    log_info "Configuring Git SSH signing..."
    
    # Check if already configured
    if [ -f ~/.ssh/git_signing_key.pub ] && [ -n "$(git config --global user.signingkey 2>/dev/null)" ]; then
        log_info "Git signing already configured"
        return 0
    fi
    
    # Try to find signing key
    local key_names=("${GIT_SIGNING_KEY_ITEM:-}" "Git Signing Key" "GitHub SSH Key")
    local key_found=false
    
    for key_name in "${key_names[@]}"; do
        [ -z "$key_name" ] && continue
        
        if ! validate_item_name "$key_name"; then
            log_warn "Skipping invalid key name: $key_name"
            continue
        fi
        
        log_debug "Trying signing key: $key_name"
        
        local key_json
        if ! key_json=$(op_get_item "$key_name" 2>/dev/null); then
            continue
        fi
        
        # Extract public key using secure extraction
        local public_key
        public_key=$(extract_json_field "$key_json" '.fields[] | select(.type == "SSHKEY" or .label == "public key").value' "" $SSH_KEY_MAX_LENGTH)
        
        # Filter to get only the public key part
        public_key=$(echo "$public_key" | grep -E '^ssh-' | head -1)
        
        if [ -z "$public_key" ]; then
            log_debug "No public key found for: $key_name"
            continue
        fi
        
        # Get email for comment
        local email
        email=$(git config --global user.email 2>/dev/null || echo "")
        
        # Save public key
        if [ -n "$email" ]; then
            atomic_write ~/.ssh/git_signing_key.pub "$public_key $email" 644
        else
            atomic_write ~/.ssh/git_signing_key.pub "$public_key" 644
        fi
        
        # Configure Git
        git config --global gpg.format ssh
        git config --global user.signingkey ~/.ssh/git_signing_key.pub
        git config --global commit.gpgsign true
        git config --global tag.gpgsign true
        
        # Setup allowed signers
        if [ -n "$email" ]; then
            atomic_write ~/.ssh/allowed_signers "$email $public_key" 644
            git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
        fi
        
        log_info "Configured Git signing with: $key_name"
        key_found=true
        break
    done
    
    if ! $key_found; then
        log_warn "No Git signing key found in 1Password"
    fi
    
    return 0
}

# ============================================================================
# HEALTH CHECKS
# ============================================================================

perform_health_checks() {
    log_info "Performing health checks..."
    
    local checks_passed=0
    local checks_total=0
    local check_results_file
    check_results_file=$(mktemp)
    
    # Run checks in parallel for better performance
    {
        # Check: Git configuration
        timeout $HEALTH_CHECK_TIMEOUT bash -c '
            if [ -n "$(git config --global user.name)" ] && [ -n "$(git config --global user.email)" ]; then
                echo "git:1:✓ Git user configured"
            else
                echo "git:0:✗ Git user not fully configured"
            fi
        ' 2>/dev/null || echo "git:0:✗ Git configuration check timed out"
    } >> "$check_results_file" &
    
    {
        # Check: SSH agent
        timeout $HEALTH_CHECK_TIMEOUT bash -c '
            if ssh-add -l &>/dev/null; then
                key_count=$(ssh-add -l | wc -l | tr -d " ")
                echo "ssh:1:✓ SSH agent running with $key_count keys"
            else
                echo "ssh:0:✗ SSH agent not running or no keys loaded"
            fi
        ' 2>/dev/null || echo "ssh:0:✗ SSH agent check timed out"
    } >> "$check_results_file" &
    
    {
        # Check: Git signing
        timeout $HEALTH_CHECK_TIMEOUT bash -c '
            if [ -f ~/.ssh/git_signing_key.pub ] && [ "$(git config --global gpg.format)" = "ssh" ]; then
                echo "signing:1:✓ Git signing configured"
            else
                echo "signing:0:✗ Git signing not configured"
            fi
        ' 2>/dev/null || echo "signing:0:✗ Git signing check timed out"
    } >> "$check_results_file" &
    
    # Wait for all checks to complete
    wait
    
    # Process results
    while IFS=: read -r check_name check_passed check_message; do
        checks_total=$((checks_total + 1))
        if [ "$check_passed" = "1" ]; then
            checks_passed=$((checks_passed + 1))
            log_info "$check_message"
        else
            log_warn "$check_message"
        fi
    done < <(sort "$check_results_file" 2>/dev/null || true)
    
    rm -f "$check_results_file"
    
    log_info "Health check summary: $checks_passed/$checks_total passed"
    
    return 0
}

# ============================================================================
# SUMMARY DISPLAY
# ============================================================================

display_setup_summary() {
    echo ""
    log_info "${COLOR_GREEN}============================================${COLOR_RESET}"
    log_info "${COLOR_GREEN}✅ Development Environment Setup Complete!${COLOR_RESET}"
    log_info "${COLOR_GREEN}============================================${COLOR_RESET}"
    echo ""
    log_info "Git user: $(git config --global user.name) <$(git config --global user.email)>"
    
    if [ "$(git config --global gpg.format)" = "ssh" ]; then
        log_info "Git signing: Enabled (SSH)"
    else
        log_info "Git signing: Not configured"
    fi
    
    # Show SSH keys status
    if ssh-add -l &>/dev/null; then
        local key_count=$(ssh-add -l | wc -l | tr -d ' ')
        log_info "SSH keys: $key_count loaded"
    else
        log_info "SSH keys: None loaded"
    fi
    
    # Show next steps if needed
    local next_steps=()
    
    if [ -z "$(git config --global user.name)" ] || [ "$(git config --global user.name)" = "Developer" ]; then
        next_steps+=("Configure your Git identity: git config --global user.name 'Your Name'")
    fi
    
    if [ -z "$(git config --global user.email)" ] || [ "$(git config --global user.email)" = "developer@localhost" ]; then
        next_steps+=("Configure your Git email: git config --global user.email 'you@example.com'")
    fi
    
    if ! ssh-add -l &>/dev/null; then
        next_steps+=("Add SSH keys to agent: ssh-add ~/.ssh/id_rsa")
    fi
    
    if [ ${#next_steps[@]} -gt 0 ]; then
        log_info ""
        log_info "Next steps:"
        for step in "${next_steps[@]}"; do
            log_info "  • $step"
        done
    fi
    
    log_info ""
    log_info "Log file: $LOG_FILE"
    
    # Show warning if running in CI
    if is_ci_environment; then
        log_warn "Note: Running in CI environment, some features may be limited"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================


main() {
    log_info "Starting post-create setup (v$SCRIPT_VERSION)..."
    log_info "Platform: $PLATFORM"
    log_info "Log file: $LOG_FILE"
    
    
    # Acquire lock
    if ! acquire_lock; then
        log_error "Another instance is running or lock timeout exceeded. Check for stale lock file: $LOCK_FILE"
        exit 1
    fi
    
    # Ensure cleanup on exit
    trap 'cleanup' EXIT
    
    # Create secure temporary directory
    TEMP_DIR=$(create_secure_temp)
    
    # Create SSH directory
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Load environment variables from .env file
    load_env_file
    
    # Initialize 1Password if token is available
    if [ -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]; then
        if init_onepassword; then
            # Configure Git user
            configure_git_user || log_warn "Git user configuration failed"
            
            # Setup SSH agent
            setup_ssh_agent || log_warn "SSH agent setup failed"
            
            # Load SSH keys
            load_ssh_keys || log_warn "SSH key loading failed"
            
            # Configure Git signing
            configure_git_signing || log_warn "Git signing configuration failed"
        else
            log_warn "1Password initialization failed, continuing with limited functionality"
        fi
    else
        log_warn "OP_SERVICE_ACCOUNT_TOKEN not set, skipping 1Password integration"
    fi
    
    # Fallback Git configuration with enhanced defaults
    if [ -z "$(git config --global user.name)" ]; then
        # Try to use system username as fallback
        local fallback_name="${USER:-${USERNAME:-Developer}}"
        # Capitalize first letter if it's lowercase
        fallback_name="$(echo "$fallback_name" | sed 's/^./\U&/')"
        git config --global user.name "$fallback_name"
        log_info "Set fallback Git user.name: $fallback_name"
    fi
    
    if [ -z "$(git config --global user.email)" ]; then
        # Try to construct a more meaningful default email
        local username="${USER:-${USERNAME:-developer}}"
        local hostname="${HOSTNAME:-${HOST:-localhost}}"
        # Remove any .local or .localdomain suffix for cleaner email
        hostname="${hostname%.local}"
        hostname="${hostname%.localdomain}"
        git config --global user.email "${username}@${hostname}"
        log_info "Set fallback Git user.email: ${username}@${hostname}"
    fi
    
    # Perform health checks
    perform_health_checks
    
    # Display summary
    display_setup_summary
    
    return 0
}

# Execute main function
main "$@"