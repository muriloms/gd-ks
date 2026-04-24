# Presets Guide — GD-KS v0.4

> 7 curated profiles that scale GD-KS from "weekend jam" to "full AAA studio".

---

## Why presets?

GD-KS ships with **32 specialized agents** across 4 teams. That's a lot.
A hobbyist building a game in 48 hours doesn't need a Marketing
Strategist. A narrative-driven RPG doesn't need a Progression Architect.

Presets are curated selections of agents tailored to common project
profiles. Pick the one that matches your situation, and the installer
keeps only the relevant agents in your `_gdks/` directory.

---

## The 7 Presets

### `minimal` ⚡ — Hobby / Game Jam
**Team size:** 1
**Duration:** 48h to 2 weeks
**Active agents:** ~8

For when you need to move fast. Skips narrative, art direction, audio
bible, marketing, and most of the planning team. You get the core
design loop (brainstorm → mechanics → loops) and UE5 architect. Build,
don't document.

**Keeps:** Sparky, Mira, Diana, Marco, Lucas, Ulysses, Eric
**Cuts:** everything else

---

### `solo-indie` 🎮 — Solo or Duo Developer
**Team size:** 1-2
**Duration:** 3-18 months
**Active agents:** ~16

The default for indie devs. Balanced between discipline and
pragmatism. Every core design, narrative, art, and audio role is
represented by a lead, but skips specialists you can merge into
generalists (no separate character designer — Nina handles both).

**Keeps:** Sparky, Mira, Ivy, Diana, Marco, Lucas, Felix, Theo, Nina,
Aurora, Anton, Dylan, Sam, Peter, Ulysses, Priscilla, Eric

---

### `small-studio` 🏢 — 3-10 devs
**Team size:** 3-10
**Duration:** 9-24 months
**Active agents:** ~23

Real small studio setup. All disciplines have a proper specialist
(concept artist separate from art director, character designer
separate from narrative designer). Planning team has a documentation
specialist. Keeps GDKS lightweight enough that you don't drown in
meta-work.

---

### `studio` 🏛️ — AAA / Educational
**Team size:** 10+
**Duration:** 24+ months
**Active agents:** 32 (all)

Every agent active. For AAA studios doing everything by the book, or
for learning GDKS — seeing all the roles helps understand where each
responsibility lives.

---

### `narrative-heavy` 📖 — RPG / Visual Novel
**Team size:** 2-8
**Duration:** 12-36 months
**Active agents:** ~20

Optimized for story-first games. Full narrative team (Nina, Walter,
Charlie), concept artist active, agency advocate kept. Drops
progression architect (less grind-focused) and game feel physicist
(less twitch-focused), drops marketing. Keeps documentation
specialist because narrative needs rigorous tracking.

---

### `mobile-casual` 📱 — F2P / Hypercasual
**Team size:** 2-6
**Duration:** 3-9 months
**Active agents:** ~17

Optimized for mobile F2P and casual. Strong progression (Paige
active), marketing strategist present, game feel emphasized,
playtest coordinator kept. Drops narrative team (not the focus),
drops level designer (procedural/grid-based design).

---

### `custom` 🎛️ — Pick Your Own
**Team size:** any
**Duration:** any
**Active agents:** 32 (all, adjust individually)

Starts with everything enabled. Use `gd-ks preset enable-agent` /
`disable-agent` to craft your exact loadout.

---

## Choosing a preset at install time

```bash
$ gd-ks install

? 🎯 What best describes your project?
  ❯ Solo Indie (1-2 devs)
    Small Studio (3-10 devs)
    Full Studio (10+ devs, AAA)
    Narrative-Heavy (RPG, VN)
    Mobile Casual / F2P
    Minimal (hobby / game jam)
    Custom (all agents, adjust later)
```

The preset you pick is saved in `_gdks/_state/project-state.yaml`
under `preset:`, and the installer filters agents accordingly.

---

## Inspecting the active preset

```bash
$ gd-ks preset show

🎯 Active Preset: 🎮 Solo Indie Developer
   id: solo-indie

Perfect for 1-2 devs building a focused game. Balanced between
discipline and pragmatism.

Target
  Team size:      1-2
  Scope:          small-to-medium
  Duration:       3-18 months

Active Agents (16)
  core:
    ✓ gdks-master
  ideation:
    ✓ concept-brainstormer
    ✓ mechanics-explorer
    ✓ ideation-coordinator
  design:
    ✓ game-design-director
    ✓ mechanics-designer
    ✓ core-loop-specialist
    ✓ game-feel-physicist
    ...
```

---

## Listing all presets

```bash
$ gd-ks preset list

📋 Available Presets

  ⚡ Minimal (hobby / game jam) (minimal)
     Smallest set of agents for quick prototyping, game jams, or hobby
     projects. Skips full documentation rituals.
     8 active agent(s)

  🎮 Solo Indie Developer (solo-indie)
     Perfect for 1-2 devs building a focused game. Balanced between
     discipline and pragmatism.
     16 active agent(s)

  🏢 Small Studio (3-10 people) (small-studio)
     ...
```

---

## Changing preset mid-project

```bash
$ gd-ks preset switch studio

✓ Preset switched to "studio".
  Run `gd-ks install` again (or re-run the installer in-place)
  to apply agent filtering to your installed _gdks/ tree.
```

The switch persists in `project-state.yaml`. Re-running the installer
respects the new preset. No data loss — agents re-added if you switch
to a richer preset.

---

## Fine-tuning: enable / disable specific agents

Presets are starting points, not prisons. You can adjust individually:

```bash
# Start with solo-indie but add market-analyst because you need market research
$ gd-ks preset enable-agent market-analyst --module=ideation
✓ Agent "market-analyst" enabled in module "ideation".
  Overrides saved in project state. Re-run install to apply.

# Drop playtest-coordinator because you'll handle testing yourself
$ gd-ks preset disable-agent playtest-coordinator --module=design
✓ Agent "playtest-coordinator" disabled in module "design".
```

Overrides are saved under `state.preset_overrides`, so they don't
modify the shipped preset files. Your overrides follow you even if
you switch presets.

---

## How agents get filtered

On `gd-ks install`:

1. **Copy all module files** into `_gdks/<module>/` (as before).
2. **Read preset** from `project-state.yaml`.
3. **For each module, for each `*.agent.yaml`:**
   - If the agent is in `preset.agents_disabled` — delete the file.
   - Otherwise, compile it to `.md` as usual.
4. **Reads overrides** from `state.preset_overrides` if present.

Result: `_gdks/design/agents/` contains exactly the agents active in
your preset, nothing more.

---

## Creating your own preset

Right now, the 7 shipped presets are the only valid choices. If you
want a new preset:

1. Create `src/_config/presets/my-preset.preset.yaml` following the
   schema in `tools/validator/schema/preset.schema.json`.
2. Add the id to the `enum` in the preset schema.
3. Update `install.js` wizard to offer it as a choice.

Custom presets as a first-class feature is on the roadmap (likely
Sprint 5 or a post-v1.0 feature).

---

## FAQ

### What happens to agents I disabled if I switch preset later?

`gd-ks preset switch` only updates the preset id. To re-install the
right agents, run `gd-ks install` again (it's idempotent for state;
only re-filters agents).

### Do contracts still work across presets?

Yes. Contracts have `required_when` conditions that reference preset
ids. For example, `story-bible.md` is only required when preset is
`narrative-heavy` or `studio`. See `src/core/contracts/phase-02-to-03.contract.yaml`.

### Why aren't rollbacks tied to presets?

Presets control the active agent set. Rollback restores state
(progress, deliverables, decisions). They're independent. You can
roll back state while keeping your preset, or switch presets without
touching state.

### Can I edit the shipped preset files?

Technically yes, but we recommend against it — your edits will be
overwritten when you `npm update gd-ks`. Use
`preset enable-agent`/`disable-agent` instead; overrides persist in
your project state, not the package.

### Which preset should I pick if I'm unsure?

Start with `solo-indie`. You can always switch later.
