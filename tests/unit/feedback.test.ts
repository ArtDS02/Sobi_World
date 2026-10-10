// FeedbackDirector contract (spec §11.3, D25).
import { describe, expect, it } from 'vitest';
import type { ErrorCode } from '../../src/core/config/errors';
import { GAME_EVENT_TYPES, type GameEvent } from '../../src/areas/farm/logic/events';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { createFeedbackDirector } from '../../src/areas/farm/scene/feedback/FeedbackDirector';
import { feedbackPlan } from '../../src/areas/farm/scene/feedback/feedbackPlan';
import { FEEDBACK_TABLE, REJECT_ROW } from '../../src/areas/farm/scene/feedback/feedbackTable';
import { toastText } from '../../src/areas/farm/scene/feedback/toastText';
import { vi } from '../../src/i18n/vi';
import type { EventListener, EventOrigin, FarmSnapshot as StoreSnapshot } from '../../src/areas/farm/store';
import { farm } from './actionKit';
import { makePig } from './pigFactory';

/** One sample event per type, for totality checks. */
const SAMPLES: Record<(typeof GAME_EVENT_TYPES)[number], GameEvent> = {
  PIG_HUNGRY_ZERO: { type: 'PIG_HUNGRY_ZERO', pigId: 'pig-1', at: 0, stalled: true },
  PIG_BECAME_SICK: { type: 'PIG_BECAME_SICK', pigId: 'pig-1' },
  PIG_NEED_DROPPED: { type: 'PIG_NEED_DROPPED', pigId: 'pig-1', need: 'hunger', level: 'low' },
  TROUGH_UPGRADED: { type: 'TROUGH_UPGRADED', level: 2, capacity: 80, gold: -1200 },
  MANURE_CLEANED: { type: 'MANURE_CLEANED', piles: 3, kept: 3 },
  ITEM_SOLD: { type: 'ITEM_SOLD', itemId: 'item_manure', quantity: 3, gold: 18 },
  PIG_BECAME_CRITICAL: { type: 'PIG_BECAME_CRITICAL', pigId: 'pig-1' },
  PIG_DIED: { type: 'PIG_DIED', pigId: 'pig-1', name: 'Ủn Hồng', breed: 'PIG_EARTH_PINK' },
  PIG_BECAME_ADULT: { type: 'PIG_BECAME_ADULT', pigId: 'pig-1' },
  PIG_ATE_FROM_TROUGH: { type: 'PIG_ATE_FROM_TROUGH', pigId: 'pig-1', meals: 1, hungerBefore: 50 },
  BIRTH: { type: 'BIRTH', motherId: 'pig-1', childId: 'pig-1', childBreed: 'PIG_EARTH_PINK' },
  TROUGH_EMPTY: { type: 'TROUGH_EMPTY', at: 0 },
  ORDER_NEW: { type: 'ORDER_NEW', orderId: 'o' },
  ORDER_EXPIRED: { type: 'ORDER_EXPIRED', orderId: 'o' },
  LEVEL_UP: { type: 'LEVEL_UP', level: 2 },
  DISCOVERY: { type: 'DISCOVERY', kind: 'BREED', id: 'PIG_EARTH_PINK', gold: 500 },
  PIG_BOUGHT: { type: 'PIG_BOUGHT', pigId: 'pig-1', breed: 'PIG_EARTH_PINK' },
  PIG_ADOPTED: { type: 'PIG_ADOPTED', pigId: 'pig-1', breed: 'PIG_EARTH_PINK' },
  PIG_FED: { type: 'PIG_FED', pigId: 'pig-1' },
  PIG_CLEANED: { type: 'PIG_CLEANED', pigIds: ['pig-1', 'pig-2'] },
  PIG_TREATED: { type: 'PIG_TREATED', pigId: 'pig-1' },
  TROUGH_FILLED: { type: 'TROUGH_FILLED', units: 5, fromInventory: 5, gold: 0 },
  ITEM_BOUGHT: { type: 'ITEM_BOUGHT', itemId: 'FOOD_BASIC', quantity: 2, gold: -50 },
  PIG_RENAMED: { type: 'PIG_RENAMED', pigId: 'pig-1' },
  PIG_PETTED: { type: 'PIG_PETTED', pigId: 'pig-1', bond: 3, hearts: 0 },
  PIG_PURPOSE_SET: { type: 'PIG_PURPOSE_SET', pigId: 'pig-1', purpose: 'PET' },
  PIG_SOLD: { type: 'PIG_SOLD', pigId: 'pig-1', gold: 1200 },
  BREEDING_STARTED: {
    type: 'BREEDING_STARTED',
    motherId: 'pig-1',
    fatherId: 'pig-2',
    endsAt: 3_600_000,
  },
  SLOT_BOUGHT: { type: 'SLOT_BOUGHT', slots: 5, gold: -2000 },
  ORDER_FULFILLED: { type: 'ORDER_FULFILLED', orderId: 'o', gold: 800 },
  SETTING_CHANGED: { type: 'SETTING_CHANGED', key: 'musicOn', value: false },
  GIFT_SPAWNED: { type: 'GIFT_SPAWNED', giftId: 'g1' },
  GIFT_OPENED: { type: 'GIFT_OPENED', giftId: 'g1', gold: 120, xp: 35 },
  RELIEF_CLAIMED: { type: 'RELIEF_CLAIMED', gold: 0, food: 12, medicine: 1 },
  DECOR_BOUGHT: { type: 'DECOR_BOUGHT', decorId: 'DECOR_HAY_BALE', gold: -1500 },
  DECOR_ARRANGED: { type: 'DECOR_ARRANGED', decorId: 'DECOR_HAY_BALE', op: 'move' },
};

describe('feedback table (§11.3)', () => {
  it('has a row for every GameEvent type, and nothing else', () => {
    expect(Object.keys(FEEDBACK_TABLE).sort()).toEqual([...GAME_EVENT_TYPES].sort());
  });

  it('a row toasts (or floats, toasting under reduceMotion) exactly when it has toast text', () => {
    const s = farm([makePig()]);
    for (const type of GAME_EVENT_TYPES) {
      const row = FEEDBACK_TABLE[type];
      expect(toastText(SAMPLES[type], s, s) !== null, type).toBe(row.toast || !!row.float);
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
  it('catch-up never animates, bursts or sounds; toasts stay (care-level drops: none, NH-1)', () => {
    for (const type of GAME_EVENT_TYPES) {
      const p = feedbackPlan(SAMPLES[type], 'catchup', false);
      expect(p.animations, type).toEqual([]);
      expect(p.vfx, type).toEqual([]);
      expect(p.sound, type).toBeNull();
      expect(p.toast, type).toBe(FEEDBACK_TABLE[type].toast && type !== 'PIG_NEED_DROPPED');
    }
  });

  it('reduceMotion drops tweens and particles, keeps sound and toast', () => {
    const p = feedbackPlan(SAMPLES.PIG_BOUGHT, 'action', true);
    expect(p).toEqual({
      animations: [],
      vfx: [],
      floats: [],
      life: false,
      sound: 'ui_click',
      toast: true,
    });
  });

  it('gift: smoke + pop on spawn; open pops, floats the reward, toasts only under reduceMotion', () => {
    const spawn = feedbackPlan(SAMPLES.GIFT_SPAWNED, 'tick', false);
    expect(spawn.animations).toEqual([
      { animation: 'giftSpawn', target: { kind: 'gift', giftId: 'g1' }, delayMs: 0 },
    ]);
    expect(spawn.vfx.map((v) => v.fx)).toEqual(['fx_smoke']);
    expect(feedbackPlan(SAMPLES.GIFT_SPAWNED, 'catchup', false).animations).toEqual([]);
    const open = feedbackPlan(SAMPLES.GIFT_OPENED, 'action', false);
    expect(open.floats).toEqual([
      { lines: ['+120 Sobi Coin', '+35 KN'], target: { kind: 'gift', giftId: 'g1' }, delayMs: 0 },
    ]);
    expect(open.toast).toBe(false);
    const still = feedbackPlan(SAMPLES.GIFT_OPENED, 'action', true);
    expect(still).toMatchObject({ floats: [], toast: true, sound: 'coin_collect' });
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
function fakeStore(save: FarmGame) {
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
    set(next: FarmGame) {
      snap = { save: next } as StoreSnapshot;
      subs.forEach((f) => f(snap));
    },
    emit: (events: GameEvent[], origin: EventOrigin) => evs.forEach((f) => f(events, origin)),
    reject: (e: ErrorCode) => rejs.forEach((f) => f(e)),
  };
}

function director(save: FarmGame) {
  const store = fakeStore(save);
  const log: string[] = [];
  const d = createFeedbackDirector({
    store,
    effects: () => ({
      animate: (a, t) => log.push(`anim:${a}:${t.kind}`),
      burst: (fx, t) => log.push(`vfx:${fx}:${t.kind}`),
      float: (lines, t) => log.push(`float:${lines.join('|')}:${t.kind}`),
      life: (e) => log.push(`life:${e.type}`),
    }),
    audio: { play: (k) => log.push(`sound:${k}`) },
    toast: (m) => log.push(`toast:${m}`),
  });
  return { store, log, d };
}

describe('FeedbackDirector', () => {
  it('pig tap and DOM button sounds go through the director (§12)', () => {
    const { log, d } = director(
      farm([makePig({ hunger: 10 }), makePig({ id: 'happy', slotIndex: 1, hunger: 90 })]),
    );
    d.pigTapped('pig-1');
    d.pigTapped('happy');
    d.pigTapped('gone');
    d.uiClick();
    expect(log).toEqual(['sound:pig_oink_hungry', 'sound:pig_oink_happy', 'sound:ui_click']);
  });

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
    expect(log.at(-1)).toBe('toast:Đã bán Ủn Hồng được 1.200 Sobi Coin.');
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
