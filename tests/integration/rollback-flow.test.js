/**
 * Integration test: gd-ks rollback restores state from checkpoint.
 *
 * Scenario:
 *   1. Install → phase 1
 *   2. Start phase 1, add deliverable, complete phase 1 (checkpoint saved)
 *   3. Start phase 2
 *   4. Rollback to phase 1 checkpoint → current_phase should go back to 1
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

describe('Rollback flow', () => {
  let sandbox;
  let sm;
  let cm;

  before(async () => {
    sandbox = await createSandbox('rollback-flow');
    const installer = new Installer({
      targetDir: sandbox.path,
      projectName: 'Rollback Test',
      modules: ['ideation', 'design'],
      language: 'en',
      ide: 'none',
      preset: 'minimal',
      targetEngine: 'unreal-5',
      installerVersion: '0.4.0-beta.1'
    });
    const r = await installer.install();
    if (!r.success) throw new Error(`Install failed: ${r.error}`);

    sm = new StateManager({ projectRoot: sandbox.path });
    cm = new CheckpointManager({ projectRoot: sandbox.path });
  });

  after(async () => {
    await sandbox.cleanup();
  });

  async function writeDoc(relPath, content) {
    const full = join(sandbox.path, relPath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, 'utf8');
  }

  it('advances through phase 1 → phase 2 with a checkpoint', async () => {
    await sm.startPhase(1);

    const words = (n) => 'word '.repeat(n);
    await writeDoc(
      '_gdks-output/01-ideation/concept-brief.md',
      `# Concept\n## Core Concept\n${words(400)}\n## Target Audience\nCore gamers\n${words(100)}`
    );
    await writeDoc(
      '_gdks-output/01-ideation/mechanics-exploration.md',
      `# Mechanics\n## Core Mechanics\n${words(250)}`
    );
    await writeDoc(
      '_gdks-output/01-ideation/ideation-handoff.md',
      `# Handoff\n${words(120)}`
    );

    await sm.addDeliverable(1, { id: 'concept-brief', path: '_gdks-output/01-ideation/concept-brief.md', verified: true });
    await sm.addDeliverable(1, { id: 'mechanics-exploration', path: '_gdks-output/01-ideation/mechanics-exploration.md', verified: true });
    await sm.addDeliverable(1, { id: 'ideation-handoff', path: '_gdks-output/01-ideation/ideation-handoff.md', verified: true });
    await sm.update((s) => {
      s.phase_progress['1'].completion_pct = 85;
      return s;
    });

    const gate = new HandoffGate({ projectRoot: sandbox.path });
    const r = await gate.handoff({ fromPhase: 1, toPhase: 2 });
    assert.equal(r.success, true, `Handoff failed: ${JSON.stringify(r.report)}`);

    const afterHandoff = await sm.read();
    assert.equal(afterHandoff.current_phase, 2);
    assert.ok(afterHandoff.phases_completed.includes(1));
  });

  it('has a checkpoint for phase 1', async () => {
    const list = await cm.list({ phase: 1 });
    assert.equal(list.length, 1);
  });

  it('rollback restores phase 1 state', async () => {
    const checkpoints = await cm.list({ phase: 1 });
    const latest = checkpoints[0];
    const checkpoint = await cm.load(latest);

    // Manually perform the rollback (mimicking what `gd-ks rollback --yes` does)
    const current = await sm.read();

    // Save backup of current state
    const backupPath = await cm.save(current.current_phase, current, { label: 'pre-rollback' });
    assert.ok(backupPath);

    // Restore
    await sm.write(checkpoint.state);

    // Log
    const logger = new EventLogger({ projectRoot: sandbox.path });
    await logger.log({
      type: 'rollback',
      from_state_phase: current.current_phase,
      to_state_phase: checkpoint.state.current_phase,
      checkpoint_file: latest,
      backup_file: backupPath
    });

    // Verify state rolled back
    const restored = await sm.read();
    assert.equal(restored.current_phase, 1);
    // phases_completed snapshot was taken mid-handoff (before completing phase 1),
    // so restored state should not mark phase 1 as completed
    assert.ok(!restored.phases_completed.includes(1));
  });

  it('audit log contains the rollback event', async () => {
    const logger = new EventLogger({ projectRoot: sandbox.path });
    const rollbacks = await logger.readAll({ filterType: 'rollback' });
    assert.equal(rollbacks.length, 1);
    assert.equal(rollbacks[0].to_state_phase, 1);
    assert.equal(rollbacks[0].from_state_phase, 2);
  });

  it('pre-rollback backup was created', async () => {
    const all = await cm.list();
    const backups = all.filter((f) => f.includes('pre-rollback'));
    assert.equal(backups.length, 1);
  });
});
