#!/usr/bin/env node
/**
 * lint-markdown.js
 *
 * Lightweight Markdown linter for GD-KS workflow instructions and templates.
 * Checks for:
 *   - Files with zero content
 *   - Broken H1 (missing or more than one)
 *   - Trailing whitespace (info only)
 *   - Unresolved template placeholders like {TODO} or {{TODO}}
 *
 * Usage:
 *   node scripts/lint-markdown.js
 *   node scripts/lint-markdown.js --fix-trailing
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const ROOTS = [
  join(PROJECT_ROOT, 'src'),
  join(PROJECT_ROOT, 'docs')
];

const IGNORE_DIRS = new Set(['node_modules', '.git']);

async function walk(dir) {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(full)));
    else if (extname(entry.name) === '.md') results.push(full);
  }
  return results;
}

function lintContent(content) {
  const issues = [];
  const lines = content.split('\n');

  if (content.trim().length === 0) {
    issues.push({ level: 'error', msg: 'File is empty' });
    return issues;
  }

  const h1Count = lines.filter((l) => /^#\s+\S/.test(l)).length;
  if (h1Count === 0) {
    issues.push({ level: 'warn', msg: 'No H1 heading found' });
  } else if (h1Count > 1) {
    issues.push({ level: 'warn', msg: `Multiple H1 headings (${h1Count})` });
  }

  const placeholders = content.match(/\{\{?\s*TODO\s*\}?\}/gi);
  if (placeholders) {
    issues.push({
      level: 'warn',
      msg: `Unresolved placeholders: ${placeholders.slice(0, 3).join(', ')}`
    });
  }

  let trailingCount = 0;
  for (const line of lines) {
    if (line.length > 0 && /[ \t]$/.test(line)) trailingCount++;
  }
  if (trailingCount > 0) {
    issues.push({ level: 'info', msg: `Trailing whitespace on ${trailingCount} line(s)` });
  }

  return issues;
}

async function main() {
  let totalFiles = 0;
  let errors = 0;
  let warnings = 0;

  for (const root of ROOTS) {
    const files = await walk(root);
    for (const file of files) {
      totalFiles++;
      const content = await readFile(file, 'utf8');
      const issues = lintContent(content);
      if (issues.length === 0) continue;
      const rel = file.replace(PROJECT_ROOT + '/', '');
      for (const issue of issues) {
        if (issue.level === 'error') {
          console.error(`✗ ${rel}: ${issue.msg}`);
          errors++;
        } else if (issue.level === 'warn') {
          console.warn(`⚠ ${rel}: ${issue.msg}`);
          warnings++;
        } else {
          // info — silent unless --verbose passed
          if (process.argv.includes('--verbose')) {
            console.log(`ℹ ${rel}: ${issue.msg}`);
          }
        }
      }
    }
  }

  console.log(`\nScanned ${totalFiles} markdown files. ${errors} error(s), ${warnings} warning(s).`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
