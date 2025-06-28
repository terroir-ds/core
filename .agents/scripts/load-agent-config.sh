#!/bin/bash
# Common agent configuration loader
# Source this from any script that needs agent mappings

# Find the base directory
if [ -n "$BASH_SOURCE" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
fi
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load the mapping configuration
MAPPING_FILE="$BASE_DIR/config/agent-mapping.conf"

if [ ! -f "$MAPPING_FILE" ]; then
    echo "Error: Agent mapping file not found: $MAPPING_FILE" >&2
    exit 1
fi

# Parse mapping file and create associative arrays
declare -A AGENT_PURPOSE
declare -A AGENT_BRANCH  
declare -A AGENT_COLOR
declare -A PURPOSE_TO_NUM

while IFS=: read -r num purpose branch color; do
    # Skip comments and empty lines
    [[ "$num" =~ ^#.*$ ]] && continue
    [[ -z "$num" ]] && continue
    
    # Trim whitespace
    num=$(echo "$num" | xargs)
    purpose=$(echo "$purpose" | xargs)
    branch=$(echo "$branch" | xargs)
    color=$(echo "$color" | xargs)
    
    # Store mappings
    AGENT_PURPOSE[$num]="$purpose"
    AGENT_BRANCH[$num]="$branch"
    AGENT_COLOR[$num]="$color"
    PURPOSE_TO_NUM[$purpose]="$num"
done < "$MAPPING_FILE"

# Function to resolve agent identifier (number or purpose) to number
resolve_agent_number() {
    local input="$1"
    
    # If it's already a number, return it
    if [[ "$input" =~ ^[0-9]+$ ]]; then
        if [ -n "${AGENT_PURPOSE[$input]}" ]; then
            echo "$input"
            return 0
        fi
    fi
    
    # Try to resolve as purpose name
    if [ -n "${PURPOSE_TO_NUM[$input]}" ]; then
        echo "${PURPOSE_TO_NUM[$input]}"
        return 0
    fi
    
    # Not found
    return 1
}

# Function to get agent info
get_agent_info() {
    local agent_id="$1"
    local num=$(resolve_agent_number "$agent_id")
    
    if [ -z "$num" ]; then
        return 1
    fi
    
    echo "NUMBER=$num"
    echo "PURPOSE=${AGENT_PURPOSE[$num]}"
    echo "BRANCH=${AGENT_BRANCH[$num]}"
    echo "COLOR=${AGENT_COLOR[$num]}"
}

# Export for use in scripts
export -f resolve_agent_number
export -f get_agent_info