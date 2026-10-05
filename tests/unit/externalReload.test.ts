// AM-1: a save replaced by another program (the admin dashboard) is adopted, never overwritten.
import { describe, expect, it } from 'vitest';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { fakeClock } from '../../src/core/clock';
import { mulberry32 } from '../../src/core/rng';
import { parseSave } from '../../src/core/save/migrate';
import { SAVE_CHANGED_EXTERNALLY, type SaveStorage } from '../../src/core/save/port';
import type { SaveGame } from '../../src/core/types';
import { createGameStore } from '../../src/app/gameStore';

/** A save file with the desktop rules: a write after an outside edit is refused until re-read. */
function fileStorage() {
  let file: string | null = null;
  let version = 0;
  let known = -1;
  let notify: (() => void) | null = null;
  const storage: SaveStorage = {
    async load() {
      known = version;
      if (file === null) return { kind: 'empty' };
      const r = parseSave(file);
      return r.ok ? { kind: 'ok', save: r.save, source: 'primary' } : { kind: 'recovery' };
    },
    async save(s) {
      if (known !== version) throw new Error(SAVE_CHANGED_EXTERNALLY);
      file = JSON.stringify(s);
      known = ++version;
    },
    onExternalChange: (fn) => void (notify = fn),
  };
  return {
    storage,
    gold: () => (JSON.parse(file!) as SaveGame).player.gold,
    /** The admin dashboard writes the file; `watch` = the file watcher noticed it. */
    adminSetGold(gold: number, watch: boolean) {
      const s = JSON.parse(file!) as SaveGame;
      file = JSON.stringify({ ...s, player: { ...s.player, gold } });
      version++;
      if (watch) notify?.();
    },
  };
}

const settle = () => new Promise((r) => setTimeout(r, 0));
const guard = { start: async () => true, isReadOnly: () => false, close: () => {} };

function makeStore(f: ReturnType<typeof fileStorage>) {
  return createGameStore({
    storage: f.storage,
    instanceGuard: guard,
    clock: fakeClock(1_700_000_000_000),
    rng: mulberry32(3),
    every: () => 1,
    cancel: () => {},
    sleep: async () => {},
  });
}

describe('external save edits (AM-1)', () => {
  it('the watcher notice reloads the edited save into the running game', async () => {
    const f = fileStorage();
    const store = makeStore(f);
    await store.init();
    f.adminSetGold(123_456, true);
    await settle();
    expect(store.getSnapshot().save!.player.gold).toBe(123_456);
    await store.persistNow();
    expect(f.gold()).toBe(123_456); // the game's next write keeps the admin value
  });

  it('without a notice, the next write is refused and the edit is adopted, not overwritten', async () => {
    const f = fileStorage();
    const store = makeStore(f);
    await store.init();
    f.adminSetGold(77_777, false);
    await store.dispatch((s, c) => buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'FEMALE' }, c));
    await settle();
    expect(f.gold()).toBe(77_777);
    expect(store.getSnapshot().save!.player.gold).toBe(77_777);
    expect(store.getSnapshot().saveError).toBe(false);
  });
});
