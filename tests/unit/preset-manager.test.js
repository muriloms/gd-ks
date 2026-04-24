import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { PresetManager } from '../../src/core/presets/preset-manager.js';

describe('PresetManager', () => {
  let pm;

  before(() => {
    pm = new PresetManager();
  });

  describe('load()', () => {
    it('loads the solo-indie preset', async () => {
      const p = await pm.load('solo-indie');
      assert.equal(p.schema_version, '1.0');
      assert.equal(p.preset.id, 'solo-indie');
      assert.equal(p.preset.name, 'Solo Indie Developer');
      assert.ok(Array.isArray(p.modules_enabled));
    });

    it('caches repeated loads', async () => {
      const a = await pm.load('minimal');
      const b = await pm.load('minimal');
      assert.strictEqual(a, b);
    });

    it('throws for unknown presets', async () => {
      const fresh = new PresetManager();
      await assert.rejects(() => fresh.load('nonexistent'), /not found/);
    });

    it('loads all 7 canonical presets', async () => {
      const ids = ['minimal', 'solo-indie', 'small-studio', 'studio', 'narrative-heavy', 'mobile-casual', 'custom'];
      for (const id of ids) {
        const p = await pm.load(id);
        assert.equal(p.preset.id, id, `Mismatch for ${id}`);
      }
    });
  });

  describe('list()', () => {
    it('returns all 7 presets with metadata', async () => {
      const list = await pm.list();
      assert.equal(list.length, 7);
      for (const p of list) {
        assert.ok(p.id);
        assert.ok(p.name);
        assert.ok(typeof p.agent_count === 'number');
      }
    });
  });

  describe('isAgentActive()', () => {
    it('returns true for agents explicitly active in module', async () => {
      const p = await pm.load('solo-indie');
      assert.equal(pm.isAgentActive(p, 'design', 'game-design-director'), true);
    });

    it('returns false for agents in disabled list', async () => {
      const p = await pm.load('solo-indie');
      assert.equal(pm.isAgentActive(p, 'ideation', 'market-analyst'), false);
    });

    it('returns false for agents not listed at all', async () => {
      const p = await pm.load('solo-indie');
      assert.equal(pm.isAgentActive(p, 'design', 'fictional-agent'), false);
    });
  });

  describe('getActiveAgents()', () => {
    it('returns flat list of all active agents across modules', async () => {
      const p = await pm.load('minimal');
      const agents = pm.getActiveAgents(p);
      assert.ok(agents.includes('gdks-master'));
      assert.ok(agents.includes('concept-brainstormer'));
      assert.ok(!agents.includes('marketing-strategist'));
    });

    it('studio preset has the most agents', async () => {
      const studio = await pm.load('studio');
      const minimal = await pm.load('minimal');
      assert.ok(pm.getActiveAgents(studio).length > pm.getActiveAgents(minimal).length);
    });

    it('respects agents_disabled list', async () => {
      const p = await pm.load('solo-indie');
      const agents = pm.getActiveAgents(p);
      for (const d of p.agents_disabled || []) {
        assert.ok(!agents.includes(d), `Disabled agent ${d} leaked into active list`);
      }
    });
  });

  describe('enableAgent() / disableAgent()', () => {
    it('enableAgent adds to active and removes from disabled', async () => {
      const p = await pm.load('solo-indie');
      const next = pm.enableAgent(p, 'ideation', 'market-analyst');
      assert.ok(next.agents_active.ideation.includes('market-analyst'));
      assert.ok(!next.agents_disabled.includes('market-analyst'));
    });

    it('disableAgent removes from active and adds to disabled', async () => {
      const p = await pm.load('solo-indie');
      const next = pm.disableAgent(p, 'design', 'game-design-director');
      assert.ok(!next.agents_active.design.includes('game-design-director'));
      assert.ok(next.agents_disabled.includes('game-design-director'));
    });

    it('does not mutate the input preset (deep clone)', async () => {
      const p = await pm.load('solo-indie');
      const before = JSON.stringify(p);
      pm.enableAgent(p, 'ideation', 'market-analyst');
      assert.equal(JSON.stringify(p), before);
    });

    it('is idempotent', async () => {
      const p = await pm.load('solo-indie');
      const once = pm.disableAgent(p, 'design', 'narrative-designer');
      const twice = pm.disableAgent(once, 'design', 'narrative-designer');
      assert.deepEqual(twice.agents_disabled.sort(), once.agents_disabled.sort());
    });
  });
});
