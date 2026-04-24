# Architecture Decision Records (ADRs)

This directory holds short documents capturing architectural decisions
made during GD-KS development. They explain **why** we made a choice,
not just **what** the choice was.

## Format

Each ADR has: Context → Decision → Rationale → Consequences → Revisit if.

## Index

| ID | Title | Sprint | Status |
|----|-------|--------|--------|
| [ADR-001](./ADR-001-node-test-runner.md) | Use `node:test` instead of Jest | 1 | Accepted |
| [ADR-003](./ADR-003-json-schema.md) | Use JSON Schema + AJV for validation | 1 | Accepted |

### Planned ADRs

- **ADR-002** — NDJSON format for event log (Sprint 2)
- **ADR-004** — Migration strategy v0.3 → v0.4 (Sprint 2)
- **ADR-005** — Engine-agnostic layer via feature flag (Sprint 3)
- **ADR-006** — LLM API key handling and security policy (Sprint 6)

## When to add an ADR

Add one when:
- You're making a decision that future contributors would reasonably ask
  "why did they do it this way?"
- You're picking between 2+ real alternatives.
- You're about to commit to something that's hard to reverse later.

Skip it for:
- Style choices (those go in `.prettierrc` / `eslint.config.js`).
- Bug fixes.
- Routine refactors.
