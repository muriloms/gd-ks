import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

import { ContractValidator } from '../../src/core/contracts/contract-validator.js';
import { createSandbox } from '../helpers/sandbox.js';

describe('ContractValidator', () => {
  let sandbox;
  let validator;

  beforeEach(async () => {
    sandbox = await createSandbox('contract-validator');
    validator = new ContractValidator({ projectRoot: sandbox.path });
  });

  afterEach(async () => {
    await sandbox.cleanup();
  });

  async function writeDoc(relPath, content) {
    const full = join(sandbox.path, relPath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, 'utf8');
  }

  const baseState = (overrides = {}) => ({
    schema_version: '1.0',
    project: { id: 'x', name: 'X', created_at: new Date().toISOString() },
    current_phase: 1,
    preset: 'solo-indie',
    target_engine: 'unreal-5',
    phase_progress: {
      '1': { status: 'in_progress', completion_pct: 90, deliverables: [] }
    },
    active_agents: [],
    decisions: [],
    open_questions: [],
    ...overrides
  });

  describe('required deliverables', () => {
    it('passes when file exists, is long enough, and has required sections', async () => {
      await writeDoc(
        '_gdks-output/01-ideation/concept-brief.md',
        '# Concept Brief\n\n## Core Concept\n\n' + 'word '.repeat(250)
      );
      const contract = {
        required_deliverables: [
          {
            id: 'concept-brief',
            path_glob: '_gdks-output/01-ideation/concept-brief.md',
            min_word_count: 200,
            required_sections: ['Core Concept']
          }
        ]
      };
      // Register as verified in state
      const state = baseState();
      state.phase_progress['1'].deliverables.push({
        id: 'concept-brief',
        path: '_gdks-output/01-ideation/concept-brief.md',
        verified: true
      });

      const report = await validator.check(contract, state);
      assert.equal(report.passed, true, `Failed: ${JSON.stringify(report.checks)}`);
    });

    it('fails when file is missing', async () => {
      const contract = {
        required_deliverables: [
          { id: 'missing-doc', path_glob: '_gdks-output/01-ideation/nope.md' }
        ]
      };
      const report = await validator.check(contract, baseState());
      assert.equal(report.passed, false);
      assert.match(report.checks[0].reason, /File not found/);
    });

    it('fails when file exists but is not marked verified in state', async () => {
      await writeDoc('_gdks-output/01-ideation/concept-brief.md', 'hello world');
      const contract = {
        required_deliverables: [
          { id: 'concept-brief', path_glob: '_gdks-output/01-ideation/concept-brief.md' }
        ]
      };
      const state = baseState();
      state.phase_progress['1'].deliverables.push({
        id: 'concept-brief',
        path: '_gdks-output/01-ideation/concept-brief.md',
        verified: false
      });
      const report = await validator.check(contract, state);
      assert.equal(report.passed, false);
      assert.match(report.checks[0].reason, /not marked as verified/);
    });

    it('fails when word count is too low', async () => {
      await writeDoc('_gdks-output/01-ideation/concept-brief.md', 'too short');
      const contract = {
        required_deliverables: [
          {
            id: 'concept-brief',
            path_glob: '_gdks-output/01-ideation/concept-brief.md',
            min_word_count: 200
          }
        ]
      };
      const state = baseState();
      state.phase_progress['1'].deliverables.push({
        id: 'concept-brief',
        path: '_gdks-output/01-ideation/concept-brief.md',
        verified: true
      });
      const report = await validator.check(contract, state);
      assert.equal(report.passed, false);
      assert.match(report.checks[0].reason, /Too short/);
    });

    it('fails when required sections are missing', async () => {
      await writeDoc(
        '_gdks-output/01-ideation/concept-brief.md',
        '# Concept\nThis has no target audience section.'
      );
      const contract = {
        required_deliverables: [
          {
            id: 'concept-brief',
            path_glob: '_gdks-output/01-ideation/concept-brief.md',
            required_sections: ['Target Audience']
          }
        ]
      };
      const state = baseState();
      state.phase_progress['1'].deliverables.push({
        id: 'concept-brief',
        path: '_gdks-output/01-ideation/concept-brief.md',
        verified: true
      });
      const report = await validator.check(contract, state);
      assert.equal(report.passed, false);
      assert.match(report.checks[0].reason, /Missing required section/);
    });
  });

  describe('conditional deliverables (required_when)', () => {
    it('skips deliverable when preset does not match', async () => {
      const contract = {
        required_deliverables: [
          {
            id: 'story-bible',
            path_glob: '_gdks-output/02-design/narrative/story-bible.md',
            required_when: { preset: ['narrative-heavy'] }
          }
        ]
      };
      const state = baseState({ preset: 'solo-indie' });
      const report = await validator.check(contract, state);
      assert.equal(report.passed, true);
      assert.equal(report.checks[0].status, 'skipped');
    });

    it('requires deliverable when preset matches', async () => {
      const contract = {
        required_deliverables: [
          {
            id: 'story-bible',
            path_glob: '_gdks-output/02-design/narrative/story-bible.md',
            required_when: { preset: ['narrative-heavy'] }
          }
        ]
      };
      const state = baseState({ preset: 'narrative-heavy' });
      const report = await validator.check(contract, state);
      assert.equal(report.passed, false);
      assert.equal(report.checks[0].status, 'failed');
    });
  });

  describe('quality gates', () => {
    it('no_open_blockers passes when there are none', async () => {
      const contract = { required_deliverables: [], quality_gates: [{ type: 'no_open_blockers' }] };
      const state = baseState();
      state.open_questions = [{ id: 'Q1', status: 'pending', text: 'x' }];
      const report = await validator.check(contract, state);
      assert.equal(report.passed, true);
    });

    it('no_open_blockers fails when there is a blocker', async () => {
      const contract = { required_deliverables: [], quality_gates: [{ type: 'no_open_blockers' }] };
      const state = baseState();
      state.open_questions = [{ id: 'Q1', status: 'blocker', text: 'help' }];
      const report = await validator.check(contract, state);
      assert.equal(report.passed, false);
      assert.match(report.checks[0].reason, /blocker/i);
    });

    it('min_completion_pct passes when above threshold', async () => {
      const contract = {
        required_deliverables: [],
        quality_gates: [{ type: 'min_completion_pct', value: 80 }]
      };
      const state = baseState();
      state.phase_progress['1'].completion_pct = 85;
      const report = await validator.check(contract, state);
      assert.equal(report.passed, true);
    });

    it('min_completion_pct fails when below threshold', async () => {
      const contract = {
        required_deliverables: [],
        quality_gates: [{ type: 'min_completion_pct', value: 80 }]
      };
      const state = baseState();
      state.phase_progress['1'].completion_pct = 50;
      const report = await validator.check(contract, state);
      assert.equal(report.passed, false);
      assert.match(report.checks[0].reason, /50% < required 80%/);
    });

    it('all_agents_signoff fails when agents missing from active_agents', async () => {
      const contract = {
        required_deliverables: [],
        quality_gates: [{ type: 'all_agents_signoff', agents: ['diana', 'dylan'] }]
      };
      const state = baseState();
      state.active_agents = ['diana']; // missing dylan
      const report = await validator.check(contract, state);
      assert.equal(report.passed, false);
      assert.match(report.checks[0].reason, /dylan/);
    });

    it('all_agents_signoff passes when all agents active', async () => {
      const contract = {
        required_deliverables: [],
        quality_gates: [{ type: 'all_agents_signoff', agents: ['diana', 'dylan'] }]
      };
      const state = baseState();
      state.active_agents = ['diana', 'dylan'];
      const report = await validator.check(contract, state);
      assert.equal(report.passed, true);
    });

    it('unknown gate types are skipped, not failed', async () => {
      const contract = {
        required_deliverables: [],
        quality_gates: [{ type: 'unknown_gate_type' }]
      };
      const report = await validator.check(contract, baseState());
      assert.equal(report.passed, true);
      assert.equal(report.checks[0].status, 'skipped');
    });
  });

  describe('summary', () => {
    it('counts passed/failed/skipped', async () => {
      await writeDoc('_gdks-output/ok.md', 'word '.repeat(50));
      const contract = {
        required_deliverables: [
          { id: 'ok', path_glob: '_gdks-output/ok.md' },
          { id: 'missing', path_glob: '_gdks-output/missing.md' },
          { id: 'skip', path_glob: '_gdks-output/skip.md', required_when: { preset: ['x'] } }
        ]
      };
      const state = baseState({ preset: 'solo-indie' });
      state.phase_progress['1'].deliverables.push({ id: 'ok', path: '_gdks-output/ok.md', verified: true });

      const report = await validator.check(contract, state);
      assert.equal(report.summary.passed, 1);
      assert.equal(report.summary.failed, 1);
      assert.equal(report.summary.skipped, 1);
      assert.equal(report.summary.total, 3);
    });
  });
});
