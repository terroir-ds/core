#!/usr/bin/env bash
# Quick security audit for agent scripts

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ISSUES_FOUND=0

log_issue() {
    local severity="$1"
    local file="$2"
    local line="$3"
    local message="$4"
    
    case "$severity" in
        "HIGH")   echo -e "${RED}[HIGH]${NC} $file:$line - $message" ;;
        "MEDIUM") echo -e "${YELLOW}[MEDIUM]${NC} $file:$line - $message" ;;
        "LOW")    echo -e "${BLUE}[LOW]${NC} $file:$line - $message" ;;
        "INFO")   echo -e "${GREEN}[INFO]${NC} $file:$line - $message" ;;
    esac
    
    if [ "$severity" != "INFO" ]; then
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
}

audit_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo -e "\n${BLUE}Auditing: $filename${NC}"
    
    # Check for dangerous patterns
    
    # 1. Unquoted variables (command injection risk)
    local unquoted_vars=$(grep -n '\$[A-Za-z_][A-Za-z0-9_]*[^"]' "$file" | grep -v '^\s*#' || true)
    if [ -n "$unquoted_vars" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "MEDIUM" "$filename" "$line_num" "Potentially unquoted variable (command injection risk)"
        done <<< "$unquoted_vars"
    fi
    
    # 2. Use of eval (high risk)
    local eval_usage=$(grep -n 'eval\s' "$file" || true)
    if [ -n "$eval_usage" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "HIGH" "$filename" "$line_num" "Use of 'eval' detected (code injection risk)"
        done <<< "$eval_usage"
    fi
    
    # 3. Unsafe temp file creation
    local unsafe_temp=$(grep -n '/tmp/[^$]' "$file" | grep -v mktemp || true)
    if [ -n "$unsafe_temp" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "MEDIUM" "$filename" "$line_num" "Hardcoded temp path (race condition risk)"
        done <<< "$unsafe_temp"
    fi
    
    # 4. Missing input validation on user input
    local user_input=$(grep -n 'read\s.*\$' "$file" || true)
    if [ -n "$user_input" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "MEDIUM" "$filename" "$line_num" "User input without validation"
        done <<< "$user_input"
    fi
    
    # 5. Curl without SSL verification
    local curl_unsafe=$(grep -n 'curl.*-k\|curl.*--insecure' "$file" || true)
    if [ -n "$curl_unsafe" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "HIGH" "$filename" "$line_num" "Curl with disabled SSL verification"
        done <<< "$curl_unsafe"
    fi
    
    # 6. Wget without SSL verification
    local wget_unsafe=$(grep -n 'wget.*--no-check-certificate' "$file" || true)
    if [ -n "$wget_unsafe" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "HIGH" "$filename" "$line_num" "Wget with disabled SSL verification"
        done <<< "$wget_unsafe"
    fi
    
    # 7. Password or key in plaintext
    local sensitive_data=$(grep -ni 'password\|secret\|key.*=' "$file" | grep -v 'key_name\|keychain\|public_key\|ssh_key' || true)
    if [ -n "$sensitive_data" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "HIGH" "$filename" "$line_num" "Potential sensitive data in plaintext"
        done <<< "$sensitive_data"
    fi
    
    # 8. Use of echo instead of printf (potential formatting issues)
    local echo_usage=$(grep -n 'echo.*\$' "$file" | grep -v 'echo -e' || true)
    if [ -n "$echo_usage" ]; then
        local count=$(echo "$echo_usage" | wc -l)
        if [ "$count" -gt 10 ]; then  # Only report if excessive
            log_issue "LOW" "$filename" "multiple" "Extensive use of echo with variables (consider printf)"
        fi
    fi
    
    # 9. Missing error handling
    local no_error_check=$(grep -n '^\s*[a-zA-Z].*\$.*' "$file" | grep -v '||' | grep -v 'if\|while\|for' | head -5 || true)
    if [ -n "$no_error_check" ]; then
        log_issue "LOW" "$filename" "various" "Commands without error checking"
    fi
    
    # 10. Unsafe file permissions
    local perm_commands=$(grep -n 'chmod\s\+[7-9][7-9][7-9]\|chmod\s\+777' "$file" || true)
    if [ -n "$perm_commands" ]; then
        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d: -f1)
            log_issue "MEDIUM" "$filename" "$line_num" "Overly permissive file permissions"
        done <<< "$perm_commands"
    fi
}

audit_security_practices() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo -e "\n${BLUE}Security Practices Check: $filename${NC}"
    
    # Positive security practices
    
    # 1. Check for set -euo pipefail
    if grep -q 'set -euo pipefail' "$file"; then
        log_issue "INFO" "$filename" "-" "Good: Uses 'set -euo pipefail'"
    else
        log_issue "MEDIUM" "$filename" "-" "Missing 'set -euo pipefail' for safety"
    fi
    
    # 2. Check for umask setting
    if grep -q 'umask' "$file"; then
        log_issue "INFO" "$filename" "-" "Good: Sets umask for file permissions"
    else
        log_issue "LOW" "$filename" "-" "Consider setting restrictive umask"
    fi
    
    # 3. Check for input validation
    if grep -q 'validate\|sanitize\|check.*input' "$file"; then
        log_issue "INFO" "$filename" "-" "Good: Contains input validation"
    fi
    
    # 4. Check for secure temp file usage
    if grep -q 'mktemp' "$file"; then
        log_issue "INFO" "$filename" "-" "Good: Uses mktemp for temporary files"
    fi
    
    # 5. Check for signal handling
    if grep -q 'trap.*EXIT\|trap.*INT' "$file"; then
        log_issue "INFO" "$filename" "-" "Good: Has signal handling/cleanup"
    else
        log_issue "LOW" "$filename" "-" "Consider adding signal handling for cleanup"
    fi
    
    # 6. Check for privilege dropping
    if grep -q 'sudo.*-u\|runuser\|su -c' "$file"; then
        log_issue "INFO" "$filename" "-" "Note: Uses privilege escalation - verify necessity"
    fi
}

check_file_permissions() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check script permissions
    local perms=$(stat -c %a "$file" 2>/dev/null || stat -f %Lp "$file" 2>/dev/null)
    
    if [ "$perms" -gt 755 ]; then
        log_issue "MEDIUM" "$filename" "-" "Script has overly permissive permissions: $perms"
    elif [ "$perms" = 755 ] || [ "$perms" = 750 ]; then
        log_issue "INFO" "$filename" "-" "Good: Script has appropriate permissions: $perms"
    elif [ "$perms" -lt 700 ]; then
        log_issue "LOW" "$filename" "-" "Script may not be executable: $perms"
    fi
}

main() {
    echo -e "${BLUE}Security Audit for Agent Scripts${NC}"
    echo -e "${BLUE}================================${NC}"
    
    local scripts=(
        "$BASE_DIR/docker/agent-manager.sh"
        "$BASE_DIR/../scripts/utils/setup-git-ssh.sh"
        "$BASE_DIR/scripts/load-agent-config.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            audit_file "$script"
            audit_security_practices "$script"
            check_file_permissions "$script"
        else
            echo -e "${YELLOW}Warning: Script not found: $script${NC}"
        fi
    done
    
    echo -e "\n${BLUE}Audit Summary${NC}"
    echo -e "${BLUE}=============${NC}"
    
    if [ $ISSUES_FOUND -eq 0 ]; then
        echo -e "${GREEN}✓ No security issues found${NC}"
    else
        echo -e "${YELLOW}⚠ Found $ISSUES_FOUND potential security issues${NC}"
        echo -e "Review the issues above and consider implementing fixes."
    fi
    
    echo -e "\n${BLUE}Recommendations:${NC}"
    echo "1. Always validate and sanitize user input"
    echo "2. Use quoted variables to prevent word splitting"
    echo "3. Implement proper error handling with || and &&"
    echo "4. Use mktemp for temporary files"
    echo "5. Set restrictive file permissions and umask"
    echo "6. Avoid hardcoded paths and credentials"
    echo "7. Add signal handling for cleanup"
    echo "8. Regular security audits and code reviews"
    
    return $ISSUES_FOUND
}

main "$@"