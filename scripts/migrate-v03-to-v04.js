#!/usr/bin/env node
/**
 * migrate-v03-to-v04.js
 *
 * Upgrade an existing _gdks/ installation from v0.3 to v0.4:
 *   - Create _gdks/_state/ (project-state.yaml + history/ + checkpoints/)
 *   - Create _gdks/_contracts/ (copy defaults from the package)
 *   - Retrofit a project-state.yaml based on what we can infer from
 *     manifest.yaml, project-config.yaml, and existing output files.
 *   - Log a migration event.
 *
 * Safe: dry-run mode by default. Use --apply to commit changes.
 *
 * Usage:
 *   node scripts/migrate-v03-to-v04.js [--project=<path>] [--apply] [--verbose]
 */

import { join } from 'path';
import { readdir, access } from 'fs/promises';
import chalk from 'chalk';

import { FileManager } from '../tools/installer/lib/file-manager.js';
import { StateManager } from '../src/core/state/state-manager.js';
import { EventLogger } from '../src/core/state/event-logger.js';
import { ContractLoader } from '../src/core/contracts/contract-loader.js';

function parseArgs(argv) {
  const args = { apply: false, verbose: false, project: process.cwd() };
  for (const a of argv) {
    if (a === '--apply') args.apply = true;
    else if (a === '--verbose') args.verbose = true;
    else if (a.startsWith('--project=')) args.project = a.slice('--project='.length);
  }
  return args;
}

async function pathExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function loadYamlSafe(fileManager, p) {
  if (!(await fileManager.exists(p))) return null;
  try { return await fileManager.readYaml(p); } catch { return null; }
}

async function scanOutputDeliverables(outputDir, fileManager) {
  const result = { 1: [], 2: [], 3: [], 4: [] };
  const phaseDirs = {
    1: '01-ideation',
    2: '02-design',
    3: '03-planning',
    4: '04-engine'
  };

  for (const [phase, dirName] of Object.entries(phaseDirs)) {
    const dir = join(outputDir, dirName);
    if (!(await fileManager.exists(dir))) continue;
    const files = await walkMdFiles(dir);
    for (const full of files) {
      const relative = full.substring(outputDir.length + 1).replace(/\\/g, '/');
      const id = inferIdFromPath(full);
      result[phase].push({
        id,
        path: join(dirName, relative.substring(dirName.length + 1)).replace(/\\/g, '/'),
        verified: false
      });
    }
  }
  return result;
}

async function walkMdFiles(root) {
  const out = [];
  async function walk(dir) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.name.endsWith('.md') && entry.name !== '.gitkeep') out.push(full);
      }
    } catch {
      // ignore unreadable dirs
    }
  }
  await walk(root);
  return out;
}

function inferIdFromPath(full) {
  // Take the filename without extension as a starting id guess
  return full.split(/[/\\]/).pop().replace(/\.md$/, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fm = new FileManager();

  console.log('');
  console.log(chalk.cyan.bold('🔄 GD-KS v0.3 → v0.4 Migration'));
  console.log(chalk.gray(`   Project: ${args.project}`));
  console.log(chalk.gray(`   Mode: ${args.apply ? chalk.yellow('APPLY') : 'dry-run'}`));
  console.log('');

  const gdksDir = join(args.project, '_gdks');
  if (!(await pathExists(gdksDir))) {
    console.error(chalk.red(`No _gdks/ folder at ${args.project}. Are you in the project root?`));
    process.exit(1);
  }

  // Check if already v0.4
  const stateFile = join(gdksDir, '_state', 'project-state.yaml');
  if (await pathExists(stateFile)) {
    console.log(chalk.green('✓ Project is already on v0.4 (project-state.yaml exists). Nothing to do.'));
    return;
  }

  const plan = {
    createDirs: [],
    writeState: null,
    copyContracts: [],
    logEvent: null
  };

  // Plan 1: directories
  plan.createDirs = [
    join(gdksDir, '_state'),
    join(gdksDir, '_state', 'checkpoints'),
    join(gdksDir, '_state', 'history'),
    join(gdksDir, '_contracts')
  ];

  // Plan 2: retrofit state from manifest + config
  const manifest = await loadYamlSafe(fm, join(gdksDir, '_config', 'manifest.yaml'));
  const projectConfig = await loadYamlSafe(fm, join(gdksDir, '_config', 'project-config.yaml'));

  const projectName =
    projectConfig?.project?.name ||
    manifest?.project?.name ||
    'Migrated Game Project';

  const outputFolder =
    projectConfig?.settings?.output_folder ||
    manifest?.project?.output_folder ||
    '_gdks-output';

  const language =
    projectConfig?.settings?.communication_language ||
    manifest?.project?.language ||
    'en';

  const installedAt = manifest?.installed_at || new Date().toISOString();

  // Scan output folder for existing deliverables
  const outputDir = join(args.project, outputFolder);
  const deliverables = await scanOutputDeliverables(outputDir, fm);

  // Decide which phase to mark as current based on where deliverables exist
  let currentPhase = 1;
  const phasesWithContent = Object.entries(deliverables)
    .filter(([, arr]) => arr.length > 0)
    .map(([p]) => Number(p));
  if (phasesWithContent.length > 0) {
    currentPhase = Math.max(...phasesWithContent);
  }

  plan.writeState = {
    projectName,
    language,
    deliverables,
    currentPhase,
    installedAt
  };

  // Plan 3: contracts to copy
  const sourceContractsDir = ContractLoader.getPackageContractsDir();
  if (await pathExists(sourceContractsDir)) {
    const files = await fm.listFiles(sourceContractsDir, '.contract.yaml');
    plan.copyContracts = files.map((f) => ({
      from: join(sourceContractsDir, f),
      to: join(gdksDir, '_contracts', f)
    }));
  }

  // Plan 4: event
  plan.logEvent = {
    type: 'migrated',
    from_version: manifest?.gdks_version || 'unknown',
    to_version: '0.4.0',
    migrated_at: new Date().toISOString(),
    inferred_phase: currentPhase,
    deliverables_found: Object.fromEntries(
      Object.entries(deliverables).map(([k, v]) => [k, v.length])
    )
  };

  // Print the plan
  console.log(chalk.white.bold('📋 Plan'));
  console.log(chalk.white('  Directories to create:'));
  for (const d of plan.createDirs) console.log(`    + ${d.replace(args.project + '/', '')}`);
  console.log('');
  console.log(chalk.white('  Project state to retrofit:'));
  console.log(`    name:         ${projectName}`);
  console.log(`    language:     ${language}`);
  console.log(`    current_phase: ${currentPhase}`);
  for (const [phase, items] of Object.entries(deliverables)) {
    if (items.length === 0) continue;
    console.log(`    phase ${phase}: ${items.length} deliverable(s)`);
    if (args.verbose) {
      for (const d of items) console.log(chalk.gray(`        - ${d.id}`));
    }
  }
  console.log('');
  console.log(chalk.white('  Contracts to install:'));
  for (const c of plan.copyContracts) console.log(`    + ${c.to.replace(args.project + '/', '')}`);
  console.log('');

  if (!args.apply) {
    console.log(chalk.yellow('⚠  Dry-run. No files changed.'));
    console.log(chalk.gray('   Re-run with --apply to commit this migration.'));
    return;
  }

  // APPLY --------------------------------------------------------------------
  console.log(chalk.cyan('Applying migration...'));

  for (const d of plan.createDirs) {
    await fm.ensureDir(d);
  }

  // Create project-state
  const sm = new StateManager({ projectRoot: args.project });
  await sm.init({
    projectName,
    language,
    targetEngine: 'unreal-5'
  });

  // Populate deliverables
  await sm.update((s) => {
    s.current_phase = currentPhase;
    for (const [phase, items] of Object.entries(deliverables)) {
      s.phase_progress[phase].deliverables = items.map((d) => ({ ...d }));
      if (items.length > 0 && Number(phase) < currentPhase) {
        s.phase_progress[phase].status = 'completed';
        s.phase_progress[phase].completed_at = installedAt;
        s.phase_progress[phase].completion_pct = 100;
        if (!s.phases_completed.includes(Number(phase))) s.phases_completed.push(Number(phase));
      } else if (Number(phase) === currentPhase && items.length > 0) {
        s.phase_progress[phase].status = 'in_progress';
        s.phase_progress[phase].started_at = installedAt;
        if (!s.phases_in_progress.includes(Number(phase))) s.phases_in_progress.push(Number(phase));
      }
    }
    return s;
  });

  // Copy contracts
  for (const c of plan.copyContracts) {
    await fm.copy(c.from, c.to);
  }

  // Log event
  const logger = new EventLogger({ projectRoot: args.project });
  await logger.log(plan.logEvent);

  console.log('');
  console.log(chalk.green.bold('✓ Migration complete.'));
  console.log(chalk.gray('  Inspect your new state with: gd-ks state show'));
  console.log('');
}

main().catch((err) => {
  console.error(chalk.red('Migration failed:'), err);
  process.exit(1);
});
