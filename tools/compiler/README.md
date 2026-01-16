# GD-KS Agent Compiler

This directory will contain the agent compilation system:

## Files (To be implemented in Phase 1)

- `agent-compiler.js` - Compiles YAML agent definitions to Markdown
- `schema/agent.js` - Zod schema for agent validation
- `templates/` - Compilation templates

## Compilation Process

1. Read `.agent.yaml` source file
2. Validate against schema
3. Apply customizations from `.customize.yaml`
4. Generate IDE-ready `.md` file
5. Copy to installation directory

## Status

🚧 Under development - will be implemented in Phase 1
