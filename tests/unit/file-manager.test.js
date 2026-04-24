import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { FileManager } from '../../tools/installer/lib/file-manager.js';
import { createSandbox } from '../helpers/sandbox.js';
import { assertFileExists, assertDirExists } from '../helpers/assertions.js';

describe('FileManager', () => {
  let fm;
  let sandbox;

  before(async () => {
    fm = new FileManager();
    sandbox = await createSandbox('file-manager');
  });

  after(async () => {
    await sandbox.cleanup();
  });

  describe('ensureDir()', () => {
    it('creates a directory that does not exist', async () => {
      const dir = join(sandbox.path, 'new', 'nested', 'dir');
      await fm.ensureDir(dir);
      await assertDirExists(dir);
    });

    it('is idempotent when directory already exists', async () => {
      const dir = join(sandbox.path, 'repeat');
      await fm.ensureDir(dir);
      await fm.ensureDir(dir);
      await assertDirExists(dir);
    });
  });

  describe('exists()', () => {
    it('returns true for existing paths', async () => {
      const file = join(sandbox.path, 'exists.txt');
      await writeFile(file, 'hi');
      assert.equal(await fm.exists(file), true);
    });

    it('returns false for missing paths', async () => {
      assert.equal(await fm.exists(join(sandbox.path, 'nope.txt')), false);
    });
  });

  describe('writeFile() / readFile()', () => {
    it('writes and reads UTF-8 content roundtrip', async () => {
      const file = join(sandbox.path, 'subdir', 'hello.txt');
      await fm.writeFile(file, 'olá mundo 🌎');
      await assertFileExists(file);
      const content = await fm.readFile(file);
      assert.equal(content, 'olá mundo 🌎');
    });

    it('auto-creates parent directories', async () => {
      const file = join(sandbox.path, 'deep', 'deep', 'file.txt');
      await fm.writeFile(file, 'x');
      await assertFileExists(file);
    });
  });

  describe('writeYaml() / readYaml()', () => {
    it('writes and reads a YAML object roundtrip', async () => {
      const file = join(sandbox.path, 'data.yaml');
      const data = {
        name: 'test',
        modules: ['a', 'b'],
        nested: { key: 'value' }
      };
      await fm.writeYaml(file, data);
      const read = await fm.readYaml(file);
      assert.deepEqual(read, data);
    });
  });

  describe('copy()', () => {
    it('copies a file', async () => {
      const src = join(sandbox.path, 'src.txt');
      const dst = join(sandbox.path, 'copy-dst', 'dst.txt');
      await writeFile(src, 'content');
      await fm.copy(src, dst);
      assert.equal(await fm.readFile(dst), 'content');
    });
  });

  describe('copyDir()', () => {
    it('recursively copies a directory', async () => {
      const srcRoot = join(sandbox.path, 'src-tree');
      await mkdir(join(srcRoot, 'sub'), { recursive: true });
      await writeFile(join(srcRoot, 'a.txt'), 'A');
      await writeFile(join(srcRoot, 'sub', 'b.txt'), 'B');

      const dstRoot = join(sandbox.path, 'dst-tree');
      await fm.copyDir(srcRoot, dstRoot);

      assert.equal(await fm.readFile(join(dstRoot, 'a.txt')), 'A');
      assert.equal(await fm.readFile(join(dstRoot, 'sub', 'b.txt')), 'B');
    });
  });

  describe('listFiles()', () => {
    it('lists files with optional extension filter', async () => {
      const dir = join(sandbox.path, 'listdir');
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'one.yaml'), '');
      await writeFile(join(dir, 'two.yaml'), '');
      await writeFile(join(dir, 'three.md'), '');
      await mkdir(join(dir, 'subdir')); // should not appear

      const all = await fm.listFiles(dir);
      assert.equal(all.length, 3);

      const yamls = await fm.listFiles(dir, '.yaml');
      assert.deepEqual(yamls.sort(), ['one.yaml', 'two.yaml']);
    });

    it('returns empty array for missing directory', async () => {
      const result = await fm.listFiles(join(sandbox.path, 'does-not-exist'));
      assert.deepEqual(result, []);
    });
  });
});
