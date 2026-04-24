/**
 * GD-KS Contract Loader
 *
 * Loads handoff contract YAML files from `_gdks/_contracts/`.
 * Contracts define what a phase must deliver before advancing.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileManager } from '../../../tools/installer/lib/file-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTRACTS_RELATIVE_PATH = join('_gdks', '_contracts');

// Fallback: source contracts shipped with the package (for install-time copy)
const PACKAGE_CONTRACTS_DIR = join(__dirname, '..', '..', '..', 'src', 'core', 'contracts');

export class ContractLoader {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.contractsDir = join(this.projectRoot, CONTRACTS_RELATIVE_PATH);
    this.fileManager = new FileManager();
  }

  /**
   * Load a contract by (from_phase, to_phase).
   * Throws if not found.
   */
  async load(fromPhase, toPhase) {
    const filename = this._filename(fromPhase, toPhase);
    const userPath = join(this.contractsDir, filename);

    if (await this.fileManager.exists(userPath)) {
      return this.fileManager.readYaml(userPath);
    }

    // Fall back to packaged default
    const packagedPath = join(PACKAGE_CONTRACTS_DIR, filename);
    if (await this.fileManager.exists(packagedPath)) {
      return this.fileManager.readYaml(packagedPath);
    }

    throw new Error(`Contract not found: ${filename}. Looked in ${this.contractsDir} and ${PACKAGE_CONTRACTS_DIR}`);
  }

  /**
   * List all contracts available in the user's project.
   */
  async listUserContracts() {
    try {
      const { readdir } = await import('fs/promises');
      const entries = await readdir(this.contractsDir);
      return entries.filter((e) => e.endsWith('.contract.yaml'));
    } catch {
      return [];
    }
  }

  _filename(from, to) {
    return `phase-${String(from).padStart(2, '0')}-to-${String(to).padStart(2, '0')}.contract.yaml`;
  }

  /**
   * Path (in the package) of default contracts. Used by installer to copy them in.
   */
  static getPackageContractsDir() {
    return PACKAGE_CONTRACTS_DIR;
  }
}
