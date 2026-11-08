import { describe, expect, it } from 'vitest';
import { createPersister } from '../../src/core/world/persister';

function make(results: boolean[] = []) {
  const calls: number[] = [];
  let release: (() => void) | null = null;
  let dead = false;
  let failing = false;
  const sleeps: number[] = [];
  const p = createPersister({
    attempt: () => {
      calls.push(calls.length);
      const ok = results.length ? results.shift()! : true;
      failing = !ok;
      return new Promise<boolean>((r) => { release = () => r(ok); });
    },
    sleep: (ms) => { sleeps.push(ms); return Promise.resolve(); },
    retryMs: [1, 5, 30],
    isDead: () => dead,
    wantsRetry: () => failing,
  });
  return { p, calls, sleeps, finish: () => release?.(), kill: () => (dead = true) };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('persister (B1)', () => {
  it('collapses many persist() calls made during a write into one follow-up write', async () => {
    const t = make();
    const first = t.p.persist();
    for (let i = 0; i < 10; i++) void t.p.persist();
    expect(t.calls).toHaveLength(1);
    t.finish();
    await tick();
    expect(t.calls).toHaveLength(2); // exactly one coalesced follow-up
    t.finish();
    await first;
    expect(t.calls).toHaveLength(2);
    await t.p.idle();
  });

  it('a failed attempt is retried with backoff and the failure is not dropped', async () => {
    const t = make([false, false, true]);
    void t.p.persist();
    t.finish();
    await tick();
    expect(t.sleeps).toEqual([1]);
    expect(t.calls).toHaveLength(2); // the retry ran
    t.finish();
    await tick();
    expect(t.sleeps).toEqual([1, 5]);
    expect(t.calls).toHaveLength(3);
    t.finish();
    await t.p.idle();
  });

  it('no retry once disposed', async () => {
    const t = make([false]);
    t.kill();
    void t.p.persist();
    t.finish();
    await t.p.idle();
    expect(t.sleeps).toEqual([]);
  });
});
