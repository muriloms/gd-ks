import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

import { ContractLoader } from '../../src/core/contracts/contract-loader.js';
import { createSandbox } from '../helpers/sandbox.js';

describe('ContractLoader', () => {
  let sandbox;
  let loader;

  beforeEach(async () => {
    sandbox = await createSandbox('contract-loader');
    loader = new ContractLoader({ projectRoot: sandbox.path });
  });

  afterEach(async () => {
    await sandbox.cleanup();
  });

  describe('load()', () => {
    it('loads a shipped default contract (fallback)', async () => {
      // No user contract in sandbox → should fall back to packaged contract
      const contract = await loader.load(1, 2);
      assert.equal(contract.from_phase, 1);
      assert.equal(contract.to_phase, 2);
      assert.ok(Array.isArray(contract.required_deliverables));
    });

    it('loads all three shipped contracts', async () => {
      const c1 = await loader.load(1, 2);
      const c2 = await loader.load(2, 3);
      const c3 = await loader.load(3, 4);
      assert.equal(c1.from_phase, 1);
      assert.equal(c2.from_phase, 2);
      assert.equal(c3.from_phase, 3);
    });

    it('prefers user-customized contract over default', async () => {
      const userContractsDir = join(sandbox.path, '_gdks', '_contracts');
      await mkdir(userContractsDir, { recursive: true });
      await writeFile(
        join(userContractsDir, 'phase-01-to-02.contract.yaml'),
        `schema_version: "1.0"
from_phase: 1
to_phase: 2
name: "CUSTOM User Contract"
required_deliverables:
  - id: custom-doc
    path_glob: "_gdks-output/custom.md"
`,
        'utf8'
      );

      const contract = await loader.load(1, 2);
      assert.equal(contract.name, 'CUSTOM User Contract');
      assert.equal(contract.required_deliverables[0].id, 'custom-doc');
    });

    it('throws a helpful error when contract is not found', async () => {
      // Phase 4→5 doesn't exist
      await assert.rejects(() => loader.load(4, 5), /Contract not found/);
    });
  });

  describe('listUserContracts()', () => {
    it('returns empty array when user contracts dir does not exist', async () => {
      const list = await loader.listUserContracts();
      assert.deepEqual(list, []);
    });

    it('lists .contract.yaml files from the user project', async () => {
      const userContractsDir = join(sandbox.path, '_gdks', '_contracts');
      await mkdir(userContractsDir, { recursive: true });
      await writeFile(join(userContractsDir, 'phase-01-to-02.contract.yaml'), 'x', 'utf8');
      await writeFile(join(userContractsDir, 'phase-02-to-03.contract.yaml'), 'x', 'utf8');
      await writeFile(join(userContractsDir, 'irrelevant.txt'), 'x', 'utf8');

      const list = await loader.listUserContracts();
      assert.equal(list.length, 2);
      assert.ok(list.every((f) => f.endsWith('.contract.yaml')));
    });
  });

  describe('getPackageContractsDir()', () => {
    it('returns an absolute path to the packaged contracts directory', () => {
      const dir = ContractLoader.getPackageContractsDir();
      assert.match(dir, /src[/\\]core[/\\]contracts$/);
    });
  });
});
