/**
 * GD-KS Handoff Gate
 *
 * The orchestrator for moving from one phase to the next.
 * Ties together:
 *   - ContractLoader (load the handoff contract)
 *   - ContractValidator (check state meets contract)
 *   - StateManager (complete FROM phase, start TO phase)
 *   - CheckpointManager (snapshot state before transitioning)
 *   - EventLogger (audit the handoff)
 */

import { StateManager } from '../state/state-manager.js';
import { EventLogger } from '../state/event-logger.js';
import { CheckpointManager } from '../state/checkpoint-manager.js';
import { ContractLoader } from './contract-loader.js';
import { ContractValidator } from './contract-validator.js';

export class HandoffGate {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.stateManager = options.stateManager || new StateManager({ projectRoot: this.projectRoot });
    this.logger = options.logger || new EventLogger({ projectRoot: this.projectRoot });
    this.checkpoints = options.checkpoints || new CheckpointManager({ projectRoot: this.projectRoot });
    this.loader = options.loader || new ContractLoader({ projectRoot: this.projectRoot });
    this.validator = options.validator || new ContractValidator({ projectRoot: this.projectRoot });
  }

  /**
   * Execute a handoff from one phase to another.
   *
   * @param {object} options
   * @param {number} options.fromPhase
   * @param {number} options.toPhase
   * @param {boolean} [options.force=false] - Skip contract validation
   * @param {boolean} [options.dryRun=false] - Check only, do not mutate state
   */
  async handoff({ fromPhase, toPhase, force = false, dryRun = false }) {
    // 1. Load contract
    const contract = await this.loader.load(fromPhase, toPhase);
    if (contract.from_phase !== fromPhase || contract.to_phase !== toPhase) {
      throw new Error(
        `Contract mismatch: loaded contract is ${contract.from_phase}→${contract.to_phase}, expected ${fromPhase}→${toPhase}`
      );
    }

    // 2. Read current state
    const state = await this.stateManager.read();

    // 3. Run contract validation
    const report = await this.validator.check(contract, state);

    // 4. Decide
    if (!report.passed && !force) {
      return {
        success: false,
        reason: 'Contract validation failed',
        report
      };
    }

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        report
      };
    }

    // 5. Save checkpoint of FROM phase BEFORE mutating
    const checkpointPath = await this.checkpoints.save(fromPhase, state, { label: `handoff-to-${toPhase}` });

    // 6. Mutate state: complete FROM, start TO
    await this.stateManager.completePhase(fromPhase);
    await this.stateManager.startPhase(toPhase);

    // 7. Audit
    await this.logger.log({
      type: 'handoff',
      from_phase: fromPhase,
      to_phase: toPhase,
      forced: force,
      contract_passed: report.passed,
      checkpoint: checkpointPath
    });

    return {
      success: true,
      report,
      checkpoint: checkpointPath,
      forced: force && !report.passed
    };
  }
}
