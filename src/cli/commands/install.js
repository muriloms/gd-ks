/**
 * GD-KS Install Command
 * 
 * Handles the installation of GD-KS into a project
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { join } from 'path';
import { Installer } from '../../../tools/installer/index.js';

// Available modules with descriptions
const MODULES = {
  core: {
    name: 'Core',
    description: 'Essential system (always installed)',
    required: true,
    agents: ['gdks-master']
  },
  ideation: {
    name: 'Ideation Team',
    description: 'Brainstorming, concept development (4 agents)',
    required: false,
    agents: ['concept-brainstormer', 'market-analyst', 'mechanics-explorer', 'ideation-coordinator']
  },
  design: {
    name: 'Design Team',
    description: 'GDD, level design, narrative, art, audio (7 agents)',
    required: false,
    agents: ['game-design-director', 'level-designer', 'narrative-designer', 'technical-game-designer', 'art-director', 'audio-director', 'design-coordinator']
  },
  planning: {
    name: 'Planning Team',
    description: 'Sprint planning, epics, stories (4 agents)',
    required: false,
    agents: ['scrum-master', 'technical-producer', 'documentation-specialist', 'planning-coordinator']
  },
  engine: {
    name: 'Engine Team',
    description: 'Unreal Engine 5 implementation (5 agents)',
    required: false,
    agents: ['ue5-architect', 'ue5-programmer-lead', 'ue5-systems-specialist', 'ue5-blueprint-specialist', 'engine-coordinator']
  }
};

/**
 * Display welcome banner
 */
function showWelcome() {
  console.log('');
  console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.white.bold('            Welcome to GD-KS Installation Wizard                 ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.gray('            Game Development Knowledge System                     ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝'));
  console.log('');
}

/**
 * Check if GD-KS is already installed
 */
function checkExistingInstallation() {
  const gdksPath = join(process.cwd(), '_gdks');
  return existsSync(gdksPath);
}

/**
 * Prompt for project configuration
 */
async function promptConfiguration(options) {
  // Quick install with defaults
  if (options.yes) {
    return {
      projectName: 'My Game Project',
      modules: ['core', 'ideation', 'design', 'planning', 'engine'],
      outputFolder: '_gdks-output',
      language: 'en',
      confirm: true
    };
  }

  // Parse modules option if provided
  let preselectedModules = null;
  if (options.modules && options.modules !== 'all') {
    preselectedModules = options.modules.split(',').map(m => m.trim());
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: '🎮 What is your game project name?',
      default: 'My Game Project',
      validate: (input) => input.length > 0 || 'Project name is required'
    },
    {
      type: 'checkbox',
      name: 'modules',
      message: '📦 Which modules would you like to install?',
      choices: Object.entries(MODULES).map(([key, mod]) => ({
        name: `${mod.name} - ${mod.description}`,
        value: key,
        checked: preselectedModules ? preselectedModules.includes(key) : true,
        disabled: mod.required ? 'Required' : false
      })),
      validate: (input) => input.length > 0 || 'Select at least one module'
    },
    {
      type: 'list',
      name: 'language',
      message: '🌐 Preferred language for agent communication?',
      choices: [
        { name: 'English', value: 'en' },
        { name: 'Português (Brasil)', value: 'pt-BR' },
        { name: 'Español', value: 'es' }
      ],
      default: 'en'
    },
    {
      type: 'list',
      name: 'ide',
      message: '🖥️  Which IDE are you using?',
      choices: [
        { name: 'Cursor (recommended)', value: 'cursor' },
        { name: 'Windsurf', value: 'windsurf' },
        { name: 'VS Code (with Copilot/Continue)', value: 'vscode' },
        { name: 'Claude Code', value: 'claude-code' },
        { name: 'None / Other', value: 'none' }
      ],
      default: 'cursor'
    },
    {
      type: 'input',
      name: 'outputFolder',
      message: '📁 Output folder for generated documents?',
      default: '_gdks-output'
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: '🚀 Ready to install GD-KS?',
      default: true
    }
  ]);

  // Always include core
  if (!answers.modules.includes('core')) {
    answers.modules.unshift('core');
  }

  return answers;
}

/**
 * Main install function
 */
export async function install(options) {
  showWelcome();

  // Check for existing installation
  if (checkExistingInstallation()) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '⚠️  GD-KS is already installed. What would you like to do?',
        choices: [
          { name: '🔄 Update existing installation', value: 'update' },
          { name: '🗑️  Reinstall (will overwrite)', value: 'reinstall' },
          { name: '❌ Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (action === 'cancel') {
      console.log(chalk.yellow('\n⚠️  Installation cancelled.\n'));
      return;
    }

    if (action === 'update') {
      console.log(chalk.cyan('\n📦 Updating GD-KS...\n'));
    }
  }

  // Get configuration
  const config = await promptConfiguration(options);

  if (config.confirm === false) {
    console.log(chalk.yellow('\n⚠️  Installation cancelled.\n'));
    return;
  }

  console.log('');

  // Create installer instance
  const installer = new Installer({
    targetDir: process.cwd(),
    projectName: config.projectName,
    modules: config.modules,
    language: config.language,
    outputFolder: config.outputFolder,
    ide: config.ide,
    installerVersion: '0.1.0-alpha.1'
  });

  // Start installation with spinner
  const spinner = ora('Preparing installation...').start();

  try {
    const result = await installer.install((message) => {
      spinner.text = message;
    });

    if (!result.success) {
      spinner.fail(chalk.red(`Installation failed: ${result.error}`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('GD-KS installed successfully!'));

    // Show summary
    showInstallationSummary(config, result);

  } catch (error) {
    spinner.fail(chalk.red('Installation failed'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    
    if (options.verbose) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

/**
 * Show installation summary
 */
function showInstallationSummary(config, result) {
  console.log('');
  console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.white.bold('                    Installation Summary                          ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝'));
  console.log('');
  
  console.log(chalk.white('  📋 Project Configuration'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(`     ${chalk.cyan('Project:')}     ${config.projectName}`);
  console.log(`     ${chalk.cyan('Location:')}    ${result.gdksDir}`);
  console.log(`     ${chalk.cyan('Output:')}      ${result.outputDir}`);
  console.log(`     ${chalk.cyan('Language:')}    ${config.language}`);
  console.log(`     ${chalk.cyan('IDE:')}         ${config.ide || 'none'}`);
  console.log('');
  
  console.log(chalk.white('  📦 Installed Modules'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  
  let totalAgents = 0;
  for (const mod of config.modules) {
    const module = MODULES[mod];
    const agentCount = module.agents.length;
    totalAgents += agentCount;
    console.log(`     ${chalk.green('✓')} ${module.name.padEnd(20)} ${chalk.gray(`(${agentCount} agents)`)}`);
  }
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(`     ${chalk.white('Total:')} ${totalAgents} agents ready`);
  console.log('');

  // Show IDE-specific info
  if (config.ide && config.ide !== 'none') {
    console.log(chalk.white('  🖥️  IDE Configuration'));
    console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
    
    const ideInfo = {
      'cursor': { folder: '.cursor/rules/gdks/', activation: 'Rules auto-apply when editing _gdks/ files' },
      'windsurf': { folder: '.windsurf/', activation: 'Load gdks-rules.md in AI context' },
      'vscode': { folder: '.vscode/', activation: 'See README.md for setup instructions' },
      'claude-code': { folder: '.claude/commands/gdks/', activation: 'Use /gdks commands' }
    };
    
    const info = ideInfo[config.ide];
    if (info) {
      console.log(`     ${chalk.cyan('Config folder:')} ${info.folder}`);
      console.log(`     ${chalk.cyan('Activation:')}    ${info.activation}`);
    }
    console.log('');
  }
  
  console.log(chalk.white('  🚀 Next Steps'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  
  if (config.ide === 'cursor') {
    console.log(`     1. Open this project in ${chalk.cyan('Cursor')}`);
    console.log(`     2. The GD-KS rules will auto-apply for ${chalk.yellow('_gdks/')} files`);
    console.log(`     3. Open ${chalk.yellow('_gdks/core/agents/gdks-master.md')}`);
    console.log(`     4. Type ${chalk.yellow('*init')} in chat to start!`);
  } else {
    console.log(`     1. Open your project in ${chalk.cyan('Cursor')}, ${chalk.cyan('Windsurf')}, or ${chalk.cyan('VS Code')}`);
    console.log(`     2. Add ${chalk.yellow('_gdks/core/agents/gdks-master.md')} to your AI context`);
    console.log(`     3. Type ${chalk.yellow('*init')} to initialize your project`);
    console.log('     4. Follow the agent\'s guidance!');
  }
  console.log('');
  
  console.log(chalk.white('  💡 Quick Reference'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(`     ${chalk.yellow('*init')}      Initialize project and select track`);
  console.log(`     ${chalk.yellow('*status')}    Check workflow progress`);
  console.log(`     ${chalk.yellow('*teams')}     View all teams and agents`);
  console.log(`     ${chalk.yellow('*help')}      Show available commands`);
  console.log('');
  
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(chalk.gray(`  Documentation: ${chalk.cyan('https://github.com/mrlmoro/gd-ks')}`));
  console.log(chalk.gray(`  Issues: ${chalk.cyan('https://github.com/mrlmoro/gd-ks/issues')}`));
  console.log('');
}
