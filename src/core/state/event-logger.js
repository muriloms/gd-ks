/**
 * GD-KS Event Logger
 *
 * Append-only NDJSON log of everything that happens in a project:
 * phase transitions, decisions, deliverables added, handoffs, etc.
 *
 * Stored at `_gdks/_state/history/events.ndjson`.
 *
 * Rationale (ADR-002): NDJSON is trivially appendable, human-readable,
 * and tool-friendly (jq, grep). YAML can't be appended safely without
 * parsing the full file.
 */

import { join } from 'path';
import { appendFile, readFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const HISTORY_RELATIVE_PATH = join('_gdks', '_state', 'history', 'events.ndjson');

export class EventLogger {
  /**
   * @param {object} options
   * @param {string} options.projectRoot
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.logPath = join(this.projectRoot, HISTORY_RELATIVE_PATH);
  }

  /**
   * Append an event. Each event gets a timestamp automatically.
   *
   * @param {object} event - must have at least { type }
   */
  async log(event) {
    if (!event || !event.type) {
      throw new Error('Event must have a "type" field');
    }
    const entry = {
      timestamp: new Date().toISOString(),
      ...event
    };
    await mkdir(dirname(this.logPath), { recursive: true });
    await appendFile(this.logPath, JSON.stringify(entry) + '\n', 'utf8');
    return entry;
  }

  /**
   * Read all events. Cheap for normal project sizes (< a few thousand events).
   * For very large histories use readStream() instead.
   */
  async readAll({ limit, filterType } = {}) {
    let content;
    try {
      content = await readFile(this.logPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
    const lines = content.split('\n').filter(Boolean);
    let events = lines.map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        // Corrupt line — skip but record
        return { _parse_error: err.message, _line: i + 1, _raw: line };
      }
    });

    if (filterType) {
      events = events.filter((e) => e.type === filterType);
    }
    if (limit != null && events.length > limit) {
      events = events.slice(-limit);
    }
    return events;
  }

  /**
   * Read last N events (convenience).
   */
  async readLast(n = 20) {
    return this.readAll({ limit: n });
  }
}
