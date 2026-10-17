// Drawing an exploration area (spec §3.2): the ground baked from its tiles (zone tile art when there is some, flat colours until GĐ14),
// the props standing on their footprints (drawn as wide as their base, sorted by the bottom edge so the walker passes behind tall
// ones), the things (chests, gates, springs, travellers, stones, shrine, portal) and the enemy groups with their element icons. Phaser
// only; the numbers come from the content and the scene state.
import * as Phaser from 'phaser';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { PROPS, type AreaMap } from '../logic/config/content';
import { thingsOf, type Thing } from '../logic/maps';
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
  groups: Map<string, { img: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text }>;
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
  const groups = new Map<string, { img: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text }>();
  for (const g of s.groups) {
    const img = scene.add.image(0, 0, key(scene, g.art)).setOrigin(0.5, 1);
    const size = g.kind === 'boss' ? 2.4 : g.kind === 'elite' ? 1.8 : 1.4;
    const ratio = img.height > 0 ? img.width / img.height : 1;
    img.setDisplaySize(size * t * ratio, size * t);
    const label = scene.add.text(0, 0, '', { fontSize: '16px', color: '#2b2118', backgroundColor: '#fff6e0', padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setDepth(99998);
    groups.set(g.id, { img, label });
    layer.add([img, label]);
  }
  return { layer, things, groups, sparkles };
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
