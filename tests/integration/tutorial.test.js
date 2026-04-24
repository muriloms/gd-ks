/**
 * Integration test: gd-ks tutorial sets up sandbox with samples.
 *
 * Uses explicit projectRoot instead of process.chdir to avoid races
 * when multiple integration suites run.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';

import { tutorial } from '../../src/cli/commands/tutorial.js';
import { createSandbox } from '../helpers/sandbox.js';
import { assertFileExists, assertDirExists } from '../helpers/assertions.js';

describe('Tutorial command', () => {
  let sandbox;

  beforeEach(async () => {
    sandbox = await createSandbox('tutorial-cmd');
  });

  afterEach(async () => {
    await sandbox.cleanup();
  });

  const opts = () => ({ projectRoot: sandbox.path, quiet: true });

  describe('default setup', () => {
    it('copies Cosmic Explorer samples to _gdks-output-tutorial/', async () => {
      await tutorial(opts());

      await assertDirExists(join(sandbox.path, '_gdks-output-tutorial'));
      await assertFileExists(join(sandbox.path, '_gdks-output-tutorial', '01-ideation', 'concept-brief.md'));
      await assertFileExists(join(sandbox.path, '_gdks-output-tutorial', '02-design', 'gdd', 'main.md'));
      await assertFileExists(join(sandbox.path, '_gdks-output-tutorial', '03-planning', 'epics.md'));
      await assertFileExists(join(sandbox.path, '_gdks-output-tutorial', '04-engine', 'architecture.md'));
    });

    it('creates tutorial-state.yaml separate from project-state.yaml', async () => {
      await tutorial(opts());

      const statePath = join(sandbox.path, '_gdks', '_state', 'tutorial-state.yaml');
      await assertFileExists(statePath);

      const content = await readFile(statePath, 'utf8');
      const state = yaml.load(content);
      assert.equal(state.schema_version, '1.0');
      assert.equal(state.project.id, 'tutorial-cosmic-explorer');
      assert.equal(state.current_phase, 1);
      assert.equal(state.preset, 'solo-indie');
    });

    it('does not touch the real project-state.yaml', async () => {
      await tutorial(opts());

      const realStatePath = join(sandbox.path, '_gdks', '_state', 'project-state.yaml');
      const fs = await import('fs');
      assert.equal(fs.existsSync(realStatePath), false);
    });
  });

  describe('--reset', () => {
    it('removes previous sandbox + tutorial state', async () => {
      await tutorial(opts());
      await tutorial({ ...opts(), reset: true });

      const fs = await import('fs');
      assert.equal(
        fs.existsSync(join(sandbox.path, '_gdks-output-tutorial')),
        false
      );
      assert.equal(
        fs.existsSync(join(sandbox.path, '_gdks', '_state', 'tutorial-state.yaml')),
        false
      );
    });

    it('is safe to run when nothing exists', async () => {
      await tutorial({ ...opts(), reset: true });
    });
  });

  describe('sample files content', () => {
    it('concept-brief has the required sections', async () => {
      await tutorial(opts());
      const content = await readFile(
        join(sandbox.path, '_gdks-output-tutorial', '01-ideation', 'concept-brief.md'),
        'utf8'
      );
      assert.match(content, /## Core Concept/);
      assert.match(content, /## Target Audience/);
      assert.match(content, /## Hook/);
    });

    it('GDD has pillars and mechanics', async () => {
      await tutorial(opts());
      const content = await readFile(
        join(sandbox.path, '_gdks-output-tutorial', '02-design', 'gdd', 'main.md'),
        'utf8'
      );
      assert.match(content, /## Pillars/);
      assert.match(content, /## Core Mechanics/);
    });

    it('epics file has Epic entries', async () => {
      await tutorial(opts());
      const content = await readFile(
        join(sandbox.path, '_gdks-output-tutorial', '03-planning', 'epics.md'),
        'utf8'
      );
      assert.match(content, /## Epic \d:/);
    });
  });
});
