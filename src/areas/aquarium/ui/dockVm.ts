// The dock: the odds of a cast now (the rod's mini-game is fishingGame.ts). Pure.
import { itemArtId } from '../../../core/config/assetIds';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import { castCooldownLeft, isNightNow } from '../logic/derived';
import { catchOdds, type CastDepth } from '../logic/fishing';
import { skyForRod } from '../logic/sky';
import { aquariumOf } from '../logic/save/lens';

export interface OddsRow {
  name: string;
  art: string;
  /** 0..100 */
  percent: number;
  rarity: string;
  night: boolean;
  /** Met before (the Codex knows it); unknown species show as "???". */
  known: boolean;
}

export interface DockVm {
  cooldownMs: number;
  night: boolean;
  period: string;
  odds: OddsRow[];
}

export function dockVm(world: WorldSave, now: number, dayOffsetMs: number, score = 0.6, depth: CastDepth = 0): DockVm {
  const a = aquariumOf(world);
  const night = isNightNow(now, dayOffsetMs);
  const met = new Set(world.collection.discovered.fish ?? []);
  const odds = catchOdds(score, night, skyForRod(world, now, dayOffsetMs, night), depth)
    .map((o): OddsRow => {
      if (o.species) {
        const known = met.has(o.species.id);
        return { name: known ? o.species.nameVi : '???', art: o.species.art, percent: o.share * 100, rarity: o.species.rarity, night: o.species.nightOnly, known };
      }
      return { name: vi.aquarium.fishing.oyster, art: itemArtId(o.item ?? ''), percent: o.share * 100, rarity: 'RARE', night: false, known: true };
    })
    .sort((x, y) => y.percent - x.percent);
  return { cooldownMs: castCooldownLeft(a, now), night, period: night ? vi.aquarium.fishing.night : vi.aquarium.fishing.day, odds };
}

