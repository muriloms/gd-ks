/**
 * Integration: after gd-ks install, the project should have:
 *   - _gdks/_state/project-state.yaml (valid)
 *   - _gdks/_state/history/events.ndjson (with a project_initialized entry)
 *   - _gdks/_contracts/phase-01-to-02.contract.yaml (and 02-03, 03-04)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';

import { Installer } from '../../tools/installer/index.js';
import { StateManager } from '../../src/core/state/state-manager.js';
import { EventLogger } from '../../src/core/state/event-logger.js';
import { createSandbox } from '../helpers/sandbox.js';
import { assertDirExists, assertFileExists } from '../helpers/assertions.js';

describe('Installer — v0.4 state + contracts integration', () => {
  let sandbox;
  let result;

  before(async () => {
    sandbox = await createSandbox('install-state');
    const installer = new Installer({
      targetDir: sandbox.path,
      projectName: 'State Integration Test',
      modules: ['ideation', 'design'],
      language: 'en',
      outputFolder: '_gdks-output',
      ide: 'none',
      preset: 'solo-indie',
      targetEngine: 'unreal-5',
      installerVersion: '0.4.0-alpha.2'
    });
    result = await installer.install();
  });

  after(async () => {
    await sandbox.cleanup();
  });

  it('install succeeds', () => {
    assert.equal(result.success, true, `Install failed: ${result.error}`);
  });

  it('creates the _state and _contracts directories', async () => {
    await assertDirExists(join(sandbox.path, '_gdks', '_state'));
    await assertDirExists(join(sandbox.path, '_gdks', '_state', 'checkpoints'));
    await assertDirExists(join(sandbox.path, '_gdks', '_state', 'history'));
    await assertDirExists(join(sandbox.path, '_gdks', '_contracts'));
  });

  it('creates a valid project-state.yaml', async () => {
    const statePath = join(sandbox.path, '_gdks', '_state', 'project-state.yaml');
    await assertFileExists(statePath);

    const content = await readFile(statePath, 'utf8');
    const state = yaml.load(content);
    assert.equal(state.schema_version, '1.0');
    assert.equal(state.project.name, 'State Integration Test');
    assert.equal(state.preset, 'solo-indie');
    assert.equal(state.target_engine, 'unreal-5');
    assert.equal(state.current_phase, 1);

    // And the StateManager's validator must agree
    const sm = new StateManager({ projectRoot: sandbox.path });
    const r = await sm.validate();
    assert.equal(r.valid, true, `State file did not pass schema: ${r.errors.join(', ')}`);
  });

  it('logs a project_initialized event', async () => {
    const logger = new EventLogger({ projectRoot: sandbox.path });
    const events = await logger.readAll({ filterType: 'project_initialized' });
    assert.equal(events.length, 1);
    assert.equal(events[0].version, '0.4.0-alpha.2');
    assert.deepEqual(events[0].modules, ['ideation', 'design']);
  });

  it('installs the 3 default handoff contracts', async () => {
    const contractsDir = join(sandbox.path, '_gdks', '_contracts');
    await assertFileExists(join(contractsDir, 'phase-01-to-02.contract.yaml'));
    await assertFileExists(join(contractsDir, 'phase-02-to-03.contract.yaml'));
    await assertFileExists(join(contractsDir, 'phase-03-to-04.contract.yaml'));
  });

  it('does not overwrite existing user state on reinstall', async () => {
    const sm = new StateManager({ projectRoot: sandbox.path });
    // Customize the state
    await sm.update({ current_phase: 3 });

    // Rerun install
    const installer = new Installer({
      targetDir: sandbox.path,
      projectName: 'State Integration Test',
      modules: ['ideation', 'design'],
      language: 'en',
      outputFolder: '_gdks-output',
      ide: 'none',
      preset: 'solo-indie',
      installerVersion: '0.4.0-alpha.2'
    });
    const r = await installer.install();
    assert.equal(r.success, true);

    // current_phase should still be 3 (not reset)
    const state = await sm.read();
    assert.equal(state.current_phase, 3);
  });
});
