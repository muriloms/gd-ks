/**
 * `gd-ks validate` — check project state against a handoff contract.
 *
 * Usage:
 *   gd-ks validate --phase=2             Check if phase 2 can hand off (to phase 3)
 *   gd-ks validate --from=2 --to=3       Explicit from/to phases
 */

import chalk from 'chalk';
import { StateManager } from '../../core/state/state-manager.js';
import { ContractLoader } from '../../core/contracts/contract-loader.js';
import { ContractValidator } from '../../core/contracts/contract-validator.js';

export async function validate(options = {}) {
  const sm = new StateManager();
  if (!(await sm.exists())) {
    console.error(chalk.red('No project state found. Run `gd-ks install` first.'));
    process.exit(1);
  }

  let fromPhase = options.from != null ? Number(options.from) : null;
  let toPhase = options.to != null ? Number(options.to) : null;

  if (fromPhase == null && options.phase != null) {
    fromPhase = Number(options.phase);
    toPhase = fromPhase + 1;
  }

  if (fromPhase == null) {
    const state = await sm.read();
    fromPhase = state.current_phase;
    toPhase = fromPhase + 1;
  }

  if (toPhase > 4) {
    console.log(chalk.green(`✓ Phase ${fromPhase} is the final phase — no handoff to validate.`));
    return;
  }

  const loader = new ContractLoader();
  const validator = new ContractValidator();
  const state = await sm.read();

  let contract;
  try {
    contract = await loader.load(fromPhase, toPhase);
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.cyan.bold(`🔍 Validating handoff: Phase ${fromPhase} → Phase ${toPhase}`));
  console.log(chalk.gray(`   Contract: ${contract.name || '(unnamed)'}`));
  console.log('');

  const report = await validator.check(contract, state);

  for (const check of report.checks) {
    const icon = {
      passed: chalk.green('✓'),
      failed: chalk.red('✗'),
      skipped: chalk.gray('○')
    }[check.status];

    const label = check.type === 'deliverable' ? check.id : `gate:${check.gate}`;
    let line = `  ${icon} ${label}`;
    if (check.reason) line += chalk.gray(` — ${check.reason}`);
    console.log(line);
  }

  console.log('');
  if (report.passed) {
    console.log(chalk.green.bold(`✓ PASSED — ${report.summary.passed}/${report.summary.total} checks`));
    console.log(chalk.gray(`  You can proceed with: gd-ks handoff --from=${fromPhase} --to=${toPhase}`));
  } else {
    console.log(chalk.red.bold(`✗ FAILED — ${report.summary.failed} check(s) failed, ${report.summary.passed} passed`));
    console.log(chalk.gray(`  Fix the failures, or use --force to override: gd-ks handoff --from=${fromPhase} --to=${toPhase} --force`));
    process.exit(1);
  }
}
