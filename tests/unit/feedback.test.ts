// FeedbackDirector contract (spec §11.3, D25).
import { describe, expect, it } from 'vitest';
import type { ErrorCode } from '../../src/core/config/errors';
import { GAME_EVENT_TYPES, type GameEvent } from '../../src/core/events';
import type { SaveGame } from '../../src/core/types';
import { createFeedbackDirector } from '../../src/game/feedback/FeedbackDirector';
import { feedbackPlan } from '../../src/game/feedback/feedbackPlan';
import { FEEDBACK_TABLE, REJECT_ROW } from '../../src/game/feedback/feedbackTable';
import { toastText } from '../../src/game/feedback/toastText';
import { vi } from '../../src/i18n/vi';
import type { EventListener, EventOrigin, StoreSnapshot } from '../../src/store/gameStore';
import { farm } from './actionKit';
import { makePig } from './pigFactory';

/** One sample event per type, for totality checks. */
const SAMPLES: Record<(typeof GAME_EVENT_TYPES)[number], GameEvent> = {
  PIG_HUNGRY_ZERO: { type: 'PIG_HUNGRY_ZERO', pigId: 'pig-1', at: 0, stalled: true },
  PIG_BECAME_SICK: { type: 'PIG_BECAME_SICK', pigId: 'pig-1' },
  PIG_BECAME_ADULT: { type: 'PIG_BECAME_ADULT', pigId: 'pig-1' },
  BIRTH: { type: 'BIRTH', motherId: 'pig-1', childId: 'pig-1', childBreed: 'PIG_EARTH_PINK' },
  TROUGH_EMPTY: { type: 'TROUGH_EMPTY', at: 0 },
  ORDER_NEW: { type: 'ORDER_NEW', orderId: 'o' },
  ORDER_EXPIRED: { type: 'ORDER_EXPIRED', orderId: 'o' },
  LEVEL_UP: { type: 'LEVEL_UP', level: 2 },
  DISCOVERY: { type: 'DISCOVERY', kind: 'BREED', id: 'PIG_EARTH_PINK', gold: 500 },
  PIG_BOUGHT: { type: 'PIG_BOUGHT', pigId: 'pig-1', breed: 'PIG_EARTH_PINK' },
  PIG_FED: { type: 'PIG_FED', pigId: 'pig-1' },
  PIG_CLEANED: { type: 'PIG_CLEANED', pigIds: ['pig-1', 'pig-2'] },
  PIG_TREATED: { type: 'PIG_TREATED', pigId: 'pig-1' },
  TROUGH_FILLED: { type: 'TROUGH_FILLED', units: 5, fromInventory: 5, gold: 0 },
  ITEM_BOUGHT: { type: 'ITEM_BOUGHT', itemId: 'FOOD_BASIC', quantity: 2, gold: -50 },
  PIG_RENAMED: { type: 'PIG_RENAMED', pigId: 'pig-1' },
  PIG_SOLD: { type: 'PIG_SOLD', pigId: 'pig-1', gold: 1200 },
  BREEDING_STARTED: {
    type: 'BREEDING_STARTED',
    motherId: 'pig-1',
    fatherId: 'pig-2',
    endsAt: 3_600_000,
  },
  SLOT_BOUGHT: { type: 'SLOT_BOUGHT', slots: 5, gold: -2000 },
  ORDER_FULFILLED: { type: 'ORDER_FULFILLED', orderId: 'o', gold: 800 },
};

describe('feedback table (§11.3)', () => {
  it('has a row for every GameEvent type, and nothing else', () => {
    expect(Object.keys(FEEDBACK_TABLE).sort()).toEqual([...GAME_EVENT_TYPES].sort());
  });

  it('a row toasts exactly when its event has toast text', () => {
    const s = farm([makePig()]);
    for (const type of GAME_EVENT_TYPES) {
      expect(toastText(SAMPLES[type], s, s) !== null, type).toBe(FEEDBACK_TABLE[type].toast);
    }
  });

  it('matches the spec rows', () => {
    expect(FEEDBACK_TABLE.PIG_BOUGHT).toMatchObject({ animation: 'bounce', sound: 'ui_click' });
    expect(FEEDBACK_TABLE.PIG_SOLD).toMatchObject({ vfx: ['fx_coin'], sound: 'coin_collect' });
    expect(FEEDBACK_TABLE.TROUGH_FILLED.toast).toBe(false);
    expect(REJECT_ROW).toMatchObject({ sound: 'ui_error', toast: true });
  });
});

describe('feedbackPlan', () => {
  it('catch-up never animates, bursts or sounds; toasts stay', () => {
    for (const type of GAME_EVENT_TYPES) {
      const p = feedbackPlan(SAMPLES[type], 'catchup', false);
      expect(p.animations, type).toEqual([]);
      expect(p.vfx, type).toEqual([]);
      expect(p.sound, type).toBeNull();
      expect(p.toast, type).toBe(FEEDBACK_TABLE[type].toast);
    }
  });

  it('reduceMotion drops tweens and particles, keeps sound and toast', () => {
    const p = feedbackPlan(SAMPLES.PIG_BOUGHT, 'action', true);
    expect(p).toEqual({ animations: [], vfx: [], sound: 'ui_click', toast: true });
  });

  it('PIG_CLEANED animates each pig, staggered', () => {
    const p = feedbackPlan(SAMPLES.PIG_CLEANED, 'action', false);
    expect(p.animations.map((a) => [a.target, a.delayMs > 0])).toEqual([
      [{ kind: 'pig', pigId: 'pig-1' }, false],
      [{ kind: 'pig', pigId: 'pig-2' }, true],
    ]);
    expect(p.vfx.map((v) => v.fx)).toEqual(['fx_bubble', 'fx_bubble']);
  });

  it('trough and board events target the object, LEVEL_UP the top of the scene', () => {
    const target = (e: GameEvent) => feedbackPlan(e, 'tick', false);
    expect(target(SAMPLES.TROUGH_FILLED).animations[0]?.target).toEqual({ kind: 'trough' });
    expect(target(SAMPLES.ORDER_NEW).animations[0]?.target).toEqual({ kind: 'board' });
    expect(target(SAMPLES.LEVEL_UP).vfx[0]?.target).toEqual({ kind: 'top' });
  });
});

/** Minimal store double: push snapshots, events and rejections by hand. */
function fakeStore(save: SaveGame) {
  let snap = { save } as StoreSnapshot;
  const subs = new Set<(s: StoreSnapshot) => void>();
  const evs = new Set<EventListener>();
  const rejs = new Set<(e: ErrorCode) => void>();
  const on =
    <T>(set: Set<T>) =>
    (fn: T) => {
      set.add(fn);
      return () => set.delete(fn);
    };
  return {
    getSnapshot: () => snap,
    subscribe: on(subs),
    onEvents: on(evs),
    onReject: on(rejs),
    set(next: SaveGame) {
      snap = { save: next } as StoreSnapshot;
      subs.forEach((f) => f(snap));
    },
    emit: (events: GameEvent[], origin: EventOrigin) => evs.forEach((f) => f(events, origin)),
    reject: (e: ErrorCode) => rejs.forEach((f) => f(e)),
  };
}

function director(save: SaveGame) {
  const store = fakeStore(save);
  const log: string[] = [];
  createFeedbackDirector({
    store,
    effects: () => ({
      animate: (a, t) => log.push(`anim:${a}:${t.kind}`),
      burst: (fx, t) => log.push(`vfx:${fx}:${t.kind}`),
    }),
    audio: { play: (k) => log.push(`sound:${k}`) },
    toast: (m) => log.push(`toast:${m}`),
  });
  return { store, log };
}

describe('FeedbackDirector', () => {
  it('order per event: animation → VFX → sound → toast', () => {
    const { store, log } = director(farm([makePig()]));
    store.emit([SAMPLES.PIG_BOUGHT], 'action');
    expect(log).toEqual([
      'anim:bounce:pig',
      'vfx:fx_sparkle:pig',
      'sound:ui_click',
      'toast:Chào mừng Ủn Hồng về nông trại!',
    ]);
  });

  it('catch-up: toast only', () => {
    const { store, log } = director(farm([makePig()]));
    store.emit([SAMPLES.PIG_BECAME_SICK], 'catchup');
    expect(log).toEqual(['toast:Ủn Hồng bị bệnh rồi!']);
  });

  it('a sold pig is still named from the state before the action', () => {
    const { store, log } = director(farm([makePig()]));
    store.set(farm());
    store.emit([SAMPLES.PIG_SOLD], 'action');
    expect(log.at(-1)).toBe('toast:Đã bán Ủn Hồng được 1.200 vàng.');
  });

  it('reject → ui_error + toast with the reason', () => {
    const { store, log } = director(farm());
    store.reject('INSUFFICIENT_GOLD');
    expect(log).toEqual(['sound:ui_error', `toast:${vi.error.INSUFFICIENT_GOLD}`]);
  });

  it('reduceMotion from settings: no animation or VFX', () => {
    const base = farm([makePig()]);
    const { store, log } = director({
      ...base,
      settings: { ...base.settings, reduceMotion: true },
    });
    store.emit([SAMPLES.PIG_TREATED], 'action');
    expect(log).toEqual(['sound:ui_click', 'toast:Ủn Hồng đã khỏi bệnh.']);
  });
});
