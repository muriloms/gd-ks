/**
 * `gd-ks state` — inspect and manage the project state.
 *
 * Subcommands:
 *   gd-ks state show                  Pretty-print current state
 *   gd-ks state show --phase=N        Only phase N
 *   gd-ks state history [--last=N]    Read the event log
 *   gd-ks state decision "<text>"     Record a decision
 *   gd-ks state question "<text>"     Record an open question
 */

import chalk from 'chalk';
import { StateManager } from '../../core/state/state-manager.js';
import { EventLogger } from '../../core/state/event-logger.js';

export async function state(subcommand, args = {}) {
  const sm = new StateManager();
  const logger = new EventLogger();

  if (!(await sm.exists())) {
    console.error(chalk.red('No project state found. Run `gd-ks install` first.'));
    process.exit(1);
  }

  switch (subcommand) {
  case 'show':
    return await showState(sm, args);
  case 'history':
    return await showHistory(logger, args);
  case 'decision':
    return await addDecision(sm, args);
  case 'question':
    return await addQuestion(sm, args);
  case 'context':
    return await showContext(sm);
  case 'inject':
    return await injectContext(sm);
  default:
    console.error(chalk.red(`Unknown subcommand: ${subcommand}`));
    console.log('Use: gd-ks state [show|history|decision|question|context|inject]');
    process.exit(1);
  }
}

async function injectContext(sm) {
  const { readdir, readFile, writeFile } = await import('fs/promises');
  const { join } = await import('path');

  const context = await sm.renderContext();
  const placeholder = '<!-- GDKS_STATE_CONTEXT_PLACEHOLDER -->';
  const blockEnd = '> ℹ️  Current project state will be injected here by `gd-ks state context` or the IDE hook.';

  const gdksDir = join(process.cwd(), '_gdks');
  let patchedCount = 0;

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_')) continue; // skip _state, _config, etc.
        await walk(full);
      } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
        const content = await readFile(full, 'utf8');
        if (content.includes(placeholder)) {
          const patched = content.replace(
            new RegExp(`${escapeRegex(placeholder)}\\n${escapeRegex(blockEnd)}\\n?`),
            `${placeholder}\n\n${context}\n\n`
          );
          await writeFile(full, patched, 'utf8');
          patchedCount++;
        }
      }
    }
  }

  await walk(gdksDir);
  console.log(chalk.green(`✓ Injected project state context into ${patchedCount} compiled agent(s).`));
  console.log(chalk.gray('  Re-run this command any time the state changes.'));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function showState(sm, args) {
  const state = await sm.read();

  console.log('');
  console.log(chalk.cyan.bold(`📊 ${state.project.name}`));
  console.log(chalk.gray(`   ${state.project.id} • created ${formatDate(state.project.created_at)}`));
  console.log('');
  console.log(`${chalk.white('Preset:')}       ${state.preset || 'custom'}`);
  console.log(`${chalk.white('Engine:')}       ${state.target_engine || 'unreal-5'}`);
  console.log(`${chalk.white('Language:')}     ${state.language || 'en'}`);
  console.log(`${chalk.white('Current:')}      Phase ${state.current_phase}`);
  console.log('');

  const phases = args.phase ? [Number(args.phase)] : [1, 2, 3, 4];
  const phaseNames = { 1: 'Ideation', 2: 'Design', 3: 'Planning', 4: 'Engine' };

  for (const phase of phases) {
    const p = state.phase_progress?.[String(phase)];
    if (!p) continue;

    const icon = {
      not_started: '○',
      in_progress: '◐',
      completed: '●',
      blocked: '✕'
    }[p.status] || '?';
    const color = {
      not_started: chalk.gray,
      in_progress: chalk.yellow,
      completed: chalk.green,
      blocked: chalk.red
    }[p.status] || chalk.white;

    console.log(color(`${icon} Phase ${phase} — ${phaseNames[phase]} (${p.status})`));
    if (p.completion_pct != null) {
      console.log(chalk.gray(`    ${p.completion_pct}% complete`));
    }
    for (const d of p.deliverables || []) {
      const mark = d.verified ? chalk.green('✓') : chalk.gray('·');
      console.log(`    ${mark} ${d.id} ${chalk.gray(`→ ${d.path}`)}`);
    }
  }

  if (state.decisions?.length) {
    console.log('');
    console.log(chalk.white.bold('🎯 Recent Decisions'));
    for (const d of state.decisions.slice(-5)) {
      console.log(chalk.gray(`  ${d.id} [phase ${d.phase}, ${d.by}] ${d.what}`));
    }
  }

  const pendingQs = (state.open_questions || []).filter((q) => q.status === 'pending' || q.status === 'blocker');
  if (pendingQs.length) {
    console.log('');
    console.log(chalk.white.bold('❓ Open Questions'));
    for (const q of pendingQs) {
      const tag = q.status === 'blocker' ? chalk.red('[BLOCKER]') : chalk.yellow('[pending]');
      console.log(`  ${tag} ${q.id}: ${q.text}`);
    }
  }

  console.log('');
}

async function showHistory(logger, args) {
  const limit = args.last ? Number(args.last) : 20;
  const events = await logger.readLast(limit);

  if (events.length === 0) {
    console.log(chalk.gray('No events recorded yet.'));
    return;
  }

  console.log('');
  console.log(chalk.cyan.bold(`📜 Last ${events.length} events`));
  console.log('');
  for (const e of events) {
    const ts = formatDate(e.timestamp);
    const type = chalk.yellow(e.type.padEnd(15));
    const body = Object.entries(e)
      .filter(([k]) => k !== 'type' && k !== 'timestamp')
      .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('  ');
    console.log(`${chalk.gray(ts)}  ${type} ${chalk.gray(body)}`);
  }
  console.log('');
}

async function addDecision(sm, args) {
  if (!args.text) {
    console.error(chalk.red('Usage: gd-ks state decision "<text>" [--by=<agent>] [--phase=N]'));
    process.exit(1);
  }
  const d = {
    what: args.text,
    by: args.by,
    phase: args.phase ? Number(args.phase) : undefined
  };
  const next = await sm.addDecision(d);
  const last = next.decisions[next.decisions.length - 1];
  console.log(chalk.green(`✓ Decision ${last.id} recorded: ${last.what}`));
}

async function addQuestion(sm, args) {
  if (!args.text) {
    console.error(chalk.red('Usage: gd-ks state question "<text>" [--from=<agent>] [--to=user]'));
    process.exit(1);
  }
  const q = {
    text: args.text,
    from: args.from,
    to: args.to,
    phase: args.phase ? Number(args.phase) : undefined
  };
  const next = await sm.addQuestion(q);
  const last = next.open_questions[next.open_questions.length - 1];
  console.log(chalk.green(`✓ Question ${last.id} opened: ${last.text}`));
}

async function showContext(sm) {
  const ctx = await sm.renderContext();
  console.log(ctx);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
