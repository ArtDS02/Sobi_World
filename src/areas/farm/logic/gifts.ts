// Timed gift boxes (U06): one farm-wide timer in the save, advanced by advanceWorld from
// timestamps, so offline time counts and no setInterval decides anything. Rewards and seeds come
// from a hash of the spawn time (like orders, Q3): no injected rng is consumed and replaying the
// same `now` never changes the result.
import { BREEDS } from '../../../core/config/breeds';
import { GIFTS } from '../../../core/config/gifts';
import type { GameEvent } from '../../../core/events';
import { mulberry32 } from '../../../core/rng';
import type { GiftBox, Pig, SaveGame } from '../../../core/types';

/** Wait until the next spawn for this herd (null without pigs). */
export function giftInterval(pigs: readonly Pig[]): number | null {
  if (pigs.length === 0) return null;
  const factor =
    pigs.reduce((sum, p) => sum + GIFTS.INTERVAL_FACTOR[BREEDS[p.breed].rarity], 0) / pigs.length;
  return Math.round(GIFTS.BASE_INTERVAL_MS * factor);
}

/** Reward power of the herd: rarity weight, babies count part (growth lerps to full). */
export function giftPower(pigs: readonly Pig[]): number {
  return pigs.reduce((sum, p) => {
    const share = GIFTS.BABY_SHARE + (1 - GIFTS.BABY_SHARE) * (p.growthProgress / 100);
    return sum + GIFTS.POWER[BREEDS[p.breed].rarity] * share;
  }, 0);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));

/** Stable seed for one box (FNV-style mix of time and index). */
const giftSeed = (at: number, index: number): number =>
  (Math.imul(Math.floor(at / 1000) ^ 0x9e3779b1, 0x85ebca6b) ^ ((index + 1) * 0xc2b2ae35)) >>> 0;

/** One box spawned at `at`: reward from the herd's power ± VARIANCE, clamped. */
export function makeGift(pigs: readonly Pig[], at: number, index: number): GiftBox {
  const seed = giftSeed(at, index);
  const rng = mulberry32(seed);
  const power = giftPower(pigs);
  const spread = () => 1 + (rng.next() * 2 - 1) * GIFTS.VARIANCE;
  return {
    id: `${at}:${index}`,
    spawnedAt: at,
    seed,
    gold: clamp(power * GIFTS.GOLD_PER_POWER * spread(), GIFTS.MIN_GOLD, GIFTS.MAX_GOLD),
    xp: clamp(power * GIFTS.XP_PER_POWER * spread(), GIFTS.MIN_XP, GIFTS.MAX_XP),
  };
}

/** Boxes per spawn for this herd. */
export const giftsPerSpawn = (pigCount: number): number =>
  Math.min(GIFTS.MAX_PER_SPAWN, 1 + Math.floor(pigCount / GIFTS.PIGS_PER_EXTRA_BOX));

/**
 * advanceWorld step 5. No pigs → timer off. First pig → timer starts at `now`. Each passed spawn
 * time adds boxes up to MAX_ON_FARM; a full farm restarts the wait from `now` (no backlog).
 * A clock set back simply finds nextAt in the future. Idempotent for the same `now`.
 */
export function resolveGifts(
  state: SaveGame,
  now: number,
): { state: SaveGame; events: GameEvent[] } {
  const interval = giftInterval(state.pigs);
  const { gifts } = state;
  if (interval === null) {
    return gifts.nextAt === null ? { state, events: [] } : { state: off(state), events: [] };
  }
  if (gifts.nextAt === null)
    return { state: withGifts(state, now + interval, gifts.boxes), events: [] };
  if (now < gifts.nextAt) return { state, events: [] };

  let nextAt = gifts.nextAt;
  const boxes = [...gifts.boxes];
  const events: GameEvent[] = [];
  for (let step = 0; nextAt <= now && step < GIFTS.MAX_STEPS; step += 1) {
    if (boxes.length >= GIFTS.MAX_ON_FARM) {
      nextAt = now + interval;
      break;
    }
    const count = Math.min(giftsPerSpawn(state.pigs.length), GIFTS.MAX_ON_FARM - boxes.length);
    for (let i = 0; i < count; i += 1) {
      const box = makeGift(state.pigs, nextAt, i);
      boxes.push(box);
      events.push({ type: 'GIFT_SPAWNED', giftId: box.id });
    }
    nextAt += interval;
  }
  return { state: withGifts(state, nextAt, boxes), events };
}

const withGifts = (state: SaveGame, nextAt: number | null, boxes: GiftBox[]): SaveGame => ({
  ...state,
  gifts: { nextAt, boxes },
});
const off = (state: SaveGame) => withGifts(state, null, state.gifts.boxes);
