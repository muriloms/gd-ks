/**
 * GD-KS Version
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = require(join(__dirname, '..', 'package.json'));

export const version = packageJson.version;
export const name = packageJson.name;
export const description = packageJson.description;
