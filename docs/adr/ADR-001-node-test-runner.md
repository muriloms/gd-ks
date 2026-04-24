# ADR-001: Use Node's built-in `node:test` runner instead of Jest

**Status:** Accepted
**Date:** 2026-04-20
**Sprint:** 1

## Context

GD-KS v0.4 introduces an automated test suite. We needed to pick a
testing framework. The main candidates were:

- **Jest** — the de facto standard for JavaScript testing
- **Vitest** — modern ESM-first, Jest-compatible API
- **`node:test`** — Node.js's built-in test runner (stable since Node 20)
- **Mocha + Chai + Sinon** — classic combo, requires assembling pieces

## Decision

Use **`node:test`** (with `node:assert/strict`) as the exclusive test runner.

## Rationale

1. **Zero new runtime dependencies.** GD-KS is distributed via NPM and
   every transitive dep adds install time, security surface, and potential
   conflicts for users. A test framework that ships with Node is free.
2. **ESM-native.** GD-KS is `"type": "module"`. Jest requires extra
   configuration (`jest.config.js`, Babel, or experimental flags) to work
   with native ESM. `node:test` just works.
3. **Fast startup.** `node --test` has negligible overhead vs Jest's
   worker-pool bootstrap. This matters on CI where we run the same suite
   3× (Ubuntu, macOS, Windows) × 2 Node versions.
4. **TAP output.** Native TAP streaming makes CI parsing trivial.
5. **Coverage via `c8`.** The one thing `node:test` doesn't have built-in
   is coverage reports, which `c8` provides without needing to match
   versions or plugins with a framework.

## Consequences

### Positive

- `npm install` stays lean — we added only `c8` as a devDependency.
- No config files to maintain (no `jest.config.js`, no Babel).
- Works identically in all environments Node 20+ supports.

### Negative

- `node:test` lacks some ergonomics developers expect from Jest:
  snapshot testing, fancy diff output, `expect()` chains. We use the
  simpler `assert.equal/deepEqual/match` API instead.
- No Jest mocking (`jest.fn()`, `jest.mock()`). When we need mocks we
  build tiny helpers in `tests/helpers/` or use `module.Module._load`
  patching if absolutely necessary.
- Fewer StackOverflow answers — developers new to `node:test` may need
  to read the official docs rather than copy-paste.

## Revisit if

- Someone contributes a patch and struggles noticeably with `node:test`
  patterns.
- We need snapshot testing for a feature (unlikely for a YAML/CLI tool).
- Node deprecates or severely limits `node:test` (unlikely — it's in
  stable since 20.0).
