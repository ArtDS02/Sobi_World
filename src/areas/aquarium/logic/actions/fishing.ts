// The rod and the tank's door (spec V2 §8.3): a cast brings a catch into the bag; a caught fish can be put in the tank
// to be raised. Each action catches the tank up first.
import type { WorldSave } from '../../../../core/save/world';
import { pick, randomId } from '../../../../core/rng';
import type { ActionContext } from '../../../../core/types';
import { AB, FISH_NAMES, fishOfItem, type FishSpecies } from '../config/content';
import { castCooldownLeft, isNightNow, tankFree } from '../derived';
import { cast, cooldownAfter, drawCastEvent, isDepth, isShadow, recordCatch, sizeCmOf, type CastDepth, type CastEvent, type ShadowSize } from '../fishing';
import { skyForRod } from '../sky';
import type { Fish } from '../state';
import { give, pay, put, runAquarium, take, type AquariumResult } from './kit';

/**
 * Casts the rod. `score` (0..1) is how well the player timed the mini-game; the catch goes to the bag. The rod rests
 * `cooldownSec` after a catch and a part of it after a miss. With the `shadow` of the fish (the rod's screen) the catch
 * also gets a size in cm for the catch book, and may bring a cast event (decision 061).
 */
export function castLine(world: WorldSave, args: { score: number; depth?: CastDepth; shadow?: ShadowSize }, ctx: ActionContext): AquariumResult {
  return runAquarium(world, ctx, (w, a) => {
    if (!Number.isFinite(args.score) || args.score < 0 || args.score > 1) return { ok: false, error: 'INVALID_REQUEST' };
    if (args.depth !== undefined && !isDepth(args.depth)) return { ok: false, error: 'INVALID_REQUEST' };
    if (args.shadow !== undefined && !isShadow(args.shadow)) return { ok: false, error: 'INVALID_REQUEST' };
    if (castCooldownLeft(a, ctx.now) > 0) return { ok: false, error: 'FISHING_COOLDOWN' };
    const night = isNightNow(ctx.now, ctx.dayOffsetMs ?? 0);
    const depth = args.depth ?? 0;
    const result = cast(ctx.rng, args.score, night, skyForRod(w, ctx.now, ctx.dayOffsetMs ?? 0, night), depth);
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
    const species = result.kind === 'fish' ? result.species : null;
    // Only a fish with a shadow gets a size and may bring an event; an oyster or a cast without one is the plain catch.
    const extras = species && args.shadow ? castExtras(ctx, species, args.shadow, depth) : null;
    const ev = extras?.event ?? null;
    const quantity = 1 + (ev?.kind === 'school' ? ev.extra : 0);
    const bag = give(w, { [itemId]: quantity, ...(ev?.kind === 'chest' ? ev.items : {}) });
    if (!bag.ok) return bag;
    let next = bag.world;
    let bonusCoins = 0;
    let book = a.catchBook;
    let record = false;
    if (species && extras) {
      const rec = recordCatch(a.catchBook?.[species.id], extras.cm, ctx.now);
      record = rec.record;
      book = { ...a.catchBook, [species.id]: rec.entry };
      if (record) bonusCoins += AB.fishing.record.coins;
    }
    if (ev?.kind === 'giant' || ev?.kind === 'bottle') bonusCoins += ev.coins;
    if (bonusCoins > 0) {
      const note = [record ? 'record' : '', ev?.kind ?? ''].filter(Boolean).join(' ');
      const paid = pay(next, bonusCoins, 'AQUARIUM_FISHING_BONUS', ctx, { refId: species?.id ?? itemId, note });
      if (!paid.ok) return paid;
      next = paid.state;
    }
    return {
      ok: true,
      world: put(next, { ...a, lastCastAt, ...(book ? { catchBook: book } : {}) }),
      events: [
        {
          type: 'AQUARIUM_CAST',
          speciesId: species?.id ?? null,
          itemId,
          quantity,
          score: args.score,
          night,
          ...(extras ? { depth, shadow: args.shadow, sizeCm: extras.cm, record } : {}),
          ...(ev ? { event: ev.kind } : {}),
          ...(bonusCoins > 0 ? { bonusCoins } : {}),
          ...(ev?.kind === 'chest' ? { bonusItems: { ...ev.items } } : {}),
        },
      ],
      xp: AB.xp.catch,
    };
  });
}

/** The size of a fish with a shadow and the event its cast brought (decision 061); a giant is bigger than the species' range. */
function castExtras(ctx: ActionContext, species: FishSpecies, shadow: ShadowSize, depth: CastDepth): { cm: number; event: CastEvent | null } {
  const event = drawCastEvent(ctx.rng, depth);
  const cm = Math.round(sizeCmOf(species, shadow, ctx.rng.next()) * (event?.kind === 'giant' ? AB.fishing.events.giant.sizeFactor : 1));
  return { cm, event };
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
