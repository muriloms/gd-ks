import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { ModuleManager } from '../../tools/installer/lib/module-manager.js';

describe('ModuleManager', () => {
  let mm;

  before(() => {
    mm = new ModuleManager();
  });

  describe('getModulePath()', () => {
    it('resolves core to src/core', () => {
      const path = mm.getModulePath('core');
      assert.match(path, /src[/\\]core$/);
    });

    it('resolves non-engine, non-core modules to src/modules/<name>', () => {
      for (const name of ['ideation', 'design', 'planning']) {
        const path = mm.getModulePath(name);
        assert.match(path, new RegExp(`src[/\\\\]modules[/\\\\]${name}$`));
      }
    });

    it('resolves "engine" to engines/unreal-5 by default (v0.4 Sprint 3)', () => {
      const path = mm.getModulePath('engine');
      assert.match(path, /src[/\\]modules[/\\]engines[/\\]unreal-5$/);
    });

    it('respects targetEngine when resolving "engine"', () => {
      const custom = new ModuleManager({ targetEngine: 'godot-4' });
      const path = custom.getModulePath('engine');
      assert.match(path, /engines[/\\]godot-4$/);
    });

    it('resolves explicit engines/<id> paths directly', () => {
      const path = mm.getModulePath('engines/unreal-5');
      assert.match(path, /src[/\\]modules[/\\]engines[/\\]unreal-5$/);
    });
  });

  describe('getModuleConfig()', () => {
    it('loads real module.yaml for shipped modules', async () => {
      for (const name of ['core', 'ideation', 'design', 'planning']) {
        const cfg = await mm.getModuleConfig(name);
        assert.ok(cfg, `Expected config for ${name}`);
        assert.equal(cfg.name, name, `Module name should be ${name}`);
        assert.ok(cfg.version, `Module ${name} should have version`);
        assert.ok(cfg.description, `Module ${name} should have description`);
      }
    });

    it('loads engine module config via the new engines/ path', async () => {
      const cfg = await mm.getModuleConfig('engine');
      assert.ok(cfg);
      assert.equal(cfg.name, 'engine');
    });

    it('returns a fallback config for unknown modules', async () => {
      const cfg = await mm.getModuleConfig('does-not-exist');
      assert.equal(cfg.name, 'does-not-exist');
      assert.ok(cfg.version);
    });
  });

  describe('getAvailableModules()', () => {
    it('lists all 5 canonical modules', async () => {
      const mods = await mm.getAvailableModules();
      const names = mods.map((m) => m.name).sort();
      assert.deepEqual(names, ['core', 'design', 'engine', 'ideation', 'planning']);
    });

    it('marks core as required', async () => {
      const mods = await mm.getAvailableModules();
      const core = mods.find((m) => m.name === 'core');
      assert.equal(core.required, true);
    });

    it('marks non-core modules as optional', async () => {
      const mods = await mm.getAvailableModules();
      const optional = mods.filter((m) => m.name !== 'core');
      for (const m of optional) assert.equal(m.required, false);
    });
  });

  describe('static helpers (Sprint 3)', () => {
    it('getKnownEngines returns unreal-5, godot-4, unity-6', () => {
      const engines = ModuleManager.getKnownEngines();
      assert.ok(engines['unreal-5']);
      assert.ok(engines['godot-4']);
      assert.ok(engines['unity-6']);
    });

    it('getAvailableEngines filters to those marked available', () => {
      const available = ModuleManager.getAvailableEngines();
      const ids = available.map((e) => e.id);
      assert.ok(ids.includes('unreal-5'));
      // Sprint post-5: Godot and Unity are now fully supported
      assert.ok(ids.includes('godot-4'));
      assert.ok(ids.includes('unity-6'));
    });
  });
});
