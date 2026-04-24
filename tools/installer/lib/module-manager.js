/**
 * GD-KS Module Manager
 * Handles module installation and management.
 *
 * v0.4 Sprint 3: supports the new `engines/<engine-id>/` layout in
 * addition to the legacy `modules/engine/` path. When asked for
 * module `engine`, resolves to `modules/engines/unreal-5/` by default
 * (or whatever `targetEngine` was configured).
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileManager } from './file-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to source modules
const SRC_ROOT = join(__dirname, '..', '..', '..', 'src');

// Default engine when 'engine' is requested without an explicit mapping
const DEFAULT_ENGINE = 'unreal-5';

// Engines marked as available for the installer picker.
// Entries can have `available: false` to signal placeholder engines (godot, unity).
const KNOWN_ENGINES = {
  'unreal-5': { name: 'Unreal Engine 5', available: true },
  'godot-4': { name: 'Godot 4', available: true },
  'unity-6': { name: 'Unity 6', available: true }
};

export class ModuleManager {
  constructor(options = {}) {
    this.fileManager = new FileManager();
    this.srcRoot = options.srcRoot || SRC_ROOT;
    this.targetEngine = options.targetEngine || DEFAULT_ENGINE;
  }

  /**
   * Get the source path for a module. Supports both legacy and
   * engine-agnostic layouts.
   *
   * - `core` → src/core/
   * - `engine` → src/modules/engines/<targetEngine>/ (with fallback to legacy engine/)
   * - any id of the form `engines/<engine-id>` → src/modules/engines/<engine-id>/
   * - anything else → src/modules/<moduleName>/
   */
  getModulePath(moduleName) {
    if (moduleName === 'core') {
      return join(this.srcRoot, 'core');
    }

    // Engine-agnostic: 'engine' resolves to the configured engine
    if (moduleName === 'engine') {
      return join(this.srcRoot, 'modules', 'engines', this.targetEngine);
    }

    // Explicit engine selection: 'engines/unreal-5'
    if (moduleName.startsWith('engines/')) {
      return join(this.srcRoot, 'modules', moduleName);
    }

    return join(this.srcRoot, 'modules', moduleName);
  }

  /**
   * List known engines.
   */
  static getKnownEngines() {
    return { ...KNOWN_ENGINES };
  }

  /**
   * List engines that are actually implemented (available=true).
   */
  static getAvailableEngines() {
    return Object.entries(KNOWN_ENGINES)
      .filter(([, info]) => info.available)
      .map(([id, info]) => ({ id, ...info }));
  }

  /**
   * Get module configuration
   */
  async getModuleConfig(moduleName) {
    const modulePath = this.getModulePath(moduleName);
    const configPath = join(modulePath, 'module.yaml');
    
    if (await this.fileManager.exists(configPath)) {
      return await this.fileManager.readYaml(configPath);
    }
    
    return {
      name: moduleName,
      version: '0.1.0',
      description: `${moduleName} module`
    };
  }

  /**
   * Install a module to target directory
   */
  async installModule(moduleName, targetDir) {
    const sourcePath = this.getModulePath(moduleName);
    
    // Check if source exists
    if (!await this.fileManager.exists(sourcePath)) {
      throw new Error(`Module source not found: ${moduleName}`);
    }

    // Copy module files
    await this.copyModuleFiles(sourcePath, targetDir, moduleName);
  }

  /**
   * Copy module files to target
   */
  async copyModuleFiles(sourcePath, targetDir, _moduleName) {
    // Ensure target directories exist
    await this.fileManager.ensureDir(join(targetDir, 'agents'));
    await this.fileManager.ensureDir(join(targetDir, 'workflows'));

    // Copy module.yaml if exists
    const moduleYamlSource = join(sourcePath, 'module.yaml');
    if (await this.fileManager.exists(moduleYamlSource)) {
      await this.fileManager.copy(
        moduleYamlSource,
        join(targetDir, 'module.yaml')
      );
    }

    // Copy agents
    const agentsSource = join(sourcePath, 'agents');
    if (await this.fileManager.exists(agentsSource)) {
      await this.copyAgents(agentsSource, join(targetDir, 'agents'));
    }

    // Copy workflows
    const workflowsSource = join(sourcePath, 'workflows');
    if (await this.fileManager.exists(workflowsSource)) {
      await this.fileManager.copyDir(workflowsSource, join(targetDir, 'workflows'));
    }

    // Copy knowledge base if exists (for engine module)
    const knowledgeSource = join(sourcePath, 'knowledge');
    if (await this.fileManager.exists(knowledgeSource)) {
      await this.fileManager.copyDir(knowledgeSource, join(targetDir, 'knowledge'));
    }

    // Copy templates if exists
    const templatesSource = join(sourcePath, 'templates');
    if (await this.fileManager.exists(templatesSource)) {
      await this.fileManager.copyDir(templatesSource, join(targetDir, 'templates'));
    }

    // Copy data if exists (game types, etc)
    const dataSource = join(sourcePath, 'data');
    if (await this.fileManager.exists(dataSource)) {
      await this.fileManager.copyDir(dataSource, join(targetDir, 'data'));
    }
  }

  /**
   * Copy agent files (YAML sources)
   */
  async copyAgents(sourcePath, targetDir) {
    const files = await this.fileManager.listFiles(sourcePath, '.yaml');
    
    for (const file of files) {
      await this.fileManager.copy(
        join(sourcePath, file),
        join(targetDir, file)
      );
    }

    // Also copy .md files if they exist (pre-compiled)
    const mdFiles = await this.fileManager.listFiles(sourcePath, '.md');
    for (const file of mdFiles) {
      await this.fileManager.copy(
        join(sourcePath, file),
        join(targetDir, file)
      );
    }
  }

  /**
   * Get list of available modules
   */
  async getAvailableModules() {
    return [
      {
        name: 'core',
        displayName: 'Core',
        description: 'Essential system (always installed)',
        required: true
      },
      {
        name: 'ideation',
        displayName: 'Ideation Team',
        description: 'Brainstorming, concept development (4 agents)',
        required: false
      },
      {
        name: 'design',
        displayName: 'Design Team',
        description: 'GDD, level design, narrative, art, audio (7 agents)',
        required: false
      },
      {
        name: 'planning',
        displayName: 'Planning Team',
        description: 'Sprint planning, epics, stories (4 agents)',
        required: false
      },
      {
        name: 'engine',
        displayName: 'Engine Team',
        description: 'Engine-specific implementation (Godot 4 · Unity 6 · Unreal Engine 5)',
        required: false
      }
    ];
  }
}
