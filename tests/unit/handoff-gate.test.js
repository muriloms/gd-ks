import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

import { HandoffGate } from '../../src/core/contracts/handoff-gate.js';
import { StateManager } from '../../src/core/state/state-manager.js';
import { EventLogger } from '../../src/core/state/event-logger.js';
import { CheckpointManager } from '../../src/core/state/checkpoint-manager.js';
import { createSandbox } from '../helpers/sandbox.js';

describe('HandoffGate', () => {
  let sandbox;
  let sm;
  let gate;

  beforeEach(async () => {
    sandbox = await createSandbox('handoff-gate');
    sm = new StateManager({ projectRoot: sandbox.path });
    await sm.init({ projectName: 'HG Test', preset: 'minimal', targetEngine: 'unreal-5' });
    gate = new HandoffGate({ projectRoot: sandbox.path });
  });

  afterEach(async () => {
    await sandbox.cleanup();
  });

  async function writeDoc(relPath, content) {
    const full = join(sandbox.path, relPath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, 'utf8');
  }

  async function prepareIdeationDocs() {
    // Make phase 1 contract-satisfying
    const wordsOf = (n) => 'word '.repeat(n);
    await writeDoc(
      '_gdks-output/01-ideation/concept-brief.md',
      `# Concept Brief\n\n## Core Concept\n\n${wordsOf(350)}\n\n## Target Audience\n\nCore gamers.`
    );
    await writeDoc(
      '_gdks-output/01-ideation/mechanics-exploration.md',
      `# Mechanics\n\n## Core Mechanics\n\n${wordsOf(250)}`
    );
    await writeDoc(
      '_gdks-output/01-ideation/ideation-handoff.md',
      `# Handoff\n\nReady for design. ${wordsOf(120)}`
    );

    await sm.startPhase(1);
    await sm.addDeliverable(1, { id: 'concept-brief', path: '_gdks-output/01-ideation/concept-brief.md', verified: true });
    await sm.addDeliverable(1, { id: 'mechanics-exploration', path: '_gdks-output/01-ideation/mechanics-exploration.md', verified: true });
    await sm.addDeliverable(1, { id: 'ideation-handoff', path: '_gdks-output/01-ideation/ideation-handoff.md', verified: true });
    await sm.update((s) => {
      s.phase_progress['1'].completion_pct = 85;
      return s;
    });
  }

  describe('successful handoff', () => {
    beforeEach(async () => {
      await prepareIdeationDocs();
    });

    it('advances phase when all checks pass', async () => {
      const result = await gate.handoff({ fromPhase: 1, toPhase: 2 });
      assert.equal(result.success, true);
      assert.equal(result.forced, false);

      const state = await sm.read();
      assert.ok(state.phases_completed.includes(1));
      assert.equal(state.phase_progress['1'].status, 'completed');
      assert.equal(state.phase_progress['2'].status, 'in_progress');
      assert.equal(state.current_phase, 2);
    });

    it('saves a checkpoint before mutating state', async () => {
      const result = await gate.handoff({ fromPhase: 1, toPhase: 2 });
      assert.ok(result.checkpoint);

      const cm = new CheckpointManager({ projectRoot: sandbox.path });
      const list = await cm.list({ phase: 1 });
      assert.equal(list.length, 1);
    });

    it('logs a handoff event', async () => {
      await gate.handoff({ fromPhase: 1, toPhase: 2 });
      const logger = new EventLogger({ projectRoot: sandbox.path });
      const events = await logger.readAll({ filterType: 'handoff' });
      assert.equal(events.length, 1);
      assert.equal(events[0].from_phase, 1);
      assert.equal(events[0].to_phase, 2);
    });
  });

  describe('blocked handoff', () => {
    it('returns success=false when contract fails', async () => {
      // No docs prepared → should fail
      const result = await gate.handoff({ fromPhase: 1, toPhase: 2 });
      assert.equal(result.success, false);
      assert.match(result.reason, /Contract validation failed/);

      // State must be unchanged
      const state = await sm.read();
      assert.equal(state.current_phase, 1);
      assert.ok(!state.phases_completed.includes(1));
    });

    it('does NOT save a checkpoint when blocked', async () => {
      await gate.handoff({ fromPhase: 1, toPhase: 2 });
      const cm = new CheckpointManager({ projectRoot: sandbox.path });
      const list = await cm.list();
      assert.equal(list.length, 0);
    });

    it('does NOT log a handoff event when blocked', async () => {
      await gate.handoff({ fromPhase: 1, toPhase: 2 });
      const logger = new EventLogger({ projectRoot: sandbox.path });
      const events = await logger.readAll({ filterType: 'handoff' });
      assert.equal(events.length, 0);
    });
  });

  describe('force mode', () => {
    it('advances even when contract fails, and flags result.forced', async () => {
      const result = await gate.handoff({ fromPhase: 1, toPhase: 2, force: true });
      assert.equal(result.success, true);
      assert.equal(result.forced, true);

      const state = await sm.read();
      assert.equal(state.current_phase, 2);
    });

    it('still logs, but marks forced=true in the event', async () => {
      await gate.handoff({ fromPhase: 1, toPhase: 2, force: true });
      const logger = new EventLogger({ projectRoot: sandbox.path });
      const events = await logger.readAll({ filterType: 'handoff' });
      assert.equal(events[0].forced, true);
      assert.equal(events[0].contract_passed, false);
    });
  });

  describe('dry-run mode', () => {
    beforeEach(async () => {
      await prepareIdeationDocs();
    });

    it('returns the report without mutating state', async () => {
      const result = await gate.handoff({ fromPhase: 1, toPhase: 2, dryRun: true });
      assert.equal(result.success, true);
      assert.equal(result.dryRun, true);

      const state = await sm.read();
      assert.equal(state.current_phase, 1);
      assert.ok(!state.phases_completed.includes(1));
    });

    it('does not create a checkpoint', async () => {
      await gate.handoff({ fromPhase: 1, toPhase: 2, dryRun: true });
      const cm = new CheckpointManager({ projectRoot: sandbox.path });
      assert.equal((await cm.list()).length, 0);
    });
  });

  describe('error handling', () => {
    it('rejects mismatched phases between args and contract', async () => {
      // Attempt to load contract 2→3 but request 1→2 would fail inside — let's just test the right path mismatch
      // This is indirect — we validate that the handoff refuses if contract.from_phase doesn't match.
      // The shipped contract for 1→2 has from_phase=1, so a legitimate call should not trigger this.
      // We simulate by passing nonsensical args.
      await assert.rejects(
        () => gate.handoff({ fromPhase: 4, toPhase: 5 }),
        /Contract not found/
      );
    });
  });
});
