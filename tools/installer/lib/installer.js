/**
 * GD-KS Installer
 * Main installation logic
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ModuleManager } from './module-manager.js';
import { FileManager } from './file-manager.js';
import { AgentCompiler } from './agent-compiler.js';
import { ManifestGenerator } from './manifest-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to IDE configs
const IDE_CONFIGS_PATH = join(__dirname, '..', '..', '..', 'src', 'ide-configs');

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

      // Step 8: Install IDE configuration
      if (this.config.ide && this.config.ide !== 'none') {
        progressCallback(`Installing ${this.config.ide} configuration...`);
        await this.installIdeConfig();
      }

      return {
        success: true,
        gdksDir: this.gdksDir,
        outputDir: this.outputDir,
        ide: this.config.ide
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
        communication_language: this.config.language || 'en',
        ide: this.config.ide || 'cursor'
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
        outputFolder: this.config.outputFolder,
        ide: this.config.ide
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
   * Install IDE-specific configuration files
   */
  async installIdeConfig() {
    const ide = this.config.ide || 'cursor';
    
    switch (ide) {
    case 'cursor':
      await this.installCursorConfig();
      break;
    case 'windsurf':
      await this.installWindsurfConfig();
      break;
    case 'vscode':
      await this.installVSCodeConfig();
      break;
    case 'claude-code':
      await this.installClaudeCodeConfig();
      break;
    default:
      // No IDE config to install
      break;
    }
  }

  /**
   * Install Cursor IDE configuration
   */
  async installCursorConfig() {
    const cursorRulesDir = join(this.targetDir, '.cursor', 'rules', 'gdks');
    await this.fileManager.ensureDir(cursorRulesDir);

    // Copy all .mdc files from cursor config
    const sourceDir = join(IDE_CONFIGS_PATH, 'cursor', 'rules');
    
    if (await this.fileManager.exists(sourceDir)) {
      const files = await this.fileManager.listFiles(sourceDir, '.mdc');
      
      for (const file of files) {
        await this.fileManager.copy(
          join(sourceDir, file),
          join(cursorRulesDir, file)
        );
      }
    }
  }

  /**
   * Install Windsurf IDE configuration
   */
  async installWindsurfConfig() {
    const windsurfDir = join(this.targetDir, '.windsurf');
    await this.fileManager.ensureDir(windsurfDir);

    const sourceFile = join(IDE_CONFIGS_PATH, 'windsurf', 'gdks-rules.md');
    
    if (await this.fileManager.exists(sourceFile)) {
      await this.fileManager.copy(
        sourceFile,
        join(windsurfDir, 'gdks-rules.md')
      );
    }
  }

  /**
   * Install VS Code configuration
   */
  async installVSCodeConfig() {
    const vscodeDir = join(this.targetDir, '.vscode');
    await this.fileManager.ensureDir(vscodeDir);

    // Copy settings and README
    const sourceDir = join(IDE_CONFIGS_PATH, 'vscode');
    
    if (await this.fileManager.exists(sourceDir)) {
      const files = await this.fileManager.listFiles(sourceDir);
      
      for (const file of files) {
        await this.fileManager.copy(
          join(sourceDir, file),
          join(vscodeDir, file.replace('gdks-', ''))
        );
      }
    }
  }

  /**
   * Install Claude Code configuration
   */
  async installClaudeCodeConfig() {
    const claudeDir = join(this.targetDir, '.claude', 'commands', 'gdks');
    await this.fileManager.ensureDir(claudeDir);

    const sourceDir = join(IDE_CONFIGS_PATH, 'claude-code', 'commands');
    
    if (await this.fileManager.exists(sourceDir)) {
      const files = await this.fileManager.listFiles(sourceDir, '.md');
      
      for (const file of files) {
        await this.fileManager.copy(
          join(sourceDir, file),
          join(claudeDir, file)
        );
      }
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
