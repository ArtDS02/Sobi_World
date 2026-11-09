// The zone side of the Garden's screens (decision 028), as plain data: which plots of the zone on screen the bulk buttons
// take, and the zone switcher over the field. Pure; unit-tested.
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { GARDEN_TIERS, PLOTS_PER_ZONE, ZONE_COUNT } from '../logic/config/content';
import { gardenZoneBonus, gardenZoneLevel, gardenZoneUpgrade, nextExpansion, ownedZones, zonePlots } from '../logic/derived';
import { rankLine, rankOfGroup } from '../../../ui/world/tierUpgradeVm';
import { gardenOf } from '../logic/save/lens';

const gold = (n: number) => formatInt(n);

/** Plots of `zone` with nothing growing on them. */
export const emptyIn = (world: WorldSave, zone: number): number[] => zonePlots(gardenOf(world), zone).filter((i) => gardenOf(world).plots[i]!.cropId === null);

/** Plots of `zone` whose crop is still growing and has no fertiliser yet. */
export const unfertilizedIn = (world: WorldSave, zone: number): number[] =>
  zonePlots(gardenOf(world), zone).filter((i) => {
    const p = gardenOf(world).plots[i]!;
    return p.cropId !== null && p.ripeAt === null && !p.fertilized;
  });

export interface ZoneVm {
  title: string;
  /** Zones the switcher can show: the owned ones, and the next one (locked) once the last owned zone is full. */
  viewable: number;
  /** The zone on screen is not open yet: why. */
  locked: string | null;
  /** The rank of the zone on screen (null while it is not open): the chip's text, the full line, and whether the upgrade is on offer (decision 056). */
  rank: { short: string; line: string; open: boolean } | null;
}

export const gardenRankName = (id: string): string => vi.garden.rankNames[id as keyof typeof vi.garden.rankNames] ?? id;

/** The zone switcher over the field. */
export function zoneVm(world: WorldSave, zone: number): ZoneVm {
  const g = gardenOf(world);
  const owned = ownedZones(g);
  const name = vi.garden.zoneNames[zone] ?? '';
  const next = nextExpansion(g);
  const locked = zone >= owned ? t(vi.garden.zoneLocked, { n: zone + 1, level: next?.level ?? 1, gold: gold(next?.price ?? 0) }) : null;
  // The next zone can be looked at once the last owned one is full (it opens whole), like the Cloud's tiers.
  const viewable = Math.min(ZONE_COUNT, owned + (g.plots.length % PLOTS_PER_ZONE === 0 ? 1 : 0));
  const level = gardenZoneLevel(g, zone);
  const bonus = gardenZoneBonus(g, zone);
  const { step, block } = gardenZoneUpgrade(g, zone, Infinity);
  const rank =
    zone < owned
      ? {
          short: t(bonus > 0 ? vi.plotTier.shortBonus : vi.plotTier.short, { rank: level, bonus }),
          line: rankLine(rankOfGroup(GARDEN_TIERS, gardenRankName, level), GARDEN_TIERS),
          open: step !== null && block !== 'GROUP_INCOMPLETE',
        }
      : null;
  return { title: t(vi.garden.zoneTitle, { n: zone + 1, name }), viewable, locked, rank };
}
