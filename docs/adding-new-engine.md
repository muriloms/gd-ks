# Adding a New Engine to GD-KS

> Tutorial for contributors adding support for a new game engine
> (Godot 4, Unity 6, Bevy, O3DE, etc.) to GD-KS.

---

## Big picture

GD-KS v0.4 organizes engines as pluggable modules under
`src/modules/engines/<engine-id>/`. Each engine ships:

- An `engine-profile.yaml` declaring what the engine can do
- A `module.yaml` describing the module (same shape as other modules)
- One or more **agents** (`*.agent.yaml`) — the specialists users
  talk to in their IDE
- One or more **workflows** — guided processes those agents execute

Your job as an engine contributor is to build those four things.
GD-KS takes care of the rest: installer integration, engine selection
UI, schema validation, template conditionals, handoff contracts.

---

## Checklist

1. [ ] Pick an engine id: lowercase, hyphenated, versioned (e.g. `godot-4`)
2. [ ] Create directory: `src/modules/engines/<engine-id>/`
3. [ ] Write `engine-profile.yaml` (see below)
4. [ ] Write `module.yaml`
5. [ ] Define 3–5 agents in `agents/`
6. [ ] Define the workflows in `workflows/`
7. [ ] (Optional) Add `knowledge/` for engine-specific docs
8. [ ] Register your engine in `tools/installer/lib/module-manager.js`
      (`KNOWN_ENGINES`)
9. [ ] Add the engine as a selectable option in
      `src/cli/commands/install.js`
10. [ ] Add conditional blocks to `src/modules/planning/templates/story.template.md`
11. [ ] Write tests: at minimum, load-profile test
12. [ ] Add entry to `CHANGELOG.md`

---

## 1. Design the engine profile

The profile is the single declarative document describing your engine.
Let's walk through a fictional `my-engine` example.

Create `src/modules/engines/my-engine/engine-profile.yaml`:

```yaml
schema_version: "1.0"

engine:
  id: "my-engine"
  name: "My Custom Engine"
  vendor: "My Company"
  version_range: "1.0+"
  documentation_url: "https://my-engine.example/docs"

paradigms:
  primary_languages: ["rust"]
  secondary_languages: ["lua"]
  has_visual_scripting: false
  has_ecs: true
  has_gas: false
  rendering: ["forward-plus"]

capabilities:
  supports_platforms: ["pc", "console"]
  multiplayer: ["client-server"]
  animation_systems: ["skeletal", "morph-targets"]
  physics: ["rapier"]
  audio: ["kira"]

agents_provided:
  - my-architect
  - my-programmer

workflows_provided:
  - id: architecture
    trigger: "my-engine-architecture"
    agent: my-architect
  - id: code-prompt
    trigger: "my-engine-code-prompt"
    agent: my-programmer

handoff_consumes:
  from_phase: 3
  required_deliverables:
    - sprint-plan
    - stories

planning_template_hints:
  preferred_for_core_logic: "rust"
  preferred_for_designer_tunables: "lua"
  typical_folder_structure:
    - "src/"
    - "assets/"
  story_implementation_note_template: |
    - Implement core gameplay as a Rust system
    - Expose tunables via Lua config files
```

### Required fields

- `schema_version`: must be `"1.0"`
- `engine.id`: must match the directory name
- `engine.name`: human-readable
- `paradigms.primary_languages`: at least one
- `agents_provided`: at least one agent id
- `handoff_consumes.from_phase`: **must be `3`** (engines always
  consume from Planning)

See `tools/validator/schema/engine-profile.schema.json` for the full
shape. Your profile is validated automatically.

---

## 2. Write `module.yaml`

Same format as `ideation/module.yaml`, `design/module.yaml`, etc.
Minimum:

```yaml
name: engine               # or "engines/my-engine" for explicit resolution
version: 0.1.0
description: My Custom Engine implementation guidance
agents:
  - my-architect
  - my-programmer
workflows:
  - architecture
  - code-prompt
```

---

## 3. Define your agents

Each agent is a YAML file following the schema in
`tools/validator/schema/agent.schema.json`. Minimum fields:

```yaml
# src/modules/engines/my-engine/agents/my-architect.agent.yaml

metadata:
  id: "_gdks/engine/agents/my-architect.md"
  name: "Myrna"
  title: "My Engine Architect"
  icon: "🏗️"
  module: "engine"

persona:
  role: "My Engine Architect"
  identity: |
    I am Myrna, your My Engine Architect. I design robust
    systems using ECS patterns and Rust idioms.

menu:
  - trigger: "my-engine-architecture"
    description: "[AR] 🏗️ Design the technical architecture"
    workflow: "{module}/workflows/architecture/workflow.yaml"
```

The `{module}` variable resolves to the installed module path at
runtime, so workflow references work whether the user picked your
engine or not.

---

## 4. Define your workflows

Each workflow is a directory under `workflows/` with:

- `workflow.yaml` — the workflow definition
- `instructions.md` — detailed step-by-step guide for the agent

Example:

```yaml
# src/modules/engines/my-engine/workflows/architecture/workflow.yaml

name: my-engine-architecture
description: Design My Engine architecture for the project
version: 1.0.0
module: engine
phase: 4

metadata:
  display_name: "My Engine Architecture"
  icon: "🏗️"
  time_estimate: "60-90 minutes"
  difficulty: "advanced"

agents:
  primary: my-architect

inputs:
  required:
    - sprint-plan.md
    - stories.md

outputs:
  - architecture.md
  - systems-diagram.md

steps:
  - id: review-planning
    name: "Review Planning Output"
    type: analysis
  - id: propose-architecture
    name: "Propose Architecture"
    type: prompt
  - id: document
    name: "Document"
    type: template
```

---

## 5. Register the engine

### 5a. Update `ModuleManager.KNOWN_ENGINES`

In `tools/installer/lib/module-manager.js`, add:

```js
const KNOWN_ENGINES = {
  'unreal-5': { name: 'Unreal Engine 5', available: true },
  'godot-4': { name: 'Godot 4', available: false },
  'unity-6': { name: 'Unity 6', available: false },
  'my-engine': { name: 'My Custom Engine', available: true }  // ← add
};
```

### 5b. Add installer choice

In `src/cli/commands/install.js`, find the `targetEngine` question and
add your engine to the `choices` array:

```js
{
  name: 'My Custom Engine',
  value: 'my-engine'
}
```

### 5c. Add template conditionals

In `src/modules/planning/templates/story.template.md`, add a block:

```markdown
{{#engine my-engine}}
### My Engine Implementation

- Implement core logic as a Rust system
- Expose tunables via Lua config
{{/engine}}
```

---

## 6. Test

Create `tests/unit/my-engine-profile.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EngineProfileManager } from '../../src/core/engines/engine-profile-manager.js';

describe('my-engine profile', () => {
  it('loads and validates', async () => {
    const epm = new EngineProfileManager();
    const profile = await epm.load('my-engine');
    assert.equal(profile.engine.id, 'my-engine');
    assert.ok(profile.agents_provided.length >= 1);
  });
});
```

And run the full suite:

```bash
npm run validate:schemas    # ensure your profile passes
npm run test                # all tests must still pass
npm run test:coverage       # report coverage
```

---

## 7. Documentation

At the minimum:

- Add a section to `CHANGELOG.md` describing the engine you added
- If your engine has distinctive workflows, document them in
  `src/modules/engines/my-engine/README.md`
- Update `README.md` at the project root to list your engine

---

## FAQ

### My engine has special concepts GD-KS doesn't know about (e.g. Unity's ScriptableObjects). How do I handle that?

Put that knowledge in your agents' `persona.identity` and in workflow
`instructions.md`. The framework doesn't need to understand the
concept — it just needs to route the user to the right agent.

### My engine targets only mobile. Can I skip PC/console in platforms?

Yes. The `supports_platforms` list is informational. It should reflect
what your engine actually supports, so users know.

### Can an engine module also contribute agents to Design or Planning?

Best practice is: keep engine-specific expertise **only** in the engine
module. If there's a "Unity animation specialist", they belong in
`engines/unity-6/agents/`, not in `design/agents/`. Design and Planning
should stay engine-agnostic so users can change engines without
rewriting their GDD.

### What's the difference between `engine` and `engines/my-engine` as module names?

- `engine` — resolved at runtime to the user's `target_engine`. Use
  this as the module name in `module.yaml` when you want the user's
  engine selection to flip in the right place.
- `engines/my-engine` — explicit path. Use this if you want to pin
  workflows to a specific engine regardless of user selection
  (rare — usually for debugging or tooling).

### How do I deprecate an old engine module?

Bump `version` in `module.yaml` and add a `deprecated: true` field.
GD-KS will still install it but the installer UI will hide it from
the default picker.

---

## Next steps

Once your engine is merged, consider contributing:

- An example project showing end-to-end use
- A tutorial blog post
- Additional workflows (e.g. shader author, networking specialist)

Questions? Open an issue at https://github.com/muriloms/gd-ks/issues.
