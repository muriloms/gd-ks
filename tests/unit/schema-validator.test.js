import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { SchemaValidator } from '../../tools/validator/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, '..', 'fixtures');
const PROJECT_ROOT = join(__dirname, '..', '..');

describe('SchemaValidator', () => {
  let validator;

  before(async () => {
    validator = new SchemaValidator();
    await validator.load();
  });

  describe('agent schema', () => {
    it('accepts a well-formed agent fixture', async () => {
      const result = await validator.validateFile('agent', join(FIXTURES, 'valid-agent.yaml'));
      assert.equal(
        result.valid,
        true,
        `Expected valid agent to pass. Errors:\n${result.errors.join('\n')}`
      );
    });

    it('rejects the broken agent fixture', async () => {
      const result = await validator.validateFile('agent', join(FIXTURES, 'invalid-agent.yaml'));
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0, 'Expected at least one error');
    });

    it('rejects an empty object', () => {
      const result = validator.validate('agent', {});
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('metadata') || e.includes('required')));
    });

    it('rejects an agent id that does not match the pattern', () => {
      const result = validator.validate('agent', {
        metadata: {
          id: 'totally/wrong.txt',
          name: 'X',
          title: 'X Agent',
          icon: '🤖',
          module: 'design'
        },
        persona: {
          role: 'Role',
          identity: 'x'.repeat(60)
        },
        menu: [{ trigger: 'ok', description: 'do something' }]
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('pattern') || e.includes('id')));
    });

    it('rejects a menu trigger starting with asterisk', () => {
      const result = validator.validate('agent', {
        metadata: {
          id: '_gdks/design/agents/x.md',
          name: 'XX',
          title: 'X Agent',
          icon: '🤖',
          module: 'design'
        },
        persona: { role: 'Role', identity: 'x'.repeat(60) },
        menu: [{ trigger: '*ping', description: 'with asterisk is wrong' }]
      });
      assert.equal(result.valid, false);
    });
  });

  describe('workflow schema', () => {
    it('accepts the valid workflow fixture', async () => {
      const result = await validator.validateFile('workflow', join(FIXTURES, 'valid-workflow.yaml'));
      assert.equal(
        result.valid,
        true,
        `Expected valid workflow to pass. Errors:\n${result.errors.join('\n')}`
      );
    });

    it('rejects the invalid workflow fixture', async () => {
      const result = await validator.validateFile('workflow', join(FIXTURES, 'invalid-workflow.yaml'));
      assert.equal(result.valid, false);
      assert.ok(result.errors.length >= 2, `Expected multiple errors, got: ${result.errors.join('; ')}`);
    });
  });

  describe('module schema', () => {
    it('validates existing real module.yaml files', async () => {
      const modulesDir = join(PROJECT_ROOT, 'src', 'modules');
      const results = await validator.validateDirectory('module', modulesDir, /^module\.yaml$/);
      assert.ok(results.length >= 4, `Expected at least 4 module.yaml files, got ${results.length}`);
      const failures = results.filter((r) => !r.valid);
      assert.equal(
        failures.length,
        0,
        `Real module files should validate. Failures:\n${failures
          .map((f) => `${f.file}: ${f.errors.join('; ')}`)
          .join('\n')}`
      );
    });
  });

  describe('project-state schema (forward compat)', () => {
    it('accepts a minimal valid state object', () => {
      const result = validator.validate('project-state', {
        schema_version: '1.0',
        project: {
          id: 'my-game',
          name: 'My Game',
          created_at: '2026-04-20T10:00:00Z'
        }
      });
      assert.equal(
        result.valid,
        true,
        `Expected minimal state to pass. Errors:\n${result.errors.join('\n')}`
      );
    });

    it('rejects a state with wrong schema_version', () => {
      const result = validator.validate('project-state', {
        schema_version: '0.9',
        project: { id: 'x', name: 'X', created_at: '2026-04-20T10:00:00Z' }
      });
      assert.equal(result.valid, false);
    });

    it('rejects a bad project id', () => {
      const result = validator.validate('project-state', {
        schema_version: '1.0',
        project: { id: 'Bad ID With Spaces', name: 'X', created_at: '2026-04-20T10:00:00Z' }
      });
      assert.equal(result.valid, false);
    });
  });

  describe('reliability', () => {
    it('throws if validate() is called before load()', () => {
      const fresh = new SchemaValidator();
      assert.throws(() => fresh.validate('agent', {}), /not loaded/i);
    });

    it('throws for unknown schema name', () => {
      assert.throws(() => validator.validate('nonexistent', {}), /Unknown schema/);
    });
  });
});
