# Base Agent Prompts

This directory contains the base prompts that all agents should use as a foundation.

## Directory Structure

```text
base/
├── README.md           # This file
├── base-prompt.md      # The core prompt all agents inherit
└── context-template.md # Template for adding current context
```

## Usage

1. Start with `base-prompt.md`
2. Add agent-specific instructions from `../agents/`
3. Optionally add current context using `context-template.md`
4. Copy the combined prompt into Claude

## Quick Start

For a crashed/restarted agent:

```bash
cat base/base-prompt.md agents/[agent-name].md > current-prompt.md
# Then copy current-prompt.md content to Claude
```
