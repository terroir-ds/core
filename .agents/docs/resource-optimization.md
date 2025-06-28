# Multi-Agent Resource Optimization Guide

## Overview

Running multiple VS Code devcontainers simultaneously can be resource-intensive. This guide provides strategies to optimize resource usage while maintaining productivity.

## Resource Usage Breakdown

### Full Setup (4 Agents)

- **Memory**: 8-10GB RAM
- **CPU**: 4-8 cores under load
- **Storage**: ~2GB per container

### Minimal Setup (Core + Agent 1)

- **Memory**: 4-5GB RAM
- **CPU**: 2-4 cores under load
- **Storage**: ~1GB per container

## Optimization Strategies

### 1. Use Minimal Setup

Instead of running all 4 agents, use the minimal setup:

````bash
# From host machine
./.claude/multi-agent/scripts/host/start-minimal-agents.sh
```text
This reduces resource usage by ~50%.

### 2. Reduce VS Code Extensions

Edit `.claude/multi-agent/templates/agent-devcontainer.json` to disable non-essential extensions:

```json
{
  "extensions": [
    // Essential only
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
    // Comment out others
  ]
}
```text
### 3. Configure TypeScript Server

Add to VS Code settings to limit TypeScript server memory:

```json
{
  "typescript.tsserver.maxTsServerMemory": 2048,
  "typescript.tsserver.experimental.enableProjectDiagnostics": false
}
```yaml
### 4. Sequential Development

Instead of parallel development:

1. Work in Core workspace
2. Open Agent 1 only when needed
3. Close agents when tasks complete

### 5. Monitor Resources

Use your operating system's native tools:

- **macOS**: Activity Monitor
- **Linux**: htop, top, or System Monitor
- **Windows**: Task Manager or Resource Monitor

### 6. Container Resource Limits (Already Configured)

The devcontainer configurations now include resource limits by default:

```json
{
  "runArgs": [
    "--memory=4g",              // Maximum 4GB RAM per container
    "--memory-reservation=1g",  // Minimum 1GB RAM guaranteed
    "--cpus=4"                  // Maximum 4 CPU cores
  ]
}
```text
These limits help prevent any single container from consuming all system resources, improving stability when running multiple VS Code instances.

### 7. Disable Unused Services

In devcontainer.json, remove unused features:

```json
{
  "features": {
    // Remove unused features
  }
}
```text
### 8. Use Lightweight Base Image

Consider using a minimal Node.js image:

```json
{
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18-bullseye"
}
```text
## Performance Tips

### VS Code Settings

```json
{
  // Reduce file watching
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/objects/**": true,
    "**/dist/**": true
  },

  // Disable telemetry
  "telemetry.telemetryLevel": "off",

  // Limit search
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```yaml
### Development Workflow

1. **Start Small**: Begin with Core only
2. **Add as Needed**: Open agents for specific tasks
3. **Close When Done**: Don't leave idle agents running
4. **Regular Cleanup**: Restart containers weekly

### System Recommendations

- **Minimum**: 16GB RAM, 4 cores
- **Recommended**: 32GB RAM, 8 cores
- **OS**: Linux/macOS (better Docker performance)

## Troubleshooting

### High Memory Usage

1. Check TypeScript servers: `pkill -f tsserver`
2. Restart VS Code window
3. Clear VS Code cache
4. Reduce open files

### Slow Performance

1. Close unused agents
2. Disable extensions
3. Increase Docker resources
4. Use SSD storage

### Container Issues

1. Prune Docker: `docker system prune -a`
2. Reset containers: `docker-compose down && docker-compose up`
3. Check logs: `docker logs <container>`

## Quick Reference

```bash
# Start minimal setup
./.claude/multi-agent/scripts/host/start-minimal-agents.sh

# Monitor resources
./.claude/multi-agent/scripts/host/resource-monitor.sh

# Kill all VS Code processes
pkill -f code

# Clean Docker
docker system prune -a

# Restart TypeScript servers
pkill -f tsserver
````
