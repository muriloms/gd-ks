/**
 * Integration: simulate a realistic handoff flow.
 *
 * 1. Install GD-KS.
 * 2. Start phase 1, create required docs, verify them.
 * 3. Try handoff BEFORE docs exist → expect blocked.
 * 4. Create docs → try again → expect success.
 * 5. Verify checkpoint and event log captured the transition.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { writeFile, mkdir } from 'fs/promises';

import { Installer } from '../../tools/installer/index.js';
import { StateManager } from '../../src/core/state/state-manager.js';
import { HandoffGate } from '../../src/core/contracts/handoff-gate.js';
import { CheckpointManager } from '../../src/core/state/checkpoint-manager.js';
import { EventLogger } from '../../src/core/state/event-logger.js';
import { createSandbox } from '../helpers/sandbox.js';

describe('End-to-end handoff flow', () => {
  let sandbox;
  let sm;
  let gate;

  before(async () => {
    sandbox = await createSandbox('e2e-handoff');

    const installer = new Installer({
      targetDir: sandbox.path,
      projectName: 'E2E Flow',
      modules: ['ideation', 'design'],
      language: 'en',
      outputFolder: '_gdks-output',
      ide: 'none',
      preset: 'minimal', // minimal preset makes contract less strict
      targetEngine: 'unreal-5',
      installerVersion: '0.4.0-alpha.2'
    });
    const r = await installer.install();
    if (!r.success) throw new Error(`Install failed: ${r.error}`);

    sm = new StateManager({ projectRoot: sandbox.path });
    gate = new HandoffGate({ projectRoot: sandbox.path });
  });

  after(async () => {
    await sandbox.cleanup();
  });

  async function writeOutputDoc(relPath, content) {
    const full = join(sandbox.path, relPath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, 'utf8');
  }

  it('phase 1 is in_progress after install + startPhase', async () => {
    await sm.startPhase(1);
    const s = await sm.read();
    assert.equal(s.current_phase, 1);
    assert.equal(s.phase_progress['1'].status, 'in_progress');
  });

  it('handoff is BLOCKED before any docs exist', async () => {
    const r = await gate.handoff({ fromPhase: 1, toPhase: 2 });
    assert.equal(r.success, false);
    assert.match(r.reason, /Contract validation failed/);

    // Failure details should include the missing deliverables
    const failedIds = r.report.checks
      .filter((c) => c.status === 'failed')
      .map((c) => c.id || c.gate);
    assert.ok(failedIds.includes('concept-brief'), 'concept-brief should be flagged as missing');
  });

  it('state is unchanged after a blocked handoff', async () => {
    const s = await sm.read();
    assert.equal(s.current_phase, 1);
    assert.ok(!s.phases_completed.includes(1));
  });

  it('handoff SUCCEEDS after creating + verifying all required docs', async () => {
    const words = (n) => 'word '.repeat(n);

    await writeOutputDoc(
      '_gdks-output/01-ideation/concept-brief.md',
      `# Concept Brief\n\n## Core Concept\n\n${words(200)}\n\n## Target Audience\n\nCore gamers 18-35.\n\n${words(100)}`
    );
    await writeOutputDoc(
      '_gdks-output/01-ideation/mechanics-exploration.md',
      `# Mechanics Exploration\n\n## Core Mechanics\n\n${words(220)}`
    );
    await writeOutputDoc(
      '_gdks-output/01-ideation/ideation-handoff.md',
      `# Ideation Handoff\n\n${words(110)}`
    );

    await sm.addDeliverable(1, { id: 'concept-brief', path: '_gdks-output/01-ideation/concept-brief.md', verified: true });
    await sm.addDeliverable(1, { id: 'mechanics-exploration', path: '_gdks-output/01-ideation/mechanics-exploration.md', verified: true });
    await sm.addDeliverable(1, { id: 'ideation-handoff', path: '_gdks-output/01-ideation/ideation-handoff.md', verified: true });

    await sm.update((s) => {
      s.phase_progress['1'].completion_pct = 85;
      return s;
    });

    const r = await gate.handoff({ fromPhase: 1, toPhase: 2 });
    assert.equal(r.success, true, `Handoff failed: ${JSON.stringify(r.report?.checks)}`);
  });

  it('state advanced to phase 2', async () => {
    const s = await sm.read();
    assert.equal(s.current_phase, 2);
    assert.ok(s.phases_completed.includes(1));
    assert.equal(s.phase_progress['1'].status, 'completed');
    assert.equal(s.phase_progress['2'].status, 'in_progress');
  });

  it('a checkpoint was saved for phase 1', async () => {
    const cm = new CheckpointManager({ projectRoot: sandbox.path });
    const list = await cm.list({ phase: 1 });
    assert.equal(list.length, 1);

    const loaded = await cm.load(list[0]);
    assert.equal(loaded._checkpoint.phase, 1);
    // Snapshot was taken at the moment of handoff → current_phase should still be 1 in the snapshot
    assert.equal(loaded.state.current_phase, 1);
  });

  it('a handoff event was logged', async () => {
    const logger = new EventLogger({ projectRoot: sandbox.path });
    const events = await logger.readAll({ filterType: 'handoff' });
    assert.equal(events.length, 1);
    assert.equal(events[0].from_phase, 1);
    assert.equal(events[0].to_phase, 2);
    assert.equal(events[0].contract_passed, true);
    assert.equal(events[0].forced, false);
  });

  it('dry-run handoff from phase 2 does not mutate even if contract passes', async () => {
    // Phase 2 contract would require lots of docs; dry-run just reports.
    // Without docs, dry-run will actually fail validation (success=false),
    // but it still must not mutate. This test verifies that behavior.
    const before = await sm.read();
    const r = await gate.handoff({ fromPhase: 2, toPhase: 3, dryRun: true });
    const after = await sm.read();

    assert.equal(before.current_phase, after.current_phase);
    assert.equal(before.phase_progress['2'].status, after.phase_progress['2'].status);
    // Either result is acceptable — we only assert "no mutation"
    void r;
  });
});
