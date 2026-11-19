// What stands on the open ground of the diorama: grass tufts and flowers that bend away from the party, a border of grass along the
// paths, reeds on the banks (never above half a tile on a tile one can walk on), the landmark props, the decorations, the things of the
// area (stones, gates, springs, travellers, exits…) and the enemy groups and chests (foes.ts brings those to life).
// Pictures come by id through the host's resolver; what each thing shows follows the scene state, as in the 2D map (`thingArt`).
import * as THREE from 'three';
import { ENEMIES, PROPS, type AreaMap } from '../../logic/config/content';
import { thingsOf } from '../../logic/maps';
import { decorOf } from '../../logic/scenery';
import { chestArt, exitArt, MIMIC_ART } from '../mapKit';
import { thingArt, zoneOfMapId } from '../mapView';
import type { AdventureSceneState } from '../sceneState';
import { cardOf, type ArtFn } from './artKit';
import { buildBarrier } from './barriers';
import { TILT, cardBatch, shadowStandIns, type CardLook, type CardUniforms, type Placed } from './cards';
import { decksOf, deckAt } from './decks';
import { reedCard, softEdges } from './extraArt';
import { heightAt, weightsAt, type Grid } from './field';
import { Foes } from './foes';
import { InkPool } from './inkPool';
import { LandmarkGlow } from './landmarkGlow';
import { Spores } from './spores';
import { hash2, noise2 } from './noise';
import { tuftCard, type Card } from './textures';

/** Height of a tall landmark (an oak, a dead tree) as a multiple of its footprint's width over the picture's aspect (a wide one keeps 1.45). */
const LANDMARK = 1.6;
/** Landmarks drawn larger than their footprint says, kept whole (their grey stones are no painted shadow) and alive with a soft glow. */
const LANDMARKS: Readonly<Record<string, { scale: number; glow: boolean; spores?: boolean }>> = {
  prop_adv_lm_f2: { scale: 1.2, glow: true },
  prop_adv_lm_f3: { scale: 1.15, glow: false },
  prop_adv_lm_n1: { scale: 1.1, glow: false, spores: true },
  prop_adv_lm_n2: { scale: 1.35, glow: false },
};
const FOE_H: Record<string, number> = { normal: 1.7, elite: 2.3, mutant: 2.0, subboss: 2.6, boss: 3.2, special: 2.2 };

export interface Things {
  group: THREE.Group;
  foes: Foes;
  /** Breathes the glow of the exits (call each frame with the clock, seconds). */
  glow(t: number): void;
}

/** A soft dark ellipse lying on the ground (a thing's contact shadow), `w` × `d` tiles. */
function contactShadow(blob: THREE.Texture, x: number, y: number, z: number, w: number, d: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blob, color: 0x050c05, transparent: true, opacity: 0.55, depthWrite: false }));
  m.position.set(x, y + 0.05, z);
  m.scale.set(w, 1, d);
  m.renderOrder = 3;
  return m;
}

export async function dressThings(art: ArtFn, map: AreaMap, g: Grid, u: CardUniforms, quality: number, blob: THREE.Texture, s: AdventureSceneState, opts: { inkPools?: boolean; /** Share of the landmark's spores (default 1). */ spore?: number; /** Height of a shut barrier as a multiple of the default (a taller wall with a soft shadow at its foot). */ barrier?: number } = {}): Promise<Things> {
  const { inkPools = false, spore = 1, barrier = 1 } = opts;
  const group = new THREE.Group();
  const ground = (x: number, z: number) => heightAt(g, x, z);
  const r = (x: number, y: number, k: number) => hash2(Math.round(x * 97), Math.round(y * 89), k);
  const walkable = (x: number, z: number) => x >= 0 && z >= 0 && x < g.cols && z < g.rows && !g.blocked[Math.floor(z) * g.cols + Math.floor(x)];
  const add = (card: Card | null, items: Placed[], look: CardLook, shadow?: [[number, number, number], number]) => {
    if (!card || !items.length) return;
    group.add(cardBatch(card, items, u, look));
    if (shadow) group.add(shadowStandIns(items, card.aspect, shadow[0], shadow[1]));
  };

  /** Things that move on their own each frame (a landmark's glow). */
  const lives: ((t: number) => void)[] = [];

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
    const plain = def ? await cardOf(art, def.art) : null;
    if (!def || !plain) continue;
    const x = p.x + def.w / 2;
    const z = p.y + def.h - 0.3;
    const look = LANDMARKS[p.prop];
    const card = look ? await cardOf(art, def.art, true) : plain;
    // A landmark is the biggest thing in the area: drawn well above the ordinary trees (about 1/6 of the frame wide).
    if (!card) continue;
    const h = (def.w / card.aspect) * (card.aspect < 1 ? LANDMARK : 1.45) * (look?.scale ?? 1);
    add(card, [{ x, z, y: ground(x, z), h }], { sway: 0.35, tilt: TILT, see: true }, [[0.7, 0.4, 0.26], 0.14]);
    if (look?.glow) {
      const lg = new LandmarkGlow(new THREE.Vector3(x, ground(x, z), z), h * card.aspect, h, blob);
      group.add(lg.group);
      lives.push((t) => lg.update(t, 1));
    }
    if (look?.spores) {
      const sp = new Spores(new THREE.Vector3(x, ground(x, z), z), h * card.aspect, h, blob, Math.max(4, Math.round(26 * quality * spore)));
      group.add(sp.group);
      lives.push((t) => sp.update(t, 1));
    }
  }

  // Hand-placed decorations (decision 047) and the things of the area, one batch per picture.
  const pictures = new Map<string, { card: Card; items: Placed[] }>();
  const put = async (id: string, state: string | undefined, x: number, z: number, width: number, keep: boolean | number = false) => {
    const key = `${id}|${state ?? ''}|${keep}`;
    let p = pictures.get(key);
    if (!p) {
      const loaded = await cardOf(art, id, keep, state);
      if (!loaded) return;
      // The log tunnel's picture is cut by its own frame at the top and the right: those edges melt into the woods.
      const card = id.endsWith('exit_log_tunnel') ? softEdges(loaded, { top: 0.16, right: 0.2 }) : loaded;
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
      if (bar) group.add(buildBarrier(bar, t, u, ground, 41, 1.25 * barrier));
      if (bar && barrier > 1) group.add(contactShadow(blob, t.x + t.w / 2, ground(t.x + t.w / 2, t.y + t.h), t.y + t.h - 0.1, t.w + 1.4, 1.8));
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
        group.add(buildBarrier(bar, t, u, ground, 43, 1.25 * barrier));
        if (barrier > 1) group.add(contactShadow(blob, t.x + t.w / 2, ground(t.x + t.w / 2, t.y + t.h), t.y + t.h - 0.1, t.w + 1.4, 1.8));
        continue;
      }
    }
    // A boulder gate: its painted ground shadow is cut away (it would show as a hard band) and a soft round one lies under it.
    const boulder = t.kind === 'gate' && a.id.includes('boulder');
    if (boulder) group.add(contactShadow(blob, t.x + t.w / 2, ground(t.x + t.w / 2, t.y + t.h - 0.3), t.y + t.h - 0.35, t.w * 0.95, 2));
    await put(a.id, a.state, t.x + t.w / 2, t.y + t.h - 0.12, Math.max(1.1, t.w + 0.4), boulder ? 0.85 : false);
  }
  for (const { card, items } of pictures.values()) add(card, items, { sway: 0, tilt: TILT, see: true }, [[0.5, 0.4, 0.4], 0]);

  // The waterfall is drawn by waterfall.ts (the view builds it from the `w` tiles).

  // Enemy groups and chests (a boss of the corruption stands in a pool of its ink).
  const foes = new Foes(u, blob, ground);
  group.add(foes.group);
  const mimic = await cardOf(art, MIMIC_ART, true);
  for (const gr of map.groups) {
    if (inkPools && gr.kind === 'boss') {
      const pool = new InkPool(blob, gr.x + 0.5, ground(gr.x + 0.5, gr.y + 0.9), gr.y + 0.9);
      group.add(pool.group);
      lives.push((t) => pool.update(t));
    }
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
  const glow = (t: number) => {
    lives.forEach((f) => f(t));
    glows.forEach((s, i) => (s.material.opacity = 0.32 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 2))));
  };
  return { group, foes, glow };
}
