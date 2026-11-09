// Plot skins (decision 056), pure: whether a skin's blueprint is open, what a skin costs, which skins the player owns.
// A skin is cosmetic only: it never changes yield, speed, the Codex or World Development. Which cloud tier / garden zone wears
// which skin is each Area's own slice state; what the player owns lives in the world save (`cosmetics.plotSkins`).
import { codexCounts } from '../collection/codex';
import { levelFromXp, worldXp, type LevelTable } from '../progression/levels';
import type { WorldSave } from '../save/world';

export type SkinUnlock =
  | { kind: 'worldLevel'; level: number }
  | { kind: 'codex'; codexKind: string; count: number }
  | { kind: 'areaList'; area: string; path: readonly string[]; has: string }
  | { kind: 'areaRecord'; area: string; path: readonly string[]; key: string };

export interface SkinDef {
  id: string;
  materials: Readonly<Record<string, number | undefined>>;
  coins: number;
  gems: number;
  unlock: SkinUnlock;
}

export interface SkinRules {
  gemRate: number;
  xp: number;
  skins: readonly SkinDef[];
}

/** Walks `path` through plain saved data; undefined when any step is missing. */
function readPath(root: unknown, path: readonly string[]): unknown {
  let at: unknown = root;
  for (const step of path) {
    if (typeof at !== 'object' || at === null) return undefined;
    at = (at as Record<string, unknown>)[step];
  }
  return at;
}

/** Whether the blueprint of a skin is open in this world. */
export function unlockMet(world: WorldSave, unlock: SkinUnlock, levels: LevelTable): boolean {
  switch (unlock.kind) {
    case 'worldLevel':
      return levelFromXp(worldXp(world), levels) >= unlock.level;
    case 'codex':
      return (codexCounts(world.collection.discovered).byKind[unlock.codexKind] ?? 0) >= unlock.count;
    case 'areaList': {
      const list = readPath(world.areas[unlock.area], unlock.path);
      return Array.isArray(list) && list.includes(unlock.has);
    }
    case 'areaRecord': {
      const rec = readPath(world.areas[unlock.area], unlock.path);
      if (typeof rec !== 'object' || rec === null || Array.isArray(rec)) return false;
      const n = (rec as Record<string, unknown>)[unlock.key];
      return typeof n === 'number' && n > 0;
    }
  }
}

export const ownedSkins = (world: Pick<WorldSave, 'cosmetics'>): readonly string[] => world.cosmetics.plotSkins;
export const ownsSkin = (world: Pick<WorldSave, 'cosmetics'>, skinId: string): boolean => world.cosmetics.plotSkins.includes(skinId);

/** `owned`, `forgeable` (blueprint open, not forged) or `locked` (blueprint closed). */
export type SkinStatus = 'owned' | 'forgeable' | 'locked';

export function skinStatus(world: WorldSave, skin: SkinDef, levels: LevelTable): SkinStatus {
  if (ownsSkin(world, skin.id)) return 'owned';
  return unlockMet(world, skin.unlock, levels) ? 'forgeable' : 'locked';
}
