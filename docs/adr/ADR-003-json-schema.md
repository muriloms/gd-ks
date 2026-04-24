# ADR-003: Use JSON Schema (AJV) instead of Zod for YAML validation

**Status:** Accepted
**Date:** 2026-04-20
**Sprint:** 1

## Context

GD-KS needs to validate YAML files against structural contracts:
agents, workflows, modules, and (from Sprint 2) project state.
Options considered:

- **JSON Schema + AJV** — standard IETF spec, mature validator
- **Zod** — TypeScript-first, great ergonomics, runtime-first
- **Joi** — older Node-first schema library
- **Custom validation** — hand-written `validate()` functions

## Decision

Use **JSON Schema (draft 2020-12) with AJV 8** as the validation layer.

## Rationale

1. **Schemas are data, not code.** Stored as `.json` files under
   `tools/validator/schema/`, they can be consumed by:
   - The Node validator (AJV)
   - Editors (VS Code YAML extension) for live validation as users
     edit agent/workflow YAMLs
   - Third-party tooling (`ajv-cli`, `yajsv`)
   - Future language ports (a Python or Rust contributor could
     re-implement GD-KS and reuse the same schemas)
2. **Cross-language portability.** Zod is Node-exclusive.
   JSON Schema works everywhere.
3. **Format support via `ajv-formats`.** Native `date-time`, `email`,
   `uri`, `uuid` — we need `date-time` for the state manager.
4. **Mature spec.** Well-known error messages, predictable behavior,
   stable across AJV versions.
5. **User experience.** When a user edits `my-agent.agent.yaml` in
   VS Code and hovers over a field, the editor can show which values
   are valid — for free, if we configure `settings.json`. No amount
   of Zod can do that.

## Consequences

### Positive

- Schemas are versionable, shareable, and tool-agnostic.
- Good error messages via `ajv.errors` with `allErrors: true`.
- `$id` URIs (`https://gdks.dev/schemas/agent.schema.json`) give each
  schema a stable identity even if the file moves.

### Negative

- JSON Schema can be verbose (no TypeScript types inferred).
  We accept this because our schema files are few and stable.
- AJV is strict by default about unknown keywords; we disabled
  `strict` mode in the validator to allow annotation keywords from
  future drafts.

## Revisit if

- TypeScript/editor tooling becomes the dominant UX and authoring
  schemas in TS feels natural (e.g., via `@sinclair/typebox`).
- We decide to expose a programmatic API where users describe agents
  in JavaScript; in that case Zod would be the natural fit for the
  runtime API, while JSON Schema would remain the on-disk format.
