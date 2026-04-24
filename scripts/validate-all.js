#!/usr/bin/env node
/**
 * validate-all.js
 *
 * Run the schema validator over every YAML file in src/.
 * Exits non-zero if any file fails validation.
 *
 * Usage:
 *   node scripts/validate-all.js
 *   node scripts/validate-all.js --verbose
 */

import { runCli } from '../tools/validator/validator.js';

await runCli([...process.argv.slice(2)]);
