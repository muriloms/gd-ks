# 🎮 GD-KS (Game Development Knowledge System)

[![npm version](https://img.shields.io/npm/v/gd-ks.svg)](https://www.npmjs.com/package/gd-ks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/gd-ks.svg)](https://nodejs.org)
[![Developed by RE-G3X](https://img.shields.io/badge/Developed%20by-RE--G3X-blueviolet)](https://re-g3x.github.io)

**AI-powered, multi-engine framework for game development.**

> Developed by **[RE-G3X](https://re-g3x.github.io)** — a research group dedicated to scientific research in digital games.

GD-KS gives you a team of specialized AI agents that walk you from a blank page to implementation-ready specs — through brainstorming, design, planning, and engine-specific implementation guidance. Works with **Unreal Engine 5**, **Godot 4**, and **Unity 6**.

---

## ✨ What's inside

- 🧠 **32 specialized AI agents** — each with its own role, personality, and menu of workflows
- 🎯 **4 development phases** — Ideation, Design, Planning, Engine
- 🎮 **Three supported engines** — Godot 4, Unity 6, Unreal Engine 5 (each with its own implementation team)
- 🎛️ **7 presets** — from game jam (8 agents) to AAA studio (32 agents), tuned for your team size
- 📋 **40+ guided workflows** — step-by-step processes for each task
- 🔒 **Handoff contracts** — can't advance a phase until the right deliverables are verified
- 🧠 **Central project state** — agents remember decisions across sessions
- 🖥️ **Multi-IDE** — Cursor, Windsurf, VS Code, Claude Code
- ✅ **Schema-validated** — 7 JSON schemas enforce consistency
- 🧪 **240 automated tests** across unit and integration, ~93% coverage

---

## 🚀 Quick start

```bash
mkdir my-game && cd my-game
npx gd-ks install
```

The wizard asks four questions:

1. Project name
2. **Preset** — how big is your project? (solo-indie by default)
3. Which teams to install
4. **Engine** — Godot 4, Unity 6, or Unreal Engine 5

After install, open your project in an AI-capable IDE (Cursor, Windsurf, VS Code with Continue, or Claude Code). Load the `gdks-master` agent and type `*tutorial` to take the 15-minute guided walkthrough.

---

## 🎯 Presets

Not every project needs 32 agents. Pick the preset that fits your scope:

| Preset | Agents | Best for |
|---|---|---|
| ⚡ **Minimal** | ~8 | Game jams, hobby, 48h-2 weeks |
| 🎮 **Solo Indie** | ~16 | 1-2 devs, 3-18 months _(default)_ |
| 🏢 **Small Studio** | ~23 | 3-10 devs, 9-24 months |
| 🏛️ **Full Studio** | 32 | AAA, 24+ months, all agents active |
| 📖 **Narrative-Heavy** | ~20 | RPG, Visual Novel |
| 📱 **Mobile Casual** | ~17 | F2P, hypercasual |
| 🎛️ **Custom** | 32 | All active, tune individually |

Switch anytime:

```bash
gd-ks preset switch solo-indie
gd-ks preset show              # inspect the active preset
gd-ks preset enable-agent marketing-strategist
gd-ks preset disable-agent playtest-coordinator
```

See [`docs/presets-guide.md`](docs/presets-guide.md) for a complete reference.

---

## 🎮 Engines

GD-KS supports three engines as first-class, pluggable modules. Each lives under `src/modules/engines/<engine-id>/` with its own `engine-profile.yaml`. Contracts and templates adapt automatically via `{{#engine}}` blocks.

### Godot 4 — `godot-4`

4 agents: **Guilherme** (Architect), **Gabi** (GDScript Lead), **Gina** (Node Specialist), **Érico** (Coordinator). Idioms: statically-typed GDScript, `@export`, signal-driven coupling, autoloads for genuine globals, Custom Resources (`.tres`) for content.

### Unity 6 — `unity-6`

4 agents: **Uma** (Architect), **Ugo** (C# Lead), **Uli** (Prefab Specialist), **Enzo** (Coordinator). Idioms: `private [SerializeField]`, cached `GetComponent` in `Awake`, ScriptableObject event channels over singletons, Addressables over `Resources.Load`, URP/HDRP/Built-in pipeline choice.

### Unreal Engine 5 — `unreal-5`

5 agents: **Ulysses** (Architect), **Priscilla** (C++ Lead), **Simon** (Systems — GAS/AI/Subsystems), **Bella** (Blueprint Specialist), **Eric** (Coordinator). Idioms: `UPROPERTY(EditAnywhere, BlueprintReadWrite)`, C++/Blueprint boundary design, Unreal Insights profiling, PIE-to-packaged-build testing flow.

See [`docs/adding-new-engine.md`](docs/adding-new-engine.md) to add your own (Bevy, O3DE, GameMaker, etc.).

---

## 📦 The four phases

### 🧠 Ideation Team (Phase 1)

| Agent | Role |
|---|---|
| **Sparky** 💡 | Concept Brainstormer |
| **Marcus** 📊 | Market Analyst |
| **Mira** ⚙️ | Mechanics Explorer |
| **Ivy** 🎯 | Ideation Coordinator |

Output: `_gdks-output/01-ideation/` — concept briefs, mechanics exploration, handoff doc.

### 🎨 Design Team (Phase 2)

Up to 18 agents depending on preset. Anchors: **Diana** (Game Design Director), **Marco** (Mechanics Designer), **Lucas** (Core Loop Specialist). Specialists activate with the right preset: narrative team for RPGs, progression team for mobile, art/audio directors for most setups.

Output: `_gdks-output/02-design/` — GDD, design pillars, core mechanics spec, gameplay loops, progression system, narrative/art/audio bibles.

### 📋 Planning Team (Phase 3)

| Agent | Role |
|---|---|
| **Sam** 📊 | Scrum Master |
| **Tina** 📅 | Technical Producer |
| **Dana** 📝 | Documentation Specialist |
| **Peter** 🎯 | Planning Coordinator |

Output: `_gdks-output/03-planning/` — epics, stories, sprint plan, roadmap, risks.

### ⚙️ Engine Team (Phase 4)

Engine-specific (see engine section above). Always includes a Coordinator for cross-team spec review and LLM-prompt preparation.

Output: `_gdks-output/04-engine/` — architecture, class/prefab/scene specs, LLM code-generation prompts ready to paste into Claude, ChatGPT, or any model.

---

## 🔒 Handoff contracts

You can't jump from Design to Planning just because you feel like it. Each phase transition is guarded by a contract in `_gdks/_contracts/` that checks:

- Required deliverables exist and meet word-count minimums
- Required sections are present (e.g. "Pillars", "Core Mechanics")
- Quality gates pass (no open blockers, minimum completion %)
- Contracts adapt to preset — `story-bible.md` is required for narrative-heavy but optional for minimal

```bash
gd-ks validate --phase=2        # Am I ready to hand off?
gd-ks handoff --from=2 --to=3   # Advance (runs the contract check)
gd-ks handoff --from=2 --to=3 --force   # Override when you know what you're doing
gd-ks rollback                  # Restore state from a checkpoint
```

See [`docs/state-and-contracts.md`](docs/state-and-contracts.md) for the full memory model.

---

## 🎯 CLI commands

```bash
gd-ks install                    # Wizard install
gd-ks install --yes              # Quick install with defaults

gd-ks state show                 # Inspect current project state
gd-ks state history --last=30    # Read the audit log
gd-ks state decision "Use 2D pixel art" --by=aurora
gd-ks state question "Support co-op?" --from=marco
gd-ks state context              # Print the state block agents consume
gd-ks state inject               # Inject state into compiled agent markdown

gd-ks validate --phase=2         # Contract check for current phase
gd-ks handoff --from=2 --to=3    # Advance phases
gd-ks rollback                   # Restore from a checkpoint

gd-ks preset show                # Active preset details
gd-ks preset list                # All 7 presets
gd-ks preset switch <id>
gd-ks preset enable-agent <agent>
gd-ks preset disable-agent <agent>

gd-ks tutorial                   # Bootstrap the guided tutorial (sandbox mode)
gd-ks tutorial --info            # Syllabus without side effects
gd-ks tutorial --reset           # Clear tutorial sandbox

gd-ks info                       # System information
```

In your IDE chat, agents respond to `*<command>` triggers defined in their menus:

```
*help          # show the agent's command menu
*chat          # free-form conversation
*brainstorm    # (Sparky) creative ideation
*gdd           # (Diana) produce the Game Design Document
*code-prompt   # (Engine Lead) generate an LLM prompt for a story
*tutorial      # (gdks-master) 15-min guided walkthrough
```

---

## 📁 Project structure

```
your-project/
├── _gdks/                           # GD-KS framework (agents, contracts, state)
│   ├── core/                        # Master agent and core workflows
│   ├── ideation/                    # Ideation team
│   ├── design/                      # Design team
│   ├── planning/                    # Planning team
│   ├── engine/                      # Engine team (chosen engine)
│   ├── _config/                     # Project config, presets, features
│   ├── _contracts/                  # Handoff contracts
│   └── _state/
│       ├── project-state.yaml       # Single source of truth
│       ├── history/events.ndjson    # Append-only audit log
│       └── checkpoints/             # Snapshots before each handoff
│
├── _gdks-output/                    # Generated documents
│   ├── 01-ideation/
│   ├── 02-design/
│   ├── 03-planning/
│   └── 04-engine/
│
└── .cursor/rules/gdks/              # IDE rules (if Cursor)
```

---

## 🖥️ IDE support

- **Cursor** _(recommended)_ — auto-applies rules based on file context
- **Windsurf** — rules file for AI context
- **VS Code** — works with Copilot, Continue, Cody
- **Claude Code** — command files for slash commands

---

## 🎓 Learning path

1. **Install:** `npx gd-ks install`
2. **Take the tutorial:** `gd-ks tutorial`, then `*tutorial` in your IDE — 15 minutes, walks you through Cosmic Explorer (a sample puzzle-platformer project)
3. **Read the guides:**
   - [State & contracts](docs/state-and-contracts.md) — how the memory and handoff systems work
   - [Presets guide](docs/presets-guide.md) — which preset fits your project
   - [Adding a new engine](docs/adding-new-engine.md) — for contributors

---

## 🔄 Upgrading from v0.3

```bash
# Dry-run to preview changes
node node_modules/gd-ks/scripts/migrate-v03-to-v04.js

# Apply
node node_modules/gd-ks/scripts/migrate-v03-to-v04.js --apply
```

The migration:
- Creates `_gdks/_state/` and `_gdks/_contracts/`
- Infers your current phase from existing output docs
- Preserves all your work — `_gdks-output/` is never modified

---

## 🤝 Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) if present, or open an issue at https://github.com/muriloms/gd-ks/issues.

**Ideas for contribution:**
- New engine modules (Bevy, O3DE, GameMaker, LÖVE)
- Agents for specific genres (roguelike specialist, VR UX, etc.)
- New presets for niche profiles
- Translations of step markdown (tutorial supports i18n through file swaps)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🔬 About RE-G3X

GD-KS is developed by **[RE-G3X](https://re-g3x.github.io)** — a research group dedicated to the scientific study of digital games. The group investigates topics at the intersection of game development, AI-assisted tooling, generative pipelines, and player experience.

If you use GD-KS in academic work, please cite the project:

```bibtex
@software{gdks_2026,
  author = {Moro, Murilo and {RE-G3X}},
  title = {GD-KS: A Multi-Agent, Multi-Engine Framework for
           AI-Assisted Game Development},
  year = {2026},
  version = {v0.4.0-beta.2},
  url = {https://github.com/muriloms/gd-ks},
  license = {MIT}
}
```

🌐 Website: **[https://re-g3x.github.io](https://re-g3x.github.io)**

---

## 🙏 Acknowledgments

Inspired by the [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) framework by bmad-code-org.

---

**Made with ❤️ by [RE-G3X](https://re-g3x.github.io) for indie game developers, solo devs, and studios of every size.**

[Report a bug](https://github.com/muriloms/gd-ks/issues) · [Request a feature](https://github.com/muriloms/gd-ks/issues) · [npm package](https://www.npmjs.com/package/gd-ks) · [RE-G3X](https://re-g3x.github.io)
