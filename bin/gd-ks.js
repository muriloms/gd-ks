#!/usr/bin/env node

/**
 * GD-KS CLI Entry Point
 * Game Development Knowledge System
 * 
 * Usage:
 *   npx gd-ks install    - Install GD-KS in current project
 *   npx gd-ks --help     - Show help
 *   npx gd-ks --version  - Show version
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import CLI
async function main() {
  try {
    const cli = await import(join(__dirname, '..', 'src', 'cli', 'index.js'));
    await cli.default();
  } catch (error) {
    console.error('Error starting GD-KS:', error.message);
    process.exit(1);
  }
}

main();
