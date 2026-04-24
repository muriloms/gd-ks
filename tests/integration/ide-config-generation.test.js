/**
 * Integration test: every IDE option produces its config files in the right place.
 */

import { describe, it } from 'node:test';
import { join } from 'path';

import { Installer } from '../../tools/installer/index.js';
import { createSandbox } from '../helpers/sandbox.js';
import { assertDirExists, assertFileExists } from '../helpers/assertions.js';

async function installWithIde(ide) {
  const sb = await createSandbox(`ide-${ide}`);
  const installer = new Installer({
    targetDir: sb.path,
    projectName: `Test ${ide}`,
    modules: [], // minimal install
    language: 'en',
    outputFolder: '_gdks-output',
    ide,
    installerVersion: '0.4.0-alpha.1'
  });
  const result = await installer.install();
  return { sb, result };
}

describe('IDE config installation', () => {
  describe('cursor', () => {
    it('creates .cursor/rules/gdks/ with .mdc files', async () => {
      const { sb, result } = await installWithIde('cursor');
      try {
        if (!result.success) throw new Error(`Install failed: ${result.error}`);
        await assertDirExists(join(sb.path, '.cursor', 'rules', 'gdks'));
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('windsurf', () => {
    it('creates .windsurf/gdks-rules.md', async () => {
      const { sb, result } = await installWithIde('windsurf');
      try {
        if (!result.success) throw new Error(`Install failed: ${result.error}`);
        await assertFileExists(join(sb.path, '.windsurf', 'gdks-rules.md'));
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('vscode', () => {
    it('creates .vscode/ with configuration files', async () => {
      const { sb, result } = await installWithIde('vscode');
      try {
        if (!result.success) throw new Error(`Install failed: ${result.error}`);
        await assertDirExists(join(sb.path, '.vscode'));
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('claude-code', () => {
    it('creates .claude/commands/gdks/ with .md files', async () => {
      const { sb, result } = await installWithIde('claude-code');
      try {
        if (!result.success) throw new Error(`Install failed: ${result.error}`);
        await assertDirExists(join(sb.path, '.claude', 'commands', 'gdks'));
      } finally {
        await sb.cleanup();
      }
    });
  });

  describe('none', () => {
    it('does not create any IDE-specific folders', async () => {
      const { sb, result } = await installWithIde('none');
      try {
        if (!result.success) throw new Error(`Install failed: ${result.error}`);
        // Only _gdks and _gdks-output should be at the root. No .cursor/.vscode/etc
        const { readdir } = await import('fs/promises');
        const entries = await readdir(sb.path);
        const ideFolders = entries.filter((e) =>
          ['.cursor', '.windsurf', '.vscode', '.claude'].includes(e)
        );
        if (ideFolders.length > 0) {
          throw new Error(`Unexpected IDE folders created: ${ideFolders.join(', ')}`);
        }
      } finally {
        await sb.cleanup();
      }
    });
  });
});
