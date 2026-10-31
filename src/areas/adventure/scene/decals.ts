// The small dressing scattered over an exploration area (GĐ14, batch adventure-06-tiles D1 / D2): grass tufts, flowers, pebbles, moss,
// lily pads… so the ground tiles do not read as a grid. Where they fall comes from the area's id through a seeded rng, so an area
// always looks the same; they never block the walker and never sit on a prop, a thing or a wall. Pure (no Phaser).
import { hashSeed, mulberry32, pick } from '../../../core/rng';
import type { AreaMap } from '../logic/config/content';
import { blockedTiles } from '../logic/maps';
import { CORRUPT_FLAT, CORRUPT_UPRIGHT, WALL_PROPS } from './mapKit';

export interface Decal {
  art: string;
  /** Centre of its base, design px. */
  x: number;
  y: number;
  /** Width in design px. */
  size: number;
  flip: boolean;
}

/** What each zone scatters, by ground kind (`.` ground, `,` path, `~` water). */
const SETS: Record<string, Partial<Record<string, readonly string[]>>> = {
  forest: {
    '.': ['grass', 'grass', 'grass', 'daisy', 'buttercup', 'pinkflower', 'fern', 'leaves', 'pebbles'],
    ',': ['pebbles', 'leaves'],
    '~': ['lilypad'],
  },
  mountain: {
    '.': ['drygrass', 'drygrass', 'gravel', 'rockchips', 'pebbles', 'crystal'],
    ',': ['pebbles', 'gravel', 'rockchips'],
  },
  // The coast scatters the kit's shells (decision 045) among pebbles; a full manifest id stands for itself.
  coast: {
    '.': ['pebbles', 'adv_map_coast_prop_shells', 'drygrass', 'pebbles', 'adv_map_coast_prop_shells'],
    ',': ['pebbles', 'gravel'],
  },
  ruins: {
    '.': ['moss', 'moss', 'violet', 'ivy', 'rubble', 'pebbles', 'grass'],
    ',': ['rubble', 'moss', 'pebbles'],
    '~': ['lilypad'],
  },
};

/** Share of the free tiles of each kind that get one. */
const DENSITY: Record<string, number> = { '.': 0.16, ',': 0.06, '~': 0.08 };

export const decalArt = (name: string): string => (name.startsWith('adv_map_') ? name : `prop_adv_decal_${name}`);

/** The decals of `map` in its zone (`forest`, `mountain`, `ruins`, `coast`). */
export function decalsOf(map: AreaMap, zone: string): Decal[] {
  const set = SETS[zone];
  if (!set) return [];
  const rng = mulberry32(hashSeed('adventure-decals', map.id));
  const blocked = blockedTiles(map);
  const t = map.tile;
  const out: Decal[] = [];
  map.terrain.forEach((row, y) =>
    [...row].forEach((c, x) => {
      const names = set[c];
      // A roll for every tile, used or not, keeps one tile's decal independent of the ones before it.
      const roll = rng.next();
      const dx = rng.next();
      const dy = rng.next();
      const sz = rng.next();
      const flip = rng.next() < 0.5;
      if (!names || roll >= (DENSITY[c] ?? 0)) return;
      if (c !== '~' && blocked[y * map.cols + x]) return;
      const name = pick(rng, names);
      out.push({ art: decalArt(name), x: (x + 0.2 + dx * 0.6) * t, y: (y + 0.45 + dy * 0.5) * t, size: t * (c === '~' ? 0.7 : 0.45 + sz * 0.3), flip });
    }),
  );
  return out;
}

/**
 * The corrupted dressing of `map` at `pct` % corruption (decision 045 §10): flat marks on the ground (sludge, cracks, roots) and small
 * sick pieces of the zone (crystals, wilted plants), on free ground more often the more corrupted it is, and on most corrupted tiles
 * (`c`). They never block. Seeded by the area, so the same tiles keep their piece as the corruption drops (fewer, never moved).
 */
export function corruptionDecalsOf(map: AreaMap, zone: string, pct: number): (Decal & { flat: boolean })[] {
  const upright = CORRUPT_UPRIGHT[zone] ?? [];
  const share = Math.max(0, Math.min(100, pct)) / 100;
  const rng = mulberry32(hashSeed('adventure-corruption', map.id));
  const blocked = blockedTiles(map);
  const t = map.tile;
  const out: (Decal & { flat: boolean })[] = [];
  map.terrain.forEach((row, y) =>
    [...row].forEach((c, x) => {
      const roll = rng.next();
      const kind = rng.next();
      const pickRoll = rng.next();
      const sz = rng.next();
      const flip = rng.next() < 0.5;
      const chance = c === 'c' ? 0.45 : c === '.' || c === ',' || c === '^' ? 0.07 * share : 0;
      if (roll >= chance || blocked[y * map.cols + x]) return;
      const flat = kind < 0.6 || upright.length === 0;
      const names = flat ? CORRUPT_FLAT : upright;
      const art = names[Math.floor(pickRoll * names.length)]!;
      out.push({ art, x: (x + 0.5) * t, y: (y + (flat ? 0.75 : 0.9)) * t, size: t * (flat ? 0.9 + sz * 0.4 : 0.55 + sz * 0.3), flip, flat });
    }),
  );
  return out;
}

/**
 * The kit's props heaped on the blocked land of `map` (decision 045): on a wall tile (`#`) next to the way, now and then, a tree, a
 * rock or a broken column of the zone, standing on the tile's foot. They only stand where nothing walks, never on a thing, a cover or
 * an exit (all of those sit on walkable tiles). Seeded by the area.
 */
export function wallPropsOf(map: AreaMap, zone: string): Decal[] {
  const names = WALL_PROPS[zone] ?? [];
  if (names.length === 0) return [];
  const rng = mulberry32(hashSeed('adventure-wall-props', map.id));
  const t = map.tile;
  const at = (x: number, y: number) => map.terrain[y]?.[x] ?? '';
  const open = (c: string) => c !== '' && c !== '#' && c !== 'F' && c !== 'w' && c !== '~';
  const out: Decal[] = [];
  map.terrain.forEach((row, y) =>
    [...row].forEach((c, x) => {
      const roll = rng.next();
      const pickRoll = rng.next();
      const sz = rng.next();
      const flip = rng.next() < 0.5;
      if (c !== '#' || roll >= 0.32) return;
      // Along the way only: a free tile beside or below it (the deep woods stay the wall texture).
      if (!(open(at(x - 1, y)) || open(at(x + 1, y)) || open(at(x, y + 1)) || open(at(x, y - 1)))) return;
      const art = names[Math.floor(pickRoll * pickRoll * names.length)]!;
      out.push({ art, x: (x + 0.5) * t, y: (y + 0.95) * t, size: t * (1.25 + sz * 0.6), flip });
    }),
  );
  return out;
}
