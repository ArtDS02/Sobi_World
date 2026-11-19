// Thung Nấm's small mushroom clusters: the giant mushroom's own picture scaled down to a quarter or a third, standing beside the bushes
// of the woods' edge (the same feet as the bushes: a blocked tile, never an open one). Nothing new is drawn: one more batch of an
// existing picture, kept whole (its grass patch is part of it).
import type * as THREE from 'three';
import { PROPS } from '../../logic/config/content';
import { cardOf, type ArtFn } from './artKit';
import type { Foot } from './blockers';
import { TILT, cardBatch, shadowStandIns, type CardUniforms, type Placed } from './cards';
import { heightAt, type Grid } from './field';
import { hash2 } from './noise';

/** Height of the giant mushroom's picture over the width of its footprint (dressThings draws a wide landmark at 1.45 x). */
const FULL = 1.45 * 1.1;

/** A cluster stands on `share` of the bush feet, 0.25–0.4 of the giant one's size. */
export async function mushroomClusters(art: ArtFn, feet: readonly Foot[], g: Grid, u: CardUniforms, share: number): Promise<THREE.Group | null> {
  const def = PROPS.prop_adv_lm_n1;
  const card = def ? await cardOf(art, def.art, true) : null;
  if (!def || !card) return null;
  const items: Placed[] = feet
    .filter((f) => f.kind === 'bush' && !f.bad && hash2(Math.round(f.x * 13), Math.round(f.z * 13), 61) < share)
    .map((f) => {
      const k = hash2(Math.round(f.x * 17), Math.round(f.z * 17), 62);
      const h = ((def.w / card.aspect) * FULL) * (0.25 + 0.15 * k);
      return { x: f.x, z: f.z + 0.04, y: heightAt(g, f.x, f.z), h, flip: k < 0.5 };
    });
  if (!items.length) return null;
  const group = cardBatch(card, items, u, { sway: 0.25, tilt: TILT, see: true });
  group.add(shadowStandIns(items, card.aspect, [0.62, 0.42, 0.3], 0.06));
  return group;
}
