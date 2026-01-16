/**
 * GD-KS Installer
 * Main installation logic
 */

import { join } from 'path';
import { ModuleManager } from './module-manager.js';
import { FileManager } from './file-manager.js';
import { AgentCompiler } from './agent-compiler.js';
import { ManifestGenerator } from './manifest-generator.js';

export class Installer {
  constructor(options = {}) {
    this.targetDir = options.targetDir || process.cwd();
    this.gdksDir = join(this.targetDir, '_gdks');
    this.outputDir = join(this.targetDir, options.outputFolder || '_gdks-output');
    this.config = options;
    
    this.fileManager = new FileManager();
    this.moduleManager = new ModuleManager();
    this.agentCompiler = new AgentCompiler();
    this.manifestGenerator = new ManifestGenerator();
  }

  /**
   * Run the installation
   */
  async install(progressCallback = () => {}) {
    try {
      // Step 1: Create directory structure
      progressCallback('Creating directory structure...');
      await this.createDirectoryStructure();

      // Step 2: Install core module (always required)
      progressCallback('Installing core module...');
      await this.installModule('core');

      // Step 3: Install selected modules
      const modules = this.config.modules || [];
      for (const moduleName of modules) {
        if (moduleName !== 'core') {
          progressCallback(`Installing ${moduleName} module...`);
          await this.installModule(moduleName);
        }
      }

      // Step 4: Compile all agents
      progressCallback('Compiling agents...');
      await this.compileAgents();

      // Step 5: Create configuration files
      progressCallback('Creating configuration files...');
      await this.createConfigFiles();

      // Step 6: Generate manifest
      progressCallback('Generating manifest...');
      await this.generateManifest();

      // Step 7: Create output directories
      progressCallback('Creating output directories...');
      await this.createOutputDirectories();

      return {
        success: true,
        gdksDir: this.gdksDir,
        outputDir: this.outputDir
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create the main directory structure
   */
  async createDirectoryStructure() {
    const directories = [
      this.gdksDir,
      join(this.gdksDir, 'core'),
      join(this.gdksDir, 'core', 'agents'),
      join(this.gdksDir, 'core', 'workflows'),
      join(this.gdksDir, '_memory'),
      join(this.gdksDir, '_config')
    ];

    for (const dir of directories) {
      await this.fileManager.ensureDir(dir);
    }
  }

  /**
   * Install a specific module
   */
  async installModule(moduleName) {
    const moduleSource = this.moduleManager.getModulePath(moduleName);
    const moduleTarget = join(this.gdksDir, moduleName);

    await this.fileManager.ensureDir(moduleTarget);
    await this.moduleManager.installModule(moduleName, moduleTarget);
  }

  /**
   * Compile all agents from YAML to MD
   */
  async compileAgents() {
    const modules = ['core', ...(this.config.modules || [])];
    
    for (const moduleName of modules) {
      const agentsDir = join(this.gdksDir, moduleName, 'agents');
      await this.agentCompiler.compileAll(agentsDir, this.config);
    }
  }

  /**
   * Create configuration files
   */
  async createConfigFiles() {
    // Project config
    const projectConfig = {
      project: {
        name: this.config.projectName || 'My Game Project',
        version: '0.1.0'
      },
      settings: {
        output_folder: this.config.outputFolder || '_gdks-output',
        communication_language: this.config.language || 'en'
      },
      modules: {
        installed: ['core', ...(this.config.modules || [])]
      }
    };

    await this.fileManager.writeYaml(
      join(this.gdksDir, '_config', 'project-config.yaml'),
      projectConfig
    );
  }

  /**
   * Generate installation manifest
   */
  async generateManifest() {
    const manifest = this.manifestGenerator.generate({
      version: this.config.installerVersion || '0.1.0-alpha.1',
      installedAt: new Date().toISOString(),
      modules: ['core', ...(this.config.modules || [])],
      config: {
        projectName: this.config.projectName,
        language: this.config.language,
        outputFolder: this.config.outputFolder
      }
    });

    await this.fileManager.writeYaml(
      join(this.gdksDir, '_config', 'manifest.yaml'),
      manifest
    );
  }

  /**
   * Create output directories for generated documents
   */
  async createOutputDirectories() {
    const outputDirs = [
      this.outputDir,
      join(this.outputDir, '01-ideation'),
      join(this.outputDir, '02-design'),
      join(this.outputDir, '03-planning'),
      join(this.outputDir, '04-engine')
    ];

    for (const dir of outputDirs) {
      await this.fileManager.ensureDir(dir);
    }

    // Create .gitkeep files
    for (const dir of outputDirs.slice(1)) {
      await this.fileManager.writeFile(join(dir, '.gitkeep'), '');
    }
  }

  /**
   * Check if GD-KS is already installed
   */
  async isInstalled() {
    return this.fileManager.exists(this.gdksDir);
  }

  /**
   * Get installed version from manifest
   */
  async getInstalledVersion() {
    const manifestPath = join(this.gdksDir, '_config', 'manifest.yaml');
    if (await this.fileManager.exists(manifestPath)) {
      const manifest = await this.fileManager.readYaml(manifestPath);
      return manifest.version;
    }
    return null;
  }
}
