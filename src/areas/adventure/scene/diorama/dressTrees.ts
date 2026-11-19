// The woods of the diorama: trunks, bushes, rocks and stumps stand ONLY in the tiles the game blocks (blockers.ts), one per tile,
// plus the forest margin around the area. Every standing picture leans to the camera and its shadow comes from round stand-ins
// (cards.ts); each tree is three layers (the far side of the crown, the tree, its sunlit leaf clumps) so the crown has depth. The
// crowns overhang the open tiles: the party is seen through them by the see-through ring (docs/maps/MAP_SCENE_STANDARD.md §6).
import * as THREE from 'three';
import type { AreaMap } from '../../logic/config/content';
import { cardOf, forestKit, type ArtFn } from './artKit';
import { marginTrees, placeFeet, type BlockerPlan, type Foot } from './blockers';
import { TILT, cardBatch, shadowStandIns, type CardLook, type CardUniforms, type Placed } from './cards';
import type { SceneContract } from './contracts';
import { leafLayer } from './extraArt';
import { mushroomClusters } from './mushrooms';
import { heightAt, type Grid } from './field';
import type { Card } from './textures';

interface TreeKind {
  art: string;
  h: [number, number];
  /** Shadow crown (centre height, half width, half height as shares) and trunk half width share. */
  crown: [number, number, number];
  trunk: number;
}
/** In the order of the contract's tree shares: oak, fir, big canopy, blossom. */
const TREES: TreeKind[] = [
  { art: 'prop_tree_oak', h: [4.2, 5.6], crown: [0.64, 0.42, 0.3], trunk: 0.06 },
  { art: 'prop_tree_fir', h: [4.8, 6.6], crown: [0.52, 0.32, 0.42], trunk: 0.05 },
  { art: 'cover_canopy_big', h: [3.6, 4.6], crown: [0.55, 0.45, 0.36], trunk: 0.05 },
  { art: 'prop_tree_blossom', h: [3.8, 4.6], crown: [0.62, 0.42, 0.3], trunk: 0.06 },
];
/** Up and back (toward the camera) per unit along the view: the camera looks down 52°. */
const VIEW_UP = Math.sin((52 * Math.PI) / 180);
const VIEW_BACK = Math.cos((52 * Math.PI) / 180);

/** Standing pictures by foot kind: the kit's, and the corruption's. */
const LOW = {
  bush: {
    art: 'prop_bushes',
    bad: 'corrupt_bush',
    h: [0.8, 1.35],
    look: { sway: 0.5, tilt: TILT, push: 0.12, see: true } as CardLook,
    crown: [0.42, 0.46, 0.38] as [number, number, number],
  },
  rock: {
    art: 'prop_rocks',
    bad: 'corrupt_rock',
    h: [0.65, 1.15],
    look: { sway: 0, tilt: TILT, see: true } as CardLook,
    crown: [0.38, 0.46, 0.38] as [number, number, number],
  },
  stump: {
    art: 'prop_stumps',
    bad: 'corrupt_log',
    h: [0.55, 0.8],
    look: { sway: 0, tilt: TILT, see: true } as CardLook,
    crown: [0.4, 0.42, 0.4] as [number, number, number],
  },
} as const;

export async function dressTrees(art: ArtFn, plan: BlockerPlan, map: AreaMap, g: Grid, u: CardUniforms, c: SceneContract, light = false): Promise<THREE.Group> {
  const group = new THREE.Group();
  const opts = { mix: c.trees, corrupt: c.corrupt };
  const sick = c.sick ?? 0;
  // Where the contract keeps the woods low, a tall tree is drawn as a bush (the tile still blocks, its foot is unchanged).
  const low = c.keepLow ?? [];
  const kept = (f: Foot) => low.some((r) => f.x >= r.x && f.x < r.x + r.w && f.z >= r.y && f.z < r.y + r.h);
  const feet = [...placeFeet(plan, opts), ...marginTrees(map, opts)].map((f): Foot => (f.kind === 'tree' && kept(f) ? { ...f, kind: 'bush' } : f));
  const at = (f: Foot, h: number): Placed => ({
    x: f.x,
    z: f.z,
    y: heightAt(g, f.x, f.z),
    h,
    flip: f.flip,
  });
  const add = (card: Card | null, items: Placed[], look: CardLook, shadow?: [[number, number, number], number], tint?: number, order = 0) => {
    if (!card || !items.length) return;
    const batch = cardBatch(card, items, u, look, tint);
    batch.children.forEach((m) => (m.renderOrder = order));
    group.add(batch);
    if (shadow) group.add(shadowStandIns(items, card.aspect, shadow[0], shadow[1]));
  };

  // Three layers per tree (the far one only at full quality), moved along the view so they stay in register on screen: the far side of the crown (the picture again,
  // a little larger and darker), the tree itself, and its sunlit leaf clumps in front, swaying more.
  const toCam = (it: Placed, d: number): Placed => ({
    ...it,
    y: it.y + VIEW_UP * d,
    z: it.z + VIEW_BACK * d,
  });
  const treeCards = await Promise.all(TREES.map((k) => cardOf(art, forestKit(k.art))));
  TREES.forEach((k, i) => {
    const card = treeCards[i];
    const items = feet.filter((f) => f.kind === 'tree' && !f.bad && f.variant === i).map((f) => at(f, k.h[0] + f.roll * (k.h[1] - k.h[0])));
    if (!card) return;
    // The far layer is drawn last (its pixels are mostly hidden by the tree, so the depth test discards them early) and unlit by volume.
    if (!light)
      add(
        { tex: card.tex, aspect: card.aspect },
        items.map((it) => ({ ...toCam(it, -0.35), h: it.h * 1.012 })),
        { sway: 0.6, tilt: TILT, see: true, shift: -0.35 * VIEW_BACK, sick },
        undefined,
        0x6f7f66,
        2,
      );
    add(card, items, { sway: 1, tilt: TILT, see: true, sick }, [k.crown, k.trunk]);
    add(
      leafLayer(card),
      items.map((it) => toCam(it, 0.3)),
      { sway: 1.8, tilt: TILT, see: true, shift: 0.3 * VIEW_BACK, sick },
    );
  });
  const oak = TREES[0]!;
  add(
    await cardOf(art, forestKit('corrupt_oak')),
    feet.filter((f) => f.kind === 'tree' && f.bad).map((f) => at(f, 3.4 + f.roll * 1.6)),
    { sway: 0.5, tilt: TILT, see: true },
    [oak.crown, oak.trunk],
  );

  // Bushes, rocks and stumps: the blocker of the edge tiles.
  for (const kind of ['bush', 'rock', 'stump'] as const) {
    const low = LOW[kind];
    const [card, bad] = await Promise.all([cardOf(art, forestKit(low.art), kind === 'rock'), cardOf(art, forestKit(low.bad), kind === 'rock')]);
    const mine = feet.filter((f) => f.kind === kind);
    const h = (f: Foot) => low.h[0] + f.roll * (low.h[1] - low.h[0]);
    add(
      card,
      mine.filter((f) => !f.bad).map((f) => at(f, h(f))),
      { ...low.look, sick },
      [low.crown, 0],
    );
    add(
      bad,
      mine.filter((f) => f.bad).map((f) => at(f, h(f))),
      low.look,
      [low.crown, 0],
    );
  }
  if (c.mushrooms) {
    const clusters = await mushroomClusters(art, feet, g, u, c.mushrooms);
    if (clusters) group.add(clusters);
  }
  return group;
}
