// D3: the seasonal pig show — judging, places, once per pig per season, prizes through the ledger, the save round trip.
import { describe, expect, it } from 'vitest';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { enterShow, placeOf, SHOW, showBase, showEntered, showSeason } from '../../src/areas/farm/logic/show';
import { farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { DAY_MS } from '../../src/core/clock';
import { mulberry32, sequenceRng } from '../../src/core/rng';
import { migrate } from '../../src/core/save/migrate';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

// The pigs live at t = 0 in the test factories, so the show is held near it (a 20,000-day catch-up would starve them).
const T0 = 3_600_000;
const ctxWith = (roll: number, now = T0) => ({ now, rng: sequenceRng([roll]), dayOffsetMs: 0 });
const adult = (extra: Parameters<typeof makePig>[0] = {}) => makePig({ growthProgress: 100, hunger: 100, cleanliness: 100, ...extra });
const farm = (pigs = [adult({ id: 'a' })]): FarmGame => ({ ...makeState(pigs, 1000), tokens: undefined });

describe('judging', () => {
  it('a plain pig brings little, a well-kept bred rare one brings much more', () => {
    const plain = showBase(adult({ id: 'p' }));
    const ancestor = { name: 'Cụ', breed: 'PIG_EARTH_PINK' as const, gender: 'FEMALE' as const, generation: 1 };
    const star = showBase(adult({ id: 's', bond: 100, generation: 4, traits: ['t1', 't2'], hiddenTrait: 't3', lineage: { mother: ancestor, father: { ...ancestor, gender: 'MALE' as const } } }));
    expect(star.base).toBeGreaterThan(plain.base + 15);
    expect(star.parts.bond).toBe(5 * SHOW.judges.bondPerHeart);
    expect(star.parts.traits).toBe(Math.min(SHOW.judges.traitCap, 3 * SHOW.judges.traitPoints));
    expect(star.parts.generation).toBe(Math.min(SHOW.judges.generationCap, 3 * SHOW.judges.generationPoints));
  });
  it('places go from the best score down and always pay something', () => {
    const top = SHOW.places[0]!;
    expect(placeOf(top.minScore).place).toBe(top.place);
    expect(placeOf(top.minScore - 0.01).place).toBeGreaterThan(top.place);
    const none = placeOf(0);
    expect(none).toEqual({ place: 0, ...SHOW.participation });
    expect(none.coins + none.tokens).toBeGreaterThan(0);
  });
  it('seasons are whole blocks of seasonDays local days', () => {
    expect(showSeason(0)).toBe(0);
    expect(showSeason(SHOW.seasonDays * DAY_MS - 1)).toBe(0);
    expect(showSeason(SHOW.seasonDays * DAY_MS)).toBe(1);
    expect(showSeason(SHOW.seasonDays * DAY_MS - 1, 2 * 3_600_000)).toBe(1); // the local offset moves the boundary
  });
});

describe('enterShow', () => {
  it('pays coins and tokens through the ledger (one Transaction each) and records the entry', () => {
    const s = farm();
    const r = enterShow(s, { pigId: 'a' }, ctxWith(0.5));
    if (!r.ok) throw new Error(r.error);
    const ev = r.events.find((e) => e.type === 'SHOW_ENTERED');
    if (!ev || ev.type !== 'SHOW_ENTERED') throw new Error('no event');
    expect(r.state.player.gold).toBe(s.player.gold + ev.coins);
    expect(r.state.tokens ?? 0).toBe(ev.tokens);
    const tx = r.state.transactions.filter((t) => t.type === 'SHOW_REWARD');
    expect(tx.map((t) => t.currency ?? 'coins').sort()).toEqual(ev.tokens > 0 ? ['coins', 'eventTokens'] : ['coins']);
    expect(showEntered(r.state, 'a', showSeason(T0))).toBe(true);
  });
  it('the same pig cannot enter twice in a season, but can in the next', () => {
    const first = enterShow(farm(), { pigId: 'a' }, ctxWith(0.1));
    if (!first.ok) throw new Error(first.error);
    expect(enterShow(first.state, { pigId: 'a' }, ctxWith(0.1))).toEqual({ ok: false, error: 'ALREADY_CLAIMED' });
    // The next season is a new page: the entry no longer counts (the pig itself would need care over 28 days).
    expect(showEntered(first.state, 'a', showSeason(T0))).toBe(true);
    expect(showEntered(first.state, 'a', showSeason(T0) + 1)).toBe(false);
  });
  it('refuses a young, sick or missing pig; a roll decides the place for the same pig', () => {
    expect(enterShow(farm([makePig({ id: 'y', growthProgress: 10 })]), { pigId: 'y' }, ctxWith(0))).toEqual({ ok: false, error: 'PIG_NOT_MATURE' });
    expect(enterShow(farm([adult({ id: 'k', isSick: true })]), { pigId: 'k' }, ctxWith(0))).toEqual({ ok: false, error: 'PIG_IS_SICK' });
    expect(enterShow(farm(), { pigId: 'nope' }, ctxWith(0))).toEqual({ ok: false, error: 'PIG_NOT_FOUND' });
    const strong = adult({ id: 'b', bond: 100, generation: 4, traits: ['t1', 't2', 't3'] });
    const lo = enterShow(farm([strong]), { pigId: 'b' }, ctxWith(0));
    const hi = enterShow(farm([strong]), { pigId: 'b' }, ctxWith(0.999));
    if (!lo.ok || !hi.ok) throw new Error('failed');
    const place = (r: typeof lo) => (r.events.find((e) => e.type === 'SHOW_ENTERED') as { place: number }).place;
    expect(place(hi) === 0 ? 99 : place(hi)).toBeLessThanOrEqual(place(lo) === 0 ? 99 : place(lo));
  });
  it('is deterministic for a seed', () => {
    const run = () => enterShow(farm(), { pigId: 'a' }, { now: T0, rng: mulberry32(7), dayOffsetMs: 0 });
    expect(run()).toEqual(run());
  });
});

describe('save round trip', () => {
  it('entries and tokens survive the lens and a JSON round trip; the wallet gets the tokens', () => {
    // A real new world (the factories' troughs are not valid saves), its first pig grown up.
    const fresh = SAVE_CODEC.newWorld({ now: T0, rng: mulberry32(3) });
    const bought = buyPig(farmOf(fresh), { breed: 'PIG_EARTH_PINK', gender: 'FEMALE' }, { now: T0, rng: mulberry32(4) });
    if (!bought.ok) throw new Error(bought.error);
    const view = bought.state;
    const pig = view.pigs[0]!;
    const w = withFarm(fresh, { ...view, pigs: view.pigs.map((p, i) => (i === 0 ? { ...p, growthProgress: 100, hunger: 100, cleanliness: 100, lastTickedAt: T0 } : p)) });
    const r = enterShow(farmOf(w), { pigId: pig.id }, ctxWith(0.99));
    if (!r.ok) throw new Error(r.error);
    const next = withFarm(w, r.state);
    const tokens = r.state.tokens ?? 0;
    expect(next.wallet.eventTokens).toBe(w.wallet.eventTokens + tokens);
    expect(next.transactions.some((t) => t.type === 'SHOW_REWARD' && t.currency === 'coins')).toBe(true);
    const back = migrate(JSON.parse(JSON.stringify(next)), SAVE_CODEC);
    if (!back.ok) throw new Error(back.error);
    expect(back.repairedAreas).toBeUndefined(); // the farm slice parsed as it was
    expect(farmOf(back.save).showEntries).toEqual(r.state.showEntries);
    // a plain farm action afterwards must not drop the entry
    const again = withFarm(back.save, { ...farmOf(back.save), updatedAt: 5 });
    expect(farmOf(again).showEntries).toEqual(r.state.showEntries);
  });
});
