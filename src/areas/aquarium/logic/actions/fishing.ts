// The rod and the tank's door (spec V2 §8.3): a cast brings a catch into the bag; a caught fish can be put in the tank
// to be raised. Each action catches the tank up first.
import type { WorldSave } from '../../../../core/save/world';
import { pick, randomId } from '../../../../core/rng';
import type { ActionContext } from '../../../../core/types';
import { AB, FISH_NAMES, fishOfItem } from '../config/content';
import { castCooldownLeft, isNightNow, tankFree } from '../derived';
import { cast, cooldownAfter } from '../fishing';
import type { Fish } from '../state';
import { give, put, runAquarium, take, type AquariumResult } from './kit';

/**
 * Casts the rod. `score` (0..1) is how well the player timed the mini-game; the catch goes to the bag. The rod rests
 * `cooldownSec` after a catch and a part of it after a miss.
 */
export function castLine(world: WorldSave, args: { score: number }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    if (!Number.isFinite(args.score) || args.score < 0 || args.score > 1) return { ok: false, error: 'INVALID_REQUEST' };
    if (castCooldownLeft(a, ctx.now) > 0) return { ok: false, error: 'FISHING_COOLDOWN' };
    const night = isNightNow(ctx.now, ctx.dayOffsetMs ?? 0);
    const result = cast(ctx.rng, args.score, night);
    // The cooldown is counted from `lastCastAt`: a miss is stamped earlier so only the rest of it is left.
    const lastCastAt = ctx.now - (AB.fishing.cooldownSec - cooldownAfter(result)) * 1000;
    if (result.kind === 'miss') {
      return {
        ok: true,
        world: put(w, { ...a, lastCastAt }),
        events: [{ type: 'AQUARIUM_CAST', speciesId: null, itemId: null, quantity: 0, score: args.score, night }],
      };
    }
    const itemId = result.kind === 'fish' ? result.species.item : result.item;
    const bag = give(w, { [itemId]: 1 });
    if (!bag.ok) return bag;
    return {
      ok: true,
      world: put(bag.world, { ...a, lastCastAt }),
      events: [{ type: 'AQUARIUM_CAST', speciesId: result.kind === 'fish' ? result.species.id : null, itemId, quantity: 1, score: args.score, night }],
      xp: AB.xp.catch,
    };
  });
}

/** Puts a caught fish of the bag into the tank: it starts at `caughtProgress` and grows up there. */
export function releaseFish(world: WorldSave, args: { itemId: string }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    const species = fishOfItem(args.itemId);
    if (!species) return { ok: false, error: 'INVALID_REQUEST' };
    if (tankFree(a) <= 0) return { ok: false, error: 'TANK_FULL' };
    const taken = take(w, args.itemId, 1);
    if (!taken.ok) return taken;
    const fish: Fish = {
      id: randomId(ctx.rng),
      breed: species.id,
      name: pick(ctx.rng, FISH_NAMES),
      gender: ctx.rng.next() < 0.5 ? 'MALE' : 'FEMALE',
      growthProgress: AB.life.caughtProgress,
      hunger: 60,
      cleanliness: a.tank.water,
      isSick: false,
      generation: 1,
      createdAt: ctx.now,
      lastTickedAt: ctx.now,
    };
    return {
      ok: true,
      world: put(taken.world, { ...a, fish: [...a.fish, fish] }),
      events: [{ type: 'AQUARIUM_RELEASED', fishId: fish.id, speciesId: species.id }],
      xp: AB.xp.release,
    };
  });
}
