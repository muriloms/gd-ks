# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0-beta.2] - 2026-04-20 (revised 2026-04-23)

Two releases rolled into one beta: the **Sprint 5 Guided Tutorial**
(original beta.2) plus a **Multi-Engine Expansion** adding first-class
Godot 4 and Unity 6 support alongside Unreal Engine 5.

### Added — Multi-Engine Expansion (revised 2026-04-23)

#### Godot 4 Engine Module

Complete implementation at `src/modules/engines/godot-4/`:

- **`engine-profile.yaml`** — GDScript/C# primary languages, 4
  platforms (pc/console/mobile/web), Mecanim-style AnimationPlayer
  and AnimationTree, Godot Physics + optional Jolt extension.
- **4 agents** — Guilherme (Architect), Gabi (GDScript Lead), Gina
  (Node Specialist), Érico (Coordinator).
- **3 workflows** — `godot-architecture`, `scene-specs`,
  `code-prompt-godot`.
- Idioms baked in: static typing everywhere, `@export` for designer
  tunables, signal-driven coupling, autoload plan for genuine globals,
  Custom Resources for content.

#### Unity 6 Engine Module

Complete implementation at `src/modules/engines/unity-6/`:

- **`engine-profile.yaml`** — C# primary language, 5 platforms
  including VR and web, URP/HDRP/Built-in pipeline options, Unity
  Netcode, Mecanim, PhysX, Addressables.
- **4 agents** — Uma (Architect), Ugo (C# Lead), Uli (Prefab
  Specialist), Enzo (Coordinator).
- **3 workflows** — `unity-architecture`, `prefab-specs`,
  `code-prompt-unity`.
- Idioms baked in: `private [SerializeField]` over public, cached
  `GetComponent` in `Awake`, no allocations in `Update`, ScriptableObject
  event channels over singletons, Addressables over `Resources.Load`.

### Changed — Multi-Engine Expansion

- **`ModuleManager.KNOWN_ENGINES`** — `godot-4` and `unity-6` now
  marked `available: true`.
- **Installer wizard** — engine picker now offers all three engines
  as fully supported (no more "coming soon" placeholders).
- **`Installer._prunePresetDisabledAgents`** — detects when a preset
  lists UE5-specific agent ids (written before the multi-engine era)
  and substitutes them for the target engine's `agents_provided` list.
  Result: `solo-indie` preset + `targetEngine: godot-4` → installs
  Godot agents matching the preset's intended team size.
- **`src/modules/planning/templates/story.template.md`** —
  expanded `{{#engine godot-4}}` and `{{#engine unity-6}}` blocks
  with idiomatic implementation notes matching the new agents.
- **Schema coverage** — jumped from 105 to **123 YAML files** validated.

### Test Coverage — Multi-Engine Expansion

- **+4 new unit tests** (engine-profile-manager validates Godot/Unity
  profiles; module-manager confirms they're now available).
- **+5 new integration tests** (install with Godot, install with
  Unity, cross-engine isolation — no UE5 agents leak when installing
  Godot, etc.).
- **Updated 3 existing tests** that assumed godot/unity were
  placeholders.
- **Total: 240 tests** (174 unit + 66 integration), all passing.

### Backward Compatibility

- Zero breaking changes. Existing UE5 projects behave identically.
- Projects installed with `targetEngine: unreal-5` get exactly the
  same agents and workflows they got before.
- Engine migration (switch from UE5 to Godot mid-project) is not yet
  supported automatically — you'd need to reinstall. Planned for v0.5.

---

### Added — Sprint 5 Guided Tutorial

#### The `*tutorial` Workflow

- **`src/core/workflows/tutorial/workflow.yaml`** — 9-step workflow
  registered under the `gdks-master` agent. Invoked by typing
  `*tutorial` in the user's IDE chat.
- **`src/core/workflows/tutorial/instructions.md`** — 344-line guide
  the agent follows to narrate each step.
- **9 user-facing step documents** in
  `src/core/workflows/tutorial/steps/`:
  1. Welcome + 4-phase overview
  2. Project setup (sandbox mode)
  3. Meet Sparky (Ideation)
  4. Run `*brainstorm` → concept-brief
  5. Handoff to Design (contracts explained)
  6. Create GDD (Design team)
  7. Planning team tour (Sam, Peter)
  8. Engine team tour (Ulysses, code-prompt workflow)
  9. Wrap-up + next steps

#### Cosmic Explorer Sample Project

- **`src/core/workflows/tutorial/sample-outputs/cosmic-explorer/`** —
  complete pre-baked project demonstrating the tutorial:
  - `01-ideation/concept-brief.md` — concept for a 2D low-gravity
    puzzle-platformer
  - `02-design/gdd/main.md` — GDD with pillars, core mechanics
    (Drift / Anchor / Resonance Pulse)
  - `02-design/core-design/pillars/design-pillars.md`
  - `03-planning/epics.md` — 4 epics with stories
  - `03-planning/roadmap.md`
  - `04-engine/architecture.md` — UE5 C++ vs Blueprint boundary

#### New CLI Command

- **`gd-ks tutorial`** — bootstrap the tutorial sandbox.
  - Default: copies samples to `_gdks-output-tutorial/` and creates
    `_gdks/_state/tutorial-state.yaml` (separate from real state).
  - `--info` — print the tutorial syllabus without side effects.
  - `--reset` — clear previous tutorial sandbox and state.
  - `--quiet` — suppress output (used by tests).
  - `--project-root <path>` — explicit root (useful for testing).

- Registered in `src/cli/index.js`.
- Added `*tutorial` to the `gdks-master.agent.yaml` menu.
- Added `tutorial` to the workflows list in `src/core/module.yaml`.

#### Schema Fix

- **`tools/validator/schema/workflow.schema.json`** — `phase` field
  now accepts `0` (used by cross-phase / tutorial workflows).

### Changed — Sprint 5

- Sprint 4's test suite had a subtle race: `tests/integration/tutorial.test.js`
  used `process.chdir()` which created conflicts when run alongside other
  integration tests in parallel. Refactored to pass explicit
  `projectRoot` instead.
- `tutorial()` command now accepts a `projectRoot` option for
  non-default invocation.

### Test Coverage — Sprint 5

- **+12 new integration tests** for the tutorial command.
- Global coverage: 91.93% (pre-multi-engine expansion).

### Developer Notes

- The tutorial uses the existing `gdks-master` agent rather than
  introducing a new one — onboarding lives in the same entry point
  users already have.
- Sample outputs are intentionally complete rather than placeholders.
- The `tutorial-state.yaml` is technically a valid project state per
  the schema; users who want to graduate the tutorial into a real
  project can rename the file to `project-state.yaml`.
- Multi-engine users can create the same tutorial sample adapted to
  their engine by symmlinking `sample-outputs/cosmic-explorer/` and
  editing the `04-engine/` contents. Not needed for the core flow.

## [0.4.0-beta.1] - 2026-04-20

**First beta of the v0.4 series.** Sprint 4 of the v0.4 roadmap:
**Presets & Profiles**. Addresses the over-engineering risk by
letting users opt into a subset of the 32 agents that matches their
project profile.

### Added

#### 7 Canonical Presets

Each preset is a YAML file in `src/_config/presets/` that declares
which agents are active for a given project profile.

| Preset | Agent count | Target |
|--------|-------------|--------|
| `minimal` | ~8 | Hobbyista / game jam (48h to 2 weeks) |
| `solo-indie` | ~16 | Solo or 2-dev team (3-18 months) |
| `small-studio` | ~23 | 3-10 devs (9-24 months) |
| `studio` | 32 | AAA / educational (all agents active) |
| `narrative-heavy` | ~20 | RPG, Visual Novel (story-first) |
| `mobile-casual` | ~17 | F2P / hypercasual |
| `custom` | 32 | All active; user adjusts individually |

Installer now asks which preset matches your project BEFORE picking
individual modules.

#### Preset Schema + Validator

- **`tools/validator/schema/preset.schema.json`** — 7th schema.
- Each preset declares `modules_enabled`, `agents_active` (per module),
  `agents_disabled`, and optional `contracts_relaxed` (per-contract
  deliverable relaxations).

#### `PresetManager` Subsystem

- **`src/core/presets/preset-manager.js`** —
  `load()`, `list()`, `isAgentActive()`, `getActiveAgents()`,
  `enableAgent()`, `disableAgent()` (with deep-clone immutability).
- Caches presets in memory for repeated reads.

#### Agent Filtering During Install

- The installer now **prunes disabled agents** before compilation:
  `*.agent.yaml` and `*.md` for agents in `agents_disabled` are
  removed from the installed `_gdks/<module>/agents/` tree.
- Users of the `minimal` preset see ~8 agents instead of 32.

#### New CLI Commands

- **`gd-ks preset show`** — print the active preset with all active
  agents grouped by module.
- **`gd-ks preset list`** — list all 7 presets with descriptions and
  agent counts.
- **`gd-ks preset switch <id>`** — change active preset (persists in
  `project-state.yaml`).
- **`gd-ks preset enable-agent <id> [--module=design]`** — enable a
  specific agent. Override saved in `state.preset_overrides`.
- **`gd-ks preset disable-agent <id> [--module=design]`** — disable
  a specific agent.

- **`gd-ks rollback`** (bonus) — restore project state from a
  checkpoint. Interactive by default; supports `--to=<filename>`,
  `--phase=N`, `--dry-run`, `-y/--yes`. Backups current state before
  restoring; logs a `rollback` event.

### Changed

- **Installer wizard** now asks preset upfront (before modules).
  `--yes` default preset is `solo-indie`.
- **`Installer.compileAgents`** filters agents via the active preset.
- **Validator CLI** now recognizes the `preset` type:
  `gd-ks validate:schemas` validates all 7 presets automatically.

### Test Coverage

- **+16 new unit tests** for PresetManager.
- **+6 new integration tests** for preset install filtering (one per
  preset).
- **+5 new integration tests** for rollback flow.
- **Total: 223 tests** (170 unit + 53 integration), all passing.
- **Global coverage: 93.04%**.
- `src/core/presets/` coverage: **97.22%**.

### Backward Compatibility

- Zero breaking changes. All Sprint 1/2/3 tests still pass.
- Upgrading from `0.4.0-alpha.x` is a no-op reinstall; your existing
  `_gdks/_state/project-state.yaml` still works.
- Projects without a `preset` field in state default to `custom`
  (all agents active), so no one loses agents unexpectedly.

### Developer Notes

- User-level agent toggles (`preset enable-agent`/`disable-agent`)
  are saved under `state.preset_overrides`, leaving the shipped
  preset files untouched. This is a deliberate separation: presets
  are code, overrides are data.
- The `contracts_relaxed` field in presets is schema-defined but not
  yet consumed by `ContractValidator`. Integration is planned for
  Sprint 5 once playtest / iterative workflows land.
- Rollback creates a "pre-rollback" checkpoint of the current state
  before overwriting — you can always unroll a rollback if needed.

## [0.4.0-alpha.3] - 2026-04-20

Sprint 3 of the v0.4 roadmap: **Engine-Agnostic Layer**. Prepares GD-KS
to support engines beyond Unreal Engine 5 (Godot 4, Unity 6, etc.) by
isolating engine-specific knowledge into pluggable modules with a
common interface.

### Added

#### New Module Layout

- **`src/modules/engines/`** — directory structure where each engine
  lives as an independent module:
  - `unreal-5/` — full UE5 implementation (migrated from the old
    `src/modules/engine/`).
  - `godot-4/` — placeholder, planned for v0.5.0.
  - `unity-6/` — placeholder, planned for v0.5.0.
  - `_shared/engine-interface.yaml` — documentation of what every
    engine module must provide.

- **`engine-profile.yaml`** — new file format at the root of every
  engine module declaring capabilities (languages, physics, animation
  systems, multiplayer modes, platforms), agents provided, workflows
  exposed, and planning template hints.
- **`engine-profile.schema.json`** — JSON schema validating the
  structure of engine profiles.

#### New Subsystems

- **`src/core/engines/engine-profile-manager.js`** —
  loads, validates (against the schema), and caches engine profiles.
  Usable API: `load(engineId)`, `listAvailable()`,
  `getTemplateHints(engineId)`.

- **`src/core/templates/template-conditionals.js`** —
  tiny renderer for engine-conditional blocks in templates:

  ```markdown
  {{#engine unreal-5}}
  Use UPROPERTY macros...
  {{/engine}}

  {{#engine godot-4}}
  Use @export annotations...
  {{/engine}}

  {{#engine-not unreal-5}}
  (shown for any engine OTHER than unreal-5)
  {{/engine-not}}
  ```

  Plus simple variable substitution: `{{engine.id}}`, `{{engine.name}}`.

#### New Example Template

- **`src/modules/planning/templates/story.template.md`** —
  engine-aware user story template demonstrating `{{#engine}}` blocks.

#### Feature Flags

- **`src/_config/features.yaml`** — declarative feature flags for
  experimental behavior (`engineAgnostic`, `autoInjectStateContext`,
  `llmApiIntegration`).

### Changed

- **`ModuleManager`** now resolves the module name `engine` to
  `src/modules/engines/<targetEngine>/` via a programmatic alias —
  no symlinks (cross-platform safe). Legacy callers still work
  without changes.
- **Installer** accepts a `targetEngine` option (default `unreal-5`)
  and passes it through to `ModuleManager`.
- **`gd-ks install` wizard** now asks which engine the user targets
  when they include the `engine` module:
  - Unreal Engine 5 (fully supported)
  - Godot 4 (disabled — coming in v0.5)
  - Unity 6 (disabled — coming in v0.5)
  - Engine-agnostic (design & planning only)
- **Agent compiler** emits a `<!-- GDKS_STATE_CONTEXT_PLACEHOLDER -->`
  marker in every compiled agent markdown. The new `gd-ks state inject`
  command replaces that placeholder with live state from
  `project-state.yaml`.
- **Neutralized UE5 references** in engine-agnostic parts of the
  project:
  - `planning/agents/planning-coordinator.agent.yaml` — handoff
    instructions no longer assume UE5.
  - `design/workflows/audio/audio-implementation/workflow.yaml` —
    step renamed from "UE5 Integration" to "Engine Integration".
- **Validator** now recognizes a 6th schema: `engine-profile`.

### New CLI Sub-command

- **`gd-ks state inject`** — walks all compiled agent markdown files
  in `_gdks/` and replaces the state context placeholder with the
  current project state. Run this any time state changes so agents
  see fresh context on their next invocation.

### Backward Compatibility

- **Zero breaking changes.** Every Sprint 1 + Sprint 2 test still
  passes (197 tests total).
- Projects upgraded from v0.3 → v0.4 still work whether they were
  installed before or after the engine-agnostic refactor.

### Test Coverage

- **New unit tests (29)**: engine-profile-manager, template-conditionals.
- **New integration tests (6)**: engine-agnostic install flow.
- **Total: 197 tests** (155 unit + 42 integration), all passing.
- **Global coverage: 93.08%**.
- `src/core/engines/` coverage: **93.2%**.
- `src/core/templates/` coverage: **94.7%**.

### Developer Notes

- An engine module only needs to ship with: `engine-profile.yaml`,
  `module.yaml`, `agents/`, `workflows/`. Contributors can create new
  engine modules by following the contract in
  `src/modules/engines/_shared/engine-interface.yaml`.
- See `docs/adding-new-engine.md` for a full tutorial.

## [0.4.0-alpha.2] - 2026-04-20

Sprint 2 of the v0.4 roadmap: **Project State & Handoff Contracts**.
Adds a single source of truth for project state and formalizes the
contracts between phases. Resolves the Design→Planning bug that
motivated the v0.2 release.

### Added

#### Central Project State (`_gdks/_state/`)

- **`project-state.yaml`** — single source of truth for each project:
  current phase, deliverables, decisions, open questions, active
  agents. Validated by the JSON schema introduced in Sprint 1.
- **`history/events.ndjson`** — append-only audit log of every
  meaningful action (install, handoff, decision, etc.).
- **`checkpoints/`** — YAML snapshots saved before every phase
  transition, enabling rollback and audit.

New module: `src/core/state/`
  - `state-manager.js` — CRUD API with schema enforcement on every write
  - `event-logger.js` — NDJSON append-only logger
  - `checkpoint-manager.js` — snapshot + list + latest API

#### Handoff Contracts (`_gdks/_contracts/`)

- **Contract schema** (`contract.schema.json`) — validates the
  structure of handoff contracts themselves.
- **Three default contracts** shipped:
  - `phase-01-to-02.contract.yaml` — Ideation → Design
  - `phase-02-to-03.contract.yaml` — Design → Planning (the one that
    prevents premature handoff — requires pillars, core mechanics,
    loops, progression, and conditionally narrative/art/audio based
    on preset)
  - `phase-03-to-04.contract.yaml` — Planning → Engine

New module: `src/core/contracts/`
  - `contract-loader.js` — loads user-customized contracts with
    fallback to packaged defaults
  - `contract-validator.js` — validates deliverables + quality gates
    (`no_open_blockers`, `min_completion_pct`, `all_agents_signoff`)
  - `handoff-gate.js` — orchestrates the full transition: validate →
    checkpoint → mutate → log

#### New CLI Commands

- **`gd-ks state`** — inspect or manage project state
  - `gd-ks state show` — pretty-print the current state with progress
  - `gd-ks state show --phase=N` — filter to a specific phase
  - `gd-ks state history [--last=N]` — read the event log
  - `gd-ks state decision "<text>" --by=<agent>` — record a decision
  - `gd-ks state question "<text>" --from=<agent>` — open a question
  - `gd-ks state context` — print the `<project_state_context>` block
    that gets injected into agent prompts

- **`gd-ks validate`** — check if the current phase is ready to hand off
  - Shows pass/fail per deliverable and per quality gate
  - Suggests `gd-ks handoff` when all checks pass
  - Returns exit code 1 when not ready (CI-friendly)

- **`gd-ks handoff --from=N --to=M`** — advance between phases
  - Runs contract validation; aborts if any check fails
  - `--dry-run` — validate without mutating state
  - `--force` — override failed checks (with audit flag `forced=true`)
  - Creates a checkpoint before mutating
  - Logs a `handoff` event

#### Migration Script

- **`scripts/migrate-v03-to-v04.js`** — retrofit existing v0.3
  installations to v0.4:
  - Dry-run by default (safe); `--apply` to commit
  - Infers current phase from deliverables found in the output folder
  - Reads old `manifest.yaml`/`project-config.yaml` for project name
    and language
  - Copies the 3 default contracts
  - Logs a `migrated` event

### Changed

- **Installer** (`tools/installer/lib/installer.js`):
  - Now creates `_gdks/_state/` (checkpoints/, history/) and
    `_gdks/_contracts/` directories.
  - Calls `StateManager.init()` to create `project-state.yaml` on
    fresh installs — idempotent (will not overwrite existing state).
  - Copies the 3 default contracts into the project (idempotent —
    will not overwrite user-customized contracts).
  - Logs a `project_initialized` event on fresh install.

### Test Coverage

- **79 new unit tests** (state-manager: 25, event-logger: 10,
  checkpoint-manager: 10, contract-loader: 6, contract-validator: 17,
  handoff-gate: 11).
- **14 new integration tests** covering installer state+contracts
  integration and an end-to-end handoff simulation.
- **Total: 165 tests** (129 unit + 36 integration), all passing.
- **Global coverage: 93.55%** (up from 89.54% in Sprint 1).
- `src/core/state/` coverage: **98.11%**.
- `src/core/contracts/` coverage: **98.12%**.

### Developer Notes

- The v0.3→v0.4 migration script is safe by default — it runs in
  dry-run mode unless `--apply` is passed. Your existing files are
  never modified outside the `_gdks/_state/` and `_gdks/_contracts/`
  directories.
- `StateManager.renderContext()` produces the
  `<project_state_context>` block that agents can inject into their
  system prompt. In a future sprint, the agent compiler will do this
  automatically.
- The contract validator uses `required_when` for conditional
  deliverables — e.g., `story-bible.md` is only required when the
  preset is `narrative-heavy` or `studio`. This lays groundwork for
  Sprint 4 (Presets).

## [0.4.0-alpha.1] - 2026-04-20

Sprint 1 of the v0.4 roadmap: **Test Suite & CI/CD**. No new agents or
workflows added — this release is a maturation milestone focused on
stability, validation, and the tooling needed to safely land the rest
of the v0.4 sprints.

### Added

#### Schema Validation

- **JSON Schemas** for agents, workflows, modules, and the upcoming
  `project-state.yaml` (forward-compat for Sprint 2).
  Located under `tools/validator/schema/`.
- **Schema validator** (`tools/validator/validator.js`) built on AJV 8
  with a unified CLI — validates every YAML in `src/` by default.
- New npm scripts:
  - `npm run validate:schemas` — validate everything
  - `npm run validate:agents` / `validate:workflows` / `validate:modules`

#### Test Suite

- **Unit tests** for `SchemaValidator`, `AgentCompiler`, `FileManager`,
  `ModuleManager`, and `ManifestGenerator`, using Node's built-in
  `node:test` runner (no Jest/Mocha dependency).
- **Integration tests** covering:
  - Full installer flow (`install-flow.test.js`)
  - Compiling and schema-validating every real agent shipped
    (`compile-all-agents.test.js`)
  - IDE config generation for Cursor, Windsurf, VS Code, Claude Code,
    and `none` (`ide-config-generation.test.js`)
- **Test helpers** — `tests/helpers/sandbox.js` (temp dirs),
  `tests/helpers/assertions.js` (custom matchers).
- **Fixtures** — valid/invalid agent and workflow YAMLs under
  `tests/fixtures/`.
- **Coverage** via `c8` — run with `npm run test:coverage`.

#### CI/CD

- **GitHub Actions workflows**:
  - `.github/workflows/ci.yml` — lint, schema validation, unit tests
    on Node 20 & 22, integration tests on Ubuntu + macOS + Windows,
    coverage report.
  - `.github/workflows/pr-validation.yml` — Conventional Commit title
    check, CHANGELOG update reminder.

#### Markdown Linting

- `scripts/lint-markdown.js` — lightweight linter for workflow
  instruction and template markdown files. Wired to `npm run lint:md`.

### Changed

- **`prepublishOnly` hook** now runs `lint` + `validate:schemas` +
  `test:unit` before publishing to NPM, preventing broken releases.
- **Dependencies added**: `ajv@^8.17`, `ajv-formats@^3.0`,
  `c8@^10.1` (devDependency).

### Fixed

- **Hardcoded installer version** (`0.1.0-alpha.1`) in
  `src/cli/commands/install.js`. It now reads from `package.json`
  dynamically, so the manifest always reflects the real version.

### Developer Notes

- Schema for `module.yaml` is deliberately permissive about the
  `agents`/`workflows` fields (accepts both string-arrays and
  object-arrays) because the current modules are inconsistent — the
  `ideation` module uses rich objects while others use id strings.
  We'll normalize this in Sprint 3 without breaking existing modules.
- Forward-looking schema `project-state.schema.json` is already in
  place so Sprint 2 can land the state manager without retro-fitting.

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
