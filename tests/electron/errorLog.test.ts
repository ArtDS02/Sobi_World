import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createErrorLog } from '../../electron/errorLog';
import { createReloadLimiter } from '../../electron/reloadLimiter';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'sobi-log-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('error log', () => {
  it('appends timestamped lines', async () => {
    const log = createErrorLog({ dir: join(dir, 'logs'), now: () => 0 });
    await log.log('tick', 'boom\nstack line');
    await log.log('window', 'again');
    const text = await readFile(join(dir, 'logs', 'error.log'), 'utf8');
    expect(text).toBe('1970-01-01T00:00:00.000Z [tick] boom\n  stack line\n1970-01-01T00:00:00.000Z [window] again\n');
  });

  it('rotates by size and keeps a bounded number of files', async () => {
    const log = createErrorLog({ dir, now: () => 0, maxBytes: 200, keep: 2 });
    for (let i = 0; i < 30; i++) log.log('x', `line ${i} ${'.'.repeat(40)}`);
    await log.idle();
    expect((await readdir(dir)).sort()).toEqual(['error.1.log', 'error.2.log', 'error.log']);
    expect((await readFile(join(dir, 'error.log'), 'utf8')).length).toBeLessThanOrEqual(200);
  });

  it('never throws when the folder cannot be written', async () => {
    const log = createErrorLog({ dir: join(dir, 'a\0b'), now: () => 0 });
    await expect(log.log('x', 'y')).resolves.toBeUndefined();
  });
});

describe('reload limiter', () => {
  it('allows max reloads per window, then again after it passes', () => {
    let t = 0;
    const l = createReloadLimiter(3, 1000, () => t);
    expect([l.allow(), l.allow(), l.allow(), l.allow()]).toEqual([true, true, true, false]);
    t = 1001;
    expect(l.allow()).toBe(true);
  });
});
