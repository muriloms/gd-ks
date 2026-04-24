/**
 * Integration test: Sprint 3 engine-agnostic layer.
 *
 * - Install uses the selected engine, ModuleManager resolves correctly.
 * - Compiled agents contain the state-context placeholder.
 * - `gd-ks state inject` (in-process) replaces the placeholder with live context.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { readFile, readdir } from 'fs/promises';

import { Installer } from '../../tools/installer/index.js';
import { createSandbox } from '../helpers/sandbox.js';
import { assertFileExists, assertDirExists } from '../helpers/assertions.js';

describe('Installer — engine-agnostic layer (Sprint 3)', () => {
  describe('default install with unreal-5', () => {
    let sandbox;
    let result;

    before(async () => {
      sandbox = await createSandbox('install-ue5');
      const installer = new Installer({
        targetDir: sandbox.path,
        projectName: 'Engine Test',
        modules: ['ideation', 'design', 'engine'],
        language: 'en',
        outputFolder: '_gdks-output',
        ide: 'none',
        targetEngine: 'unreal-5',
        installerVersion: '0.4.0-alpha.3'
      });
      result = await installer.install();
    });

    after(async () => {
      await sandbox.cleanup();
    });

    it('succeeds', () => {
      assert.equal(result.success, true, `Failed: ${result.error}`);
    });

    it('installs agents from engines/unreal-5 via the "engine" module name', async () => {
      // UE5 agents should end up at _gdks/engine/agents/
      await assertDirExists(join(sandbox.path, '_gdks', 'engine', 'agents'));
      await assertFileExists(join(sandbox.path, '_gdks', 'engine', 'agents', 'ue5-architect.md'));
    });

    it('records target_engine in project-state.yaml', async () => {
      const statePath = join(sandbox.path, '_gdks', '_state', 'project-state.yaml');
      const content = await readFile(statePath, 'utf8');
      assert.ok(content.includes('target_engine: unreal-5'));
    });

    it('compiled agents include the state-context placeholder', async () => {
      const agentPath = join(sandbox.path, '_gdks', 'engine', 'agents', 'ue5-architect.md');
      const md = await readFile(agentPath, 'utf8');
      assert.ok(
        md.includes('GDKS_STATE_CONTEXT_PLACEHOLDER'),
        'Expected placeholder to be injected by agent compiler'
      );
    });
  });

  describe('engine-profile validation', () => {
    it('the shipped unreal-5 engine-profile.yaml passes its schema', async () => {
      const { SchemaValidator } = await import('../../tools/validator/validator.js');
      const { dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      const here = dirname(fileURLToPath(import.meta.url));
      const profilePath = join(here, '..', '..', 'src', 'modules', 'engines', 'unreal-5', 'engine-profile.yaml');
      const v = new SchemaValidator();
      await v.load();
      const r = await v.validateFile('engine-profile', profilePath);
      assert.equal(r.valid, true, `Errors: ${r.errors.join(', ')}`);
    });
  });

  describe('additional engines (Sprint post-5)', () => {
    it('godot-4 and unity-6 are now full engine modules, not placeholders', async () => {
      const { dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      const here = dirname(fileURLToPath(import.meta.url));
      const enginesRoot = join(here, '..', '..', 'src', 'modules', 'engines');

      const entries = await readdir(enginesRoot);
      assert.ok(entries.includes('godot-4'));
      assert.ok(entries.includes('unity-6'));

      // They have real engine-profile.yaml, not .placeholder
      await assertFileExists(join(enginesRoot, 'godot-4', 'engine-profile.yaml'));
      await assertFileExists(join(enginesRoot, 'unity-6', 'engine-profile.yaml'));
      await assertFileExists(join(enginesRoot, 'godot-4', 'module.yaml'));
      await assertFileExists(join(enginesRoot, 'unity-6', 'module.yaml'));
    });

    it('godot-4 ships with 4 agents', async () => {
      const { dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      const here = dirname(fileURLToPath(import.meta.url));
      const agentsDir = join(here, '..', '..', 'src', 'modules', 'engines', 'godot-4', 'agents');
      const entries = await readdir(agentsDir);
      const agents = entries.filter((f) => f.endsWith('.agent.yaml'));
      assert.equal(agents.length, 4);
    });

    it('unity-6 ships with 4 agents', async () => {
      const { dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      const here = dirname(fileURLToPath(import.meta.url));
      const agentsDir = join(here, '..', '..', 'src', 'modules', 'engines', 'unity-6', 'agents');
      const entries = await readdir(agentsDir);
      const agents = entries.filter((f) => f.endsWith('.agent.yaml'));
      assert.equal(agents.length, 4);
    });
  });
});
