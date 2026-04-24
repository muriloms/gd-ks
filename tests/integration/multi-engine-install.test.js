/**
 * Integration: install with godot-4 or unity-6 produces the right
 * engine agents and state.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { readdir } from 'fs/promises';

import { Installer } from '../../tools/installer/index.js';
import { StateManager } from '../../src/core/state/state-manager.js';
import { createSandbox } from '../helpers/sandbox.js';

async function listAgentIds(gdksDir, moduleName) {
  const dir = join(gdksDir, moduleName, 'agents');
  try {
    const entries = await readdir(dir);
    return entries
      .filter((f) => f.endsWith('.agent.yaml'))
      .map((f) => f.replace(/\.agent\.yaml$/, ''));
  } catch {
    return [];
  }
}

describe('Install with non-Unreal engines', () => {
  describe('godot-4', () => {
    it('installs the 4 Godot agents and records target_engine in state', async () => {
      const sb = await createSandbox('install-godot');
      try {
        const installer = new Installer({
          targetDir: sb.path,
          projectName: 'Godot Test',
          modules: ['ideation', 'engine'],
          language: 'en',
          ide: 'none',
          preset: 'solo-indie',
          targetEngine: 'godot-4',
          installerVersion: '0.4.0-beta.2'
        });
        const r = await installer.install();
        assert.equal(r.success, true, `Install failed: ${r.error}`);

        const agents = await listAgentIds(join(sb.path, '_gdks'), 'engine');
        assert.ok(agents.includes('godot-architect'));
        assert.ok(agents.includes('godot-gdscript-lead'));
        assert.ok(agents.includes('godot-node-specialist'));
        assert.ok(agents.includes('engine-coordinator-godot'));

        // No UE5 agents leaked in
        assert.ok(!agents.includes('ue5-architect'));
        assert.ok(!agents.includes('ue5-programmer-lead'));

        const sm = new StateManager({ projectRoot: sb.path });
        const state = await sm.read();
        assert.equal(state.target_engine, 'godot-4');
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('unity-6', () => {
    it('installs the 4 Unity agents and records target_engine in state', async () => {
      const sb = await createSandbox('install-unity');
      try {
        const installer = new Installer({
          targetDir: sb.path,
          projectName: 'Unity Test',
          modules: ['ideation', 'engine'],
          language: 'en',
          ide: 'none',
          preset: 'solo-indie',
          targetEngine: 'unity-6',
          installerVersion: '0.4.0-beta.2'
        });
        const r = await installer.install();
        assert.equal(r.success, true, `Install failed: ${r.error}`);

        const agents = await listAgentIds(join(sb.path, '_gdks'), 'engine');
        assert.ok(agents.includes('unity-architect'));
        assert.ok(agents.includes('unity-csharp-lead'));
        assert.ok(agents.includes('unity-prefab-specialist'));
        assert.ok(agents.includes('engine-coordinator-unity'));

        // No UE5 or Godot agents leaked in
        assert.ok(!agents.includes('ue5-architect'));
        assert.ok(!agents.includes('godot-architect'));

        const sm = new StateManager({ projectRoot: sb.path });
        const state = await sm.read();
        assert.equal(state.target_engine, 'unity-6');
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('engine isolation', () => {
    it('installing UE5 does not bring in Godot or Unity agents', async () => {
      const sb = await createSandbox('install-ue5-isolation');
      try {
        const installer = new Installer({
          targetDir: sb.path,
          projectName: 'UE5 Only',
          modules: ['engine'],
          language: 'en',
          ide: 'none',
          preset: 'solo-indie',
          targetEngine: 'unreal-5',
          installerVersion: '0.4.0-beta.2'
        });
        await installer.install();

        const agents = await listAgentIds(join(sb.path, '_gdks'), 'engine');
        // UE5 agents should be present
        assert.ok(agents.some((a) => a.startsWith('ue5-')));
        // No cross-engine leakage
        assert.ok(!agents.some((a) => a.startsWith('godot-')));
        assert.ok(!agents.some((a) => a.startsWith('unity-')));
      } finally {
        await sb.cleanup();
      }
    });
  });
});
