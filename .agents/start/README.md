# Agent START Files

This directory contains static orientation guides for each agent. These files provide quick reference information to help agents understand their domain, find their current tasks, and follow established patterns.

## Purpose

START files are:

- **Static references** that rarely change
- **Quick orientation** for agents beginning work
- **Task discovery** guides showing how to find current work
- **Pattern references** pointing to standards and examples

## Structure

Each START file follows a consistent pattern:

1. **Your Domain** - What the agent is responsible for
2. **Finding Your Current Task** - How to discover what to work on
3. **Understanding Task Metadata** - How to interpret auto-managed task instructions
4. **Core Commands** - Essential commands for the domain
5. **Development Patterns** - Key principles to follow
6. **References** - Where to find more detailed information

## Usage

Agents should:

1. Read their START file when beginning a session
2. Use it to find their current task in `.claude/tasks/agent-N/`
3. Reference it for domain-specific commands and patterns
4. Follow the metadata interpretation guide for task completion

## Files

- `agent-0-core.md` - Core Integration Agent
- `agent-1-utilities.md` - Utility Libraries Agent
- `agent-2-infra.md` - Infrastructure & Build Agent
- `agent-3-components.md` - Component Library Agent

## Maintenance

START files should only be updated when:

- Agent domains change significantly
- Task organization structure changes
- New core patterns emerge
- Essential commands change

They should NOT be updated for:

- Current task status
- Sprint phases
- Progress tracking
- Temporary information
