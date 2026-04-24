/**
 * GD-KS Engine Profile Manager
 *
 * Loads the `engine-profile.yaml` of the engine configured for a project.
 * The profile is a read-only description consumed by planning templates
 * (`{{#engine unreal-5}}...{{/engine}}`) and by the installer to validate
 * engine selection.
 *
 * Introduced in v0.4 Sprint 3 (Engine-Agnostic Layer).
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileManager } from '../../../tools/installer/lib/file-manager.js';
import { SchemaValidator } from '../../../tools/validator/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PACKAGE_ENGINES_ROOT = join(__dirname, '..', '..', 'modules', 'engines');

export class EngineProfileManager {
  constructor(options = {}) {
    this.enginesRoot = options.enginesRoot || PACKAGE_ENGINES_ROOT;
    this.fileManager = new FileManager();
    this._validator = null;
    this._cache = new Map();
  }

  async _getValidator() {
    if (!this._validator) {
      this._validator = new SchemaValidator();
      await this._validator.load();
    }
    return this._validator;
  }

  /**
   * Return the profile of an engine by id. Caches in-memory.
   * Throws if the profile is missing OR fails schema validation.
   */
  async load(engineId) {
    if (this._cache.has(engineId)) return this._cache.get(engineId);

    const profilePath = join(this.enginesRoot, engineId, 'engine-profile.yaml');
    if (!(await this.fileManager.exists(profilePath))) {
      throw new Error(`Engine profile not found for "${engineId}" at ${profilePath}`);
    }

    const profile = await this.fileManager.readYaml(profilePath);

    const validator = await this._getValidator();
    const result = validator.validate('engine-profile', profile);
    if (!result.valid) {
      throw new Error(
        `Invalid engine profile for "${engineId}":\n${result.errors.join('\n')}`
      );
    }

    this._cache.set(engineId, profile);
    return profile;
  }

  /**
   * List engine ids that have a valid profile on disk.
   */
  async listAvailable() {
    if (!(await this.fileManager.exists(this.enginesRoot))) return [];

    const entries = await this.fileManager.listFiles(this.enginesRoot);
    // listFiles only returns files at the top level; we need directories
    const { readdir } = await import('fs/promises');
    const dirs = await readdir(this.enginesRoot, { withFileTypes: true });
    const results = [];
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      if (d.name.startsWith('_')) continue; // skip _shared
      const profilePath = join(this.enginesRoot, d.name, 'engine-profile.yaml');
      if (await this.fileManager.exists(profilePath)) {
        try {
          const p = await this.load(d.name);
          results.push({ id: d.name, name: p.engine?.name || d.name, available: true });
        } catch {
          results.push({ id: d.name, name: d.name, available: false });
        }
      } else {
        // placeholder directory (godot-4, unity-6)
        results.push({ id: d.name, name: d.name, available: false });
      }
    }
    return results;
    void entries; // keep interface stable
  }

  /**
   * Shortcut: return just the planning template hints for an engine id.
   * Returns an empty object if no hints are defined.
   */
  async getTemplateHints(engineId) {
    const profile = await this.load(engineId);
    return profile.planning_template_hints || {};
  }
}
