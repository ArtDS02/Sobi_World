// The small dressing scattered over an exploration area (GĐ14, batch adventure-06-tiles D1 / D2): grass tufts, flowers, pebbles, moss,
// lily pads… so the ground tiles do not read as a grid. Where they fall comes from the area's id through a seeded rng, so an area
// always looks the same; they never block the walker and never sit on a prop, a thing or a wall. Pure (no Phaser).
import { hashSeed, mulberry32, pick } from '../../../core/rng';
import type { AreaMap } from '../logic/config/content';
import { blockedTiles } from '../logic/maps';

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
  ruins: {
    '.': ['moss', 'moss', 'violet', 'ivy', 'rubble', 'pebbles', 'grass'],
    ',': ['rubble', 'moss', 'pebbles'],
    '~': ['lilypad'],
  },
};

/** Share of the free tiles of each kind that get one. */
const DENSITY: Record<string, number> = { '.': 0.16, ',': 0.06, '~': 0.08 };

export const decalArt = (name: string): string => `prop_adv_decal_${name}`;

/** The decals of `map` in its zone (`forest`, `mountain`, `ruins`). */
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
