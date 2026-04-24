import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { AgentCompiler } from '../../tools/installer/lib/agent-compiler.js';
import { createSandbox } from '../helpers/sandbox.js';
import { assertIncludes } from '../helpers/assertions.js';

describe('AgentCompiler', () => {
  let compiler;
  let sandbox;

  before(async () => {
    compiler = new AgentCompiler();
    sandbox = await createSandbox('agent-compiler');
  });

  after(async () => {
    await sandbox.cleanup();
  });

  describe('validate()', () => {
    it('accepts a minimal valid agent', () => {
      const agent = {
        metadata: { name: 'Test', title: 'Test Agent' },
        persona: { role: 'Testing' },
        menu: [{ trigger: 'ok', description: 'ok' }]
      };
      const result = compiler.validate(agent);
      assert.equal(result.valid, true, `Errors: ${result.errors.join(', ')}`);
    });

    it('reports missing metadata section', () => {
      const result = compiler.validate({});
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('metadata')));
    });

    it('reports missing persona section', () => {
      const result = compiler.validate({
        metadata: { name: 'X', title: 'X' }
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('persona')));
    });

    it('reports empty menu', () => {
      const result = compiler.validate({
        metadata: { name: 'X', title: 'X' },
        persona: { role: 'X' },
        menu: []
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.toLowerCase().includes('menu')));
    });
  });

  describe('generateMarkdown()', () => {
    const baseAgent = {
      metadata: {
        id: '_gdks/design/agents/example.md',
        name: 'Example',
        title: 'Example Agent',
        icon: '🎯',
        module: 'design'
      },
      persona: {
        role: 'Example Role',
        identity: 'I am an example agent for testing.',
        communication_style: 'Friendly',
        principles: ['Be clear', 'Be helpful']
      },
      critical_actions: ['Read docs first'],
      memories: ['Output goes to _gdks-output/'],
      menu: [
        { trigger: 'hello', description: 'Say hello', workflow: '{module}/hello/workflow.yaml' },
        { trigger: 'bye', description: 'Say bye', action: '#farewell' }
      ]
    };

    it('renders the name as the H1 heading', () => {
      const md = compiler.generateMarkdown(baseAgent);
      assertIncludes(md, '# Example');
    });

    it('includes the persona role and identity', () => {
      const md = compiler.generateMarkdown(baseAgent);
      assertIncludes(md, 'Example Role');
      assertIncludes(md, 'I am an example agent');
    });

    it('includes the menu commands with asterisk triggers', () => {
      const md = compiler.generateMarkdown(baseAgent);
      assertIncludes(md, '`*hello`');
      assertIncludes(md, '`*bye`');
      assertIncludes(md, '`*help`');
      assertIncludes(md, '`*chat`');
    });

    it('lists principles when provided', () => {
      const md = compiler.generateMarkdown(baseAgent);
      assertIncludes(md, 'Be clear');
      assertIncludes(md, 'Be helpful');
    });

    it('lists critical actions when provided', () => {
      const md = compiler.generateMarkdown(baseAgent);
      assertIncludes(md, 'Read docs first');
      assertIncludes(md, 'critical_actions');
    });

    it('lists memories when provided', () => {
      const md = compiler.generateMarkdown(baseAgent);
      assertIncludes(md, '_gdks-output/');
      assertIncludes(md, 'memories');
    });

    it('omits optional sections when absent', () => {
      const minimal = {
        metadata: { name: 'Mini', title: 'Minimal', icon: '🤏', module: 'core' },
        persona: { role: 'Minimal Role', identity: 'Tiny agent.' },
        menu: [{ trigger: 'ok', description: 'Just ok' }]
      };
      const md = compiler.generateMarkdown(minimal);
      // Should not include sections that weren't provided
      assert.ok(!md.includes('Critical Actions'), 'Should omit Critical Actions');
      assert.ok(!md.includes('## Memories'), 'Should omit Memories');
      // But core sections must still be there
      assertIncludes(md, '# Mini');
      assertIncludes(md, '## Persona');
      assertIncludes(md, '## Commands');
    });
  });

  describe('compile()', () => {
    it('compiles a YAML file on disk to a Markdown file', async () => {
      const inputDir = join(sandbox.path, 'agents');
      await mkdir(inputDir, { recursive: true });

      const inputPath = join(inputDir, 'test.agent.yaml');
      const outputPath = join(inputDir, 'test.md');

      const yamlContent = `metadata:
  id: "_gdks/design/agents/test.md"
  name: "Roundtrip"
  title: "Roundtrip Agent"
  icon: "🔁"
  module: "design"
persona:
  role: "Roundtrip Role"
  identity: "Compiled from YAML."
menu:
  - trigger: "go"
    description: "Do the thing"
`;

      await writeFile(inputPath, yamlContent, 'utf8');
      await compiler.compile(inputPath, outputPath);

      const md = await readFile(outputPath, 'utf8');
      assertIncludes(md, '# Roundtrip');
      assertIncludes(md, 'Roundtrip Role');
      assertIncludes(md, '`*go`');
    });
  });
});
