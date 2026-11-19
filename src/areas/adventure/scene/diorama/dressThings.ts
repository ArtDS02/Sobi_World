// What stands on the open ground of the diorama: grass tufts and flowers that bend away from the party, a border of grass along the
// paths, reeds on the banks (never above half a tile on a tile one can walk on), the landmark props, the decorations, the things of the
// area (stones, gates, springs, travellers, exits…), the waterfall, and the enemy groups and chests (foes.ts brings those to life).
// Pictures come by id through the host's resolver; what each thing shows follows the scene state, as in the 2D map (`thingArt`).
import * as THREE from 'three';
import { ENEMIES, PROPS, type AreaMap } from '../../logic/config/content';
import { thingsOf } from '../../logic/maps';
import { decorOf } from '../../logic/scenery';
import { chestArt, exitArt, MIMIC_ART } from '../mapKit';
import { thingArt, zoneOfMapId } from '../mapView';
import type { AdventureSceneState } from '../sceneState';
import { cardOf, forestKit, type ArtFn } from './artKit';
import { buildBarrier } from './barriers';
import { TILT, cardBatch, shadowStandIns, type CardLook, type CardUniforms, type Placed } from './cards';
import { decksOf, deckAt } from './decks';
import { reedCard } from './extraArt';
import { heightAt, weightsAt, type Grid } from './field';
import { Foes } from './foes';
import { hash2, noise2 } from './noise';
import { tuftCard, type Card } from './textures';

/** Height of a tall landmark (an oak, a dead tree) as a multiple of its footprint's width over the picture's aspect (a wide one keeps 1.45). */
const LANDMARK = 1.6;
const FOE_H: Record<string, number> = { normal: 1.7, elite: 2.3, mutant: 2.0, subboss: 2.6, boss: 3.2, special: 2.2 };

export interface Things {
  group: THREE.Group;
  foes: Foes;
  /** Breathes the glow of the exits (call each frame with the clock, seconds). */
  glow(t: number): void;
}

export async function dressThings(art: ArtFn, map: AreaMap, g: Grid, u: CardUniforms, quality: number, blob: THREE.Texture, s: AdventureSceneState): Promise<Things> {
  const group = new THREE.Group();
  const ground = (x: number, z: number) => heightAt(g, x, z);
  const r = (x: number, y: number, k: number) => hash2(Math.round(x * 97), Math.round(y * 89), k);
  const walkable = (x: number, z: number) => x >= 0 && z >= 0 && x < g.cols && z < g.rows && !g.blocked[Math.floor(z) * g.cols + Math.floor(x)];
  const add = (card: Card | null, items: Placed[], look: CardLook, shadow?: [[number, number, number], number]) => {
    if (!card || !items.length) return;
    group.add(cardBatch(card, items, u, look));
    if (shadow) group.add(shadowStandIns(items, card.aspect, shadow[0], shadow[1]));
  };

  // Grass tufts and flowers on the open grass. Low: at most half a tile.
  const tufts: Placed[][] = [[], [], []];
  const ts = 0.62 / Math.sqrt(quality);
  for (let z = 0.2; z < g.rows; z += ts)
    for (let x = 0.2; x < g.cols; x += ts) {
      const jx = x + (r(x, z, 14) - 0.5) * ts;
      const jz = z + (r(x, z, 15) - 0.5) * ts;
      const [path, forest, water, rk] = weightsAt(g, jx, jz);
      if (path + forest + water + rk > 0.25 || r(x, z, 16) > 0.42 + noise2(jx * 0.35, jz * 0.35, 3) * 0.5) continue;
      const v = noise2(jx * 0.45, jz * 0.45, 8) > 0.6 && r(x, z, 17) < 0.55 ? 2 : r(x, z, 18) < 0.5 ? 0 : 1;
      tufts[v]!.push({ x: jx, z: jz, y: ground(jx, jz), h: 0.3 + r(x, z, 19) * 0.2, flip: r(x, z, 20) < 0.5 });
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
      if (forest < 0.2 && water < 0.2 && rk < 0.2 && path > 0.3 && path < 0.5 && r(x, z, 33) < 0.7) edge.push({ ...at, h: 0.3 + r(x, z, 34) * 0.2 });
      if (water > 0.24 && water < 0.47 && noise2(jx * 0.6, jz * 0.6, 12) > 0.42 && r(x, z, 37) < 0.45) {
        const tall = 0.7 + r(x, z, 38) * 0.45;
        reeds.push({ ...at, h: walkable(jx, jz) ? Math.min(0.5, tall) : tall });
      }
    }
  add(tuftCard(200, false), edge, { sway: 1.4, tilt: TILT, push: 0.25 });
  add(reedCard(7), reeds, { sway: 1.2, tilt: TILT, push: 0.2 });

  // The landmark props: they stand on the back half of their footprint, their picture overhangs the front.
  for (const p of map.props) {
    const def = PROPS[p.prop];
    const card = def ? await cardOf(art, def.art) : null;
    if (!def || !card) continue;
    const x = p.x + def.w / 2;
    const z = p.y + def.h - 0.3;
    // A landmark is the biggest thing in the area: drawn well above the ordinary trees (about 1/6 of the frame wide).
    add(card, [{ x, z, y: ground(x, z), h: (def.w / card.aspect) * (card.aspect < 1 ? LANDMARK : 1.45) }], { sway: 0.35, tilt: TILT, see: true }, [[0.7, 0.4, 0.26], 0.14]);
  }

  // Hand-placed decorations (decision 047) and the things of the area, one batch per picture.
  const pictures = new Map<string, { card: Card; items: Placed[] }>();
  const put = async (id: string, state: string | undefined, x: number, z: number, width: number) => {
    const key = `${id}|${state ?? ''}`;
    let p = pictures.get(key);
    if (!p) {
      const card = await cardOf(art, id, false, state);
      if (!card) return;
      p = { card, items: [] };
      pictures.set(key, p);
    }
    p.items.push({ x, z, y: ground(x, z), h: width / p.card.aspect, flip: false });
  };
  for (const d of decorOf(map)) await put(d.art, undefined, d.x, d.y, d.w);
  const has = (id: string) => art(id) !== null;
  const glows: THREE.Sprite[] = [];
  const zone = zoneOfMapId(map);
  for (const t of thingsOf(map)) {
    if (t.kind === 'chest') continue;
    if (t.kind === 'exit') {
      const e = map.exits.find((x) => x.id === t.id);
      const open = s.exits.find((x) => x.id === t.id)?.open ?? true;
      const id = exitArt(zone, e?.kind, open);
      const wide = Math.max(t.w, t.h) + 1.7;
      // Shut: what the 2D map draws barring it (the zone's bramble), as a thorny wall over the exit's tiles; open: the passage.
      const bar = !open && id ? await cardOf(art, id) : null;
      if (bar) group.add(buildBarrier(bar, t, u, ground, 41));
      else if (id) await put(id, undefined, t.x + t.w / 2, t.y + t.h - 0.1, wide);
      // A soft warm-gold glow on the ground at an open exit (a shut one has its ember thorns: a glow there showed through the bramble
      // as a box). It stands on the ground, never over the party.
      if (open) {
        const spot = new THREE.Sprite(new THREE.SpriteMaterial({ map: blob, color: new THREE.Color(1.6, 1.35, 0.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
        spot.position.set(t.x + t.w / 2, ground(t.x + t.w / 2, t.y + t.h / 2) + 0.35, t.y + t.h / 2);
        spot.scale.set(wide * 1.5, wide * 0.8, 1);
        glows.push(spot);
        group.add(spot);
      }
      continue;
    }
    const a = thingArt(t, map, s, has);
    if (t.kind === 'gate' && !a.id.startsWith('adv_map_') && !a.id.startsWith('adv_tile_')) {
      // An element gate (the 2D map hides it once opened): while shut, a thorny wall over its tiles, like a shut exit.
      if (s.openedGates.includes(t.id)) continue;
      const bar = await cardOf(art, a.id, false, a.state);
      if (bar) {
        group.add(buildBarrier(bar, t, u, ground, 43));
        continue;
      }
    }
    await put(a.id, a.state, t.x + t.w / 2, t.y + t.h - 0.12, Math.max(1.1, t.w + 0.4));
  }
  for (const { card, items } of pictures.values()) add(card, items, { sway: 0, tilt: TILT, see: true }, [[0.5, 0.4, 0.4], 0]);

  // The waterfall: the kit's picture over the `w` tiles, as wide as they are, its foot on their lowest row.
  // TODO(M4): falling-water shader, spray and the ring of foam at the foot.
  const falls = [...g.fall].flatMap((v, i) => (v ? [{ x: i % g.cols, y: Math.floor(i / g.cols) }] : []));
  const fallCard = falls.length ? await cardOf(art, forestKit('edge_waterfall')) : null;
  if (fallCard) {
    const x0 = Math.min(...falls.map((f) => f.x));
    const x1 = Math.max(...falls.map((f) => f.x)) + 1;
    const z1 = Math.max(...falls.map((f) => f.y)) + 1;
    const cx = (x0 + x1) / 2;
    add(fallCard, [{ x: cx, z: z1 - 0.15, y: ground(cx, z1 - 0.15), h: (x1 - x0 + 0.4) / fallCard.aspect }], { sway: 0, tilt: TILT });
  }

  // Enemy groups and chests.
  const foes = new Foes(u, blob, ground);
  group.add(foes.group);
  const mimic = await cardOf(art, MIMIC_ART, true);
  for (const gr of map.groups) {
    const view = s.groups.find((x) => x.id === gr.id);
    const id = view?.art ?? ENEMIES[gr.pool[0]?.enemies[0] ?? '']?.art;
    const card = id ? await cardOf(art, id, true) : null;
    if (!card) continue;
    foes.addFoe({ id: gr.id, card, mimic, x: gr.x + 0.5, z: gr.y + 0.9, h: view?.size || FOE_H[gr.kind ?? 'normal'] || 1.7, phase: hash2(gr.x, gr.y, 22) * 6 });
    if (view) foes.setFoe(gr.id, { asleep: view.asleep, defeated: view.defeated, golden: !!view.affix?.golden, disguised: view.disguised });
  }
  for (const c of map.chests) {
    const [card, openCard] = await Promise.all([cardOf(art, chestArt(c.type, false), true), cardOf(art, chestArt(c.type, true), true)]);
    if (!card) continue;
    foes.addChest({ id: c.id, card, openCard, x: c.x + 0.5, z: c.y + 0.9, phase: hash2(c.x, c.y, 23) * 6 });
    foes.setChest(c.id, s.openedChests.includes(c.id));
  }
  const glow = (t: number) => glows.forEach((s, i) => (s.material.opacity = 0.32 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 2))));
  return { group, foes, glow };
}
