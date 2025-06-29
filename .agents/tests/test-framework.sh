#!/usr/bin/env bash
# Test framework for bash/zsh scripts with security focus

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Current test context
CURRENT_TEST=""
CURRENT_SUITE=""

# Test result storage
declare -a FAILED_TESTS=()

# Setup test environment
setup_test_env() {
    export TEST_MODE=1
    export TEST_TEMP_DIR=$(mktemp -d)
    export ORIGINAL_PATH="$PATH"
    
    # Create mock commands directory
    export MOCK_BIN_DIR="$TEST_TEMP_DIR/bin"
    mkdir -p "$MOCK_BIN_DIR"
    export PATH="$MOCK_BIN_DIR:$PATH"
    
    # Disable actual command execution for safety
    export DRY_RUN=1
}

# Cleanup test environment
cleanup_test_env() {
    if [ -d "$TEST_TEMP_DIR" ]; then
        rm -rf "$TEST_TEMP_DIR"
    fi
    export PATH="$ORIGINAL_PATH"
    unset TEST_MODE DRY_RUN
}

# Test assertion functions
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="${3:-Values should be equal}"
    
    if [ "$expected" = "$actual" ]; then
        pass_test "$message"
    else
        fail_test "$message: expected '$expected', got '$actual'"
    fi
}

assert_not_equals() {
    local unexpected="$1"
    local actual="$2"
    local message="${3:-Values should not be equal}"
    
    if [ "$unexpected" != "$actual" ]; then
        pass_test "$message"
    else
        fail_test "$message: got unexpected value '$actual'"
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local message="${3:-String should contain substring}"
    
    if [[ "$haystack" == *"$needle"* ]]; then
        pass_test "$message"
    else
        fail_test "$message: '$haystack' does not contain '$needle'"
    fi
}

assert_file_exists() {
    local file="$1"
    local message="${2:-File should exist}"
    
    if [ -f "$file" ]; then
        pass_test "$message"
    else
        fail_test "$message: file '$file' does not exist"
    fi
}

assert_file_not_exists() {
    local file="$1"
    local message="${2:-File should not exist}"
    
    if [ ! -f "$file" ]; then
        pass_test "$message"
    else
        fail_test "$message: file '$file' exists"
    fi
}

assert_command_succeeds() {
    local command="$1"
    local message="${2:-Command should succeed}"
    
    if eval "$command" >/dev/null 2>&1; then
        pass_test "$message"
    else
        fail_test "$message: command failed: $command"
    fi
}

assert_command_fails() {
    local command="$1"
    local message="${2:-Command should fail}"
    
    if ! eval "$command" >/dev/null 2>&1; then
        pass_test "$message"
    else
        fail_test "$message: command succeeded unexpectedly: $command"
    fi
}

# Security-specific assertions
assert_no_command_injection() {
    local func="$1"
    local malicious_input="$2"
    local message="${3:-Should prevent command injection}"
    
    # Create a canary file
    local canary="$TEST_TEMP_DIR/canary_$$"
    touch "$canary"
    
    # Try to inject command that would remove canary
    if eval "$func '$malicious_input'" >/dev/null 2>&1; then
        # Function executed, check if injection succeeded
        if [ -f "$canary" ]; then
            pass_test "$message"
        else
            fail_test "$message: command injection succeeded!"
        fi
    else
        # Function failed (good, it rejected bad input)
        if [ -f "$canary" ]; then
            pass_test "$message"
        else
            fail_test "$message: canary file was removed!"
        fi
    fi
    
    rm -f "$canary"
}

assert_secure_permissions() {
    local file="$1"
    local expected_perms="$2"
    local message="${3:-File should have secure permissions}"
    
    local actual_perms=$(stat -c %a "$file" 2>/dev/null || stat -f %Lp "$file" 2>/dev/null)
    
    if [ "$actual_perms" = "$expected_perms" ]; then
        pass_test "$message"
    else
        fail_test "$message: expected permissions $expected_perms, got $actual_perms"
    fi
}

# Test execution helpers
run_test() {
    local test_name="$1"
    local test_func="$2"
    
    CURRENT_TEST="$test_name"
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -e "${BLUE}Running test:${NC} $test_name"
    
    # Run test in subshell to isolate
    (
        set +e
        $test_func
    )
    
    local result=$?
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$CURRENT_SUITE/$test_name")
    fi
}

run_test_suite() {
    local suite_name="$1"
    local suite_file="$2"
    
    CURRENT_SUITE="$suite_name"
    echo -e "\n${YELLOW}Test Suite: $suite_name${NC}"
    
    # Source the test file
    source "$suite_file"
    
    # Run all functions starting with test_
    for func in $(declare -F | grep -E "^declare -f test_" | awk '{print $3}'); do
        run_test "${func#test_}" "$func"
    done
}

# Mock command creation
create_mock_command() {
    local cmd_name="$1"
    local behavior="$2"
    
    cat > "$MOCK_BIN_DIR/$cmd_name" << EOF
#!/usr/bin/env bash
$behavior
EOF
    chmod +x "$MOCK_BIN_DIR/$cmd_name"
}

# Results reporting
pass_test() {
    local message="${1:-Test passed}"
    echo -e "  ${GREEN}✓${NC} $message"
}

fail_test() {
    local message="${1:-Test failed}"
    echo -e "  ${RED}✗${NC} $message"
    return 1
}

report_results() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}Test Results Summary${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "Total tests run: $TESTS_RUN"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    
    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo -e "\n${RED}Failed tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  - $test"
        done
    fi
    
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        return 1
    fi
    return 0
}

# Security test helpers
test_input_validation() {
    local func="$1"
    shift
    local test_cases=("$@")
    
    echo "Testing input validation for $func"
    
    for input in "${test_cases[@]}"; do
        assert_no_command_injection "$func" "$input" "Should handle: $input"
    done
}

test_file_operations() {
    local script="$1"
    
    echo "Testing file operations security"
    
    # Test symlink attacks
    local target="$TEST_TEMP_DIR/target"
    local symlink="$TEST_TEMP_DIR/symlink"
    touch "$target"
    ln -s "$target" "$symlink"
    
    # Script should detect and handle symlinks safely
    assert_command_fails "$script --check-file '$symlink'" "Should detect symlinks"
    
    # Test directory traversal
    assert_command_fails "$script --check-file '../../../etc/passwd'" "Should prevent directory traversal"
}

# Cross-shell compatibility
test_shell_compatibility() {
    local script="$1"
    local shells=("bash" "zsh")
    
    for shell in "${shells[@]}"; do
        if command -v "$shell" >/dev/null 2>&1; then
            echo "Testing with $shell"
            assert_command_succeeds "$shell -n $script" "Script should have valid $shell syntax"
        fi
    done
}

# Main test runner
main() {
    setup_test_env
    
    # Trap to ensure cleanup
    trap cleanup_test_env EXIT INT TERM
    
    # Run test suites
    for suite in "$@"; do
        if [ -f "$suite" ]; then
            run_test_suite "$(basename "$suite" .test.sh)" "$suite"
        fi
    done
    
    # Report results
    report_results
}

# Export functions for use in test files
export -f assert_equals assert_not_equals assert_contains
export -f assert_file_exists assert_file_not_exists
export -f assert_command_succeeds assert_command_fails
export -f assert_no_command_injection assert_secure_permissions
export -f create_mock_command test_input_validation
export -f pass_test fail_test

# Run main if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi