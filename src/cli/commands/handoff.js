/**
 * `gd-ks handoff` — advance from one phase to the next.
 *
 * Usage:
 *   gd-ks handoff --from=2 --to=3              Run contract check + advance
 *   gd-ks handoff --from=2 --to=3 --dry-run    Check only
 *   gd-ks handoff --from=2 --to=3 --force      Skip contract check (with warning)
 */

import chalk from 'chalk';
import { HandoffGate } from '../../core/contracts/handoff-gate.js';
import { StateManager } from '../../core/state/state-manager.js';

export async function handoff(options = {}) {
  const sm = new StateManager();
  if (!(await sm.exists())) {
    console.error(chalk.red('No project state found. Run `gd-ks install` first.'));
    process.exit(1);
  }

  const fromPhase = options.from != null ? Number(options.from) : null;
  const toPhase = options.to != null ? Number(options.to) : null;

  if (fromPhase == null || toPhase == null) {
    console.error(chalk.red('Usage: gd-ks handoff --from=N --to=M [--dry-run] [--force]'));
    process.exit(1);
  }

  if (toPhase !== fromPhase + 1) {
    console.error(chalk.red(`Handoff must be consecutive: --to must be --from + 1 (got from=${fromPhase}, to=${toPhase})`));
    process.exit(1);
  }

  const gate = new HandoffGate();

  console.log('');
  console.log(chalk.cyan.bold(`🚦 Handoff: Phase ${fromPhase} → Phase ${toPhase}`));
  if (options.force) console.log(chalk.yellow('   ⚠  --force: contract check is advisory only'));
  if (options.dryRun) console.log(chalk.gray('   ⓘ  --dry-run: will not mutate state'));
  console.log('');

  let result;
  try {
    result = await gate.handoff({
      fromPhase,
      toPhase,
      force: !!options.force,
      dryRun: !!options.dryRun
    });
  } catch (err) {
    console.error(chalk.red(`Handoff error: ${err.message}`));
    process.exit(1);
  }

  if (!result.success) {
    console.log(chalk.red.bold(`✗ Handoff blocked: ${result.reason}`));
    if (result.report) {
      const failed = result.report.checks.filter((c) => c.status === 'failed');
      console.log('');
      for (const c of failed) {
        const label = c.type === 'deliverable' ? c.id : `gate:${c.gate}`;
        console.log(chalk.red(`  ✗ ${label}`) + chalk.gray(` — ${c.reason}`));
      }
      console.log('');
      console.log(chalk.gray('Use --force to override, or fix the failures above.'));
    }
    process.exit(1);
  }

  if (result.dryRun) {
    console.log(chalk.green.bold('✓ Dry run passed — state NOT changed'));
    console.log(chalk.gray(`  ${result.report.summary.passed}/${result.report.summary.total} checks passed`));
    return;
  }

  if (result.forced) {
    console.log(chalk.yellow.bold('✓ Handoff completed (forced)'));
    console.log(chalk.yellow('  Some contract checks failed but you overrode them.'));
  } else {
    console.log(chalk.green.bold('✓ Handoff completed'));
    console.log(chalk.gray(`  ${result.report.summary.passed}/${result.report.summary.total} contract checks passed`));
  }
  console.log(chalk.gray(`  Checkpoint: ${result.checkpoint}`));
  console.log('');
  console.log(chalk.cyan(`→ You are now in Phase ${toPhase}. Load the appropriate agents and continue.`));
  console.log('');
}
