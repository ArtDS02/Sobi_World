// The zone side of the Garden's screens (decision 028), as plain data: which plots of the zone on screen the bulk buttons
// take, and the zone switcher over the field. Pure; unit-tested.
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { PLOTS_PER_ZONE, ZONE_COUNT } from '../logic/config/content';
import { nextExpansion, ownedZones, zonePlots } from '../logic/derived';
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
}

/** The zone switcher over the field. */
export function zoneVm(world: WorldSave, zone: number): ZoneVm {
  const g = gardenOf(world);
  const owned = ownedZones(g);
  const name = vi.garden.zoneNames[zone] ?? '';
  const next = nextExpansion(g);
  const locked = zone >= owned ? t(vi.garden.zoneLocked, { n: zone + 1, level: next?.level ?? 1, gold: gold(next?.price ?? 0) }) : null;
  // The next zone can be looked at once the last owned one is full (it opens whole), like the Cloud's tiers.
  const viewable = Math.min(ZONE_COUNT, owned + (g.plots.length % PLOTS_PER_ZONE === 0 ? 1 : 0));
  return { title: t(vi.garden.zoneTitle, { n: zone + 1, name }), viewable, locked };
}
