// The Adventure's numbers over time (ARCHITECTURE §5–6): nothing moves by itself except two closed forms that are read from
// their stamps — a fighter's energy refilling and its exhaustion ending — so the catch-up only moves the slice's clock.
import type { WorldSave } from '../../../core/save/world';
import { adventureOf, withAdventure } from './save/lens';

export function advanceAdventureWorld(world: WorldSave, now: number): { state: WorldSave; events: never[] } {
  const a = adventureOf(world);
  return { state: now > a.lastTickedAt ? withAdventure(world, { ...a, lastTickedAt: now }) : world, events: [] };
}
