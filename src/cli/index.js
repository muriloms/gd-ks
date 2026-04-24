/**
 * GD-KS CLI
 * Game Development Knowledge System
 * 
 * Main CLI entry point using Commander.js
 */

import { Command } from 'commander';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const packageJson = require(join(__dirname, '..', '..', 'package.json'));

// ASCII Art Banner
const banner = `
   ██████╗ ██████╗       ██╗  ██╗███████╗
  ██╔════╝ ██╔══██╗      ██║ ██╔╝██╔════╝
  ██║  ███╗██║  ██║█████╗█████╔╝ ███████╗
  ██║   ██║██║  ██║╚════╝██╔═██╗ ╚════██║
  ╚██████╔╝██████╔╝      ██║  ██╗███████║
   ╚═════╝ ╚═════╝       ╚═╝  ╚═╝╚══════╝
  
  Game Development Knowledge System
  Build Games, Not Documents
`;

export default async function cli() {
  const program = new Command();

  program
    .name('gd-ks')
    .description('Game Development Knowledge System - AI-powered framework for game development')
    .version(packageJson.version, '-v, --version', 'Display version number')
    .addHelpText('before', banner);

  // Install command
  program
    .command('install')
    .description('Install GD-KS in the current project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .option('--modules <modules>', 'Comma-separated list of modules to install', 'all')
    .action(async (options) => {
      try {
        const { install } = await import('./commands/install.js');
        await install(options);
      } catch (error) {
        console.error('Installation failed:', error.message);
        process.exit(1);
      }
    });

  // Build command (for compiling agents)
  program
    .command('build [agent]')
    .description('Compile agents (all or specific agent)')
    .action(async (agent) => {
      try {
        const { build } = await import('./commands/build.js');
        await build(agent);
      } catch (error) {
        console.error('Build failed:', error.message);
        process.exit(1);
      }
    });

  // Info command
  program
    .command('info')
    .description('Display information about installed GD-KS')
    .action(async () => {
      try {
        const { info } = await import('./commands/info.js');
        await info();
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  // State command (Sprint 2)
  program
    .command('state <subcommand> [text]')
    .description('Inspect or manage project state (show|history|decision|question|context)')
    .option('--phase <n>', 'Filter by phase number (for show)')
    .option('--last <n>', 'Number of history entries to show', '20')
    .option('--by <agent>', 'Agent making the decision')
    .option('--from <agent>', 'Agent asking the question')
    .option('--to <target>', 'Who the question is directed at')
    .action(async (subcommand, text, options) => {
      try {
        const { state } = await import('./commands/state.js');
        await state(subcommand, { ...options, text });
      } catch (error) {
        console.error('State error:', error.message);
        process.exit(1);
      }
    });

  // Validate command (Sprint 2)
  program
    .command('validate')
    .description('Validate that the current phase is ready for handoff')
    .option('--phase <n>', 'Phase to validate (defaults to current_phase)')
    .option('--from <n>', 'Explicit from phase')
    .option('--to <n>', 'Explicit to phase')
    .action(async (options) => {
      try {
        const { validate } = await import('./commands/validate.js');
        await validate(options);
      } catch (error) {
        console.error('Validate error:', error.message);
        process.exit(1);
      }
    });

  // Handoff command (Sprint 2)
  program
    .command('handoff')
    .description('Execute a phase handoff (requires contract check to pass, or --force)')
    .requiredOption('--from <n>', 'Source phase')
    .requiredOption('--to <n>', 'Target phase')
    .option('--dry-run', 'Check contract but do not mutate state')
    .option('--force', 'Override contract check (with warning)')
    .action(async (options) => {
      try {
        const { handoff } = await import('./commands/handoff.js');
        await handoff(options);
      } catch (error) {
        console.error('Handoff error:', error.message);
        process.exit(1);
      }
    });

  // Preset command (Sprint 4)
  program
    .command('preset <subcommand> [text]')
    .description('Manage active preset (show|list|switch|enable-agent|disable-agent)')
    .option('--module <id>', 'Target module for enable-agent/disable-agent', 'design')
    .action(async (subcommand, text, options) => {
      try {
        const { preset } = await import('./commands/preset.js');
        await preset(subcommand, { ...options, text });
      } catch (error) {
        console.error('Preset error:', error.message);
        process.exit(1);
      }
    });

  // Rollback command (Sprint 4 bonus)
  program
    .command('rollback')
    .description('Restore project state from a checkpoint')
    .option('--to <filename>', 'Specific checkpoint filename')
    .option('--phase <n>', 'Latest checkpoint for a phase')
    .option('--dry-run', 'Preview changes without applying')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (options) => {
      try {
        const { rollback } = await import('./commands/rollback.js');
        await rollback(options);
      } catch (error) {
        console.error('Rollback error:', error.message);
        process.exit(1);
      }
    });

  // Tutorial command (Sprint 5)
  program
    .command('tutorial')
    .description('Launch the guided tutorial (prepares sandbox; then type *tutorial in your IDE)')
    .option('--reset', 'Clear previous tutorial state and sandbox')
    .option('--info', 'Print the tutorial syllabus without setting up')
    .action(async (options) => {
      try {
        const { tutorial } = await import('./commands/tutorial.js');
        await tutorial(options);
      } catch (error) {
        console.error('Tutorial error:', error.message);
        process.exit(1);
      }
    });

  // Parse arguments
  await program.parseAsync(process.argv);

  // Show help if no command provided
  if (process.argv.length <= 2) {
    console.log(banner);
    program.help();
  }
}
