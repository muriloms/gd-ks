/**
 * GD-KS Checkpoint Manager
 *
 * Saves snapshots of the project state when a phase is completed.
 * Checkpoints live at `_gdks/_state/checkpoints/phase-NN-*.yaml`.
 *
 * Purpose:
 *   - Allows rolling back to a known-good state if a later phase breaks things
 *   - Provides audit trail separate from the rolling event log
 *   - Gives each phase a "frozen" snapshot that contracts can reference
 */

import { join } from 'path';
import { readdir } from 'fs/promises';
import { FileManager } from '../../../tools/installer/lib/file-manager.js';

const CHECKPOINTS_RELATIVE_PATH = join('_gdks', '_state', 'checkpoints');

export class CheckpointManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.checkpointsDir = join(this.projectRoot, CHECKPOINTS_RELATIVE_PATH);
    this.fileManager = new FileManager();
  }

  /**
   * Save a snapshot of the state for a given phase.
   * Returns the full path to the written file.
   */
  async save(phaseNumber, state, { label } = {}) {
    if (![1, 2, 3, 4].includes(phaseNumber)) {
      throw new Error(`Invalid phase: ${phaseNumber}`);
    }
    await this.fileManager.ensureDir(this.checkpointsDir);

    const phaseNames = {
      1: 'ideation',
      2: 'design',
      3: 'planning',
      4: 'engine'
    };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = label ? `-${label}` : '';
    const name = `phase-${String(phaseNumber).padStart(2, '0')}-${phaseNames[phaseNumber]}-${timestamp}${suffix}.yaml`;

    const snapshot = {
      _checkpoint: {
        phase: phaseNumber,
        phase_name: phaseNames[phaseNumber],
        created_at: new Date().toISOString(),
        label: label || null
      },
      state
    };

    const path = join(this.checkpointsDir, name);
    await this.fileManager.writeYaml(path, snapshot);
    return path;
  }

  /**
   * List all checkpoints, newest first.
   */
  async list({ phase } = {}) {
    try {
      const entries = await readdir(this.checkpointsDir);
      let files = entries.filter((e) => e.endsWith('.yaml')).sort().reverse();
      if (phase != null) {
        const prefix = `phase-${String(phase).padStart(2, '0')}-`;
        files = files.filter((f) => f.startsWith(prefix));
      }
      return files;
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  /**
   * Load a checkpoint by filename.
   */
  async load(filename) {
    const path = join(this.checkpointsDir, filename);
    return this.fileManager.readYaml(path);
  }

  /**
   * Get the most recent checkpoint for a given phase (or overall if phase is omitted).
   */
  async latest({ phase } = {}) {
    const list = await this.list({ phase });
    if (list.length === 0) return null;
    return this.load(list[0]);
  }
}
