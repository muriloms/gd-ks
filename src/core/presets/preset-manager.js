/**
 * GD-KS Preset Manager
 *
 * Loads preset YAML files, filters agents based on active preset,
 * and supports runtime preset switching and per-agent toggles.
 *
 * Introduced in v0.4 Sprint 4.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileManager } from '../../../tools/installer/lib/file-manager.js';
import { SchemaValidator } from '../../../tools/validator/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PACKAGE_PRESETS_DIR = join(__dirname, '..', '..', '_config', 'presets');

export class PresetManager {
  constructor(options = {}) {
    this.presetsDir = options.presetsDir || PACKAGE_PRESETS_DIR;
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
   * Load a preset by id. Throws if missing or invalid.
   */
  async load(presetId) {
    if (this._cache.has(presetId)) return this._cache.get(presetId);

    const path = join(this.presetsDir, `${presetId}.preset.yaml`);
    if (!(await this.fileManager.exists(path))) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const preset = await this.fileManager.readYaml(path);
    const validator = await this._getValidator();
    const result = validator.validate('preset', preset);
    if (!result.valid) {
      throw new Error(`Invalid preset "${presetId}":\n${result.errors.join('\n')}`);
    }

    this._cache.set(presetId, preset);
    return preset;
  }

  /**
   * List all available presets with metadata.
   */
  async list() {
    const files = await this.fileManager.listFiles(this.presetsDir, '.preset.yaml');
    const results = [];
    for (const f of files) {
      const id = f.replace(/\.preset\.yaml$/, '');
      try {
        const p = await this.load(id);
        results.push({
          id: p.preset.id,
          name: p.preset.name,
          description: p.preset.description,
          icon: p.preset.icon,
          agent_count: this._countAgents(p)
        });
      } catch {
        // skip invalid
      }
    }
    return results;
  }

  /**
   * Test whether a specific agent is active in a preset.
   */
  isAgentActive(preset, moduleId, agentId) {
    if (preset.agents_disabled && preset.agents_disabled.includes(agentId)) {
      return false;
    }
    const active = preset.agents_active?.[moduleId] || [];
    return active.includes(agentId);
  }

  /**
   * Return the flat list of all active agent ids across all modules.
   */
  getActiveAgents(preset) {
    const out = [];
    for (const ids of Object.values(preset.agents_active || {})) {
      out.push(...ids);
    }
    const disabled = new Set(preset.agents_disabled || []);
    return out.filter((a) => !disabled.has(a));
  }

  /**
   * Count total active agents (for UI display).
   */
  _countAgents(preset) {
    return this.getActiveAgents(preset).length;
  }

  /**
   * Given a preset and an agent id, enable it (add to active, remove from disabled).
   * Returns the mutated preset (caller can save it).
   */
  enableAgent(preset, moduleId, agentId) {
    const next = JSON.parse(JSON.stringify(preset));
    // Remove from disabled
    next.agents_disabled = (next.agents_disabled || []).filter((a) => a !== agentId);
    // Add to active[moduleId]
    next.agents_active = next.agents_active || {};
    next.agents_active[moduleId] = next.agents_active[moduleId] || [];
    if (!next.agents_active[moduleId].includes(agentId)) {
      next.agents_active[moduleId].push(agentId);
    }
    return next;
  }

  /**
   * Given a preset and an agent id, disable it (remove from active, add to disabled).
   */
  disableAgent(preset, moduleId, agentId) {
    const next = JSON.parse(JSON.stringify(preset));
    next.agents_active = next.agents_active || {};
    next.agents_active[moduleId] = (next.agents_active[moduleId] || []).filter(
      (a) => a !== agentId
    );
    next.agents_disabled = next.agents_disabled || [];
    if (!next.agents_disabled.includes(agentId)) {
      next.agents_disabled.push(agentId);
    }
    return next;
  }
}
