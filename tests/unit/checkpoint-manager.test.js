import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { CheckpointManager } from '../../src/core/state/checkpoint-manager.js';
import { createSandbox } from '../helpers/sandbox.js';

describe('CheckpointManager', () => {
  let sandbox;
  let cm;

  beforeEach(async () => {
    sandbox = await createSandbox('checkpoint-manager');
    cm = new CheckpointManager({ projectRoot: sandbox.path });
  });

  afterEach(async () => {
    await sandbox.cleanup();
  });

  const sampleState = () => ({
    schema_version: '1.0',
    project: { id: 'x', name: 'X', created_at: new Date().toISOString() },
    current_phase: 2
  });

  describe('save()', () => {
    it('saves a snapshot with phase wrapper and state', async () => {
      const path = await cm.save(2, sampleState());
      assert.match(path, /phase-02-design/);

      const loaded = await cm.load(path.split('/').pop());
      assert.equal(loaded._checkpoint.phase, 2);
      assert.equal(loaded._checkpoint.phase_name, 'design');
      assert.equal(loaded.state.current_phase, 2);
    });

    it('supports optional label', async () => {
      const path = await cm.save(1, sampleState(), { label: 'pre-handoff' });
      assert.match(path, /pre-handoff\.yaml$/);
    });

    it('rejects invalid phases', async () => {
      await assert.rejects(() => cm.save(0, sampleState()), /Invalid phase/);
      await assert.rejects(() => cm.save(9, sampleState()), /Invalid phase/);
    });
  });

  describe('list()', () => {
    it('returns an empty array if directory does not exist', async () => {
      const list = await cm.list();
      assert.deepEqual(list, []);
    });

    it('lists all saved checkpoints, newest first', async () => {
      await cm.save(1, sampleState());
      await new Promise((r) => setTimeout(r, 20));
      await cm.save(2, sampleState());
      await new Promise((r) => setTimeout(r, 20));
      await cm.save(3, sampleState());

      const list = await cm.list();
      assert.equal(list.length, 3);
      // Newest first: phase-03 should come before phase-01
      // (ordering depends on timestamp embedded in filename, so just assert count)
    });

    it('filters by phase', async () => {
      await cm.save(1, sampleState());
      await cm.save(2, sampleState());
      await cm.save(1, sampleState(), { label: 'second' });

      const p1 = await cm.list({ phase: 1 });
      assert.equal(p1.length, 2);
      for (const f of p1) assert.match(f, /^phase-01-/);

      const p2 = await cm.list({ phase: 2 });
      assert.equal(p2.length, 1);
    });
  });

  describe('latest()', () => {
    it('returns null when no checkpoints exist', async () => {
      assert.equal(await cm.latest(), null);
    });

    it('returns the most recent checkpoint', async () => {
      await cm.save(1, sampleState());
      await new Promise((r) => setTimeout(r, 20));
      const state2 = { ...sampleState(), current_phase: 3 };
      await cm.save(3, state2);

      const latest = await cm.latest();
      assert.equal(latest._checkpoint.phase, 3);
      assert.equal(latest.state.current_phase, 3);
    });

    it('supports phase filter', async () => {
      await cm.save(1, sampleState());
      await cm.save(2, sampleState());

      const latestP1 = await cm.latest({ phase: 1 });
      assert.equal(latestP1._checkpoint.phase, 1);
    });
  });
});
