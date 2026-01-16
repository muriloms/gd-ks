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

  // Parse arguments
  await program.parseAsync(process.argv);

  // Show help if no command provided
  if (process.argv.length <= 2) {
    console.log(banner);
    program.help();
  }
}
