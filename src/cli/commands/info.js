/**
 * GD-KS Info Command
 * 
 * Displays information about the installed GD-KS
 */

import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Display GD-KS information
 */
export async function info() {
  const packageJson = require(join(__dirname, '..', '..', '..', 'package.json'));
  
  console.log('');
  console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.white.bold('                    GD-KS Information                        ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
  console.log('');

  // Package info
  console.log(chalk.white.bold('Package Information:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`  ${chalk.cyan('Name:')}        ${packageJson.name}`);
  console.log(`  ${chalk.cyan('Version:')}     ${packageJson.version}`);
  console.log(`  ${chalk.cyan('Description:')} ${packageJson.description}`);
  console.log(`  ${chalk.cyan('License:')}     ${packageJson.license}`);
  console.log('');

  // Check installation
  const gdksPath = join(process.cwd(), '_gdks');
  const isInstalled = existsSync(gdksPath);

  console.log(chalk.white.bold('Installation Status:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`  ${chalk.cyan('Current Directory:')} ${process.cwd()}`);
  
  if (isInstalled) {
    console.log(`  ${chalk.cyan('GD-KS Status:')}      ${chalk.green('✓ Installed')}`);
    
    // Try to read manifest
    const manifestPath = join(gdksPath, '_config', 'manifest.yaml');
    if (existsSync(manifestPath)) {
      console.log(`  ${chalk.cyan('Manifest:')}         ${chalk.green('✓ Found')}`);
    } else {
      console.log(`  ${chalk.cyan('Manifest:')}         ${chalk.yellow('⚠ Not found')}`);
    }
  } else {
    console.log(`  ${chalk.cyan('GD-KS Status:')}      ${chalk.yellow('Not installed')}`);
    console.log('');
    console.log(chalk.gray('  Run "npx gd-ks install" to install GD-KS in this directory.'));
  }

  console.log('');

  // Teams/Modules
  console.log(chalk.white.bold('Available Modules:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`  ${chalk.cyan('🧠 Ideation Team')}   - Brainstorming, concept development`);
  console.log(`  ${chalk.cyan('🎨 Design Team')}     - GDD, level design, art & audio`);
  console.log(`  ${chalk.cyan('📋 Planning Team')}   - Sprint planning, epics, stories`);
  console.log(`  ${chalk.cyan('⚙️  Engine Team')}     - Unreal Engine 5 implementation`);
  console.log('');

  // Links
  console.log(chalk.white.bold('Resources:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`  ${chalk.cyan('Documentation:')} https://github.com/YOUR_USERNAME/gd-ks`);
  console.log(`  ${chalk.cyan('Issues:')}        https://github.com/YOUR_USERNAME/gd-ks/issues`);
  console.log(`  ${chalk.cyan('NPM:')}           https://www.npmjs.com/package/gd-ks`);
  console.log('');
}
