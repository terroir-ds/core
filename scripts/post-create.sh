#!/usr/bin/env bash

# Post-create script for Stoic Design System
# This script sets up the development environment after container creation
# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Script metadata
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_FILE="${PROJECT_ROOT}/.devcontainer/post-create.log"
readonly PID_FILE="/tmp/post-create.pid"
readonly REQUIRED_NODE_VERSION="18"
readonly PARALLEL_JOBS=4

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${LOG_FILE}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_FILE}"
}

# Progress indicator
show_progress() {
    local -r message="$1"
    local -r pid=$2
    local spin='-\|/'
    local i=0
    
    while kill -0 "$pid" 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r${BLUE}[${spin:$i:1}]${NC} %s" "$message"
        sleep 0.1
    done
    
    # Clear the line
    printf "\r%*s\r" "${#message}" ""
}

# Cleanup function
cleanup() {
    local exit_code=$?
    
    # Remove PID file
    rm -f "${PID_FILE}"
    
    # Kill any remaining background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Post-create setup completed successfully!"
    else
        log_error "Post-create setup failed with exit code: $exit_code"
        log_error "Check the log file for details: ${LOG_FILE}"
    fi
    
    exit $exit_code
}

# Trap cleanup on exit
trap cleanup EXIT INT TERM

# Prevent multiple instances
check_single_instance() {
    if [[ -f "${PID_FILE}" ]]; then
        local old_pid
        old_pid=$(cat "${PID_FILE}")
        if kill -0 "$old_pid" 2>/dev/null; then
            log_error "Another instance is already running (PID: $old_pid)"
            exit 1
        else
            log_warning "Removing stale PID file"
            rm -f "${PID_FILE}"
        fi
    fi
    
    echo $$ > "${PID_FILE}"
}

# Validate environment
validate_environment() {
    log_info "Validating environment..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        return 1
    fi
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        local node_version
        node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$node_version" -lt "$REQUIRED_NODE_VERSION" ]]; then
            log_error "Node.js version $REQUIRED_NODE_VERSION or higher is required (found: v$node_version)"
            return 1
        fi
    else
        log_error "Node.js is not installed"
        return 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        return 1
    fi
    
    log_success "Environment validation passed"
}

# Create required directories
create_directories() {
    log_info "Creating project directories..."
    
    local -a directories=(
        "tokens/base"
        "tokens/themes"
        "tokens/brands"
        "assets/icons"
        "assets/fonts"
        "assets/images"
        "packages/core"
        "packages/react"
        "packages/web-components"
        "docs"
        "tests/visual"
        "tests/unit"
        ".devcontainer"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "${PROJECT_ROOT}/${dir}"
    done
    
    log_success "Directories created"
}

# Install dependencies with retry logic
install_dependencies() {
    log_info "Installing dependencies..."
    
    local max_retries=3
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if npm ci --silent 2>&1 | tee -a "${LOG_FILE}"; then
            log_success "Dependencies installed"
            return 0
        else
            retry_count=$((retry_count + 1))
            log_warning "npm install failed, attempt $retry_count of $max_retries"
            sleep 2
        fi
    done
    
    log_error "Failed to install dependencies after $max_retries attempts"
    return 1
}

# Setup git hooks
setup_git_hooks() {
    log_info "Setting up git hooks..."
    
    local hooks_dir="${PROJECT_ROOT}/.git/hooks"
    
    # Create pre-commit hook
    cat > "${hooks_dir}/pre-commit" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Run linting
npm run lint --silent

# Run tests
npm test --silent

# Check for TODO comments
if grep -r "TODO\|FIXME" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" .; then
    echo "Warning: TODO/FIXME comments found"
fi
EOF
    
    chmod +x "${hooks_dir}/pre-commit"
    
    log_success "Git hooks configured"
}

# Configure VS Code settings
setup_vscode() {
    log_info "Configuring VS Code settings..."
    
    local vscode_dir="${PROJECT_ROOT}/.vscode"
    mkdir -p "$vscode_dir"
    
    # Create settings.json
    cat > "${vscode_dir}/settings.json" << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.DS_Store": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  }
}
EOF
    
    # Create extensions.json
    cat > "${vscode_dir}/extensions.json" << 'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "styled-components.vscode-styled-components",
    "bradlc.vscode-tailwindcss",
    "christian-kohler.path-intellisense"
  ]
}
EOF
    
    log_success "VS Code configured"
}

# Generate initial tokens
generate_initial_tokens() {
    log_info "Generating initial design tokens..."
    
    # Create base color tokens
    cat > "${PROJECT_ROOT}/tokens/base/colors.json" << 'EOF'
{
  "color": {
    "primary": {
      "value": "#0066cc",
      "type": "color",
      "description": "Primary brand color"
    },
    "secondary": {
      "value": "#6B46C1",
      "type": "color",
      "description": "Secondary brand color"
    },
    "neutral": {
      "value": "#64748B",
      "type": "color",
      "description": "Neutral color base"
    }
  }
}
EOF
    
    # Create spacing tokens
    cat > "${PROJECT_ROOT}/tokens/base/spacing.json" << 'EOF'
{
  "spacing": {
    "xs": {
      "value": "4px",
      "type": "spacing"
    },
    "sm": {
      "value": "8px",
      "type": "spacing"
    },
    "md": {
      "value": "16px",
      "type": "spacing"
    },
    "lg": {
      "value": "24px",
      "type": "spacing"
    },
    "xl": {
      "value": "32px",
      "type": "spacing"
    }
  }
}
EOF
    
    log_success "Initial tokens generated"
}

# Setup environment variables
setup_environment_variables() {
    log_info "Setting up environment variables..."
    
    if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
        cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env" 2>/dev/null || {
            cat > "${PROJECT_ROOT}/.env" << 'EOF'
# Environment Configuration
NODE_ENV=development
DESIGN_SYSTEM_VERSION=0.1.0

# Build Configuration
OPTIMIZE_IMAGES=true
GENERATE_WEBP=true

# Testing Configuration
STRICT_CONTRAST=true
VISUAL_REGRESSION_THRESHOLD=0.1

# Development Configuration
PORT=6006
STORYBOOK_PORT=6006
EOF
        }
        log_success "Environment variables configured"
    else
        log_info "Environment variables already configured"
    fi
}

# Run initial build
run_initial_build() {
    log_info "Running initial build..."
    
    # Run builds in parallel
    {
        npm run tokens:build 2>&1 | tee -a "${LOG_FILE}" &
        local tokens_pid=$!
        
        npm run assets:build 2>&1 | tee -a "${LOG_FILE}" &
        local assets_pid=$!
        
        # Wait for parallel builds
        wait $tokens_pid || log_warning "Token build failed"
        wait $assets_pid || log_warning "Asset build failed"
    }
    
    log_success "Initial build completed"
}

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    local errors=0
    
    # Check for required files
    local -a required_files=(
        "package.json"
        "tsconfig.json"
        ".gitignore"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "${PROJECT_ROOT}/${file}" ]]; then
            log_error "Missing required file: $file"
            ((errors++))
        fi
    done
    
    # Check for node_modules
    if [[ ! -d "${PROJECT_ROOT}/node_modules" ]]; then
        log_error "node_modules directory not found"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "Setup verification passed"
        return 0
    else
        log_error "Setup verification failed with $errors errors"
        return 1
    fi
}

# Display welcome message
display_welcome() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════╗
║                    Stoic Design System                        ║
║                 Development Environment Ready                 ║
╚═══════════════════════════════════════════════════════════════╝

🚀 Quick Start Commands:

  npm run dev          - Start development mode
  npm run storybook    - Launch Storybook
  npm run test         - Run tests
  npm run build        - Build all packages

📚 Documentation:

  - Design System Guide: ./docs/README.md
  - Token Architecture: ./docs/token-architecture.md
  - Contributing: ./CONTRIBUTING.md

🔗 Useful Links:

  - Storybook: http://localhost:6006
  - GitHub: https://github.com/your-org/stoic-design-system

Happy coding! 🎨

EOF
}

# Main execution
main() {
    log_info "Starting post-create setup for Stoic Design System..."
    log_info "Logging to: ${LOG_FILE}"
    
    # Initialize log file
    mkdir -p "$(dirname "${LOG_FILE}")"
    : > "${LOG_FILE}"
    
    # Check single instance
    check_single_instance
    
    # Run setup steps
    validate_environment
    create_directories
    
    # Run parallel tasks
    {
        setup_git_hooks &
        local git_pid=$!
        
        setup_vscode &
        local vscode_pid=$!
        
        generate_initial_tokens &
        local tokens_pid=$!
        
        setup_environment_variables &
        local env_pid=$!
        
        # Show progress for main installation
        install_dependencies &
        local deps_pid=$!
        show_progress "Installing dependencies..." $deps_pid
        wait $deps_pid || exit 1
        
        # Wait for other parallel tasks
        wait $git_pid
        wait $vscode_pid
        wait $tokens_pid
        wait $env_pid
    }
    
    # Run build after dependencies are installed
    run_initial_build
    
    # Final verification
    verify_setup
    
    # Display welcome message
    display_welcome
}

# Execute main function
main "$@"