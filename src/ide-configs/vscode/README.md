# GD-KS VS Code Configuration

## How to Use GD-KS with VS Code

### With GitHub Copilot Chat

1. Open `_gdks/core/agents/gdks-master.md` 
2. Copy the content and paste at the start of your Copilot Chat
3. Use `*help` to see available commands

### With Continue.dev Extension

1. Install Continue extension
2. Add this to your `.continue/config.json`:

```json
{
  "systemMessage": "You are operating within GD-KS framework. Load agents from _gdks/ folder and use * commands."
}
```

### With Other AI Extensions

Most AI extensions support custom system prompts:
1. Find the system prompt/instructions setting
2. Copy content from `_gdks/core/agents/gdks-master.md`
3. Paste as the system instructions

## Quick Reference

| Command | Description |
|---------|-------------|
| `*help` | Show available commands |
| `*init` | Initialize project |
| `*status` | Check progress |
| `*teams` | View all teams |

## Output Structure

```
_gdks-output/
├── 01-ideation/
├── 02-design/
├── 03-planning/
└── 04-engine/
```
