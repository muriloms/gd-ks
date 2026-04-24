/**
 * Custom assertions for GD-KS tests.
 * Built on top of node:assert/strict.
 */

import assert from 'node:assert/strict';
import { access, stat, readFile } from 'fs/promises';
import yaml from 'js-yaml';

/**
 * Assert a file exists.
 */
export async function assertFileExists(filePath, msg) {
  try {
    await access(filePath);
  } catch {
    assert.fail(msg || `Expected file to exist: ${filePath}`);
  }
}

/**
 * Assert a directory exists.
 */
export async function assertDirExists(dirPath, msg) {
  try {
    const s = await stat(dirPath);
    assert.ok(s.isDirectory(), msg || `Expected directory: ${dirPath}`);
  } catch {
    assert.fail(msg || `Expected directory to exist: ${dirPath}`);
  }
}

/**
 * Assert a YAML file loads and contains an expected key.
 */
export async function assertYamlHas(filePath, keyPath, msg) {
  const raw = await readFile(filePath, 'utf8');
  const data = yaml.load(raw);
  const keys = keyPath.split('.');
  let current = data;
  for (const k of keys) {
    assert.ok(
      current != null && Object.prototype.hasOwnProperty.call(current, k),
      msg || `Expected YAML ${filePath} to have key path "${keyPath}"; missing "${k}"`
    );
    current = current[k];
  }
  return current;
}

/**
 * Assert that a string contains a substring (improves error message).
 */
export function assertIncludes(haystack, needle, msg) {
  assert.ok(
    typeof haystack === 'string' && haystack.includes(needle),
    msg || `Expected string to include "${needle}". Got:\n${haystack}`
  );
}

/**
 * Collect validation failures across multiple results into a readable error.
 */
export function assertAllValid(results, msg) {
  const failures = results.filter((r) => !r.valid);
  if (failures.length > 0) {
    const report = failures
      .map((f) => `  ✗ ${f.file}\n    - ${(f.errors || []).join('\n    - ')}`)
      .join('\n');
    assert.fail(`${msg || 'Validation failures'}:\n${report}`);
  }
}
