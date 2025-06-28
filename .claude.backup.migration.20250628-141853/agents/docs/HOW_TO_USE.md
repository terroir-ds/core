# How to Use Agent Prompts

## IMPORTANT: These prompts are NOT for Claude to read and summarize!

These prompts are **instructions for Claude to follow** when starting or restarting an agent session.

## Correct Usage:

### Step 1: Generate the Combined Prompt

```bash
# DO NOT ask Claude to read these files!
# Instead, combine them yourself:

# For Utilities Agent (Agent 1):
cat base/base-prompt.md agents/utilities-agent.md > /tmp/my-prompt.txt

# For Infrastructure Agent (Agent 2):
cat base/base-prompt.md agents/infrastructure-agent.md > /tmp/my-prompt.txt

# For Documentation Agent (Agent 3):
cat base/base-prompt.md agents/documentation-agent.md > /tmp/my-prompt.txt
```

### Step 2: Copy the Combined Prompt

Open `/tmp/my-prompt.txt` in your editor and copy ALL the content.

### Step 3: Start a New Claude Session

1. Start a fresh Claude session
2. **PASTE the entire prompt content as your first message**
3. Do NOT ask Claude to "read these files" or "look at these prompts"
4. The prompt content IS the instruction - paste it directly

### Step 4: Add Context (Optional)

After pasting the base instructions, you can add context like:

```
I'm restarting after a system reboot. Please check the current status and continue with assigned tasks.
```

## Example of WRONG Usage:

❌ "Please read the agent prompts in .claude/agent-prompts"
❌ "Look at base-prompt.md and utilities-agent.md"
❌ "What do the agent prompts say?"

## Example of CORRECT Usage:

✅ Copy the entire combined prompt content and paste it as your message
✅ The first message to Claude should BE the prompt, not a request to read it

## Why This Matters:

When you ask Claude to "read" the prompts, it treats them as files to analyze and summarize. When you PASTE the prompt content directly, Claude treats it as instructions to follow.

The prompts contain role definitions, responsibilities, and context that Claude needs to act as that specific agent.