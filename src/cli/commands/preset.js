/**
 * `gd-ks preset` — inspect and manage the active preset.
 *
 * Subcommands:
 *   gd-ks preset show                     Display current preset
 *   gd-ks preset list                     List all available presets
 *   gd-ks preset switch <id>              Change active preset
 *   gd-ks preset enable-agent <agent>     Enable an agent
 *   gd-ks preset disable-agent <agent>    Disable an agent
 */

import chalk from 'chalk';
import { StateManager } from '../../core/state/state-manager.js';
import { PresetManager } from '../../core/presets/preset-manager.js';

export async function preset(subcommand, args = {}) {
  const sm = new StateManager();
  if (!(await sm.exists())) {
    console.error(chalk.red('No project state found. Run `gd-ks install` first.'));
    process.exit(1);
  }

  const pm = new PresetManager();

  switch (subcommand) {
  case 'show':
    return await showPreset(sm, pm);
  case 'list':
    return await listPresets(pm);
  case 'switch':
    return await switchPreset(sm, pm, args);
  case 'enable-agent':
    return await toggleAgent(sm, pm, args, 'enable');
  case 'disable-agent':
    return await toggleAgent(sm, pm, args, 'disable');
  default:
    console.error(chalk.red(`Unknown subcommand: ${subcommand}`));
    console.log('Use: gd-ks preset [show|list|switch|enable-agent|disable-agent]');
    process.exit(1);
  }
}

async function showPreset(sm, pm) {
  const state = await sm.read();
  const presetId = state.preset || 'custom';

  let presetData;
  try {
    presetData = await pm.load(presetId);
  } catch (err) {
    console.error(chalk.red(`Could not load preset "${presetId}": ${err.message}`));
    process.exit(1);
  }

  const activeAgents = pm.getActiveAgents(presetData);

  console.log('');
  console.log(chalk.cyan.bold(`🎯 Active Preset: ${presetData.preset.icon || ''} ${presetData.preset.name}`));
  console.log(chalk.gray(`   id: ${presetData.preset.id}`));
  console.log('');
  if (presetData.preset.description) {
    console.log(presetData.preset.description);
    console.log('');
  }

  console.log(chalk.white.bold('Target'));
  console.log(`  Team size:      ${presetData.target?.team_size || '-'}`);
  console.log(`  Scope:          ${presetData.target?.project_scope || '-'}`);
  console.log(`  Duration:       ${presetData.target?.typical_duration || '-'}`);
  console.log('');

  console.log(chalk.white.bold(`Active Agents (${activeAgents.length})`));
  for (const [mod, ids] of Object.entries(presetData.agents_active || {})) {
    if (ids.length === 0) continue;
    console.log(chalk.gray(`  ${mod}:`));
    for (const id of ids) {
      console.log(`    ${chalk.green('✓')} ${id}`);
    }
  }

  const disabled = presetData.agents_disabled || [];
  if (disabled.length > 0) {
    console.log('');
    console.log(chalk.white.bold(`Disabled Agents (${disabled.length})`));
    for (const id of disabled) {
      console.log(`  ${chalk.gray('·')} ${id}`);
    }
  }
  console.log('');
}

async function listPresets(pm) {
  const list = await pm.list();
  console.log('');
  console.log(chalk.cyan.bold('📋 Available Presets'));
  console.log('');
  for (const p of list) {
    console.log(`  ${p.icon || '•'} ${chalk.white.bold(p.name)} ${chalk.gray(`(${p.id})`)}`);
    console.log(chalk.gray(`     ${p.description}`));
    console.log(chalk.gray(`     ${p.agent_count} active agent(s)`));
    console.log('');
  }
}

async function switchPreset(sm, pm, args) {
  const newId = args.text || args.id;
  if (!newId) {
    console.error(chalk.red('Usage: gd-ks preset switch <preset-id>'));
    process.exit(1);
  }
  try {
    await pm.load(newId); // validates
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  await sm.update({ preset: newId });
  console.log(chalk.green(`✓ Preset switched to "${newId}".`));
  console.log(chalk.gray('  Run `gd-ks install` again (or re-run the installer in-place)'));
  console.log(chalk.gray('  to apply agent filtering to your installed _gdks/ tree.'));
}

async function toggleAgent(sm, pm, args, action) {
  const agentId = args.text || args.agent;
  const moduleId = args.module || 'design';
  if (!agentId) {
    console.error(chalk.red(`Usage: gd-ks preset ${action}-agent <agent-id> [--module=design]`));
    process.exit(1);
  }
  const state = await sm.read();
  const presetData = await pm.load(state.preset || 'custom');

  const next = action === 'enable'
    ? pm.enableAgent(presetData, moduleId, agentId)
    : pm.disableAgent(presetData, moduleId, agentId);

  // Save as user-overridden preset in state
  await sm.update((s) => {
    s.preset_overrides = s.preset_overrides || {};
    s.preset_overrides.agents_active = next.agents_active;
    s.preset_overrides.agents_disabled = next.agents_disabled;
    return s;
  });

  const verb = action === 'enable' ? 'enabled' : 'disabled';
  console.log(chalk.green(`✓ Agent "${agentId}" ${verb} in module "${moduleId}".`));
  console.log(chalk.gray('  Overrides saved in project state. Re-run install to apply.'));
}
