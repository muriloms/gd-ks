# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.1] - 2026-01-16

### Added
- Initial alpha release
- Core installation system with interactive wizard
- 21 specialized AI agents across 4 teams:
  - **Ideation Team** (4 agents): Sparky, Marcus, Mira, Ivy
  - **Design Team** (7 agents): Diana, Leo, Nina, Theo, Aurora, Anton, Dylan
  - **Planning Team** (4 agents): Sam, Tina, Dana, Peter
  - **Engine Team** (5 agents): Ulysses, Priscilla, Simon, Bella, Eric
- Agent compilation system (YAML → Markdown)
- Workflow system with instructions and templates
- IDE configuration support:
  - Cursor (.cursor/rules/gdks/*.mdc)
  - Windsurf (.windsurf/gdks-rules.md)
  - VS Code (.vscode/)
  - Claude Code (.claude/commands/gdks/)
- Core workflows:
  - workflow-init: Project initialization
  - workflow-status: Progress tracking
  - party-mode: Multi-agent collaboration
- Ideation workflows:
  - brainstorm-concept
  - market-analysis
  - mechanics-exploration
  - find-hook
  - scope-analysis
  - concept-synthesis
  - concept-validation
  - handoff-to-design
- Document templates for each workflow
- Multi-language support (en, pt-BR, es)
- Development tracks (Quick, Standard, Full)

### Technical
- Node.js 20+ required
- ES Modules throughout
- Dependencies: chalk, commander, fs-extra, inquirer, js-yaml, ora

## [Unreleased]

### Planned
- Enhanced workflow instructions
- More document templates
- Web bundles for ChatGPT/Gemini
- Custom agent creation guide
- UE5 code generation prompts
