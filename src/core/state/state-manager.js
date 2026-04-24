/**
 * GD-KS State Manager
 *
 * Manages the central `_gdks/_state/project-state.yaml` file.
 * Introduced in v0.4 (Sprint 2) to solve:
 *   - Risk 5.3: agents forgetting what other agents decided
 *   - Risk 5.2: premature phase handoff
 *
 * The state file is the single source of truth for a user's project.
 * Every agent, every workflow, every CLI command reads from it.
 */

import { join } from 'path';
import { FileManager } from '../../../tools/installer/lib/file-manager.js';
import { SchemaValidator } from '../../../tools/validator/validator.js';

const STATE_RELATIVE_PATH = join('_gdks', '_state', 'project-state.yaml');
const SCHEMA_VERSION = '1.0';

export class StateManager {
  /**
   * @param {object} options
   * @param {string} options.projectRoot  Root of the user's project (contains _gdks/)
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.statePath = join(this.projectRoot, STATE_RELATIVE_PATH);
    this.fileManager = new FileManager();
    this._validator = null;
  }

  /** Lazily load the schema validator. */
  async _getValidator() {
    if (!this._validator) {
      this._validator = new SchemaValidator();
      await this._validator.load();
    }
    return this._validator;
  }

  /**
   * Check whether the project has a state file.
   */
  async exists() {
    return this.fileManager.exists(this.statePath);
  }

  /**
   * Create a new state file for a fresh install.
   */
  async init({ projectName, projectId, description, preset, targetEngine, language } = {}) {
    if (await this.exists()) {
      throw new Error(`Project state already exists at ${this.statePath}`);
    }

    const now = new Date().toISOString();
    const state = {
      schema_version: SCHEMA_VERSION,
      project: {
        id: projectId || this._slugify(projectName || 'my-game'),
        name: projectName || 'My Game',
        created_at: now,
        updated_at: now
      },
      preset: preset || 'custom',
      target_engine: targetEngine || 'unreal-5',
      language: language || 'en',
      current_phase: 1,
      phases_completed: [],
      phases_in_progress: [],
      phase_progress: {
        1: { status: 'not_started', deliverables: [] },
        2: { status: 'not_started', deliverables: [] },
        3: { status: 'not_started', deliverables: [] },
        4: { status: 'not_started', deliverables: [] }
      },
      active_agents: [],
      decisions: [],
      open_questions: []
    };

    if (description) state.project.description = description;

    await this._writeState(state);
    return state;
  }

  /**
   * Read the current state from disk.
   */
  async read() {
    if (!(await this.exists())) {
      throw new Error(`Project state not found at ${this.statePath}. Run \`gd-ks install\` or \`gd-ks state init\`.`);
    }
    return this.fileManager.readYaml(this.statePath);
  }

  /**
   * Replace the whole state. Writes updated_at automatically.
   */
  async write(state) {
    await this._writeState(state);
  }

  /**
   * Shallow-merge updates into the state and persist.
   * Top-level keys only — for nested changes use specific methods or update() with a function.
   */
  async update(updates) {
    const state = await this.read();
    const next = typeof updates === 'function' ? updates(state) : { ...state, ...updates };
    await this._writeState(next);
    return next;
  }

  /**
   * Start a phase: mark it in_progress, set started_at, update current_phase.
   */
  async startPhase(phaseNumber) {
    this._assertPhase(phaseNumber);
    return this.update((state) => {
      const key = String(phaseNumber);
      state.phase_progress[key] = {
        ...(state.phase_progress[key] || { deliverables: [] }),
        status: 'in_progress',
        started_at: new Date().toISOString()
      };
      if (!state.phases_in_progress.includes(phaseNumber)) {
        state.phases_in_progress.push(phaseNumber);
      }
      state.current_phase = phaseNumber;
      return state;
    });
  }

  /**
   * Complete a phase: move from in_progress to completed.
   */
  async completePhase(phaseNumber) {
    this._assertPhase(phaseNumber);
    return this.update((state) => {
      const key = String(phaseNumber);
      state.phase_progress[key] = {
        ...(state.phase_progress[key] || { deliverables: [] }),
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_pct: 100
      };
      state.phases_in_progress = state.phases_in_progress.filter((p) => p !== phaseNumber);
      if (!state.phases_completed.includes(phaseNumber)) {
        state.phases_completed.push(phaseNumber);
      }
      return state;
    });
  }

  /**
   * Register a deliverable for a phase.
   */
  async addDeliverable(phaseNumber, deliverable) {
    this._assertPhase(phaseNumber);
    if (!deliverable || !deliverable.id || !deliverable.path) {
      throw new Error('Deliverable must have at least { id, path }');
    }
    return this.update((state) => {
      const key = String(phaseNumber);
      const progress = state.phase_progress[key] || { status: 'not_started', deliverables: [] };
      progress.deliverables = progress.deliverables || [];
      // Replace if id already exists
      const existing = progress.deliverables.findIndex((d) => d.id === deliverable.id);
      const entry = {
        id: deliverable.id,
        path: deliverable.path,
        verified: deliverable.verified ?? false,
        ...(deliverable.verified ? { verified_at: new Date().toISOString() } : {})
      };
      if (existing >= 0) progress.deliverables[existing] = entry;
      else progress.deliverables.push(entry);
      state.phase_progress[key] = progress;
      return state;
    });
  }

  /**
   * Mark a deliverable as verified.
   */
  async verifyDeliverable(phaseNumber, deliverableId) {
    this._assertPhase(phaseNumber);
    return this.update((state) => {
      const key = String(phaseNumber);
      const progress = state.phase_progress[key];
      if (!progress || !progress.deliverables) {
        throw new Error(`No deliverables for phase ${phaseNumber}`);
      }
      const d = progress.deliverables.find((x) => x.id === deliverableId);
      if (!d) throw new Error(`Deliverable "${deliverableId}" not found in phase ${phaseNumber}`);
      d.verified = true;
      d.verified_at = new Date().toISOString();
      return state;
    });
  }

  /**
   * Append a decision to the log.
   */
  async addDecision({ what, phase, by }) {
    if (!what) throw new Error('Decision must have "what"');
    return this.update((state) => {
      const nextId = `D${String((state.decisions?.length || 0) + 1).padStart(3, '0')}`;
      state.decisions = state.decisions || [];
      state.decisions.push({
        id: nextId,
        phase: phase || state.current_phase,
        by: by || 'unknown',
        what,
        when: new Date().toISOString()
      });
      return state;
    });
  }

  /**
   * Open a question.
   */
  async addQuestion({ text, from, to, phase }) {
    if (!text) throw new Error('Question must have "text"');
    return this.update((state) => {
      const nextId = `Q${String((state.open_questions?.length || 0) + 1).padStart(3, '0')}`;
      state.open_questions = state.open_questions || [];
      state.open_questions.push({
        id: nextId,
        phase: phase || state.current_phase,
        from: from || 'unknown',
        to: to || 'user',
        text,
        status: 'pending'
      });
      return state;
    });
  }

  /**
   * Update the status of an open question (e.g. answered, dropped, blocker).
   */
  async updateQuestionStatus(questionId, status) {
    const allowed = ['pending', 'answered', 'dropped', 'blocker'];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid question status "${status}". Allowed: ${allowed.join(', ')}`);
    }
    return this.update((state) => {
      const q = (state.open_questions || []).find((x) => x.id === questionId);
      if (!q) throw new Error(`Question "${questionId}" not found`);
      q.status = status;
      return state;
    });
  }

  /**
   * Produce the `<project_state_context>` block that agents consume.
   * Returns a string ready for prompt injection.
   */
  async renderContext() {
    const state = await this.read();

    const lines = [];
    lines.push('<project_state_context>');
    lines.push(`Project: ${state.project.name} (${state.project.id})`);
    lines.push(`Current phase: ${state.current_phase}`);
    if (state.preset) lines.push(`Preset: ${state.preset}`);
    if (state.target_engine) lines.push(`Engine: ${state.target_engine}`);
    lines.push('');

    if (state.phases_completed?.length) {
      lines.push(`Completed phases: ${state.phases_completed.join(', ')}`);
    }

    for (const phase of [1, 2, 3, 4]) {
      const p = state.phase_progress?.[String(phase)];
      if (!p || p.status === 'not_started') continue;
      lines.push('');
      lines.push(`Phase ${phase} (${p.status}):`);
      if (p.completion_pct != null) lines.push(`  - Completion: ${p.completion_pct}%`);
      for (const d of p.deliverables || []) {
        lines.push(`  - [${d.verified ? '✓' : ' '}] ${d.id} → ${d.path}`);
      }
    }

    if (state.decisions?.length) {
      lines.push('');
      lines.push('Key decisions:');
      for (const d of state.decisions.slice(-5)) {
        lines.push(`  - ${d.id} (phase ${d.phase}, ${d.by}): ${d.what}`);
      }
    }

    const openQs = (state.open_questions || []).filter((q) => q.status === 'pending' || q.status === 'blocker');
    if (openQs.length) {
      lines.push('');
      lines.push('Open questions:');
      for (const q of openQs) {
        lines.push(`  - ${q.id} [${q.status}] (${q.from} → ${q.to}): ${q.text}`);
      }
    }

    lines.push('</project_state_context>');
    return lines.join('\n');
  }

  /**
   * Validate the current state file against the schema.
   */
  async validate() {
    if (!(await this.exists())) {
      return { valid: false, errors: ['State file does not exist'] };
    }
    const validator = await this._getValidator();
    return validator.validateFile('project-state', this.statePath);
  }

  // -- Internals -------------------------------------------------------------

  async _writeState(state) {
    state.project = state.project || {};
    state.project.updated_at = new Date().toISOString();

    const validator = await this._getValidator();
    const result = validator.validate('project-state', state);
    if (!result.valid) {
      throw new Error(
        `Refusing to write invalid state:\n${result.errors.join('\n')}`
      );
    }

    await this.fileManager.writeYaml(this.statePath, state);
  }

  _assertPhase(p) {
    if (![1, 2, 3, 4].includes(p)) {
      throw new Error(`Invalid phase: ${p}. Must be 1-4.`);
    }
  }

  _slugify(name) {
    return String(name)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'my-game';
  }
}
