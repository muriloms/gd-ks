/**
 * Integration: installing with a preset filters out disabled agents.
 *
 * For each preset, we install into a sandbox and assert:
 *   - Only agents marked "active" in the preset appear under _gdks/<module>/agents/
 *   - Agents in "agents_disabled" do NOT appear
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { readdir } from 'fs/promises';

import { Installer } from '../../tools/installer/index.js';
import { PresetManager } from '../../src/core/presets/preset-manager.js';
import { createSandbox } from '../helpers/sandbox.js';

async function listAgentIdsInModule(gdksDir, moduleName) {
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

async function installWithPreset(presetId) {
  const sb = await createSandbox(`preset-${presetId}`);
  const installer = new Installer({
    targetDir: sb.path,
    projectName: `Preset ${presetId}`,
    modules: ['ideation', 'design', 'planning', 'engine'],
    language: 'en',
    ide: 'none',
    preset: presetId,
    targetEngine: 'unreal-5',
    installerVersion: '0.4.0-beta.1'
  });
  const result = await installer.install();
  if (!result.success) {
    await sb.cleanup();
    throw new Error(`Install with preset=${presetId} failed: ${result.error}`);
  }
  return { sb, gdksDir: join(sb.path, '_gdks') };
}

describe('Install with preset — agent filtering', () => {
  describe('minimal preset', () => {
    it('installs only the agents marked active', async () => {
      const { sb, gdksDir } = await installWithPreset('minimal');
      try {
        const pm = new PresetManager();
        const preset = await pm.load('minimal');

        for (const moduleName of ['ideation', 'design', 'planning', 'engine']) {
          const installed = await listAgentIdsInModule(gdksDir, moduleName);
          const expected = preset.agents_active[moduleName] || [];

          // Expected agents should be present
          for (const id of expected) {
            assert.ok(
              installed.includes(id),
              `[${moduleName}] Expected active agent "${id}" not installed. Got: ${installed.join(', ')}`
            );
          }

          // Disabled agents should NOT be present in this module
          for (const id of preset.agents_disabled || []) {
            assert.ok(
              !installed.includes(id),
              `[${moduleName}] Disabled agent "${id}" was installed but shouldn't be`
            );
          }
        }
      } finally {
        await sb.cleanup();
      }
    });

    it('has fewer agents than studio preset', async () => {
      const pm = new PresetManager();
      const minimal = await pm.load('minimal');
      const studio = await pm.load('studio');
      assert.ok(
        pm.getActiveAgents(minimal).length < pm.getActiveAgents(studio).length,
        'minimal should have strictly fewer agents than studio'
      );
    });
  });

  describe('studio preset', () => {
    it('installs all agents (nothing disabled)', async () => {
      const { sb, gdksDir } = await installWithPreset('studio');
      try {
        // Count every agent across all modules
        let total = 0;
        for (const moduleName of ['ideation', 'design', 'planning', 'engine']) {
          const installed = await listAgentIdsInModule(gdksDir, moduleName);
          total += installed.length;
        }
        // Studio activates 31 agents + core master. Installer only operates on non-core modules here.
        // Expect at least 30 installed across ideation/design/planning/engine.
        assert.ok(total >= 30, `Studio preset should install ≥30 agents, got ${total}`);
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('narrative-heavy preset', () => {
    it('includes narrative specialists and excludes progression-architect', async () => {
      const { sb, gdksDir } = await installWithPreset('narrative-heavy');
      try {
        const design = await listAgentIdsInModule(gdksDir, 'design');
        assert.ok(design.includes('narrative-designer'));
        assert.ok(design.includes('world-builder'));
        assert.ok(design.includes('character-designer'));
        assert.ok(!design.includes('progression-architect'), 'progression-architect should be disabled');
        assert.ok(!design.includes('systems-designer'), 'systems-designer should be disabled');
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('mobile-casual preset', () => {
    it('includes progression + marketing and excludes narrative specialists', async () => {
      const { sb, gdksDir } = await installWithPreset('mobile-casual');
      try {
        const design = await listAgentIdsInModule(gdksDir, 'design');
        assert.ok(design.includes('progression-architect'));
        assert.ok(design.includes('marketing-strategist'));
        assert.ok(!design.includes('narrative-designer'), 'narrative-designer should be disabled');
        assert.ok(!design.includes('world-builder'), 'world-builder should be disabled');
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('state captures active preset', () => {
    it('project-state.yaml has preset: solo-indie after install', async () => {
      const { sb } = await installWithPreset('solo-indie');
      try {
        const { StateManager } = await import('../../src/core/state/state-manager.js');
        const sm = new StateManager({ projectRoot: sb.path });
        const state = await sm.read();
        assert.equal(state.preset, 'solo-indie');
      } finally {
        await sb.cleanup();
      }
    });
  });
});
