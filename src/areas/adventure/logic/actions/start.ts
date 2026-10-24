// Starting a trip (spec §2, §3.7): the party, the zone's gate (level and the zone before it), where it starts (the zone's entrance or
// any lit portal of it), the rations carried, the energy paid, the bonds of its Guardian lines (decision 039).
import type { RosterEntry } from '../../../../core/area-registry/registry';
import type { ErrorCode } from '../../../../core/config/errors';
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { techBonus } from '../../../../core/config/tech';
import { worldLevel } from '../../../../core/progression/levels';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { AB, MAPS, PREP_ITEMS, ZONES, identityOf } from '../config/content';
import { energyOf, memberOf, newFighter, whyNotReady } from '../fighters';
import { withSynergies } from '../bonds';
import { tileCenter } from '../maps';
import type { AdventureState, RunMember } from '../state';
import { countOf, put, runAdventure, take, type AdventureResult } from './kit';
import { freshRun, portalLit, zoneOpen } from './trip';

export interface PartyArgs {
  keys: string[];
  roster: readonly RosterEntry[];
  prep?: string[] | undefined;
}

/** The party checked and charged: each fighter pays the energy cost now (what is left keeps refilling from this moment). */
export function chargeParty(w: WorldSave, a: AdventureState, args: PartyArgs, ctx: ActionContext): { ok: true; world: WorldSave; fighters: AdventureState['fighters']; team: RunMember[]; prep: string[] } | { ok: false; error: ErrorCode } {
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
    const identity = identityOf(entry);
    const error = whyNotReady(entry, fighters[key], ctx.now, boost);
    if (error || !identity) return { ok: false, error: error ?? 'NOT_A_FIGHTER' };
    const f = fighters[key] ?? newFighter(ctx.now);
    fighters[key] = { ...f, energy: energyOf(f, ctx.now, boost) - AB.run.energyCost, energyAt: ctx.now };
    team.push(memberOf(key, fighters[key]!, entry, identity, prep));
  }
  let bag = w;
  for (const id of prep) {
    const taken = take(bag, id, 1);
    if (!taken.ok) return taken;
    bag = taken.world;
  }
  return { ok: true, world: bag, fighters, team: withSynergies(team), prep };
}

/**
 * Starts a trip into `zoneId` with the fighters `keys` (1 to 3 creatures of `roster`). It begins at the zone's entrance, or at `mapId`
 * when that area's portal is lit. `prep` are the rations the party carries: each leaves the bag now and adds to every fighter.
 */
export function startRun(world: WorldSave, args: PartyArgs & { zoneId: string; mapId?: string | undefined }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a) => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const zone = ZONES[args.zoneId];
    if (!zone) return { ok: false, error: 'INVALID_REQUEST' };
    if (!zoneOpen(w, a, zone.id)) return { ok: false, error: worldLevel(w, WORLD_LEVELS) < zone.fromWorldLevel ? 'ZONE_LOCKED' : 'ZONE_NOT_CLEARED' };
    const mapId = args.mapId ?? zone.maps[0]!;
    const map = MAPS[mapId];
    if (!map || map.zoneId !== zone.id) return { ok: false, error: 'INVALID_REQUEST' };
    if (!portalLit(w, a, mapId)) return { ok: false, error: 'PORTAL_INACTIVE' };
    const party = chargeParty(w, a, args, ctx);
    if (!party.ok) return party;
    const at = tileCenter(map, map.spawn.x, map.spawn.y);
    const run = freshRun({ zoneId: zone.id, mapId, x: at.x, y: at.y, seed: Math.floor(ctx.rng.next() * 2 ** 31), team: party.team, prep: party.prep, startedAt: ctx.now });
    return { ok: true, world: put(party.world, { ...a, fighters: party.fighters, run }), events: [{ type: 'ADVENTURE_RUN_STARTED', zoneId: zone.id, team: args.keys, prep: party.prep }] };
  });
}
