// The Adventure's numbers over time (ARCHITECTURE §5–6): nothing moves by itself except two closed forms that are read from
// their stamps — a fighter's energy refilling and its exhaustion ending — so the catch-up only moves the slice's clock. It also puts a
// walking party back on its area's spawn when the ground under it is no longer walkable (an area redrawn since the save, decision 043).
import type { WorldSave } from '../../../core/save/world';
import { canStand } from '../../../systems/character';
import { MAPS } from './config/content';
import { tileCenter, walkableOf } from './maps';
import { adventureOf, withAdventure } from './save/lens';
import type { AdventureState } from './state';

/** The trip with its walker moved to the spawn when it stands where nobody can stand; the same object when it is fine. */
export function settleWalker(a: AdventureState): AdventureState {
  const run = a.run;
  // The Rift has no map to walk (its party stands at 0,0); battles and finished trips do not walk either.
  if (!run || run.phase !== 'explore' || run.rift) return a;
  const map = MAPS[run.mapId];
  if (!map || canStand({ x: run.x, y: run.y }, walkableOf(map, new Set(a.openedGates)))) return a;
  const at = tileCenter(map, map.spawn.x, map.spawn.y);
  return { ...a, run: { ...run, x: at.x, y: at.y, facing: 'down' } };
}

export function advanceAdventureWorld(world: WorldSave, now: number): { state: WorldSave; events: never[] } {
  const before = adventureOf(world);
  const a = settleWalker(before);
  if (a === before && now <= a.lastTickedAt) return { state: world, events: [] };
  return { state: withAdventure(world, { ...a, lastTickedAt: Math.max(now, a.lastTickedAt) }), events: [] };
}
