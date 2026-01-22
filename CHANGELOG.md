# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0-alpha.1] - 2026-01-22

### Added - Core Design Skills (15 Game Design Principles)

#### New Agents (7) - Core Design Team
- **Marco** (Mechanics Designer) - Core/secondary mechanics, player verbs
- **Paige** (Progression Architect) - Rewards, unlocks, economy
- **Lucas** (Core Loop Specialist) - Micro/core/meta loops, feedback
- **Simon** (Systems Designer) - System interactions, emergent gameplay
- **Ava** (Player Agency Advocate) - Meaningful choices, consequences
- **Pete** (Playtest Coordinator) - Test planning, feedback analysis
- **Felix** (Game Feel Physicist) - Physics, juice, responsiveness

#### New Workflows (11) - Core Design
- `*mechanics` - Core Mechanics specification
- `*progression` - Progression System design
- `*loops` - Gameplay Loops (micro/core/meta)
- `*systems` - Systems Design and interactions
- `*agency` - Player Agency audit
- `*playtest` - Playtest Plan creation
- `*feel` - Game Feel and physics tuning
- `*balance` - Balance Framework (flow, difficulty)
- `*pillars` - Design Pillars definition
- `*depth` - Game Depth analysis
- `*pacing` - Pacing Design

### Changed
- Updated Design module to v0.3.0
- Expanded Cursor rules with all 18 agents
- Added recommended workflow order for core design

### Summary
- **Total Agents:** 25 → 32 (+7)
- **Design Agents:** 11 → 18 (+7)
- **Design Workflows:** 27 → 38 (+11)
- Implements 15 professional game design skills/principles

## [0.2.0-alpha.1] - 2026-01-22

### Added - Design Phase Expansion

#### New Agents (4)
- **Walter** (World Builder) - Lore, history, geography, cultures, factions
- **Charlie** (Character Designer) - Character profiles, arcs, relationships
- **Cora** (Concept Artist Coordinator) - Concept art briefs, visual specs
- **Max** (Marketing Strategist) - Marketing strategy, brand, store page

#### New Workflows - Narrative (6)
- `*story` - Story Bible creation
- `*characters` - Character Profiles documentation
- `*lore` - World Lore development
- `*locations` - Location Design documentation
- `*dialogues` - Dialogue Design system
- `*quests` - Quest Design documentation

#### New Workflows - Art (5)
- `*concept` - Concept Art Briefs
- `*charart` - Character Art Specifications
- `*envart` - Environment Art Specifications
- `*uistyle` - UI Style Guide
- `*vfx` - VFX Design documentation

#### New Workflows - Audio (5)
- `*music` - Music Direction
- `*sfx` - SFX Catalog
- `*ambient` - Ambient Design
- `*voice` - Voice Direction
- `*audioimpl` - Audio Implementation guide

#### New Workflows - Marketing (6)
- `*marketing` - Marketing Strategy
- `*brand` - Brand Identity
- `*trailer` - Trailer Script
- `*store` - Store Page content
- `*social` - Social Media strategy
- `*presskit` - Press Kit

### Changed
- Updated Design module to v0.2.0
- Expanded Cursor rules for Design team
- Enhanced phase completion checklist
- Design Phase now ensures complete documentation before Planning

### Summary
- **Total Agents:** 21 → 25 (+4)
- **Design Agents:** 7 → 11 (+4)
- **Design Workflows:** 5 → 27 (+22)
- Design Phase now covers: GDD, Narrative, Art, Audio, and Marketing

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
