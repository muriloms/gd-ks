import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { StateManager } from '../../src/core/state/state-manager.js';
import { createSandbox } from '../helpers/sandbox.js';

describe('StateManager', () => {
  let sandbox;
  let sm;

  beforeEach(async () => {
    sandbox = await createSandbox('state-manager');
    sm = new StateManager({ projectRoot: sandbox.path });
  });

  afterEach(async () => {
    await sandbox.cleanup();
  });

  describe('init() and exists()', () => {
    it('creates a new state file with defaults', async () => {
      assert.equal(await sm.exists(), false);
      const state = await sm.init({ projectName: 'Test Game' });
      assert.equal(await sm.exists(), true);
      assert.equal(state.schema_version, '1.0');
      assert.equal(state.project.name, 'Test Game');
      assert.equal(state.project.id, 'test-game');
      assert.equal(state.current_phase, 1);
      assert.deepEqual(state.phases_completed, []);
    });

    it('refuses to overwrite an existing state', async () => {
      await sm.init({ projectName: 'First' });
      await assert.rejects(() => sm.init({ projectName: 'Second' }), /already exists/);
    });

    it('slugifies the project name properly', async () => {
      const state = await sm.init({ projectName: 'My Epic RPG!!! 2026' });
      assert.equal(state.project.id, 'my-epic-rpg-2026');
    });

    it('falls back to "my-game" for empty names', async () => {
      const state = await sm.init({ projectName: '!!!' });
      assert.equal(state.project.id, 'my-game');
    });

    it('accepts optional preset, targetEngine, language', async () => {
      const state = await sm.init({
        projectName: 'X',
        preset: 'solo-indie',
        targetEngine: 'unreal-5',
        language: 'pt-BR'
      });
      assert.equal(state.preset, 'solo-indie');
      assert.equal(state.target_engine, 'unreal-5');
      assert.equal(state.language, 'pt-BR');
    });
  });

  describe('read() and update()', () => {
    it('throws a clear error if state does not exist', async () => {
      await assert.rejects(() => sm.read(), /not found/);
    });

    it('round-trips data correctly', async () => {
      await sm.init({ projectName: 'X' });
      const s = await sm.read();
      assert.ok(s.project);
      assert.equal(s.project.name, 'X');
    });

    it('updates top-level fields', async () => {
      await sm.init({ projectName: 'X' });
      const next = await sm.update({ current_phase: 2 });
      assert.equal(next.current_phase, 2);
      const reread = await sm.read();
      assert.equal(reread.current_phase, 2);
    });

    it('supports function-form updates', async () => {
      await sm.init({ projectName: 'X' });
      const next = await sm.update((s) => {
        s.active_agents = ['diana', 'marco'];
        return s;
      });
      assert.deepEqual(next.active_agents, ['diana', 'marco']);
    });

    it('refreshes updated_at on write', async () => {
      const init = await sm.init({ projectName: 'X' });
      await new Promise((r) => setTimeout(r, 20));
      const next = await sm.update({ current_phase: 2 });
      assert.notEqual(next.project.updated_at, init.project.updated_at);
    });
  });

  describe('phase lifecycle', () => {
    beforeEach(async () => {
      await sm.init({ projectName: 'Phase Test' });
    });

    it('startPhase marks phase as in_progress and updates current_phase', async () => {
      const next = await sm.startPhase(2);
      assert.equal(next.phase_progress['2'].status, 'in_progress');
      assert.ok(next.phase_progress['2'].started_at);
      assert.equal(next.current_phase, 2);
      assert.ok(next.phases_in_progress.includes(2));
    });

    it('completePhase moves from in_progress to completed', async () => {
      await sm.startPhase(2);
      const next = await sm.completePhase(2);
      assert.equal(next.phase_progress['2'].status, 'completed');
      assert.ok(next.phase_progress['2'].completed_at);
      assert.equal(next.phase_progress['2'].completion_pct, 100);
      assert.ok(next.phases_completed.includes(2));
      assert.ok(!next.phases_in_progress.includes(2));
    });

    it('rejects invalid phase numbers', async () => {
      await assert.rejects(() => sm.startPhase(0), /Invalid phase/);
      await assert.rejects(() => sm.startPhase(5), /Invalid phase/);
    });
  });

  describe('deliverables', () => {
    beforeEach(async () => {
      await sm.init({ projectName: 'D' });
      await sm.startPhase(1);
    });

    it('addDeliverable adds a new deliverable', async () => {
      const next = await sm.addDeliverable(1, {
        id: 'concept-brief',
        path: '_gdks-output/01-ideation/concept-brief.md'
      });
      const d = next.phase_progress['1'].deliverables;
      assert.equal(d.length, 1);
      assert.equal(d[0].id, 'concept-brief');
      assert.equal(d[0].verified, false);
    });

    it('addDeliverable replaces by id (idempotent)', async () => {
      await sm.addDeliverable(1, { id: 'x', path: 'a.md' });
      const next = await sm.addDeliverable(1, { id: 'x', path: 'b.md' });
      assert.equal(next.phase_progress['1'].deliverables.length, 1);
      assert.equal(next.phase_progress['1'].deliverables[0].path, 'b.md');
    });

    it('verifyDeliverable sets verified + verified_at', async () => {
      await sm.addDeliverable(1, { id: 'x', path: 'a.md' });
      const next = await sm.verifyDeliverable(1, 'x');
      const d = next.phase_progress['1'].deliverables[0];
      assert.equal(d.verified, true);
      assert.ok(d.verified_at);
    });

    it('verifyDeliverable throws if id not found', async () => {
      await assert.rejects(() => sm.verifyDeliverable(1, 'missing'), /not found/);
    });

    it('addDeliverable validates minimum fields', async () => {
      await assert.rejects(() => sm.addDeliverable(1, { id: 'x' }), /id, path/);
      await assert.rejects(() => sm.addDeliverable(1, { path: 'y' }), /id, path/);
    });
  });

  describe('decisions and questions', () => {
    beforeEach(async () => {
      await sm.init({ projectName: 'DQ' });
      await sm.startPhase(1);
    });

    it('addDecision assigns sequential ids', async () => {
      const s1 = await sm.addDecision({ what: 'Genre: Metroidvania', by: 'sparky' });
      const s2 = await sm.addDecision({ what: 'Engine: UE5', by: 'user' });
      assert.equal(s1.decisions[0].id, 'D001');
      assert.equal(s2.decisions[1].id, 'D002');
      assert.equal(s2.decisions.length, 2);
    });

    it('addDecision fills phase from current_phase if not provided', async () => {
      const s = await sm.addDecision({ what: 'x' });
      assert.equal(s.decisions[0].phase, 1);
    });

    it('addQuestion assigns sequential ids and default status pending', async () => {
      const s = await sm.addQuestion({ text: 'Should we add co-op?', from: 'marco' });
      assert.equal(s.open_questions[0].id, 'Q001');
      assert.equal(s.open_questions[0].status, 'pending');
    });

    it('updateQuestionStatus transitions through valid states', async () => {
      await sm.addQuestion({ text: 'x' });
      const s = await sm.updateQuestionStatus('Q001', 'blocker');
      assert.equal(s.open_questions[0].status, 'blocker');
    });

    it('updateQuestionStatus rejects invalid status', async () => {
      await sm.addQuestion({ text: 'x' });
      await assert.rejects(() => sm.updateQuestionStatus('Q001', 'invalid'), /Invalid question status/);
    });

    it('updateQuestionStatus throws if question not found', async () => {
      await assert.rejects(() => sm.updateQuestionStatus('Q999', 'answered'), /not found/);
    });
  });

  describe('validate()', () => {
    it('returns valid=true for a freshly-initialized state', async () => {
      await sm.init({ projectName: 'V' });
      const r = await sm.validate();
      assert.equal(r.valid, true, `Errors: ${r.errors.join(', ')}`);
    });

    it('returns valid=false when no state file exists', async () => {
      const r = await sm.validate();
      assert.equal(r.valid, false);
    });
  });

  describe('renderContext()', () => {
    it('produces a readable context block', async () => {
      await sm.init({ projectName: 'Ctx', preset: 'solo-indie' });
      await sm.startPhase(1);
      await sm.addDeliverable(1, { id: 'concept-brief', path: 'x.md', verified: true });
      await sm.addDecision({ what: 'Use 2D pixel art', by: 'aurora' });
      await sm.addQuestion({ text: 'Multiplayer?', from: 'marco' });

      const ctx = await sm.renderContext();
      assert.ok(ctx.includes('<project_state_context>'));
      assert.ok(ctx.includes('Ctx'));
      assert.ok(ctx.includes('solo-indie'));
      assert.ok(ctx.includes('Phase 1'));
      assert.ok(ctx.includes('concept-brief'));
      assert.ok(ctx.includes('Use 2D pixel art'));
      assert.ok(ctx.includes('Multiplayer?'));
      assert.ok(ctx.includes('</project_state_context>'));
    });
  });

  describe('schema enforcement on write', () => {
    it('refuses to write a state that fails schema', async () => {
      await sm.init({ projectName: 'E' });
      await assert.rejects(
        () => sm.update((s) => {
          s.current_phase = 99; // out of range
          return s;
        }),
        /Refusing to write invalid state/
      );
    });
  });
});
