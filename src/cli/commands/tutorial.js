/**
 * `gd-ks tutorial` — launch the guided tutorial.
 *
 * The tutorial is primarily driven by the `*tutorial` workflow inside
 * the gdks-master agent (loaded in the user's IDE). This CLI command
 * exists to:
 *   - Show a summary of what the tutorial covers
 *   - Create sandbox directories so the tutorial workflow has
 *     pre-baked sample files to show
 *   - Optionally reset a previous tutorial run (`--reset`)
 *
 * Usage:
 *   gd-ks tutorial                 Prepare sandbox + print next-step instructions
 *   gd-ks tutorial --reset         Clear previous tutorial state and sandbox
 *   gd-ks tutorial --info          Just print what the tutorial is (no setup)
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { FileManager } from '../../../tools/installer/lib/file-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PACKAGE_SAMPLE_DIR = join(
  __dirname,
  '..',
  '..',
  'core',
  'workflows',
  'tutorial',
  'sample-outputs',
  'cosmic-explorer'
);

export async function tutorial(options = {}) {
  const fm = new FileManager();
  const targetDir = options.projectRoot || process.cwd();
  const quiet = !!options.quiet;

  if (options.info) {
    return printInfo();
  }

  if (options.reset) {
    return resetTutorial(fm, targetDir, quiet);
  }

  // Default: setup
  await setupTutorial(fm, targetDir, quiet);
  if (!quiet) printNextSteps();
}

function printInfo() {
  console.log('');
  console.log(chalk.cyan.bold('🎓 GD-KS Guided Tutorial'));
  console.log('');
  console.log('A walk-through of the complete GD-KS pipeline using a small');
  console.log('sample project called "Cosmic Explorer" — a quiet low-gravity');
  console.log('puzzle-platformer.');
  console.log('');
  console.log(chalk.white.bold('What you\'ll see:'));
  console.log('  1. Welcome + 4-phase overview');
  console.log('  2. Project setup (sandbox — won\'t touch your real project)');
  console.log('  3. Meet Sparky (Ideation)');
  console.log('  4. Run *brainstorm → concept-brief.md');
  console.log('  5. Handoff: contract check');
  console.log('  6. Meet Diana (Design) — GDD walkthrough');
  console.log('  7. Meet Sam (Planning) — epics and stories');
  console.log('  8. Meet the Engine Team — architecture for your chosen engine');
  console.log('  9. Wrap-up and next steps');
  console.log('');
  console.log(chalk.white.bold('Duration:'));
  console.log('  Normal mode: 15-20 min');
  console.log('  Fast mode (--fast):  5-7 min');
  console.log('');
}

async function setupTutorial(fm, targetDir, quiet = false) {
  const log = quiet ? () => {} : (...a) => console.log(...a);
  log('');
  log(chalk.cyan.bold('🎓 Preparing tutorial sandbox...'));
  log('');

  const sandboxOutDir = join(targetDir, '_gdks-output-tutorial');

  // Copy sample-outputs if they exist in the package
  if (await fm.exists(PACKAGE_SAMPLE_DIR)) {
    await fm.copyDir(PACKAGE_SAMPLE_DIR, sandboxOutDir);
    log(chalk.green('✓'), 'Cosmic Explorer sample project copied to',
      chalk.yellow('_gdks-output-tutorial/'));
  } else {
    log(chalk.yellow('⚠'), 'Sample project not found in package; creating empty sandbox.');
    await fm.ensureDir(sandboxOutDir);
  }

  // Sandbox state file (separate from real project-state.yaml)
  const tutorialStateDir = join(targetDir, '_gdks', '_state');
  await fm.ensureDir(tutorialStateDir);

  const tutorialState = {
    schema_version: '1.0',
    project: {
      id: 'tutorial-cosmic-explorer',
      name: 'Tutorial: Cosmic Explorer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: 'Sandbox project for the GD-KS tutorial'
    },
    preset: 'solo-indie',
    target_engine: 'unreal-5',
    language: 'en',
    current_phase: 1,
    phases_completed: [],
    phases_in_progress: [1],
    phase_progress: {
      1: { status: 'in_progress', deliverables: [] },
      2: { status: 'not_started', deliverables: [] },
      3: { status: 'not_started', deliverables: [] },
      4: { status: 'not_started', deliverables: [] }
    },
    active_agents: ['gdks-master'],
    decisions: [],
    open_questions: []
  };

  await fm.writeYaml(
    join(tutorialStateDir, 'tutorial-state.yaml'),
    tutorialState
  );
  log(chalk.green('✓'), 'Tutorial state created at',
    chalk.yellow('_gdks/_state/tutorial-state.yaml'));
  log('');
}

async function resetTutorial(fm, targetDir, quiet = false) {
  const log = quiet ? () => {} : (...a) => console.log(...a);
  log('');
  log(chalk.yellow('🔄 Resetting tutorial state...'));

  const { rm } = await import('fs/promises');

  const sandboxOutDir = join(targetDir, '_gdks-output-tutorial');
  const tutorialStatePath = join(targetDir, '_gdks', '_state', 'tutorial-state.yaml');

  let removed = 0;
  if (await fm.exists(sandboxOutDir)) {
    await rm(sandboxOutDir, { recursive: true, force: true });
    removed++;
    log(chalk.green('✓'), 'Removed', chalk.yellow('_gdks-output-tutorial/'));
  }
  if (await fm.exists(tutorialStatePath)) {
    await rm(tutorialStatePath, { force: true });
    removed++;
    log(chalk.green('✓'), 'Removed', chalk.yellow('_gdks/_state/tutorial-state.yaml'));
  }

  if (removed === 0) {
    log(chalk.gray('  Nothing to reset — no tutorial state found.'));
  }
  log('');
  log(chalk.gray('  Run `gd-ks tutorial` again to start fresh.'));
  log('');
}

function printNextSteps() {
  console.log(chalk.white.bold('▶  Next steps:'));
  console.log('');
  console.log('  1. Open your IDE in this directory (Cursor, Windsurf, etc.)');
  console.log('  2. Load the agent:',
    chalk.yellow('_gdks/core/agents/gdks-master.md'));
  console.log('  3. Type', chalk.yellow('*tutorial'), 'in the chat');
  console.log('  4. Follow the 9 steps (~15 min)');
  console.log('');
  console.log(chalk.gray('  Tip: `gd-ks tutorial --reset` to start over,'));
  console.log(chalk.gray('       `gd-ks tutorial --info` for a syllabus.'));
  console.log('');
}
