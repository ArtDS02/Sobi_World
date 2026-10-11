// Hit feedback for the battle screen (GĐ14): which units lost or regained health since the last draw.
// Presentation only: it reads the view model and never touches the battle. Pure apart from the memory it is given.
import type { UnitVm } from './battleVm';

export type UnitFx = 'hit' | 'heal' | 'ko';

/** Health percent per unit id as of the last draw of one battle. */
export type HpMemory = Map<string, { percent: number; down: boolean }>;

/**
 * Compares `units` with what was drawn last time, remembers the new values and returns the effect per unit.
 * A memory that shares no unit with `units` belongs to another battle: nothing plays on the first draw.
 */
export function unitEffects(memory: HpMemory, units: readonly UnitVm[]): Map<string, UnitFx> {
  const fresh = !units.some((u) => memory.has(u.id));
  const out = new Map<string, UnitFx>();
  if (fresh) memory.clear();
  for (const u of units) {
    const before = memory.get(u.id);
    if (before && !fresh) {
      if (u.down && !before.down) out.set(u.id, 'ko');
      else if (u.hpPercent < before.percent) out.set(u.id, 'hit');
      else if (u.hpPercent > before.percent) out.set(u.id, 'heal');
    }
    memory.set(u.id, { percent: u.hpPercent, down: u.down });
  }
  return out;
}
