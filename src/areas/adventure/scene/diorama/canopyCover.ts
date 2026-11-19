// Thung Nấm's accent (design.md §C.4): the big canopy over the hidden nook (a `canopy` cover of the area). Crowns of the kit's big canopy
// float over the open tiles of the cover's rectangle (no trunk stands in a walkable tile) and thin out, dithered away, while the party is
// under them, then come back when it leaves. Code only: the kit's picture and a shared fade value.
import type * as THREE from 'three';
import type { AreaMap } from '../../logic/config/content';
import { cardOf, forestKit, type ArtFn } from './artKit';
import { TILT, cardBatch, shadowStandIns, type CardUniforms, type Placed } from './cards';
import { heightAt, type Grid } from './field';
import { hash2 } from './noise';

/** The fade of a crowd of crowns: 1 whole, FLOOR thin (the party and the nook stay readable under it). */
const FLOOR = 0.2;
/** Spacing of the crowns, tiles, and how high their feet float above the ground. */
const STEP = 2.7;
const LIFT = 1.7;

export class CanopyCover {
  private constructor(
    readonly group: THREE.Group,
    private readonly fade: { value: number },
    private readonly rects: readonly { x: number; y: number; w: number; h: number }[],
  ) {}

  /** Builds the crowns over every `canopy` cover of `map`; null when there is none (or the picture is missing). */
  static async build(art: ArtFn, map: AreaMap, g: Grid, u: CardUniforms): Promise<CanopyCover | null> {
    const rects = map.covers.filter((c) => c.look === 'canopy');
    const card = rects.length ? await cardOf(art, forestKit('cover_canopy_big')) : null;
    if (!card) return null;
    const free = (x: number, z: number) => x >= 0 && z >= 0 && x < g.cols && z < g.rows && !g.blocked[Math.floor(z) * g.cols + Math.floor(x)];
    const items: Placed[] = [];
    for (const c of rects)
      for (let z = c.y + 1; z < c.y + c.h; z += STEP * 0.82)
        for (let x = c.x + 0.5; x < c.x + c.w; x += STEP) {
          const k = (n: number) => hash2(Math.round(x * 31), Math.round(z * 31), n);
          const jx = x + (k(71) - 0.5) * 1.4;
          const jz = z + (k(72) - 0.5) * 1.2;
          // Only over open ground: a crown over a blocked tile would only thicken the woods that already stand there.
          if (!free(jx, jz)) continue;
          items.push({ x: jx, z: jz, y: heightAt(g, jx, jz) + LIFT, h: 3.3 + k(73) * 1.1, flip: k(74) < 0.5 });
        }
    if (!items.length) return null;
    const fade = { value: 1 };
    const group = cardBatch(card, items, u, { sway: 0.9, tilt: TILT, see: true, fade });
    group.add(shadowStandIns(items, card.aspect, [0.55, 0.45, 0.36], 0));
    return new CanopyCover(group, fade, rects);
  }

  /** Eases the fade toward thin while the party (tiles) stands in a cover, toward whole when it does not. */
  update(party: { x: number; z: number }, dt: number) {
    const inside = this.rects.some((c) => party.x >= c.x - 0.5 && party.x < c.x + c.w + 0.5 && party.z >= c.y - 0.5 && party.z < c.y + c.h + 0.5);
    const to = inside ? FLOOR : 1;
    this.fade.value += (to - this.fade.value) * Math.min(1, dt * 3.2);
  }
}
