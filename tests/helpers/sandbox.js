/**
 * Test helper: sandbox directories for installer integration/e2e tests.
 *
 * Each test should call `createSandbox()` to get a fresh temp dir,
 * and `await sandbox.cleanup()` when done (or use `withSandbox`).
 */

import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Create a unique temporary directory.
 */
export async function createSandbox(label = 'gdks') {
  const path = await mkdtemp(join(tmpdir(), `${label}-`));
  return {
    path,
    async cleanup() {
      await rm(path, { recursive: true, force: true });
    }
  };
}

/**
 * Run a function with a sandbox and guarantee cleanup.
 *
 *   await withSandbox(async (sandbox) => {
 *     // use sandbox.path
 *   });
 */
export async function withSandbox(fn, label) {
  const sandbox = await createSandbox(label);
  try {
    return await fn(sandbox);
  } finally {
    await sandbox.cleanup();
  }
}
