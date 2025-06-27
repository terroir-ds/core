#!/bin/bash
# migrate-from-shared.sh - Migrate from terroir-shared to terroir-core as source of truth

set -e

echo "🔄 Multi-Agent Migration Script"
echo "=============================="
echo "This script migrates from the old terroir-shared setup to using terroir-core as source of truth."
echo ""

# Get the script directory and repo directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PARENT_DIR="$(dirname "$REPO_DIR")"

# Check if terroir-shared exists
if [ ! -d "$PARENT_DIR/terroir-shared" ]; then
    echo "✅ No terroir-shared directory found. Nothing to migrate."
    echo "   You can run the new host-setup.sh directly."
    exit 0
fi

echo "Found terroir-shared directory. Beginning migration..."

# 1. Backup current state
echo -e "\n📦 Creating backup..."
BACKUP_DIR="$PARENT_DIR/terroir-shared.backup.$(date +%Y%m%d-%H%M%S)"
cp -r "$PARENT_DIR/terroir-shared" "$BACKUP_DIR"
echo "✅ Backup created at: $BACKUP_DIR"

# 2. Migrate .claude contents
if [ -d "$PARENT_DIR/terroir-shared/.claude" ]; then
    echo -e "\n📋 Analyzing .claude directory contents..."
    
    # Check for any files that might have been modified in terroir-shared
    if [ -d "$PARENT_DIR/terroir-shared/.claude/tasks" ]; then
        echo "  - Comparing task files..."
        # Compare each file and show what would happen
        for file in "$PARENT_DIR/terroir-shared/.claude/tasks"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                if [ -f "$REPO_DIR/.claude/tasks/$filename" ]; then
                    # Compare timestamps
                    if [ "$file" -nt "$REPO_DIR/.claude/tasks/$filename" ]; then
                        echo "    ⚠️  $filename is NEWER in terroir-shared"
                        echo "       terroir-shared: $(stat -c %y "$file" 2>/dev/null || stat -f %Sm "$file")"
                        echo "       terroir-core:   $(stat -c %y "$REPO_DIR/.claude/tasks/$filename" 2>/dev/null || stat -f %Sm "$REPO_DIR/.claude/tasks/$filename")"
                        echo "       → Would copy from terroir-shared to terroir-core"
                    else
                        echo "    ✓ $filename is current in terroir-core (no action needed)"
                    fi
                else
                    echo "    + $filename exists only in terroir-shared"
                    echo "       → Would copy to terroir-core"
                fi
            fi
        done
        
        # Check for files only in terroir-core
        for file in "$REPO_DIR/.claude/tasks"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                if [ ! -f "$PARENT_DIR/terroir-shared/.claude/tasks/$filename" ]; then
                    echo "    ✓ $filename exists only in terroir-core (preserving)"
                fi
            fi
        done
        
        echo ""
        read -p "Proceed with migration? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Migration cancelled."
            exit 1
        fi
        
        # Now actually do the migration
        echo "  - Migrating files..."
        for file in "$PARENT_DIR/terroir-shared/.claude/tasks"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                if [ -f "$REPO_DIR/.claude/tasks/$filename" ]; then
                    # Compare timestamps
                    if [ "$file" -nt "$REPO_DIR/.claude/tasks/$filename" ]; then
                        echo "    - Updating $filename (newer in terroir-shared)"
                        cp "$file" "$REPO_DIR/.claude/tasks/"
                    fi
                else
                    echo "    - Adding new file: $filename"
                    cp "$file" "$REPO_DIR/.claude/tasks/"
                fi
            fi
        done
    fi
fi

# 3. Migrate .agent-coordination contents
if [ -d "$PARENT_DIR/terroir-shared/.agent-coordination" ]; then
    echo -e "\n🔄 Migrating .agent-coordination directory..."
    
    # Create directory structure in terroir-core if it doesn't exist
    mkdir -p "$REPO_DIR/.agent-coordination/locks"
    mkdir -p "$REPO_DIR/.agent-coordination/claims"
    mkdir -p "$REPO_DIR/.agent-coordination/blocks"
    
    # Copy any active locks, claims, or blocks
    for subdir in locks claims blocks; do
        if [ -d "$PARENT_DIR/terroir-shared/.agent-coordination/$subdir" ]; then
            count=$(ls -1 "$PARENT_DIR/terroir-shared/.agent-coordination/$subdir" 2>/dev/null | wc -l)
            if [ "$count" -gt 0 ]; then
                echo "  - Found $count $subdir to migrate"
                cp -r "$PARENT_DIR/terroir-shared/.agent-coordination/$subdir"/* "$REPO_DIR/.agent-coordination/$subdir/" 2>/dev/null || true
            fi
        fi
    done
fi

# 4. Remove old symbolic links from agent directories
echo -e "\n🧹 Cleaning up old symbolic links in agent directories..."
for i in 1 2 3; do
    AGENT_DIR="$PARENT_DIR/terroir-agent$i"
    if [ -d "$AGENT_DIR" ]; then
        echo "  - Cleaning terroir-agent$i"
        # Remove old symlinks
        if [ -L "$AGENT_DIR/.claude" ]; then
            rm "$AGENT_DIR/.claude"
            echo "    ✓ Removed .claude symlink"
        fi
        if [ -L "$AGENT_DIR/.agent-coordination" ]; then
            rm "$AGENT_DIR/.agent-coordination"
            echo "    ✓ Removed .agent-coordination symlink"
        fi
    fi
done

# 5. Summary
echo -e "\n✅ Migration Complete!"
echo ""
echo "📊 Summary:"
echo "  - Backup saved to: $BACKUP_DIR"
echo "  - Task files migrated to terroir-core/.claude"
echo "  - Coordination files migrated to terroir-core/.agent-coordination"
echo "  - Old symbolic links removed from agent directories"
echo ""
echo "🚀 Next Steps:"
echo "1. Review the migrated files in terroir-core"
echo "2. Run the new host-setup.sh script:"
echo "   cd $REPO_DIR"
echo "   ./.claude/multi-agent/scripts/host-setup.sh"
echo "3. After confirming everything works, you can remove:"
echo "   - $PARENT_DIR/terroir-shared (original)"
echo "   - $BACKUP_DIR (backup)"
echo ""
echo "⚠️  Note: The new setup will create symbolic links inside containers,"
echo "not on the host filesystem."