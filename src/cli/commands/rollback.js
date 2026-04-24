/**
 * `gd-ks rollback` — restore project state from a checkpoint.
 *
 * Usage:
 *   gd-ks rollback                     List checkpoints and pick one
 *   gd-ks rollback --to=<filename>     Restore a specific checkpoint
 *   gd-ks rollback --phase=N           Restore the latest checkpoint for phase N
 *   gd-ks rollback --dry-run           Show what would change without writing
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { StateManager } from '../../core/state/state-manager.js';
import { CheckpointManager } from '../../core/state/checkpoint-manager.js';
import { EventLogger } from '../../core/state/event-logger.js';

export async function rollback(options = {}) {
  const sm = new StateManager();
  if (!(await sm.exists())) {
    console.error(chalk.red('No project state found. Run `gd-ks install` first.'));
    process.exit(1);
  }

  const cm = new CheckpointManager();
  const logger = new EventLogger();

  // Determine which checkpoint to restore
  let checkpoint;
  let checkpointFile;

  if (options.to) {
    checkpointFile = options.to;
    try {
      checkpoint = await cm.load(checkpointFile);
    } catch (err) {
      console.error(chalk.red(`Could not load checkpoint: ${err.message}`));
      process.exit(1);
    }
  } else if (options.phase) {
    const phase = Number(options.phase);
    checkpoint = await cm.latest({ phase });
    if (!checkpoint) {
      console.error(chalk.red(`No checkpoints found for phase ${phase}.`));
      process.exit(1);
    }
    const list = await cm.list({ phase });
    checkpointFile = list[0];
  } else {
    // Interactive: list and pick
    const all = await cm.list();
    if (all.length === 0) {
      console.error(chalk.red('No checkpoints available.'));
      process.exit(1);
    }

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: '🔙 Select checkpoint to restore:',
        choices: all.map((f) => ({ name: f, value: f }))
      }
    ]);
    checkpointFile = choice;
    checkpoint = await cm.load(checkpointFile);
  }

  console.log('');
  console.log(chalk.cyan.bold(`🔙 Rollback target: ${checkpointFile}`));
  console.log(chalk.gray(`   Phase at checkpoint: ${checkpoint._checkpoint?.phase || '?'}`));
  console.log(chalk.gray(`   Created: ${checkpoint._checkpoint?.created_at || '?'}`));
  console.log('');

  // Show diff summary
  const current = await sm.read();
  console.log(chalk.white.bold('Summary of change:'));
  console.log(`  current_phase: ${current.current_phase} → ${checkpoint.state.current_phase}`);
  console.log(`  phases_completed: [${(current.phases_completed || []).join(',')}] → [${(checkpoint.state.phases_completed || []).join(',')}]`);
  console.log('');

  if (options.dryRun) {
    console.log(chalk.yellow('⚠  --dry-run: state NOT modified.'));
    return;
  }

  if (!options.yes) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Restore state from this checkpoint? Current state will be backed up first.',
        default: false
      }
    ]);
    if (!confirm) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
  }

  // Backup current state before overwriting
  const backupPath = await cm.save(current.current_phase, current, { label: 'pre-rollback' });
  console.log(chalk.gray(`  Backup saved: ${backupPath}`));

  // Restore
  await sm.write(checkpoint.state);

  // Log
  await logger.log({
    type: 'rollback',
    from_state_phase: current.current_phase,
    to_state_phase: checkpoint.state.current_phase,
    checkpoint_file: checkpointFile,
    backup_file: backupPath
  });

  console.log('');
  console.log(chalk.green.bold('✓ Rollback complete.'));
  console.log(chalk.gray(`  New current phase: ${checkpoint.state.current_phase}`));
  console.log('');
}
