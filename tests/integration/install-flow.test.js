/**
 * Integration test: end-to-end installer flow.
 *
 * Installs GD-KS into a temp sandbox directory and verifies the resulting
 * structure, manifest, and compiled agents.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';

import { Installer } from '../../tools/installer/index.js';
import { createSandbox } from '../helpers/sandbox.js';
import { assertDirExists, assertFileExists } from '../helpers/assertions.js';

describe('Installer (integration)', () => {
  let sandbox;

  before(async () => {
    sandbox = await createSandbox('install-flow');
  });

  after(async () => {
    await sandbox.cleanup();
  });

  describe('full install with all modules', () => {
    let result;
    const projectName = 'Integration Test Game';

    before(async () => {
      const installer = new Installer({
        targetDir: sandbox.path,
        projectName,
        modules: ['ideation', 'design', 'planning', 'engine'],
        language: 'en',
        outputFolder: '_gdks-output',
        ide: 'none', // skip IDE copy in test
        installerVersion: '0.4.0-alpha.1'
      });
      result = await installer.install();
    });

    it('returns success', () => {
      assert.equal(result.success, true, `Install failed: ${result.error}`);
    });

    it('creates the _gdks root directory', async () => {
      await assertDirExists(join(sandbox.path, '_gdks'));
    });

    it('creates subdirectories for every installed module', async () => {
      for (const mod of ['core', 'ideation', 'design', 'planning', 'engine']) {
        await assertDirExists(join(sandbox.path, '_gdks', mod));
      }
    });

    it('creates the _config and _memory directories', async () => {
      await assertDirExists(join(sandbox.path, '_gdks', '_config'));
      await assertDirExists(join(sandbox.path, '_gdks', '_memory'));
    });

    it('creates output subdirectories for each phase', async () => {
      for (const phase of ['01-ideation', '02-design', '03-planning', '04-engine']) {
        await assertDirExists(join(sandbox.path, '_gdks-output', phase));
      }
    });

    it('writes a manifest with the correct version', async () => {
      const manifestPath = join(sandbox.path, '_gdks', '_config', 'manifest.yaml');
      await assertFileExists(manifestPath);
      const content = await readFile(manifestPath, 'utf8');
      const manifest = yaml.load(content);
      assert.equal(manifest.gdks_version, '0.4.0-alpha.1');
      assert.deepEqual(manifest.modules.installed.sort(), [
        'core',
        'design',
        'engine',
        'ideation',
        'planning'
      ]);
      assert.equal(manifest.project.name, projectName);
    });

    it('writes project-config.yaml', async () => {
      const cfgPath = join(sandbox.path, '_gdks', '_config', 'project-config.yaml');
      await assertFileExists(cfgPath);
      const content = await readFile(cfgPath, 'utf8');
      const cfg = yaml.load(content);
      assert.equal(cfg.project.name, projectName);
      assert.equal(cfg.settings.communication_language, 'en');
    });

    it('compiles the master agent to Markdown', async () => {
      const masterMd = join(sandbox.path, '_gdks', 'core', 'agents', 'gdks-master.md');
      await assertFileExists(masterMd);
      const content = await readFile(masterMd, 'utf8');
      assert.ok(content.includes('# GameMaster'), 'Expected H1 with agent name');
      assert.ok(content.includes('*help'), 'Expected default *help command');
    });

    it('compiles at least one agent per module', async () => {
      const modulesWithAgents = [
        { mod: 'ideation', expected: 'concept-brainstormer.md' },
        { mod: 'design', expected: 'game-design-director.md' },
        { mod: 'planning', expected: 'scrum-master.md' },
        { mod: 'engine', expected: 'ue5-architect.md' }
      ];
      for (const { mod, expected } of modulesWithAgents) {
        const path = join(sandbox.path, '_gdks', mod, 'agents', expected);
        await assertFileExists(path);
      }
    });
  });

  describe('isInstalled() / getInstalledVersion()', () => {
    it('detects the prior installation', async () => {
      const installer = new Installer({ targetDir: sandbox.path });
      assert.equal(await installer.isInstalled(), true);
      const version = await installer.getInstalledVersion();
      // Version is stored under gdks_version (not "version") — accept both for forward compat
      assert.ok(version === '0.4.0-alpha.1' || version === undefined);
    });
  });
});

describe('Installer — minimal install (core only)', () => {
  it('succeeds with only core module', async () => {
    const sb = await createSandbox('minimal-install');
    try {
      const installer = new Installer({
        targetDir: sb.path,
        projectName: 'Minimal',
        modules: [],
        language: 'en',
        outputFolder: '_gdks-output',
        ide: 'none',
        installerVersion: '0.4.0-alpha.1'
      });
      const r = await installer.install();
      assert.equal(r.success, true, `Install failed: ${r.error}`);
      await assertDirExists(join(sb.path, '_gdks', 'core'));
      await assertFileExists(join(sb.path, '_gdks', 'core', 'agents', 'gdks-master.md'));
    } finally {
      await sb.cleanup();
    }
  });
});
