// The dock: the odds of a cast now, and the maths of the rod's mini-game. Pure.
import { itemArtId } from '../../../core/config/assetIds';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import { castCooldownLeft, isNightNow } from '../logic/derived';
import { catchOdds } from '../logic/fishing';
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

export function dockVm(world: WorldSave, now: number, dayOffsetMs: number, score = 0.6): DockVm {
  const a = aquariumOf(world);
  const night = isNightNow(now, dayOffsetMs);
  const met = new Set(world.collection.discovered.fish ?? []);
  const odds = catchOdds(score, night)
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

/** The mini-game: a marker sweeps a bar back and forth; the score is how close it is to the green spot when pulled. */
export const MINI = { periodMs: 1800, zoneHalf: 0.09, scoreSpan: 0.35 } as const;

/** Marker position 0..1 `elapsed` ms after the cast (a triangle wave). */
export function markerAt(elapsedMs: number): number {
  const phase = ((elapsedMs / MINI.periodMs) % 1 + 1) % 1;
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
}

/** The green spot's centre for a cast started at `startedAt` (it differs every cast, but not at random in the render). */
export function zoneCentre(startedAt: number): number {
  const h = Math.imul(Math.floor(startedAt / 1000) ^ 0x9e3779b1, 0x85ebca6b) >>> 0;
  return 0.2 + ((h % 1000) / 1000) * 0.6;
}

/** 0..1: 1 on the centre of the zone, falling to 0 at `scoreSpan` away. */
export const scoreOf = (marker: number, centre: number): number => Math.max(0, Math.min(1, 1 - Math.abs(marker - centre) / MINI.scoreSpan));
