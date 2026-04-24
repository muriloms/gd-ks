import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { EventLogger } from '../../src/core/state/event-logger.js';
import { createSandbox } from '../helpers/sandbox.js';

describe('EventLogger', () => {
  let sandbox;
  let logger;

  beforeEach(async () => {
    sandbox = await createSandbox('event-logger');
    logger = new EventLogger({ projectRoot: sandbox.path });
  });

  afterEach(async () => {
    await sandbox.cleanup();
  });

  describe('log()', () => {
    it('requires a type field', async () => {
      await assert.rejects(() => logger.log({}), /must have a "type"/);
      await assert.rejects(() => logger.log(null), /must have a "type"/);
    });

    it('appends an event with auto timestamp', async () => {
      const entry = await logger.log({ type: 'test', value: 42 });
      assert.equal(entry.type, 'test');
      assert.equal(entry.value, 42);
      assert.ok(entry.timestamp);
      assert.match(entry.timestamp, /^\d{4}-\d{2}-\d{2}T/);
    });

    it('creates the log file if missing', async () => {
      await logger.log({ type: 'first' });
      const all = await logger.readAll();
      assert.equal(all.length, 1);
    });

    it('appends multiple events as separate lines', async () => {
      await logger.log({ type: 'a' });
      await logger.log({ type: 'b' });
      await logger.log({ type: 'c' });
      const all = await logger.readAll();
      assert.equal(all.length, 3);
      assert.deepEqual(all.map((e) => e.type), ['a', 'b', 'c']);
    });
  });

  describe('readAll()', () => {
    it('returns empty array when file does not exist', async () => {
      const events = await logger.readAll();
      assert.deepEqual(events, []);
    });

    it('respects limit by slicing from the end', async () => {
      for (let i = 0; i < 10; i++) await logger.log({ type: 'e', i });
      const events = await logger.readAll({ limit: 3 });
      assert.equal(events.length, 3);
      assert.deepEqual(events.map((e) => e.i), [7, 8, 9]);
    });

    it('filters by type', async () => {
      await logger.log({ type: 'a' });
      await logger.log({ type: 'b' });
      await logger.log({ type: 'a' });
      const events = await logger.readAll({ filterType: 'a' });
      assert.equal(events.length, 2);
      for (const e of events) assert.equal(e.type, 'a');
    });

    it('survives corrupt lines without crashing', async () => {
      await logger.log({ type: 'ok' });
      // Manually write a corrupt line
      const { appendFile } = await import('fs/promises');
      await appendFile(logger.logPath, 'not-json-at-all\n', 'utf8');
      await logger.log({ type: 'ok2' });

      const events = await logger.readAll();
      assert.equal(events.length, 3);
      assert.equal(events[0].type, 'ok');
      assert.ok(events[1]._parse_error);
      assert.equal(events[2].type, 'ok2');
    });
  });

  describe('readLast()', () => {
    it('returns the last N events', async () => {
      for (let i = 0; i < 5; i++) await logger.log({ type: 't', i });
      const last2 = await logger.readLast(2);
      assert.deepEqual(last2.map((e) => e.i), [3, 4]);
    });
  });
});
