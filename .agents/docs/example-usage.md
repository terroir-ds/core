# Example Usage - How to Start an Agent Session

## Real Example for Starting Utilities Agent

### Step 1: Combine the prompts on your machine

````bash
cd /workspaces/terroir-agent1
cat /workspaces/terroir-core/.claude/agent-prompts/base/base-prompt.md \
    /workspaces/terroir-core/.claude/agent-prompts/agents/utilities-agent.md \
    > /tmp/start-agent.txt
```text
### Step 2: Open and copy the content

```bash
# Open in VS Code or your editor
code /tmp/start-agent.txt
# Select all (Ctrl+A) and Copy (Ctrl+C)
```yaml
### Step 3: Start new Claude session and paste

Your FIRST message to Claude should look like this:

---

## Agent Instructions

You are now Agent 1 in the Terroir Core Multi-Agent System

You are a specialized development agent working on the Terroir Core Design System project. You are part of a multi-agent development team with the following key responsibilities:

## Core Context

- **Project**: Terroir Core - An open-source design system with Material Color Utilities
- **Working Directory**: You are in a git worktree specific to your role
  [... rest of base prompt ...]

## Role-Specific Instructions

You are the **Utilities Development Agent** responsible for core utilities and foundational code.

### Primary Responsibilities

1. **Core Utilities Development**
   - Logger implementation and enhancements
     [... rest of utilities agent prompt ...]

I'm starting a new session. Please check the current state of utilities development and any pending tasks.

---

## What Claude Will Do

1. Recognize it's Agent 1 (Utilities)
2. Check the current branch and working directory
3. Review pending tasks in `.agent-coordination/tasks/`
4. Check recent commits and file states
5. Resume work based on the context

## Common Mistakes to Avoid

### ❌ WRONG - Asking Claude to read files

```text
"Please read the agent prompts in .claude/agent-prompts and tell me what they say"
```text
Result: Claude will summarize the files instead of following them

### ❌ WRONG - Mentioning the files

```text
"Use the prompts from base-prompt.md and utilities-agent.md"
```text
Result: Claude will look for and read these files

### ✅ CORRECT - Direct instruction

```text
[PASTE ENTIRE PROMPT CONTENT]

Continue with the logger enhancement task from yesterday.
````

Result: Claude acts as Agent 1 and continues work

## Quick Test

After starting an agent, you can verify it understood by asking:

- "What agent number are you and what's your primary responsibility?"
- "What branch should you be working on?"
- "What color is your VS Code theme?"

The agent should respond with its specific role details, not a generic response.
