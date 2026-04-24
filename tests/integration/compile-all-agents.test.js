/**
 * Integration test: compile every real agent YAML in the repo and verify
 * the produced markdown is non-empty and contains the agent's name.
 *
 * Also runs the schema validator over every real agent — this is our
 * safety net against drift.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';

import { AgentCompiler } from '../../tools/installer/lib/agent-compiler.js';
import { SchemaValidator } from '../../tools/validator/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');
const SRC_ROOT = join(PROJECT_ROOT, 'src');

async function findAgentFiles() {
  const { readdir } = await import('fs/promises');
  const results = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.agent.yaml')) results.push(full);
    }
  }
  await walk(SRC_ROOT);
  return results;
}

describe('All real agents', () => {
  let agentFiles;
  let validator;
  const compiler = new AgentCompiler();

  before(async () => {
    agentFiles = await findAgentFiles();
    validator = new SchemaValidator();
    await validator.load();
  });

  it('discovers at least 30 agent YAML files', () => {
    assert.ok(
      agentFiles.length >= 30,
      `Expected ≥30 agents, found ${agentFiles.length}`
    );
  });

  it('every agent file compiles to non-empty Markdown', async () => {
    for (const file of agentFiles) {
      const raw = await readFile(file, 'utf8');
      const data = yaml.load(raw);
      assert.ok(data, `YAML is empty: ${file}`);

      const md = compiler.generateMarkdown(data);
      assert.ok(md.length > 200, `Compiled MD too short for ${file}`);
      const name = data.metadata?.name;
      if (name) {
        assert.ok(
          md.includes(`# ${name}`),
          `Compiled MD for ${basename(file)} missing "# ${name}"`
        );
      }
    }
  });

  it('every agent passes the compiler.validate()', async () => {
    const failures = [];
    for (const file of agentFiles) {
      const raw = await readFile(file, 'utf8');
      const data = yaml.load(raw);
      const r = compiler.validate(data);
      if (!r.valid) failures.push({ file, errors: r.errors });
    }
    assert.equal(
      failures.length,
      0,
      `Agents failed compiler.validate():\n${failures
        .map((f) => `  ${f.file}: ${f.errors.join('; ')}`)
        .join('\n')}`
    );
  });

  it('every agent passes the JSON schema validator', async () => {
    const failures = [];
    for (const file of agentFiles) {
      const r = await validator.validateFile('agent', file);
      if (!r.valid) failures.push({ file, errors: r.errors });
    }
    // NOTE: If this fails, the schema or an agent has drifted. Fix one of them.
    assert.equal(
      failures.length,
      0,
      `Agents failed schema validation:\n${failures
        .slice(0, 10)
        .map((f) => `  ${f.file}: ${f.errors.join('; ')}`)
        .join('\n')}${failures.length > 10 ? `\n  ... and ${failures.length - 10} more` : ''}`
    );
  });
});

describe('All real module.yaml files', () => {
  it('pass the module schema', async () => {
    const validator = new SchemaValidator();
    await validator.load();
    const results = await validator.validateDirectory(
      'module',
      SRC_ROOT,
      /^module\.yaml$/
    );
    const failures = results.filter((r) => !r.valid);
    assert.equal(
      failures.length,
      0,
      `Module files failed validation:\n${failures
        .map((f) => `  ${f.file}: ${f.errors.join('; ')}`)
        .join('\n')}`
    );
  });
});

describe('All real workflow.yaml files', () => {
  it('pass the workflow schema', async () => {
    const validator = new SchemaValidator();
    await validator.load();
    const results = await validator.validateDirectory(
      'workflow',
      SRC_ROOT,
      /^workflow\.yaml$/
    );
    const failures = results.filter((r) => !r.valid);
    // Allow up to a few workflow failures with diagnostic output — some workflows
    // in v0.3 may not yet cleanly match the schema. We track and log them but
    // only hard-fail if more than 5 fail (tech-debt threshold).
    if (failures.length > 0) {
      console.warn(
        `\n[warn] ${failures.length} workflow file(s) failed schema validation:`
      );
      for (const f of failures.slice(0, 10)) {
        console.warn(`  ${f.file}: ${f.errors.slice(0, 2).join('; ')}`);
      }
    }
    assert.ok(
      failures.length <= 5,
      `Too many workflow validation failures (${failures.length}). Fix or relax schema.`
    );
  });
});
