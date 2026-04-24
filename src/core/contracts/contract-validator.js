/**
 * GD-KS Contract Validator
 *
 * Given a contract and the current project state + filesystem, decides
 * whether the handoff can proceed. Returns a structured report of
 * passes/failures that the CLI turns into human-readable output.
 */

import { join } from 'path';
import { readFile } from 'fs/promises';
import { FileManager } from '../../../tools/installer/lib/file-manager.js';

export class ContractValidator {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.fileManager = new FileManager();
  }

  /**
   * Validate a contract against the project state.
   *
   * @param {object} contract - loaded contract YAML
   * @param {object} state - loaded project-state
   * @returns {Promise<{passed: boolean, checks: Array}>}
   */
  async check(contract, state) {
    const checks = [];

    // 1) Required deliverables
    for (const deliverable of contract.required_deliverables || []) {
      if (this._skipConditional(deliverable, state)) {
        checks.push({
          type: 'deliverable',
          id: deliverable.id,
          status: 'skipped',
          reason: 'required_when condition not matched'
        });
        continue;
      }
      const check = await this._checkDeliverable(deliverable, state);
      checks.push(check);
    }

    // 2) Quality gates
    for (const gate of contract.quality_gates || []) {
      const check = this._checkGate(gate, state);
      checks.push(check);
    }

    const failed = checks.filter((c) => c.status === 'failed');
    return {
      passed: failed.length === 0,
      checks,
      summary: {
        total: checks.length,
        passed: checks.filter((c) => c.status === 'passed').length,
        failed: failed.length,
        skipped: checks.filter((c) => c.status === 'skipped').length
      }
    };
  }

  // -- Internals -------------------------------------------------------------

  _skipConditional(deliverable, state) {
    const cond = deliverable.required_when;
    if (!cond) return false;
    if (cond.preset && !cond.preset.includes(state.preset)) return true;
    if (cond.target_engine && !cond.target_engine.includes(state.target_engine)) return true;
    return false;
  }

  async _checkDeliverable(deliverable, state) {
    const fullPath = join(this.projectRoot, deliverable.path_glob);
    const exists = await this.fileManager.exists(fullPath);
    if (!exists) {
      return {
        type: 'deliverable',
        id: deliverable.id,
        status: 'failed',
        reason: `File not found: ${deliverable.path_glob}`
      };
    }

    // Verify file is registered in state
    const registered = this._findInState(deliverable.id, state);
    if (registered && !registered.verified) {
      return {
        type: 'deliverable',
        id: deliverable.id,
        status: 'failed',
        reason: 'Deliverable exists on disk but is not marked as verified in state'
      };
    }

    const content = await readFile(fullPath, 'utf8');

    // Min word count
    if (deliverable.min_word_count != null) {
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      if (words < deliverable.min_word_count) {
        return {
          type: 'deliverable',
          id: deliverable.id,
          status: 'failed',
          reason: `Too short: ${words} words (need ${deliverable.min_word_count}+)`
        };
      }
    }

    // Required sections (markdown H2 headings)
    if (deliverable.required_sections?.length) {
      const missing = [];
      for (const section of deliverable.required_sections) {
        // Accept any H1/H2/H3 heading containing the required phrase (case-insensitive)
        const re = new RegExp(`^#{1,3}\\s+.*${this._escapeRegex(section)}.*$`, 'mi');
        if (!re.test(content)) missing.push(section);
      }
      if (missing.length) {
        return {
          type: 'deliverable',
          id: deliverable.id,
          status: 'failed',
          reason: `Missing required section(s): ${missing.join(', ')}`
        };
      }
    }

    return {
      type: 'deliverable',
      id: deliverable.id,
      status: 'passed'
    };
  }

  _checkGate(gate, state) {
    switch (gate.type) {
    case 'no_open_blockers': {
      const blockers = (state.open_questions || []).filter((q) => q.status === 'blocker');
      if (blockers.length > 0) {
        return {
          type: 'gate',
          gate: gate.type,
          status: 'failed',
          reason: `${blockers.length} open blocker question(s): ${blockers.map((b) => b.id).join(', ')}`
        };
      }
      return { type: 'gate', gate: gate.type, status: 'passed' };
    }
    case 'min_completion_pct': {
      // Check the phase we're handing off FROM
      const phase = this._fromPhaseInContract(state);
      if (phase == null) {
        return { type: 'gate', gate: gate.type, status: 'skipped', reason: 'Could not determine from_phase' };
      }
      const pct = state.phase_progress?.[String(phase)]?.completion_pct ?? 0;
      if (pct < (gate.value || 80)) {
        return {
          type: 'gate',
          gate: gate.type,
          status: 'failed',
          reason: `Phase completion ${pct}% < required ${gate.value || 80}%`
        };
      }
      return { type: 'gate', gate: gate.type, status: 'passed' };
    }
    case 'all_agents_signoff': {
      // Lightweight check — presence of agents in active_agents as proxy for signoff.
      // A fuller implementation would track explicit signoffs; that's a Sprint 2.x improvement.
      const required = gate.agents || [];
      const missing = required.filter((a) => !(state.active_agents || []).includes(a));
      if (missing.length) {
        return {
          type: 'gate',
          gate: gate.type,
          status: 'failed',
          reason: `Required agent(s) not active: ${missing.join(', ')}`
        };
      }
      return { type: 'gate', gate: gate.type, status: 'passed' };
    }
    default:
      return {
        type: 'gate',
        gate: gate.type,
        status: 'skipped',
        reason: `Unknown gate type: ${gate.type}`
      };
    }
  }

  _findInState(id, state) {
    for (const p of Object.values(state.phase_progress || {})) {
      const found = (p.deliverables || []).find((d) => d.id === id);
      if (found) return found;
    }
    return null;
  }

  _fromPhaseInContract(state) {
    // Assume we're handing off from the current_phase (caller sets this up)
    return state.current_phase;
  }

  _escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
