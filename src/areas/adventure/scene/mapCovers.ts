// The overhead covers of an area (decision 045): tree tops, a rock overhang or a broken roof over a hidden place, drawn over the party.
// A cover fades while the party stands under it; stepping under one not found yet asks the trip to save the spot at once, so the
// hidden place counts (and says so) without waiting for the next save of the walk. Placeholder drawing until the kit's art. Phaser.
import type * as Phaser from 'phaser';
import { hashSeed, mulberry32 } from '../../../core/rng';
import type { AreaMap } from '../logic/config/content';
import { coverAt } from '../logic/maps';

/** How see-through a cover is with the party under it, and how fast it fades (ms to close ~63 % of the way). */
const UNDER_ALPHA = 0.25;
const FADE_MS = 140;

/** Colours of a cover by its look (shade, body, light) until the kit's art (decision 045) replaces them. */
const COVER_COLOURS: Record<AreaMap['covers'][number]['look'], [number, number, number]> = {
  canopy: [0x2a5e28, 0x3b8235, 0x5aa64a],
  rock: [0x5e554e, 0x7a6f66, 0x978b80],
  roof: [0x6a4c38, 0x86644c, 0xa48064],
};

/**
 * An overhead cover: overlapping round masses (tree tops, rock, broken roof) a little wider than its tiles, over the party. Placeholder
 * drawing, the same every time for the same cover.
 */
export function drawCover(scene: Phaser.Scene, map: AreaMap, c: AreaMap['covers'][number]): Phaser.GameObjects.Graphics {
  const t = map.tile;
  const rng = mulberry32(hashSeed('cover', map.id, c.id));
  const [shade, body, light] = COVER_COLOURS[c.look];
  const g = scene.add.graphics().setDepth(990_000);
  const blobs: { x: number; y: number; r: number }[] = [];
  for (let y = 0; y < c.h; y += 1) for (let x = 0; x < c.w; x += 1) blobs.push({ x: (c.x + x + 0.5 + (rng.next() - 0.5) * 0.5) * t, y: (c.y + y + 0.5 + (rng.next() - 0.5) * 0.5) * t, r: t * (0.62 + rng.next() * 0.25) });
  for (const b of blobs) g.fillStyle(shade, 1).fillCircle(b.x + t * 0.08, b.y + t * 0.14, b.r);
  for (const b of blobs) g.fillStyle(body, 1).fillCircle(b.x, b.y, b.r * 0.92);
  for (const b of blobs) if (rng.next() < 0.6) g.fillStyle(light, 0.9).fillCircle(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.38);
  return g;
}

/**
 * Fades the covers toward see-through over the party and back; returns the cover the party has just stepped under (once per entry), or
 * null.
 */
export function fadeCovers(map: AreaMap, covers: ReadonlyMap<string, Phaser.GameObjects.Graphics>, pos: { x: number; y: number }, delta: number, still: boolean, was: string | null): { under: string | null; entered: string | null } {
  const under = coverAt(map, pos)?.id ?? null;
  const k = still ? 1 : 1 - Math.exp(-delta / FADE_MS);
  for (const [id, g] of covers) {
    const target = id === under ? UNDER_ALPHA : 1;
    g.setAlpha(g.alpha + (target - g.alpha) * k);
  }
  return { under, entered: under !== was ? under : null };
}
