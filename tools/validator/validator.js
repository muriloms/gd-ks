/**
 * GD-KS Schema Validator
 *
 * Validates YAML files against JSON Schemas.
 * Introduced in v0.4 (Sprint 1) to catch structural drift across agents/workflows/modules.
 */

import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { readFile, readdir } from 'fs/promises';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_DIR = join(__dirname, 'schema');

/**
 * SchemaValidator - loads all schemas once and validates multiple payloads.
 */
export class SchemaValidator {
  constructor(options = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      verbose: options.verbose ?? false
    });
    addFormats(this.ajv);
    this.schemas = {};
    this.ready = false;
  }

  async load() {
    if (this.ready) return;

    const schemaFiles = {
      agent: 'agent.schema.json',
      workflow: 'workflow.schema.json',
      module: 'module.schema.json',
      'project-state': 'project-state.schema.json',
      contract: 'contract.schema.json',
      'engine-profile': 'engine-profile.schema.json',
      preset: 'preset.schema.json'
    };

    for (const [key, file] of Object.entries(schemaFiles)) {
      const raw = await readFile(join(SCHEMA_DIR, file), 'utf8');
      const schema = JSON.parse(raw);
      this.schemas[key] = this.ajv.compile(schema);
    }

    this.ready = true;
  }

  /**
   * Validate an already-parsed object against a named schema.
   * Returns { valid, errors }.
   */
  validate(schemaName, data) {
    if (!this.ready) {
      throw new Error('SchemaValidator not loaded. Call load() first.');
    }
    const validator = this.schemas[schemaName];
    if (!validator) {
      throw new Error(`Unknown schema: ${schemaName}`);
    }

    const valid = validator(data);
    return {
      valid,
      errors: valid ? [] : (validator.errors || []).map(formatError)
    };
  }

  /**
   * Read a YAML file from disk and validate against a schema.
   */
  async validateFile(schemaName, filePath) {
    let data;
    try {
      const raw = await readFile(filePath, 'utf8');
      data = yaml.load(raw);
    } catch (err) {
      return {
        valid: false,
        errors: [`Failed to load YAML: ${err.message}`],
        file: filePath
      };
    }

    if (data == null) {
      return {
        valid: false,
        errors: ['YAML file is empty'],
        file: filePath
      };
    }

    const result = this.validate(schemaName, data);
    return { ...result, file: filePath };
  }

  /**
   * Recursively find and validate all files matching a pattern in a directory.
   */
  async validateDirectory(schemaName, dir, filenamePattern) {
    const results = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        const subResults = await this.validateDirectory(schemaName, full, filenamePattern);
        results.push(...subResults);
      } else if (filenamePattern.test(entry.name)) {
        const r = await this.validateFile(schemaName, full);
        results.push(r);
      }
    }

    return results;
  }
}

function formatError(err) {
  const path = err.instancePath || '(root)';
  return `${path}: ${err.message}${err.params ? ' ' + JSON.stringify(err.params) : ''}`;
}

/**
 * Convenience: singleton loader for one-off validations.
 */
let _singleton = null;
export async function getValidator() {
  if (!_singleton) {
    _singleton = new SchemaValidator();
    await _singleton.load();
  }
  return _singleton;
}

/**
 * Run as CLI: node tools/validator/validator.js --type=agent [--path=src/...]
 */
export async function runCli(argv) {
  const args = parseArgs(argv);
  const projectRoot = resolve(__dirname, '..', '..');

  const validator = await getValidator();

  const plans = [];

  if (!args.type || args.type === 'all' || args.type === 'agent') {
    plans.push({
      schemaName: 'agent',
      dir: args.path || join(projectRoot, 'src'),
      pattern: /\.agent\.yaml$/
    });
  }

  if (!args.type || args.type === 'all' || args.type === 'workflow') {
    plans.push({
      schemaName: 'workflow',
      dir: args.path || join(projectRoot, 'src'),
      pattern: /^workflow\.yaml$/
    });
  }

  if (!args.type || args.type === 'all' || args.type === 'module') {
    plans.push({
      schemaName: 'module',
      dir: args.path || join(projectRoot, 'src'),
      pattern: /^module\.yaml$/
    });
  }

  if (!args.type || args.type === 'all' || args.type === 'engine-profile') {
    plans.push({
      schemaName: 'engine-profile',
      dir: args.path || join(projectRoot, 'src'),
      pattern: /^engine-profile\.yaml$/
    });
  }

  if (!args.type || args.type === 'all' || args.type === 'contract') {
    plans.push({
      schemaName: 'contract',
      dir: args.path || join(projectRoot, 'src'),
      pattern: /\.contract\.yaml$/
    });
  }

  if (!args.type || args.type === 'all' || args.type === 'preset') {
    plans.push({
      schemaName: 'preset',
      dir: args.path || join(projectRoot, 'src'),
      pattern: /\.preset\.yaml$/
    });
  }

  let failures = 0;
  let total = 0;

  for (const plan of plans) {
    const results = await validator.validateDirectory(plan.schemaName, plan.dir, plan.pattern);
    total += results.length;
    for (const r of results) {
      if (!r.valid) {
        failures++;
        console.error(`\n✗ [${plan.schemaName}] ${r.file}`);
        for (const e of r.errors) console.error(`    - ${e}`);
      } else if (args.verbose) {
        console.log(`✓ [${plan.schemaName}] ${r.file}`);
      }
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} file(s) failed validation out of ${total}.`);
    process.exit(1);
  } else {
    console.log(`\n✓ All ${total} file(s) passed validation.`);
  }
}

function parseArgs(argv) {
  const args = {};
  for (const a of argv) {
    const m = a.match(/^--([a-zA-Z0-9_-]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] ?? true;
  }
  return args;
}

// Allow direct CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
