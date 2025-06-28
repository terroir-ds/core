# Multi-Agent Quick Start Guide

## 🚀 Fastest Way to Start (Minimal Setup)

For most users, the minimal setup with Core + Agent 1 is recommended:

```bash
# From your host machine (not in container):
cd /path/to/terroir-core
./.claude/multi-agent/scripts/host/start-minimal-agents.sh
```

This gives you:
- ✅ 50% less memory usage
- ✅ Simpler workflow
- ✅ All the power you need for most tasks

## 📊 Resource Comparison

| What You're Running | Memory | Best For |
|-------------------|---------|----------|
| Core + Agent 1 (Minimal) | ~4-5GB | Most development, laptops |
| All 4 Agents (Full) | ~8-10GB | Complex parallel work, workstations |

## 🎯 Simple Daily Workflow

### Morning
```bash
# Start minimal setup
./.claude/multi-agent/scripts/host/start-minimal-agents.sh
```

### During Development
- **Agent 1** (Green): Write your utilities/features
- **Core**: Test integration and merge

### Evening
```bash
# Save and stop
./.claude/multi-agent/scripts/host/stop-agents.sh
```

## 💡 Pro Tips

1. **Start small**: Use minimal setup first
2. **Add agents only when needed**: You can always scale up
3. **Use native OS tools**: Activity Monitor (macOS) or htop (Linux) for resource monitoring
4. **Close what you're not using**: Each VS Code = ~2GB RAM

## 🆘 Quick Fixes

**Running slow?**
```bash
# Switch to minimal setup
./.claude/multi-agent/scripts/host/stop-agents.sh
./.claude/multi-agent/scripts/host/start-minimal-agents.sh
```

**Need to check resource usage?**
```bash
./.claude/multi-agent/scripts/host/resource-monitor.sh
```

**Want to stop everything?**
```bash
./.claude/multi-agent/scripts/host/stop-agents.sh
```

Remember: **Minimal setup handles 90% of development needs!**