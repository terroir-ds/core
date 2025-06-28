# Claude Working Directory

This directory contains temporary files used during Claude AI sessions.

## Structure

```
.claude/
├── tasks/         # Task planning and tracking documents
├── sessions/      # Session-specific notes and context
└── README.md      # This file
```

## Purpose

- **tasks/**: Temporary task lists, planning documents, and work-in-progress notes
- **sessions/**: Context that needs to persist across a working session but not in the repo

## Cleanup Policy

Files in this directory should be:
1. Reviewed at the end of each session
2. Moved to permanent docs if needed
3. Deleted if no longer relevant

## Note

This entire directory is gitignored and should never be committed to the repository.