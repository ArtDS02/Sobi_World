// Dressing the diorama (G0) from the area's own data: woods grown on the forest share (and the margin) out of the kit's trees, bushes
// and rocks along every border of the woods, grass tufts and flowers on the open grass, the area's landmark prop, its enemy groups and
// its chests (creatures.ts brings those to life). Positions come from a seed, so the area always looks the same. Every standing
// picture leans to the camera; its shadow comes from round stand-ins (cards.ts).
import * as THREE from 'three';
import type { AreaMap } from '../../../src/areas/adventure/logic/config/content';
import { ENEMIES, PROPS } from '../../../src/areas/adventure/logic/config/content';
import { TILT, cardBatch, shadowStandIns, type CardLook, type CardUniforms, type Placed } from './cards';
import { Creatures } from './creatures';
import { MARGIN, K, deckAt, decksOf, heightAt, kindAt, weightsAt, type Grid } from './field';
import { hash2, noise2 } from './noise';
import { leafLayer, reedCard } from './extraArt';
import { loadCard, tuftCard, type Card } from './textures';
import { BLOCK_SHARE } from './walk';

const KIT = (name: string) => `/assets/props/adventure_map/adv_map_forest_${name}.png`;

interface TreeKind {
  art: string;
  share: number;
  h: [number, number];
  /** Shadow crown (centre height, half width, half height as shares) and trunk half width share. */
  crown: [number, number, number];
  trunk: number;
}
const TREES: TreeKind[] = [
  { art: 'prop_tree_oak', share: 0.42, h: [4.2, 5.6], crown: [0.64, 0.42, 0.3], trunk: 0.06 },
  { art: 'prop_tree_fir', share: 0.3, h: [4.8, 6.6], crown: [0.52, 0.32, 0.42], trunk: 0.05 },
  { art: 'cover_canopy_big', share: 0.17, h: [3.6, 4.6], crown: [0.55, 0.45, 0.36], trunk: 0.05 },
  { art: 'prop_tree_blossom', share: 0.11, h: [3.8, 4.6], crown: [0.62, 0.42, 0.3], trunk: 0.06 },
];
/** Up and back (toward the camera) per unit along the view: the camera looks down 52°. */
const VIEW_UP = Math.sin((52 * Math.PI) / 180);
const VIEW_BACK = Math.cos((52 * Math.PI) / 180);
const FOE_H: Record<string, number> = { normal: 1.7, elite: 2.3, mutant: 2.0, subboss: 2.6, boss: 3.2, special: 2.2 };

export interface Dressing {
  group: THREE.Group;
  creatures: Creatures;
}

export async function dress(map: AreaMap, g: Grid, u: CardUniforms, quality: number, blob: THREE.Texture): Promise<Dressing> {
  const group = new THREE.Group();
  const ground = (x: number, z: number) => heightAt(g, x, z);
  const r = (x: number, y: number, k: number) => hash2(Math.round(x * 97), Math.round(y * 89), k);
  const add = (card: Card, items: Placed[], look: CardLook, shadow?: [[number, number, number], number], tint?: number) => {
    if (!items.length) return;
    group.add(cardBatch(card, items, u, look, tint));
    if (shadow) group.add(shadowStandIns(items, card.aspect, shadow[0], shadow[1]));
  };

  // Woods: a jittered lattice over the forest share (the margin included), on the very line the party is blocked by.
  const trees: Placed[][] = TREES.map(() => []);
  const step = 1.3;
  for (let z = -MARGIN + 0.5; z < g.rows + MARGIN; z += step)
    for (let x = -MARGIN + 0.5; x < g.cols + MARGIN; x += step) {
      const jx = x + (r(x, z, 1) - 0.5) * step * 0.8;
      const jz = z + (r(x, z, 2) - 0.5) * step * 0.8;
      const [, forest, , rock] = weightsAt(g, jx, jz);
      if (forest <= BLOCK_SHARE && rock <= BLOCK_SHARE) continue;
      if (rock > BLOCK_SHARE && r(x, z, 3) < 0.88) continue;
      let pick = r(x, z, 4);
      const t = Math.max(0, TREES.findIndex((k) => (pick -= k.share) < 0));
      const kind = TREES[t]!;
      trees[t]!.push({ x: jx, z: jz, y: ground(jx, jz), h: kind.h[0] + r(x, z, 5) * (kind.h[1] - kind.h[0]), flip: r(x, z, 6) < 0.5 });
    }
  const treeCards = await Promise.all(TREES.map((k) => loadCard(KIT(k.art))));
  // Three layers per tree, moved along the view so they stay in register on screen: the far side of the crown (the picture again,
  // a little larger and darker), the tree itself, and its sunlit leaf clumps in front, swaying more.
  const toCam = (it: Placed, d: number): Placed => ({ ...it, y: it.y + VIEW_UP * d, z: it.z + VIEW_BACK * d });
  TREES.forEach((k, i) => {
    const items = trees[i]!;
    const card = treeCards[i]!;
    add(card, items.map((it) => ({ ...toCam(it, -0.35), h: it.h * 1.012 })), { sway: 0.6, tilt: TILT, see: true, shift: -0.35 * VIEW_BACK }, undefined, 0x6f7f66);
    add(card, items, { sway: 1, tilt: TILT, see: true }, [k.crown, k.trunk]);
    add(leafLayer(card), items.map((it) => toCam(it, 0.3)), { sway: 1.8, tilt: TILT, see: true, shift: 0.3 * VIEW_BACK });
  });

  // Along the woods: bushes, rocks, stumps on the woods' side of every open tile that touches them.
  const bushes: Placed[] = [];
  const rocks: Placed[] = [];
  const stumps: Placed[] = [];
  const open = (k: number) => k === K.grass || k === K.path || k === K.high;
  for (let y = 0; y < g.rows; y += 1)
    for (let x = 0; x < g.cols; x += 1) {
      if (!open(kindAt(g, x, y))) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nk = kindAt(g, x + dx, y + dy);
        if (nk !== K.forest && nk !== K.rock) continue;
        const roll = r(x * 3 + dx, y * 3 + dy, 7);
        const px = x + 0.5 + dx * 0.62 + (r(x, y, 8) - 0.5) * 0.5;
        const pz = y + 0.5 + dy * 0.62 + (r(x, y, 9) - 0.5) * 0.4;
        const at = { x: px, z: pz, y: ground(px, pz), flip: r(x, y, 10) < 0.5 };
        if (roll < 0.34) bushes.push({ ...at, h: 0.8 + r(x, y, 11) * 0.55 });
        else if (roll < 0.42 || (nk === K.rock && roll < 0.7)) rocks.push({ ...at, h: 0.65 + r(x, y, 12) * 0.5 });
        else if (roll < 0.46) stumps.push({ ...at, h: 0.55 + r(x, y, 13) * 0.25 });
      }
    }
  const [bush, rock, stump] = await Promise.all(['prop_bushes', 'prop_rocks', 'prop_stumps'].map((a) => loadCard(KIT(a), a === 'prop_rocks')));
  add(bush!, bushes, { sway: 0.5, tilt: TILT, push: 0.12, see: true }, [[0.42, 0.46, 0.38], 0]);
  add(rock!, rocks, { sway: 0, tilt: TILT, see: true }, [[0.38, 0.46, 0.38], 0]);
  add(stump!, stumps, { sway: 0, tilt: TILT, see: true }, [[0.4, 0.42, 0.4], 0]);

  // Grass tufts and flowers on the open grass; they bend away from the party.
  const tufts: Placed[][] = [[], [], []];
  const ts = 0.62 / Math.sqrt(quality);
  for (let z = 0.2; z < g.rows; z += ts)
    for (let x = 0.2; x < g.cols; x += ts) {
      const jx = x + (r(x, z, 14) - 0.5) * ts;
      const jz = z + (r(x, z, 15) - 0.5) * ts;
      const [path, forest, water, rk] = weightsAt(g, jx, jz);
      if (path + forest + water + rk > 0.25 || r(x, z, 16) > 0.42 + noise2(jx * 0.35, jz * 0.35, 3) * 0.5) continue;
      const v = noise2(jx * 0.45, jz * 0.45, 8) > 0.6 && r(x, z, 17) < 0.55 ? 2 : r(x, z, 18) < 0.5 ? 0 : 1;
      tufts[v]!.push({ x: jx, z: jz, y: ground(jx, jz), h: 0.42 + r(x, z, 19) * 0.32, flip: r(x, z, 20) < 0.5 });
    }
  tufts.forEach((items, i) => add(tuftCard(100 + i, i === 2), items, { sway: 1.6, tilt: TILT, push: 0.28 }));

  // A dense border of grass along every path and reeds on the banks (never on a bridge deck).
  const edge: Placed[] = [];
  const reeds: Placed[] = [];
  const decks = decksOf(g);
  for (let z = 0.15; z < g.rows; z += 0.3)
    for (let x = 0.15; x < g.cols; x += 0.3) {
      const jx = x + (r(x, z, 30) - 0.5) * 0.3;
      const jz = z + (r(x, z, 31) - 0.5) * 0.3;
      if (deckAt(decks, jx, jz)) continue;
      const [path, forest, water, rk] = weightsAt(g, jx, jz);
      const at = { x: jx, z: jz, y: ground(jx, jz), flip: r(x, z, 32) < 0.5 };
      if (forest < 0.2 && water < 0.2 && rk < 0.2 && path > 0.3 && path < 0.5 && r(x, z, 33) < 0.7) edge.push({ ...at, h: 0.3 + r(x, z, 34) * 0.22 });
      if (water > 0.24 && water < 0.47 && noise2(jx * 0.6, jz * 0.6, 12) > 0.42 && r(x, z, 37) < 0.45) reeds.push({ ...at, h: 0.7 + r(x, z, 38) * 0.45 });
    }
  add(tuftCard(200, false), edge, { sway: 1.4, tilt: TILT, push: 0.25 });
  add(reedCard(7), reeds, { sway: 1.2, tilt: TILT, push: 0.2 });

  // The landmark prop(s).
  for (const p of map.props) {
    const def = PROPS[p.prop];
    const card = def ? await loadCard(`/assets/props/adventure_map/${def.art}.png`).catch(() => null) : null;
    if (!def || !card) continue;
    const x = p.x + def.w / 2;
    const z = p.y + def.h - 0.3;
    add(card, [{ x, z, y: ground(x, z), h: (def.w / card.aspect) * 1.45 }], { sway: 0.35, tilt: TILT, see: true }, [[0.7, 0.4, 0.26], 0.14]);
  }

  // Enemy groups and chests.
  const creatures = new Creatures(u, blob, ground);
  group.add(creatures.group);
  for (const gr of map.groups) {
    const art = ENEMIES[gr.pool[0]?.enemies[0] ?? '']?.art;
    const card = art ? await loadCard(`/assets/props/${art}.png`, true).catch(() => null) : null;
    if (card) creatures.addFoe(card, gr.x + 0.5, gr.y + 0.9, FOE_H[gr.kind ?? 'normal'] ?? 1.7, hash2(gr.x, gr.y, 22) * 6);
  }
  for (const c of map.chests) {
    const card = await loadCard(`/assets/props/adventure_map/adv_map_chest_${c.type ?? 'wood'}.png`, true).catch(() => null);
    if (card) creatures.addChest(card, c.x + 0.5, c.y + 0.9, hash2(c.x, c.y, 23) * 6);
  }
  return { group, creatures };
}
