// AM-1: `npm run dev` carries an IndexedDB farm over to the dev save file once, only when newer.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LoadResult, SaveStorage } from '../../src/core/save/port';
import { createDevFileSaveStorage } from '../../src/platform/web/devFileSaves';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';
import { parseWorldSave, world } from './worldKit';

const save = (gold: number, at: number) => {
  const s = makeState([makePig()]);
  return world({ ...s, updatedAt: at, trough: { ...s.trough, lastResolvedAt: at }, player: { ...s.player, gold } });
};
const legacy = (r: LoadResult): SaveStorage => ({ load: async () => r, save: async () => {} });

/** The dev save API answering with `file` (null = no save.json); records writes. */
function api(file: ReturnType<typeof save> | null) {
  const writes: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: { body?: string }) => {
    if (url.endsWith('load')) return Response.json(file ? [{ source: 'save', json: JSON.stringify(file) }] : []);
    writes.push(JSON.parse(init!.body!).json as string);
    return Response.json(null);
  });
  return writes;
}
const once = () => {
  let done = false;
  return { get: () => done, set: () => void (done = true) };
};

afterEach(() => vi.unstubAllGlobals());

describe('dev file save storage (AM-1)', () => {
  it('no file: the IndexedDB farm is written to the file', async () => {
    const writes = api(null);
    const r = await createDevFileSaveStorage(legacy({ kind: 'ok', save: save(900, 5), source: 'primary', fromVersion: 8 }), parseWorldSave, once()).load();
    expect(r.kind === 'ok' && r.save.wallet.coins).toBe(900);
    expect(writes).toHaveLength(1);
  });

  it('a newer IndexedDB farm wins once; an older one never does', async () => {
    api(save(100, 10));
    const m = once();
    const newer = await createDevFileSaveStorage(legacy({ kind: 'ok', save: save(900, 20), source: 'primary', fromVersion: 8 }), parseWorldSave, m).load();
    expect(newer.kind === 'ok' && newer.save.wallet.coins).toBe(900);
    const again = await createDevFileSaveStorage(legacy({ kind: 'ok', save: save(999, 30), source: 'primary', fromVersion: 8 }), parseWorldSave, m).load();
    expect(again.kind === 'ok' && again.save.wallet.coins).toBe(100); // migrated already: the file rules
    const older = await createDevFileSaveStorage(legacy({ kind: 'ok', save: save(5, 1), source: 'primary', fromVersion: 8 }), parseWorldSave, once()).load();
    expect(older.kind === 'ok' && older.save.wallet.coins).toBe(100);
  });
});
