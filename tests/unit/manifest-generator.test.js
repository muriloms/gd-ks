import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ManifestGenerator } from '../../tools/installer/lib/manifest-generator.js';

describe('ManifestGenerator', () => {
  const gen = new ManifestGenerator();

  describe('generate()', () => {
    it('produces a manifest with all required top-level keys', () => {
      const m = gen.generate();
      assert.ok(m.gdks_version);
      assert.ok(m.installed_at);
      assert.ok(m.updated_at);
      assert.ok(m.installation);
      assert.ok(m.modules);
      assert.ok(m.project);
      assert.ok(m.agents);
      assert.ok(m.tracking);
    });

    it('uses the provided version', () => {
      const m = gen.generate({ version: '0.4.0-alpha.1' });
      assert.equal(m.gdks_version, '0.4.0-alpha.1');
    });

    it('falls back to a default when version is not provided', () => {
      const m = gen.generate();
      assert.match(m.gdks_version, /^\d+\.\d+\.\d+/);
    });

    it('includes installation environment data', () => {
      const m = gen.generate();
      assert.equal(m.installation.node_version, process.version);
      assert.equal(m.installation.platform, process.platform);
      assert.equal(m.installation.arch, process.arch);
    });

    it('records selected modules and lists all available modules', () => {
      const m = gen.generate({ modules: ['core', 'design'] });
      assert.deepEqual(m.modules.installed, ['core', 'design']);
      assert.deepEqual(m.modules.available.sort(), [
        'core',
        'design',
        'engine',
        'ideation',
        'planning'
      ]);
    });

    it('stores project config', () => {
      const m = gen.generate({
        config: {
          projectName: 'My Metroidvania',
          language: 'pt-BR',
          outputFolder: '_out'
        }
      });
      assert.equal(m.project.name, 'My Metroidvania');
      assert.equal(m.project.language, 'pt-BR');
      assert.equal(m.project.output_folder, '_out');
    });
  });

  describe('update()', () => {
    it('merges new fields and refreshes updated_at', async () => {
      const original = gen.generate({ version: '0.3.0' });
      // Wait a tick so the timestamp can actually differ
      await new Promise((r) => setTimeout(r, 20));

      const updated = gen.update(original, {
        modules: { installed: ['core', 'ideation'], available: [] }
      });

      assert.equal(updated.gdks_version, '0.3.0');
      assert.deepEqual(updated.modules.installed, ['core', 'ideation']);
      assert.notEqual(updated.updated_at, original.updated_at);
    });
  });
});
