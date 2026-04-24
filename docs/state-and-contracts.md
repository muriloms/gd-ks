# State & Contracts — GD-KS v0.4

> Single source of truth for your project + formal contracts between phases.

---

## Why?

In v0.3 and earlier, GD-KS had no central memory:

- Agents had to re-derive context from scratch every session
- Nothing stopped you from jumping from Design to Planning before your
  GDD was actually complete (this was the exact bug that motivated v0.2)
- Decisions and open questions got lost between sessions

v0.4 Sprint 2 fixes both problems with two coordinated pieces:

1. **Project State** — a single `project-state.yaml` file that tracks
   everything, with a validated schema and an append-only event log.
2. **Handoff Contracts** — YAML documents that define what each phase
   must deliver before you can advance. Validated before every phase
   transition.

---

## File Layout

After `gd-ks install` on v0.4, your project has this structure:

```
my-project/
├── _gdks/
│   ├── _state/
│   │   ├── project-state.yaml         ← single source of truth
│   │   ├── checkpoints/               ← snapshots before each handoff
│   │   │   └── phase-01-ideation-2026-04-20-....yaml
│   │   └── history/
│   │       └── events.ndjson          ← append-only audit log
│   ├── _contracts/
│   │   ├── phase-01-to-02.contract.yaml
│   │   ├── phase-02-to-03.contract.yaml
│   │   └── phase-03-to-04.contract.yaml
│   ├── _config/...                    ← (existing)
│   ├── _memory/...                    ← (existing)
│   └── [module folders]               ← (existing)
│
└── _gdks-output/                      ← your generated docs
    ├── 01-ideation/
    ├── 02-design/
    ├── 03-planning/
    └── 04-engine/
```

---

## The Project State

`_gdks/_state/project-state.yaml` captures everything about your project.

### Example

```yaml
schema_version: "1.0"
project:
  id: "my-awesome-game"
  name: "My Awesome Game"
  created_at: "2026-04-20T10:00:00Z"
  updated_at: "2026-04-20T15:30:00Z"

preset: "solo-indie"
target_engine: "unreal-5"
language: "en"

current_phase: 2
phases_completed: [1]
phases_in_progress: [2]

phase_progress:
  "1":
    status: "completed"
    completed_at: "2026-04-18T00:00:00Z"
    completion_pct: 100
    deliverables:
      - { id: "concept-brief", path: "_gdks-output/01-ideation/concept-brief.md", verified: true }
  "2":
    status: "in_progress"
    started_at: "2026-04-19T00:00:00Z"
    completion_pct: 65
    deliverables:
      - { id: "gdd-main", path: "_gdks-output/02-design/gdd/main.md", verified: true }
      - { id: "story-bible", path: "_gdks-output/02-design/narrative/story-bible.md", verified: false }

active_agents: ["diana", "marco", "nina"]

decisions:
  - { id: "D001", phase: 1, by: "sparky", what: "Genre: Metroidvania 2D", when: "..." }
  - { id: "D002", phase: 2, by: "diana", what: "3 pillars defined", when: "..." }

open_questions:
  - { id: "Q001", phase: 2, from: "marco", to: "user", text: "Should we support co-op?", status: "pending" }
```

### Schema Enforcement

The state file is **never written without validation**. Any attempt to
put something invalid into the state throws immediately — you can't end
up with a silently corrupt state file.

### Never Edit by Hand (mostly)

Prefer the CLI commands below. Manual editing is possible but you have
to keep the schema happy. Use `gd-ks state show` to inspect, and the
named mutations to change.

---

## CLI Commands

### `gd-ks state show`

Prints the current state as a pretty table.

```bash
$ gd-ks state show

📊 My Awesome Game
   my-awesome-game • created 2026-04-20 10:00:00

Preset:       solo-indie
Engine:       unreal-5
Language:     en
Current:      Phase 2

● Phase 1 — Ideation (completed)
    100% complete
    ✓ concept-brief → _gdks-output/01-ideation/concept-brief.md
◐ Phase 2 — Design (in_progress)
    65% complete
    ✓ gdd-main → _gdks-output/02-design/gdd/main.md
    · story-bible → _gdks-output/02-design/narrative/story-bible.md
○ Phase 3 — Planning (not_started)
○ Phase 4 — Engine (not_started)

🎯 Recent Decisions
  D001 [phase 1, sparky] Genre: Metroidvania 2D
  D002 [phase 2, diana] 3 pillars defined

❓ Open Questions
  [pending] Q001: Should we support co-op?
```

Flags:
- `--phase=N` — only show phase N

### `gd-ks state history [--last=N]`

Read the event log (default last 20 events).

### `gd-ks state decision "<text>" [--by=<agent>] [--phase=N]`

Record a decision. Gets an auto-assigned id `D###`.

### `gd-ks state question "<text>" [--from=<agent>] [--to=<target>]`

Open a question. Gets an auto-assigned id `Q###` and status `pending`.

### `gd-ks state context`

Print the `<project_state_context>` block that agents should receive.
Useful for copying into an agent prompt manually if your IDE doesn't
auto-inject it.

---

## Handoff Contracts

A **contract** is a YAML file describing what must be true before you
can advance from one phase to the next.

### Anatomy

```yaml
schema_version: "1.0"
from_phase: 2
to_phase: 3
name: "Design → Planning Handoff"

required_deliverables:
  - id: gdd-main
    path_glob: "_gdks-output/02-design/gdd/main.md"
    min_word_count: 500
    required_sections:
      - "Pillars"
      - "Core Mechanics"

  - id: story-bible
    path_glob: "_gdks-output/02-design/narrative/story-bible.md"
    required_when:
      preset: ["narrative-heavy", "studio"]   # only required for these presets

quality_gates:
  - type: no_open_blockers
  - type: min_completion_pct
    value: 80
  - type: all_agents_signoff
    agents: ["diana", "dylan"]
```

### Deliverable Checks

Each `required_deliverables` item supports:

- `path_glob` — file the deliverable must exist at (relative to project root)
- `min_word_count` — minimum number of words in the file
- `required_sections` — list of markdown headings that must appear
  (case-insensitive, H1/H2/H3 all count)
- `required_when` — conditional; only checked if the condition matches
  the current project state. Supports `preset` and `target_engine`.

For a deliverable to pass, all of these must hold:
1. File exists on disk
2. Deliverable is registered in `project-state.yaml` as `verified: true`
3. Word count meets `min_word_count`
4. All `required_sections` appear as headings

### Quality Gates

| Gate type | Meaning |
|---|---|
| `no_open_blockers` | No open questions have `status: "blocker"` |
| `min_completion_pct` | Phase `completion_pct >= value` |
| `all_agents_signoff` | All listed agents appear in `state.active_agents` |

### Customizing Contracts

You can edit `_gdks/_contracts/*.contract.yaml` in your project to:

- Add your own required deliverables
- Relax or tighten word counts and sections
- Add conditional deliverables for your preset

The `ContractLoader` always reads from your project first, falling back
to packaged defaults only for contracts you haven't customized.

---

## The Handoff Workflow

Typical use:

```bash
# 1. Check what's still missing
$ gd-ks validate --phase=2

🔍 Validating handoff: Phase 2 → Phase 3
   Contract: Design → Planning Handoff

  ✓ gdd-main
  ✓ design-pillars
  ✗ core-mechanics-spec — File not found: _gdks-output/02-design/core-design/mechanics/core-mechanics.md
  ○ story-bible — required_when condition not matched
  ✓ gate:no_open_blockers
  ✗ gate:min_completion_pct — Phase completion 70% < required 80%

✗ FAILED — 2 check(s) failed, 3 passed

# 2. Fix the issues... (create mechanics spec, bump completion %)

# 3. Validate again
$ gd-ks validate --phase=2
✓ PASSED — 5/5 checks
  You can proceed with: gd-ks handoff --from=2 --to=3

# 4. Execute handoff
$ gd-ks handoff --from=2 --to=3

🚦 Handoff: Phase 2 → Phase 3

✓ Handoff completed
  5/5 contract checks passed
  Checkpoint: _gdks/_state/checkpoints/phase-02-design-2026-04-20-....yaml

→ You are now in Phase 3. Load the appropriate agents and continue.
```

### What Happens During Handoff

In order:

1. **Load contract** — reads user's contract; falls back to default.
2. **Validate** — checks all deliverables and quality gates.
3. **Gate** — if any check fails and `--force` not set, **abort
   without mutating state**.
4. **Checkpoint** — save full state snapshot to
   `_gdks/_state/checkpoints/phase-NN-...-handoff-to-M.yaml`.
5. **Mutate state** — mark `from_phase` completed, `to_phase`
   in_progress, update `current_phase`.
6. **Log event** — append a `handoff` entry to `events.ndjson`.

### Dry Run and Force

```bash
# Only validate; do not mutate state
gd-ks handoff --from=2 --to=3 --dry-run

# Advance even if contract fails (audit-flagged)
gd-ks handoff --from=2 --to=3 --force
```

Forced handoffs are still logged with `forced: true` so the audit trail
shows exactly what happened.

---

## Migrating from v0.3

If you already have a v0.3 project, run the migration:

```bash
# 1. Preview what will change (dry run — default)
node node_modules/gd-ks/scripts/migrate-v03-to-v04.js

# 2. Apply
node node_modules/gd-ks/scripts/migrate-v03-to-v04.js --apply
```

The migration:

- Creates `_gdks/_state/` and `_gdks/_contracts/` directories
- Infers your current phase from which phase folders in
  `_gdks-output/` have content
- Registers existing `.md` files as deliverables (not verified; you
  can verify them manually)
- Copies the 3 default contracts
- Logs a `migrated` event

Your existing files in `_gdks/` and `_gdks-output/` are **never
modified** by the migration — it only adds new directories.

---

## Rollback

Every handoff saves a checkpoint. If you need to roll back:

```bash
# List checkpoints
ls _gdks/_state/checkpoints/

# Inspect one
cat _gdks/_state/checkpoints/phase-02-design-2026-04-20-...-handoff-to-3.yaml

# Manual restore: copy the `state:` block into _gdks/_state/project-state.yaml
```

A dedicated `gd-ks rollback` command is on the roadmap (Sprint 4 or 5).

---

## Agents and State

Agents can be pointed at the state in two ways:

**1. Manual (today):** In your IDE chat, start a session with
`gd-ks state context | pbcopy` (or print it and paste).

**2. Automatic (Sprint 3):** The agent compiler will inject the
`<project_state_context>` block into the compiled agent markdown, so
agents always start with up-to-date context.

---

## FAQ

**Q: Can I delete the state file to start over?**
A: Yes, but you'll lose decision history and event log. You can
`rm -rf _gdks/_state && gd-ks install` to reset.

**Q: What happens if two agents edit state concurrently?**
A: The current implementation is last-write-wins. If you're running
multiple agents in parallel (rare), you may lose updates. Concurrent
editing is out of scope for v0.4.

**Q: Can I version-control the state?**
A: Yes — commit `_gdks/_state/project-state.yaml` to git. The event
log (`events.ndjson`) can also be committed but is append-only, so
merge conflicts are rare. Checkpoints are optional to commit.

**Q: Why NDJSON instead of YAML for the event log?**
A: NDJSON is append-safe (just write a line). YAML would require
re-parsing the entire file to append, which doesn't scale. See
`docs/adr/` for a future ADR-002 covering this.
