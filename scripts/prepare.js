/**
 * GD-KS Prepare Script
 * 
 * Runs during npm install to set up the package
 */

import { chmod } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function prepare() {
  try {
    // Make bin file executable
    const binPath = join(__dirname, '..', 'bin', 'gd-ks.js');
    await chmod(binPath, '755');
    console.log('✓ Made bin/gd-ks.js executable');
  } catch (error) {
    // Ignore errors on Windows
    if (error.code !== 'ENOENT') {
      console.warn('Warning: Could not set permissions on bin file');
    }
  }
}

prepare();
