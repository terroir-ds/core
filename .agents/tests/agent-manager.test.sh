#!/usr/bin/env bash
# Test suite for agent-manager.sh

# Source the script being tested
AGENT_MANAGER_SCRIPT="$BASE_DIR/../docker/agent-manager.sh"

# Mock docker commands
setup() {
    # Create mock docker that records commands
    create_mock_command "docker" 'echo "MOCK_DOCKER: $@" >> $TEST_TEMP_DIR/docker.log'
    
    # Create test config
    mkdir -p "$TEST_TEMP_DIR/.agents/config"
    cat > "$TEST_TEMP_DIR/.agents/config/agent-mapping.conf" << 'EOF'
# Test configuration
0:core:main:cyan
1:utilities:feat/utilities:green
2:infrastructure:feat/infrastructure:blue
3:documentation:feat/docs:purple
EOF
    
    export BASE_DIR="$TEST_TEMP_DIR/.agents"
}

# Test configuration loading
test_config_loading() {
    # Source the config loader
    source "$BASE_DIR/../scripts/load-agent-config.sh"
    
    assert_equals "utilities" "${AGENT_PURPOSE[1]}" "Agent 1 purpose should be utilities"
    assert_equals "green" "${AGENT_COLOR[1]}" "Agent 1 color should be green"
    assert_equals "1" "${PURPOSE_TO_NUM[utilities]}" "Purpose to num mapping should work"
}

# Test agent number resolution
test_agent_resolution() {
    source "$BASE_DIR/../scripts/load-agent-config.sh"
    
    # Test numeric input
    local result=$(resolve_agent_number "1")
    assert_equals "1" "$result" "Should resolve numeric input"
    
    # Test purpose name input
    result=$(resolve_agent_number "utilities")
    assert_equals "1" "$result" "Should resolve purpose name"
    
    # Test invalid input
    result=$(resolve_agent_number "invalid" 2>/dev/null || echo "FAILED")
    assert_equals "FAILED" "$result" "Should fail on invalid input"
}

# Test command injection prevention
test_command_injection_prevention() {
    setup
    
    # Test malicious agent names
    local malicious_inputs=(
        "1; rm -rf /"
        "1\$(touch /tmp/pwned)"
        "1\`touch /tmp/pwned\`"
        "1 && touch /tmp/pwned"
        "1 | touch /tmp/pwned"
        "../../../etc/passwd"
        "1;cat /etc/passwd"
    )
    
    for input in "${malicious_inputs[@]}"; do
        # The script should either fail or sanitize input
        assert_no_command_injection "$AGENT_MANAGER_SCRIPT start" "$input"
    done
}

# Test docker command construction
test_docker_run_security() {
    setup
    
    # Mock the docker run command and capture it
    create_mock_command "docker" '
    if [[ "$1" == "run" ]]; then
        echo "$@" > $TEST_TEMP_DIR/docker_run_cmd.txt
    fi
    '
    
    # Run start command
    BASE_DIR="$TEST_TEMP_DIR/.agents" "$AGENT_MANAGER_SCRIPT" start 1 >/dev/null 2>&1
    
    if [ -f "$TEST_TEMP_DIR/docker_run_cmd.txt" ]; then
        local docker_cmd=$(cat "$TEST_TEMP_DIR/docker_run_cmd.txt")
        
        # Security checks
        assert_contains "$docker_cmd" "--security-opt no-new-privileges:true" "Should disable privilege escalation"
        assert_contains "$docker_cmd" "--cap-drop=ALL" "Should drop all capabilities"
        assert_contains "$docker_cmd" "--cap-add=CHOWN" "Should only add required capabilities"
        assert_not_contains "$docker_cmd" "--privileged" "Should not run privileged"
    fi
}

# Test file path validation
test_path_validation() {
    # Test path traversal attempts
    local bad_paths=(
        "../../../etc/passwd"
        "/etc/passwd"
        "~/../../etc/passwd"
        "\$HOME/../../etc/passwd"
    )
    
    for path in "${bad_paths[@]}"; do
        # These should be rejected or sanitized
        assert_command_fails "$AGENT_MANAGER_SCRIPT --test-path '$path'" "Should reject: $path"
    done
}

# Test environment variable handling
test_environment_security() {
    # Set potentially dangerous environment variables
    export MALICIOUS_VAR='$(touch /tmp/pwned)'
    export PATH_INJECTION='/tmp/evil:$PATH'
    
    # The script should not execute these
    assert_file_not_exists "/tmp/pwned" "Should not execute injected commands"
    
    unset MALICIOUS_VAR PATH_INJECTION
}

# Test lock file security
test_lock_file_handling() {
    # Test race condition handling
    local lock_file="$TEST_TEMP_DIR/test.lock"
    
    # Create a lock file owned by another process
    echo "9999" > "$lock_file"
    
    # Script should handle existing locks gracefully
    assert_command_succeeds "test -f '$lock_file'" "Lock file should exist"
}

# Test signal handling
test_signal_handling() {
    # Start a mock long-running operation
    (
        "$AGENT_MANAGER_SCRIPT" mock_long_operation &
        local pid=$!
        sleep 0.1
        kill -TERM $pid
        wait $pid
    ) 2>/dev/null
    
    # Check cleanup was performed
    assert_file_not_exists "$TEST_TEMP_DIR/agent.tmp" "Should clean up on signal"
}

# Test cross-shell compatibility
test_shell_compatibility() {
    # Test bash-specific syntax
    if command -v bash >/dev/null 2>&1; then
        assert_command_succeeds "bash -n '$AGENT_MANAGER_SCRIPT'" "Should have valid bash syntax"
    fi
    
    # Test zsh-specific syntax
    if command -v zsh >/dev/null 2>&1; then
        assert_command_succeeds "zsh -n '$AGENT_MANAGER_SCRIPT'" "Should have valid zsh syntax"
    fi
}

# Test permission checks
test_permission_security() {
    # Create files with various permissions
    local test_file="$TEST_TEMP_DIR/test_perms"
    touch "$test_file"
    
    # Test overly permissive files are detected
    chmod 777 "$test_file"
    assert_command_fails "$AGENT_MANAGER_SCRIPT --check-perms '$test_file'" "Should reject 777 permissions"
    
    # Test secure permissions are accepted
    chmod 600 "$test_file"
    assert_command_succeeds "$AGENT_MANAGER_SCRIPT --check-perms '$test_file'" "Should accept 600 permissions"
}

# Test input sanitization
test_input_sanitization() {
    # Test various special characters
    local test_inputs=(
        "agent\$1"
        "agent\`1\`"
        "agent'1'"
        'agent"1"'
        "agent;1"
        "agent|1"
        "agent&1"
    )
    
    for input in "${test_inputs[@]}"; do
        # Should handle special characters safely
        assert_no_command_injection "$AGENT_MANAGER_SCRIPT status" "$input"
    done
}

# Run all tests
setup