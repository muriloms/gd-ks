/**
 * GD-KS Module Manager
 * Handles module installation and management
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileManager } from './file-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to source modules
const SRC_ROOT = join(__dirname, '..', '..', '..', 'src');

export class ModuleManager {
  constructor() {
    this.fileManager = new FileManager();
    this.srcRoot = SRC_ROOT;
  }

  /**
   * Get the source path for a module
   */
  getModulePath(moduleName) {
    if (moduleName === 'core') {
      return join(this.srcRoot, 'core');
    }
    return join(this.srcRoot, 'modules', moduleName);
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
  async copyModuleFiles(sourcePath, targetDir, moduleName) {
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
        description: 'Unreal Engine 5 implementation (5 agents)',
        required: false
      }
    ];
  }
}
