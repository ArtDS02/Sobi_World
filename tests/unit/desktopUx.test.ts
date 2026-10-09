// R11: away summary, tutorial, settings / recovery view-models, store catch-up + backup restore.
import { createFarmGameStore, world } from './worldKit';
import { describe, expect, it } from 'vitest';
import { setSetting } from '../../src/areas/farm/logic/actions/setSetting';
import { fakeClock } from '../../src/core/clock';
import { SAVE } from '../../src/core/config/save';
import type { GameEvent } from '../../src/areas/farm/logic/events';
import { mulberry32 } from '../../src/core/rng';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import type { BackupStore, InstanceGuard, LoadResult, SaveStorage } from '../../src/core/save/port';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { createFeedbackDirector } from '../../src/areas/farm/scene/feedback/FeedbackDirector';
import { formatTime } from '../../src/i18n/format';
import { vi } from '../../src/i18n/vi';
import { type CatchupInfo } from '../../src/app/gameStore';
import { awayVm } from '../../src/areas/farm/ui/awayVm';
import { backupsVm, creditLines, exportReminderDue } from '../../src/areas/farm/ui/settingsVm';
import { tutorialVm } from '../../src/areas/farm/ui/tutorialVm';
import { ctx, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const MIN = 60_000;
const HOUR = 60 * MIN;
const T0 = 1_790_000_000_000;
const SAVE_START_GOLD = newGame({ now: 0, rng: mulberry32(0) }).player.gold;

describe('away summary (spec §9.5)', () => {
  const now = T0 + 6 * HOUR;
  const starving = (id: string, slot: number) =>
    makePig({ id, slotIndex: slot, hunger: 0, growthProgress: 40 });

  it('the trough line comes first: when it ran dry, how many pigs stalled, for how long', () => {
    const events: GameEvent[] = [
      { type: 'TROUGH_EMPTY', at: T0 + HOUR },
      { type: 'PIG_HUNGRY_ZERO', pigId: 'a', at: T0 + 2 * HOUR, stalled: true },
      { type: 'PIG_HUNGRY_ZERO', pigId: 'b', at: T0 + 3 * HOUR, stalled: true },
      { type: 'PIG_BECAME_ADULT', pigId: 'c' },
      { type: 'ORDER_NEW', orderId: 'o' },
    ];
    const after = farm([starving('a', 0), starving('b', 1)]);
    const vm = awayVm(events, after, now, 6 * HOUR);
    expect(vm.troughRanOut).toBe(true);
    expect(vm.trough).toBe(
      vi.away.troughRanOut
        .replace('{time}', formatTime(T0 + HOUR))
        .replace('{count}', '2')
        .replace('{duration}', '4 giờ'),
    );
    expect(vm.lines.map((l) => l.text)).toEqual(['1 heo đã trưởng thành', '1 đơn hàng mới']);
    expect(vm.troughAction).toEqual({ label: 'Đổ máng', goto: { target: 'trough' } });
  });

  it('a full trough says so; a quiet absence says "Mọi thứ vẫn ổn."', () => {
    const vm = awayVm([], farm([makePig({ hunger: 80 })]), now, 2 * HOUR);
    expect(vm.troughRanOut).toBe(false);
    expect(vm.trough).toBe(vi.away.troughOk);
    expect(vm.lines).toEqual([{ text: vi.away.nothing, tone: 'info' }]);
    expect(vm.troughAction).toBeUndefined();
  });

  it('pigs already starving at departure count, from the departure time', () => {
    const vm = awayVm([], farm([starving('a', 0)]), now, 3 * HOUR);
    expect(vm.troughRanOut).toBe(true);
    expect(vm.trough).toContain('1 heo ngừng lớn trong 3 giờ');
  });
});

describe('away summary: what needs care now, with a way there (GĐ2)', () => {
  const now = T0 + 30 * HOUR;
  it('a critical pig, an ill one and manure each get a line with a button to the place; the worst first', () => {
    const critical = makePig({ id: 'c', slotIndex: 0, isSick: true, lastSickAt: now - 50 * HOUR, growthProgress: 100 });
    const ill = makePig({ id: 'i', slotIndex: 1, isSick: true, lastSickAt: now - 2 * HOUR, growthProgress: 100 });
    const after = { ...farm([ill, critical]), manure: 4 };
    const vm = awayVm([{ type: 'PIG_BECAME_CRITICAL', pigId: 'c' }], after, now, 30 * HOUR);
    expect(vm.lines.map((l) => [l.text, l.tone, l.action?.label, l.action?.goto])).toEqual([
      ['1 heo đang nguy kịch — chữa ngay!', 'alert', 'Xem heo', { target: 'pig', id: 'c' }],
      ['1 heo đang bệnh, cần thuốc', 'warn', 'Xem heo', { target: 'pig', id: 'i' }],
      ['4 đống phân chưa dọn', 'info', 'Dọn phân', { target: 'well' }],
      ['1 heo đã nguy kịch', 'info', undefined, undefined],
    ]);
  });
});

describe('tutorial (spec §10.3)', () => {
  it('5 steps; steps 1–2 wait for a pig and food in the trough', () => {
    const empty = farm();
    expect(tutorialVm(empty, 0)?.next.reason).toBe(vi.tutorial.waiting);
    const withPig = farm([makePig()]);
    expect(tutorialVm(withPig, 0)?.next.reason).toBeNull();
    expect(tutorialVm(withPig, 1)?.next.reason).toBe(vi.tutorial.waiting);
    const fed = { ...withPig, trough: { ...withPig.trough, food: 5 } };
    expect(tutorialVm(fed, 1)?.next.reason).toBeNull();
    expect(tutorialVm(fed, 4)).toMatchObject({ last: true, progress: 'Bước 5/5' });
    expect(tutorialVm(fed, 5)).toBeNull();
  });

  it('tutorialDone (skip or finish) hides it, stored in the save', () => {
    const r = expectOk(setSetting(farm(), { key: 'tutorialDone', value: true }, ctx()));
    expect(r.state.settings.tutorialDone).toBe(true);
    expect(tutorialVm(r.state, 0)).toBeNull();
    const rm = expectOk(setSetting(farm(), { key: 'reduceMotion', value: true }, ctx()));
    expect(rm.state.settings.reduceMotion).toBe(true);
  });
});

describe('settings view-model (spec §9.3)', () => {
  const DAY = 24 * HOUR;
  it('export reminder after more than 7 days (from creation when never exported)', () => {
    const s = { ...farm(), createdAt: T0 };
    expect(exportReminderDue(s, T0 + 7 * DAY)).toBe(false);
    expect(exportReminderDue(s, T0 + 7 * DAY + 1)).toBe(true);
    const exported = { ...s, settings: { ...s.settings, lastExportAt: T0 + 5 * DAY } };
    expect(exportReminderDue(exported, T0 + 8 * DAY)).toBe(false);
  });

  it('backups: loading, empty, unavailable, listed', () => {
    expect(backupsVm(null).backupsNote).toBe(vi.settings.backupsLoading);
    expect(backupsVm([]).backupsNote).toBe(vi.settings.backupsEmpty);
    expect(backupsVm(undefined).backupsNote).toBe(vi.settings.backupsUnavailable);
    const vm = backupsVm([{ name: 'save-1.json', at: T0 }]);
    expect(vm.backupsNote).toBeNull();
    expect(vm.backups[0]).toMatchObject({ name: 'save-1.json' });
  });

  it('credits come from manifest rows with a credit', () => {
    const manifest = {
      audio: [{ id: 'music_farm', credit: 'Ai đó', license: 'CC0' }, { id: 'ui_click' }],
      layout: {},
    } as unknown as Parameters<typeof creditLines>[0];
    expect(creditLines(manifest)).toEqual(['music_farm: Ai đó (CC0)']);
  });
});

/** In-memory platform with backups. */
function platform(start: LoadResult, backup: FarmGame | null) {
  const backupWorld = backup && world(backup);
  let current = start;
  const storage: SaveStorage = {
    load: async () => current,
    save: async (s) => {
      current = { kind: 'ok', save: s, source: 'primary', fromVersion: 8 };
    },
  };
  const backups: BackupStore = {
    list: async () => (backup ? [{ name: 'b1', at: T0 }] : []),
    restore: async (name) => {
      if (name !== 'b1' || !backupWorld) throw new Error('missing');
      current = { kind: 'ok', save: backupWorld, source: 'primary', fromVersion: 8 };
    },
    backupBeforeReset: async () => {},
    backupBeforeMigration: async () => {},
  };
  const instanceGuard: InstanceGuard = {
    start: async () => true,
    isReadOnly: () => false,
    close() {},
  };
  return { storage, backups, instanceGuard };
}
const quiet = {
  every: () => 0,
  cancel: () => {},
  sleep: async () => {},
  page: null,
  prefersReducedMotion: () => false,
};

describe('store: catch-up info and backup restore (spec §9.2, §9.5)', () => {
  it('the load catch-up reports how long the world slept, even with no events', async () => {
    const save = newGame({ now: T0, rng: mulberry32(1) });
    const clock = fakeClock(T0 + 20 * MIN);
    const p = platform({ kind: 'ok', save: world(save), source: 'primary', fromVersion: 8 }, null);
    const store = createFarmGameStore({ ...p, ...quiet, clock, rng: mulberry32(2) });
    const seen: [number, CatchupInfo | undefined][] = [];
    store.onEvents((events, origin, info) => {
      if (origin === 'catchup') seen.push([events.length, info]);
    });
    await store.init();
    expect(seen).toEqual([[0, { awayMs: 20 * MIN }]]);
  });

  it('a short catch-up with nothing to say stays silent', async () => {
    const save = newGame({ now: T0, rng: mulberry32(1) });
    const p = platform({ kind: 'ok', save: world(save), source: 'primary', fromVersion: 8 }, null);
    const store = createFarmGameStore({
      ...p,
      ...quiet,
      clock: fakeClock(T0 + MIN),
      rng: mulberry32(2),
    });
    let calls = 0;
    store.onEvents(() => (calls += 1));
    await store.init();
    expect(calls).toBe(0);
  });

  it('recovery → restore a backup → ready; a failing restore is rejected', async () => {
    const backup = newGame({ now: T0, rng: mulberry32(3) });
    const p = platform({ kind: 'recovery' }, backup);
    const store = createFarmGameStore({ ...p, ...quiet, clock: fakeClock(T0), rng: mulberry32(2) });
    const errors: string[] = [];
    store.onReject((e) => errors.push(e));
    expect(await store.init()).toBe('recovery');
    expect(await store.listBackups()).toEqual([{ name: 'b1', at: T0 }]);
    expect(await store.restoreBackup('nope')).toBe(false);
    expect(errors).toEqual(['SAVE_CORRUPT']);
    expect(await store.restoreBackup('b1')).toBe(true);
    expect(store.getSnapshot().status).toBe('ready');
  });

  it('without platform backups, restore is refused', async () => {
    const save = newGame({ now: T0, rng: mulberry32(1) });
    const p = platform({ kind: 'ok', save: world(save), source: 'primary', fromVersion: 8 }, null);
    const store = createFarmGameStore({
      ...p,
      ...quiet,
      backups: null,
      clock: fakeClock(T0),
      rng: mulberry32(2),
    });
    await store.init();
    expect(await store.restoreBackup('b1')).toBe(false);
  });
});

describe('FeedbackDirector: long catch-up → away summary instead of toasts', () => {
  it('routes by SAVE.AWAY_SUMMARY_MIN_MS', () => {
    let listener: ((e: GameEvent[], o: 'catchup', i?: CatchupInfo) => void) | null = null;
    const save = farm([makePig()]);
    const log: string[] = [];
    createFeedbackDirector({
      store: {
        getSnapshot: () => ({
          status: 'ready',
          save,
          readOnly: false,
          loadSource: null,
          saveError: false,
          clockRewound: false,
        }),
        subscribe: () => () => {},
        onEvents: (fn) => ((listener = fn as typeof listener), () => {}),
        onReject: () => () => {},
      },
      effects: () => ({ animate() {}, burst() {}, float() {}, life() {} }),
      audio: { play: () => {} },
      toast: (m) => log.push(`toast:${m}`),
      away: (events, ms) => log.push(`away:${events.length}:${ms}`),
    });
    const sick: GameEvent[] = [{ type: 'PIG_BECAME_SICK', pigId: 'pig-1' }];
    listener!(sick, 'catchup', { awayMs: SAVE.AWAY_SUMMARY_MIN_MS });
    listener!(sick, 'catchup', { awayMs: SAVE.AWAY_SUMMARY_MIN_MS - 1 });
    expect(log).toEqual([`away:1:${SAVE.AWAY_SUMMARY_MIN_MS}`, 'toast:Ủn Hồng bị bệnh rồi!']);
  });
});

describe('store: play again (DECISIONS PG-4)', () => {
  const rich = () => {
    const s = newGame({ now: T0, rng: mulberry32(1) });
    return { ...s, player: { ...s.player, gold: 99_999, xp: 900 } };
  };

  it('backs the farm up first, then starts a new farm and writes it', async () => {
    const p = platform({ kind: 'ok', save: world(rich()), source: 'primary', fromVersion: 8 }, null);
    const order: string[] = [];
    const save = p.storage.save;
    p.storage.save = async (s) => {
      order.push(`save:${s.wallet.coins}`);
      await save(s);
    };
    p.backups.backupBeforeReset = async () => void order.push('backup');
    const store = createFarmGameStore({ ...p, ...quiet, clock: fakeClock(T0), rng: mulberry32(2) });
    await store.init();
    order.length = 0;
    expect(await store.resetGame()).toBe(true);
    expect(order[0]).toBe('save:99999');
    expect(order[1]).toBe('backup');
    expect(order.at(-1)).toBe(`save:${SAVE_START_GOLD}`);
    expect(store.getSnapshot().save?.player.xp).toBe(0);
  });

  it('a failed backup keeps the current farm', async () => {
    const p = platform({ kind: 'ok', save: world(rich()), source: 'primary', fromVersion: 8 }, null);
    p.backups.backupBeforeReset = async () => {
      throw new Error('disk full');
    };
    const store = createFarmGameStore({ ...p, ...quiet, clock: fakeClock(T0), rng: mulberry32(2) });
    const errors: string[] = [];
    store.onReject((e) => errors.push(e));
    await store.init();
    expect(await store.resetGame()).toBe(false);
    expect(errors).toEqual(['INVALID_REQUEST']);
    expect(store.getSnapshot().save?.player.gold).toBe(99_999);
  });
});
