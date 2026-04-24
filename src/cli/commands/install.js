/**
 * GD-KS Install Command
 * 
 * Handles the installation of GD-KS into a project
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Installer } from '../../../tools/installer/index.js';

// Read version dynamically from package.json (fixes v0.3 hardcoded-version bug)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_PATH = join(__dirname, '..', '..', '..', 'package.json');
const PKG_VERSION = JSON.parse(readFileSync(PKG_PATH, 'utf8')).version;

// Available modules with descriptions
const MODULES = {
  core: {
    name: 'Core',
    description: 'Essential system (always installed)',
    required: true
  },
  ideation: {
    name: 'Ideation Team',
    description: 'Brainstorming, concept development',
    required: false
  },
  design: {
    name: 'Design Team',
    description: 'GDD, level design, narrative, art, audio',
    required: false
  },
  planning: {
    name: 'Planning Team',
    description: 'Sprint planning, epics, stories',
    required: false
  },
  engine: {
    name: 'Engine Team',
    description: 'Engine-specific implementation (chosen next)',
    required: false
  }
};

/**
 * Display welcome banner
 */
function showWelcome() {
  console.log('');
  console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.white.bold('            Welcome to GD-KS Installation Wizard                  ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.gray('         AI-powered, multi-engine game dev framework              ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.gray('           Unreal Engine 5 · Godot 4 · Unity 6                    ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝'));
  console.log('');
  console.log(chalk.gray(`  Installing into: ${chalk.white(process.cwd())}`));
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
      preset: 'solo-indie',
      modules: ['core', 'ideation', 'design', 'planning', 'engine'],
      outputFolder: '_gdks-output',
      language: 'en',
      targetEngine: 'unreal-5',
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
      type: 'list',
      name: 'preset',
      message: '🎯 What best describes your project?',
      choices: [
        { name: '🎮 Solo Indie (1-2 devs)           ~16 agents', value: 'solo-indie' },
        { name: '🏢 Small Studio (3-10 devs)        ~23 agents', value: 'small-studio' },
        { name: '🏛️  Full Studio (10+ devs, AAA)      32 agents', value: 'studio' },
        { name: '📖 Narrative-Heavy (RPG, VN)       ~20 agents', value: 'narrative-heavy' },
        { name: '📱 Mobile Casual / F2P             ~17 agents', value: 'mobile-casual' },
        { name: '⚡ Minimal (hobby / game jam)       ~8 agents', value: 'minimal' },
        { name: '🎛️  Custom (all active, tune later)  32 agents', value: 'custom' }
      ],
      default: 'solo-indie'
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
      type: 'list',
      name: 'targetEngine',
      message: '🎮 Which game engine will you use?',
      choices: [
        { name: '🎬 Unreal Engine 5       5 agents  (C++ · Blueprint · GAS)', value: 'unreal-5' },
        { name: '🟢 Godot 4              4 agents  (GDScript · Scenes · Signals)', value: 'godot-4' },
        { name: '⬛ Unity 6              4 agents  (C# · Prefabs · ScriptableObjects)', value: 'unity-6' },
        { name: '🌐 Engine-agnostic       (design & planning only)', value: 'agnostic' }
      ],
      default: 'unreal-5',
      when: (answers) => answers.modules && answers.modules.includes('engine')
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
    preset: config.preset || 'custom',
    targetEngine: config.targetEngine || 'unreal-5',
    installerVersion: PKG_VERSION
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
    await showInstallationSummary(config, result);

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
async function showInstallationSummary(config, result) {
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  // Count real agent files installed per module
  const moduleCounts = {};
  let totalAgents = 0;
  for (const mod of config.modules) {
    const agentsDir = join(result.gdksDir, mod, 'agents');
    try {
      const entries = await readdir(agentsDir);
      const count = entries.filter((f) => f.endsWith('.agent.yaml')).length;
      moduleCounts[mod] = count;
      totalAgents += count;
    } catch {
      moduleCounts[mod] = 0;
    }
  }

  // Human labels for preset + engine
  const presetLabels = {
    'minimal': '⚡ Minimal',
    'solo-indie': '🎮 Solo Indie',
    'small-studio': '🏢 Small Studio',
    'studio': '🏛️  Full Studio',
    'narrative-heavy': '📖 Narrative-Heavy',
    'mobile-casual': '📱 Mobile Casual',
    'custom': '🎛️  Custom'
  };
  const engineLabels = {
    'unreal-5': '🎬 Unreal Engine 5',
    'godot-4': '🟢 Godot 4',
    'unity-6': '⬛ Unity 6',
    'agnostic': '🌐 Engine-agnostic'
  };

  console.log('');
  console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.white.bold('                    Installation Summary                          ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝'));
  console.log('');

  // Project configuration -----------------------------------------------------
  console.log(chalk.white('  📋 Project Configuration'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(`     ${chalk.cyan('Project:')}     ${config.projectName}`);
  console.log(`     ${chalk.cyan('Location:')}    ${result.gdksDir}`);
  console.log(`     ${chalk.cyan('Output:')}      ${result.outputDir}`);
  console.log(`     ${chalk.cyan('Language:')}    ${config.language}`);
  console.log(`     ${chalk.cyan('Preset:')}      ${presetLabels[config.preset] || config.preset || 'custom'}`);
  if (config.targetEngine) {
    console.log(`     ${chalk.cyan('Engine:')}      ${engineLabels[config.targetEngine] || config.targetEngine}`);
  }
  console.log(`     ${chalk.cyan('IDE:')}         ${config.ide || 'none'}`);
  console.log('');

  // Installed modules ---------------------------------------------------------
  console.log(chalk.white('  📦 Installed Modules'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));

  for (const mod of config.modules) {
    const module = MODULES[mod] || { name: mod };
    const count = moduleCounts[mod] || 0;
    const label = count === 1 ? 'agent' : 'agents';
    console.log(`     ${chalk.green('✓')} ${module.name.padEnd(20)} ${chalk.gray(`(${count} ${label})`)}`);
  }
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(`     ${chalk.white.bold('Total:')} ${chalk.green.bold(totalAgents)} agents ready`);
  console.log('');

  // IDE configuration ---------------------------------------------------------
  if (config.ide && config.ide !== 'none') {
    console.log(chalk.white('  🖥️  IDE Configuration'));
    console.log(chalk.gray('  ─────────────────────────────────────────────────────'));

    const ideInfo = {
      'cursor':      { folder: '.cursor/rules/gdks/',     activation: 'Rules auto-apply when editing _gdks/ files' },
      'windsurf':    { folder: '.windsurf/',              activation: 'Load gdks-rules.md in AI context' },
      'vscode':      { folder: '.vscode/',                activation: 'See README.md for setup instructions' },
      'claude-code': { folder: '.claude/commands/gdks/',  activation: 'Use /gdks commands' }
    };

    const info = ideInfo[config.ide];
    if (info) {
      console.log(`     ${chalk.cyan('Config folder:')} ${info.folder}`);
      console.log(`     ${chalk.cyan('Activation:')}    ${info.activation}`);
    }
    console.log('');
  }

  // Next steps ---------------------------------------------------------------
  console.log(chalk.white('  🚀 Next Steps'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));

  if (config.ide === 'cursor') {
    console.log(`     ${chalk.cyan('1.')} Open this project in ${chalk.cyan('Cursor')}`);
    console.log(`     ${chalk.cyan('2.')} GD-KS rules auto-apply when editing ${chalk.yellow('_gdks/')} files`);
    console.log(`     ${chalk.cyan('3.')} Open ${chalk.yellow('_gdks/core/agents/gdks-master.md')} in chat`);
    console.log(`     ${chalk.cyan('4.')} Try ${chalk.yellow('*tutorial')} for a 15-min guided walkthrough`);
  } else {
    console.log(`     ${chalk.cyan('1.')} Open your project in ${chalk.cyan('Cursor')}, ${chalk.cyan('Windsurf')}, or ${chalk.cyan('VS Code')}`);
    console.log(`     ${chalk.cyan('2.')} Add ${chalk.yellow('_gdks/core/agents/gdks-master.md')} to your AI context`);
    console.log(`     ${chalk.cyan('3.')} Try ${chalk.yellow('*tutorial')} for a 15-min guided walkthrough`);
    console.log(`     ${chalk.cyan('4.')} Or type ${chalk.yellow('*init')} to start your real project`);
  }
  console.log('');

  // Quick reference -----------------------------------------------------------
  console.log(chalk.white('  💡 Quick Reference'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(`     ${chalk.white('In your IDE chat:')}`);
  console.log(`       ${chalk.yellow('*tutorial')}  15-min guided walkthrough`);
  console.log(`       ${chalk.yellow('*help')}      Show available commands`);
  console.log(`       ${chalk.yellow('*teams')}     View all teams and agents`);
  console.log(`       ${chalk.yellow('*status')}    Check workflow progress`);
  console.log('');
  console.log(`     ${chalk.white('In your terminal:')}`);
  console.log(`       ${chalk.yellow('gd-ks state show')}        Inspect project state`);
  console.log(`       ${chalk.yellow('gd-ks preset show')}       Inspect active preset`);
  console.log(`       ${chalk.yellow('gd-ks validate --phase=1')} Check handoff readiness`);
  console.log(`       ${chalk.yellow('gd-ks tutorial')}          Bootstrap tutorial sandbox`);
  console.log('');

  console.log(chalk.gray('  ─────────────────────────────────────────────────────'));
  console.log(chalk.gray(`  Documentation: ${chalk.cyan('https://github.com/muriloms/gd-ks')}`));
  console.log(chalk.gray(`  Issues:        ${chalk.cyan('https://github.com/muriloms/gd-ks/issues')}`));
  console.log('');
}
