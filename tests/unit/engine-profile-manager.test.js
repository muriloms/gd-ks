import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { EngineProfileManager } from '../../src/core/engines/engine-profile-manager.js';

describe('EngineProfileManager', () => {
  let epm;

  before(() => {
    epm = new EngineProfileManager();
  });

  describe('load()', () => {
    it('loads the unreal-5 engine profile', async () => {
      const profile = await epm.load('unreal-5');
      assert.equal(profile.schema_version, '1.0');
      assert.equal(profile.engine.id, 'unreal-5');
      assert.equal(profile.engine.name, 'Unreal Engine 5');
      assert.ok(profile.paradigms.primary_languages.includes('cpp'));
      assert.ok(profile.paradigms.primary_languages.includes('blueprint'));
    });

    it('caches repeated loads of the same engine', async () => {
      const a = await epm.load('unreal-5');
      const b = await epm.load('unreal-5');
      assert.strictEqual(a, b, 'Should return cached instance');
    });

    it('throws a clear error for unknown engine ids', async () => {
      const fresh = new EngineProfileManager();
      await assert.rejects(() => fresh.load('nope-9999'), /not found/);
    });

    it('loads the godot-4 profile', async () => {
      const fresh = new EngineProfileManager();
      const profile = await fresh.load('godot-4');
      assert.equal(profile.engine.id, 'godot-4');
      assert.equal(profile.engine.name, 'Godot 4');
      assert.ok(profile.paradigms.primary_languages.includes('gdscript'));
    });

    it('loads the unity-6 profile', async () => {
      const fresh = new EngineProfileManager();
      const profile = await fresh.load('unity-6');
      assert.equal(profile.engine.id, 'unity-6');
      assert.equal(profile.engine.name, 'Unity 6');
      assert.ok(profile.paradigms.primary_languages.includes('csharp'));
    });
  });

  describe('listAvailable()', () => {
    it('includes unreal-5 as available', async () => {
      const list = await epm.listAvailable();
      const unreal = list.find((e) => e.id === 'unreal-5');
      assert.ok(unreal);
      assert.equal(unreal.available, true);
    });

    it('includes godot-4 as available (Sprint post-5 — engine expansion)', async () => {
      const list = await epm.listAvailable();
      const godot = list.find((e) => e.id === 'godot-4');
      assert.ok(godot);
      assert.equal(godot.available, true);
    });

    it('includes unity-6 as available (Sprint post-5 — engine expansion)', async () => {
      const list = await epm.listAvailable();
      const unity = list.find((e) => e.id === 'unity-6');
      assert.ok(unity);
      assert.equal(unity.available, true);
    });

    it('skips the _shared directory', async () => {
      const list = await epm.listAvailable();
      assert.ok(!list.some((e) => e.id.startsWith('_')));
    });
  });

  describe('getTemplateHints()', () => {
    it('returns the planning_template_hints for an engine', async () => {
      const fresh = new EngineProfileManager();
      const hints = await fresh.getTemplateHints('unreal-5');
      assert.equal(hints.preferred_for_core_logic, 'cpp');
      assert.equal(hints.preferred_for_designer_tunables, 'blueprint');
      assert.ok(hints.story_implementation_note_template);
    });

    it('returns hints for godot-4', async () => {
      const fresh = new EngineProfileManager();
      const hints = await fresh.getTemplateHints('godot-4');
      assert.equal(hints.preferred_for_core_logic, 'gdscript');
    });

    it('returns hints for unity-6', async () => {
      const fresh = new EngineProfileManager();
      const hints = await fresh.getTemplateHints('unity-6');
      assert.equal(hints.preferred_for_core_logic, 'csharp');
    });
  });
});
