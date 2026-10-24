// Drawing an exploration area (spec §3.2): the ground baked from its tiles (zone tile art when there is some, flat colours until GĐ14)
// with the small dressing scattered on it (decals.ts),
// the props standing on their footprints (drawn as wide as their base, sorted by the bottom edge so the walker passes behind tall
// ones), the things (chests, gates, springs, travellers, stones, shrine, portal) and the enemy groups with their element icons. Phaser
// only; the numbers come from the content and the scene state.
import * as Phaser from 'phaser';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { PROPS, type AreaMap } from '../logic/config/content';
import { thingsOf, type Thing } from '../logic/maps';
import { elementArt } from '../ui/vmKit';
import { decalsOf } from './decals';
import type { AdventureSceneState } from './sceneState';

const GROUND: Record<string, Record<string, number>> = {
  forest: { '.': 0x9fcf7c, ',': 0xd9c08a, '=': 0xb88a55, '#': 0x4f7a3c, '~': 0x6fb6d9 },
  mountain: { '.': 0xc9b28c, ',': 0xe0cfa6, '=': 0x9a7650, '#': 0x7a6450, '~': 0xe0703a },
  ruins: { '.': 0xc8c3b0, ',': 0xe6dfc9, '=': 0xa08868, '#': 0x6d6878, '~': 0x6aa6c8 },
};
const TILE_NAME: Record<string, string> = { '.': 'ground', ',': 'path', '=': 'bridge', '#': 'wall', '~': 'water' };

export const zoneOfMapId = (map: AreaMap): string => map.zoneId.replace(/^zone_/, '');

/** The colour beyond an area's edge (its walls), seen when the camera shows past the edge. */
export const edgeColour = (map: AreaMap): number => (GROUND[zoneOfMapId(map)] ?? GROUND.forest!)['#']!;

/** The art of a thing, by its state. */
export function thingArt(t: Thing, map: AreaMap, s: AdventureSceneState): { id: string; state?: string } {
  switch (t.kind) {
    case 'chest':
      return { id: 'adv_chest', state: s.openedChests.includes(t.id) ? 'open' : 'closed' };
    case 'node':
      return { id: map.nodes.find((n) => n.id === t.id)?.kind === 'ore' ? 'adv_node_ore' : 'adv_node_herb' };
    case 'gate':
      return { id: `adv_gate_${(map.gates.find((g) => g.id === t.id)?.element ?? 'void').toLowerCase()}` };
    case 'spring':
      return { id: 'adv_spring' };
    case 'npc':
      return { id: 'adv_npc_traveler' };
    case 'lore':
      return { id: 'adv_lore_stone' };
    case 'shrine':
      return { id: 'adv_shrine' };
    case 'portal':
      return { id: 'adv_portal', state: s.portalLit ? 'on' : 'off' };
    case 'exit':
      return { id: 'adv_exit' };
  }
}

const key = (scene: Phaser.Scene, id: string, state?: string): string => {
  const k = textureKey(id, state ?? 'asset');
  return scene.textures.exists(k) ? k : FALLBACK_PROP_KEY;
};

/** An image whose bottom-centre stands on the bottom edge of a rectangle of tiles, as wide as `w` tiles × scale. */
function standOn(scene: Phaser.Scene, k: string, map: AreaMap, x: number, y: number, w: number, h: number, scale = 1): Phaser.GameObjects.Image {
  const t = map.tile;
  const img = scene.add.image((x + w / 2) * t, (y + h) * t, k).setOrigin(0.5, 1);
  const width = w * t * scale;
  const ratio = img.height > 0 ? img.width / img.height : 1;
  img.setDisplaySize(width, width / Math.max(0.2, ratio));
  img.setDepth((y + h) * t);
  return img;
}

export interface MapObjects {
  layer: Phaser.GameObjects.Container;
  things: Map<string, Phaser.GameObjects.Image>;
  groups: Map<string, { img: Phaser.GameObjects.Image; label: Phaser.GameObjects.Container }>;
  sparkles: Map<string, Phaser.GameObjects.Text>;
}

/** Builds the whole area; `destroy` the returned layer to drop it. */
export function buildMap(scene: Phaser.Scene, map: AreaMap, s: AdventureSceneState): MapObjects {
  const t = map.tile;
  const zone = zoneOfMapId(map);
  const colours = GROUND[zone] ?? GROUND.forest!;
  const layer = scene.add.container(0, 0);
  const ground = scene.add.graphics().setDepth(-10);
  map.terrain.forEach((row, y) =>
    [...row].forEach((c, x) => {
      const tex = textureKey(`adv_tile_${zone}_${TILE_NAME[c] ?? 'ground'}`);
      if (scene.textures.exists(tex)) layer.add(scene.add.image(x * t, y * t, tex).setOrigin(0).setDisplaySize(t, t).setDepth(-10));
      else ground.fillStyle(colours[c] ?? 0x88aa77, 1).fillRect(x * t, y * t, t + 0.5, t + 0.5);
    }),
  );
  layer.add(ground);
  for (const d of decalsOf(map, zone)) {
    const k = textureKey(d.art);
    if (!scene.textures.exists(k)) continue;
    const img = scene.add.image(d.x, d.y, k).setOrigin(0.5, 1).setDepth(-9).setFlipX(d.flip);
    img.setDisplaySize(d.size, (d.size * img.height) / Math.max(1, img.width));
    layer.add(img);
  }
  for (const p of map.props) {
    const def = PROPS[p.prop];
    if (def) layer.add(standOn(scene, key(scene, def.art), map, p.x, p.y, def.w, def.h, def.scale));
  }
  const things = new Map<string, Phaser.GameObjects.Image>();
  const sparkles = new Map<string, Phaser.GameObjects.Text>();
  for (const th of thingsOf(map)) {
    if (th.kind === 'exit') continue;
    const a = thingArt(th, map, s);
    const img = standOn(scene, key(scene, a.id, a.state), map, th.x, th.y, th.w, th.h, 1);
    things.set(th.id, img);
    layer.add(img);
    if (th.kind === 'chest') {
      const sp = scene.add.text((th.x + 0.5) * t, (th.y - 0.2) * t, '✦', { fontSize: '22px', color: '#fff6a0' }).setOrigin(0.5).setDepth(99999).setAlpha(0);
      sparkles.set(th.id, sp);
      layer.add(sp);
    }
  }
  const groups = new Map<string, { img: Phaser.GameObjects.Image; label: Phaser.GameObjects.Container }>();
  for (const g of s.groups) {
    const img = scene.add.image(0, 0, key(scene, g.art)).setOrigin(0.5, 1);
    const size = g.kind === 'boss' ? 2.4 : g.kind === 'elite' ? 1.8 : 1.4;
    const ratio = img.height > 0 ? img.width / img.height : 1;
    img.setDisplaySize(size * t * ratio, size * t);
    if (g.affix?.golden) img.setTint(0xffe27a);
    groups.set(g.id, { img, label: foeLabel(scene, g.elements, g.count, g.affix?.name ?? null) });
    layer.add([img, groups.get(g.id)!.label]);
  }
  return { layer, things, groups, sparkles };
}

/** The tag over a group seen up close: its elements' badges and how many it is (origin at the bottom centre). */
function foeLabel(scene: Phaser.Scene, elements: readonly AdventureSceneState['groups'][number]['elements'][number][], count: number, affix: string | null): Phaser.GameObjects.Container {
  const icon = 22;
  const parts: Phaser.GameObjects.GameObject[] = [];
  let x = 6;
  for (const e of elements) {
    const k = textureKey(elementArt(e));
    if (!scene.textures.exists(k)) continue;
    parts.push(scene.add.image(x + icon / 2, -icon / 2 - 4, k).setDisplaySize(icon, icon));
    x += icon + 2;
  }
  const text = scene.add.text(x + 2, -icon / 2 - 4, `×${count}`, { fontSize: '16px', fontStyle: 'bold', color: '#4a2e17' }).setOrigin(0, 0.5);
  const w = x + 4 + text.width + 6;
  const bg = scene.add.graphics().fillStyle(0xfff6e0, 0.95).lineStyle(2, 0x8a5a2b, 1).fillRoundedRect(0, -icon - 8, w, icon + 8, 10).strokeRoundedRect(0, -icon - 8, w, icon + 8, 10);
  const box = scene.add.container(0, 0, [bg, ...parts, text]).setDepth(99998).setVisible(false);
  for (const p of box.list as unknown as Phaser.GameObjects.Components.Transform[]) p.x -= w / 2;
  if (affix) {
    // The variant's name on a gold ribbon above the tag.
    const name = scene.add.text(0, -icon - 20, affix, { fontSize: '15px', fontStyle: 'bold', color: '#5b3a1c' }).setOrigin(0.5, 0.5);
    const rw = name.width + 16;
    const ribbon = scene.add.graphics().fillStyle(0xffe27a, 0.97).lineStyle(2, 0xb8860b, 1).fillRoundedRect(-rw / 2, -icon - 30, rw, 20, 9).strokeRoundedRect(-rw / 2, -icon - 30, rw, 20, 9);
    box.add([ribbon, name]);
  }
  return box;
}

/** Re-points the things whose state changed (a chest opened, a gate gone, a portal lit). */
export function refreshThings(scene: Phaser.Scene, map: AreaMap, objs: MapObjects, s: AdventureSceneState) {
  for (const th of thingsOf(map)) {
    const img = objs.things.get(th.id);
    if (!img) continue;
    if (th.kind === 'gate') {
      img.setVisible(!s.openedGates.includes(th.id));
      continue;
    }
    const a = thingArt(th, map, s);
    const k = key(scene, a.id, a.state);
    if (img.texture.key !== k) img.setTexture(k);
    const used = (th.kind === 'node' || th.kind === 'npc' || th.kind === 'shrine') && s.usedSpots.includes(th.id);
    img.setAlpha(used || (th.kind === 'spring' && s.springUsed) ? 0.55 : 1);
  }
}
