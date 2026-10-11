// Starting a run (spec V2 §8.5, GĐ11): the party, the zone's gate (level and the zone before it), the rations carried, the energy paid.
import type { RosterEntry } from '../../../../core/area-registry/registry';
import type { ErrorCode } from '../../../../core/config/errors';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { techBonus } from '../../../../core/config/tech';
import { worldLevel } from '../../../../core/progression/levels';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { AB, PREP_ITEMS, ZONES, archetypeOf } from '../config/content';
import { energyOf, memberOf, newFighter, whyNotReady } from '../fighters';
import type { Run, RunMember } from '../state';
import { countOf, put, runAdventure, take, type AdventureResult } from './kit';

/**
 * Starts a run of `zoneId` with the fighters `keys` (1 to 3 creatures of `roster`): each pays the energy cost. `prep` are the rations
 * the party carries (GĐ11): each leaves the bag now and adds to every fighter for the whole run.
 */
export function startRun(world: WorldSave, args: { zoneId: string; keys: string[]; roster: readonly RosterEntry[]; prep?: string[] }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const zone = ZONES[args.zoneId];
    if (!zone) return { ok: false, error: 'INVALID_REQUEST' };
    if (worldLevel(w, WORLD_LEVELS) < zone.fromWorldLevel) return { ok: false, error: 'ZONE_LOCKED' };
    if (zone.requiresCleared && !a.cleared[zone.requiresCleared]) return { ok: false, error: 'ZONE_NOT_CLEARED' };
    const prep = args.prep ?? [];
    if (prep.length > techBonus(w, 'prepSlots') || new Set(prep).size !== prep.length || prep.some((id) => !PREP_ITEMS[id] || countOf(w, id) < 1)) return { ok: false, error: 'PREP_INVALID' };
    const keys = args.keys;
    if (keys.length < 1 || keys.length > AB.team.max || new Set(keys).size !== keys.length) return { ok: false, error: 'TEAM_INVALID' };
    const boost = techBonus(w, 'adventureEnergy');
    const fighters = { ...a.fighters };
    const team: RunMember[] = [];
    for (const key of keys) {
      const entry = args.roster.find((r) => r.key === key);
      if (!entry) return { ok: false, error: 'TEAM_INVALID' };
      const archetype = archetypeOf(entry);
      const error: ErrorCode | null = whyNotReady(entry, fighters[key], ctx.now, boost);
      if (error || !archetype) return { ok: false, error: error ?? 'NOT_A_FIGHTER' };
      const f = fighters[key] ?? newFighter(ctx.now);
      // The energy is spent now; what is left keeps refilling from this moment.
      fighters[key] = { ...f, energy: energyOf(f, ctx.now, boost) - AB.run.energyCost, energyAt: ctx.now };
      team.push(memberOf(key, fighters[key]!, entry, archetype, prep));
    }
    let bag = w;
    for (const id of prep) {
      const taken = take(bag, id, 1);
      if (!taken.ok) return taken;
      bag = taken.world;
    }
    const run: Run = {
      zoneId: zone.id,
      seed: Math.floor(ctx.rng.next() * 2 ** 31),
      nodeIndex: 0,
      team,
      prep,
      phase: 'map',
      battle: null,
      loot: {},
      coins: 0,
      gems: 0,
      expGained: 0,
      levelUps: [],
      lastEvent: null,
      log: [],
      result: null,
      startedAt: ctx.now,
    };
    return { ok: true, world: put(bag, { ...a, fighters, run }), events: [{ type: 'ADVENTURE_RUN_STARTED', zoneId: zone.id, team: keys, prep }] };
  });
}
