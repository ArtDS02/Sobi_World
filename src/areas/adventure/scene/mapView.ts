// Drawing an exploration area (spec §3.2): the ground baked from its tiles (zone tile art when there is some, flat colours until GĐ14)
// with the small dressing scattered on it (decals.ts),
// the props standing on their footprints (drawn as wide as their base, sorted by the bottom edge so the walker passes behind tall
// ones), the things (chests, gates, springs, travellers, stones, shrine, portal) and the enemy groups with their element icons. Phaser
// only; the numbers come from the content and the scene state.
import * as Phaser from 'phaser';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { PROPS, type AreaMap } from '../logic/config/content';
import { thingsOf, type Thing } from '../logic/maps';
import { vi } from '../../../i18n/vi';
import { decalsOf } from './decals';
import { dressCorruption } from './mapCorruption';
import { corruptionMarks, foeLabel, NO_MARKS, sleepMark, type CorruptionMarks } from './foeMarks';
import { drawCover } from './mapCovers';
import { chestArt, kitTile, MIMIC_ART, puzzleArt } from './mapKit';
import { dressArea, type AreaDressing } from './mapDepth';
import type { AdventureSceneState } from './sceneState';

const GROUND: Record<string, Record<string, number>> = {
  forest: { '.': 0x9fcf7c, ',': 0xd9c08a, '=': 0xb88a55, '#': 0x4f7a3c, '~': 0x6fb6d9 },
  mountain: { '.': 0xc9b28c, ',': 0xe0cfa6, '=': 0x9a7650, '#': 0x7a6450, '~': 0xe0703a },
  ruins: { '.': 0xc8c3b0, ',': 0xe6dfc9, '=': 0xa08868, '#': 0x6d6878, '~': 0x6aa6c8 },
  coast: { '.': 0xf0e0b0, ',': 0xe8d4a0, '=': 0xb08860, '#': 0x8a8070, '~': 0x4aa8d8 },
};
const TILE_NAME: Record<string, string> = { '.': 'ground', ',': 'path', '=': 'bridge', '#': 'wall', '~': 'water', '^': 'ground', s: 'path', c: 'ground', F: 'wall', w: 'water' };
/** The layout v2 tiles drawn with a base tile until the kit's own (decision 045): its base character and a tint. */
const TILE_BASE: Record<string, [string, number]> = { '^': ['.', 0xf2f7e6], s: [',', 0xcfc0a8], c: ['.', 0xcbb0dc], F: ['#', 0xb8a894], w: ['~', 0xe8f6ff] };

export const zoneOfMapId = (map: AreaMap): string => map.zoneId.replace(/^zone_/, '');

/** The colour beyond an area's edge (its walls), seen when the camera shows past the edge. */
export const edgeColour = (map: AreaMap): number => (GROUND[zoneOfMapId(map)] ?? GROUND.forest!)['#']!;

/** The art of a thing, by its state; `has` says whether a kit picture is loaded (else the older art). */
export function thingArt(t: Thing, map: AreaMap, s: AdventureSceneState, has: (id: string) => boolean = () => false): { id: string; state?: string } {
  switch (t.kind) {
    case 'chest': {
      // The kit's chest of its kind (decision 045), else the older one.
      const open = s.openedChests.includes(t.id);
      const kit = chestArt(map.chests.find((c) => c.id === t.id)?.type, open);
      return has(kit) ? { id: kit } : { id: 'adv_chest', state: open ? 'open' : 'closed' };
    }
    case 'node':
      return { id: map.nodes.find((n) => n.id === t.id)?.kind === 'ore' ? 'adv_node_ore' : 'adv_node_herb' };
    case 'gate': {
      const gate = map.gates.find((g) => g.id === t.id);
      // A false wall wears the zone's own wall tile until it gives way (decision 045).
      if (gate?.look === 'crack') return { id: `adv_tile_${zoneOfMapId(map)}_wall` };
      return { id: `adv_gate_${(gate?.element ?? 'void').toLowerCase()}` };
    }
    case 'puzzle': {
      // An element device, dark until lit (the kit's own pair), else the shrine dimmed.
      const p = map.puzzles.find((x) => x.id === t.id);
      const kit = puzzleArt(t.id, p?.element ?? 'LIGHT', s.litPuzzles.includes(t.id));
      return has(kit) ? { id: kit } : { id: 'adv_shrine' };
    }
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

/** A teleport gate's picture: its own art (`adv_warp_gate`, on / off) when the manifest has it, else the area portal's. */
const gateKey = (scene: Phaser.Scene, open: boolean): string => {
  const own = textureKey('adv_warp_gate', open ? 'on' : 'off');
  return scene.textures.exists(own) ? own : key(scene, 'adv_portal', open ? 'on' : 'off');
};

export interface MapObjects {
  layer: Phaser.GameObjects.Container;
  things: Map<string, Phaser.GameObjects.Image>;
  /** Each group's picture with its resting scale and its own breathing phase, its shadow and its tag. */
  groups: Map<
    string,
    {
      img: Phaser.GameObjects.Image;
      sx: number;
      sy: number;
      phase: number;
      shadow: Phaser.GameObjects.Ellipse;
      label: Phaser.GameObjects.Container;
      /** A dark glow under a group corrupted 3 or more, and the Zzz over a sleeping one (decision 045). */
      aura: Phaser.GameObjects.Image | null;
      zzz: Phaser.GameObjects.Image | Phaser.GameObjects.Text | null;
      /** Its corruption marks (decision 045): violet veins on the ground under it from 3, crystal spikes behind it from 4. */
      marks: CorruptionMarks;
    }
  >;
  sparkles: Map<string, Phaser.GameObjects.Text>;
  /** The teleport gates (exits): the portal picture, its swirl of light while open, the lock and its words while shut. */
  gates: Map<string, { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; lock: Phaser.GameObjects.Container; words: Phaser.GameObjects.Text }>;
  dressing: AreaDressing;
  /** The overhead covers over hidden places, drawn over the party (decision 045). */
  covers: Map<string, Phaser.GameObjects.Container>;
}

/** Builds the whole area; `destroy` the returned layer to drop it. `motion` = false (reduced motion): the dressing stays still. */
export function buildMap(scene: Phaser.Scene, map: AreaMap, s: AdventureSceneState, motion = true): MapObjects {
  const t = map.tile;
  const zone = zoneOfMapId(map);
  const colours = GROUND[zone] ?? GROUND.forest!;
  const layer = scene.add.container(0, 0);
  const depth = dressArea(scene, layer, map, zone, motion);
  depth.under();
  const ground = scene.add.graphics().setDepth(-10);
  map.terrain.forEach((row, y) =>
    [...row].forEach((c, x) => {
      const kit = kitTile(zone, c, x, y);
      const tex = kit && scene.textures.exists(textureKey(kit.id)) ? textureKey(kit.id) : textureKey(`adv_tile_${zone}_${TILE_NAME[c] ?? 'ground'}`);
      const [base, plain] = TILE_BASE[c] ?? [c, 0xffffff];
      const tint = kit && tex === textureKey(kit.id) ? kit.tint : plain;
      if (scene.textures.exists(tex)) layer.add(scene.add.image(x * t, y * t, tex).setOrigin(0).setDisplaySize(t, t).setDepth(-10).setTint(tint));
      else ground.fillStyle(colours[base] ?? 0x88aa77, 1).fillRect(x * t, y * t, t + 0.5, t + 0.5);
    }),
  );
  layer.add(ground);
  const dressing = depth.ground();
  dressCorruption(scene, layer, map, s.corruption, motion);
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
    const a = thingArt(th, map, s, (id) => scene.textures.exists(textureKey(id)));
    const img = standOn(scene, key(scene, a.id, a.state), map, th.x, th.y, th.w, th.h, 1);
    // A tall thin device (a lightning rod) or a chest no taller than its place; its lit picture keeps the same scale.
    const tallest = th.kind === 'puzzle' ? 1.8 : th.kind === 'chest' ? 1.2 : Infinity;
    if (img.displayHeight > tallest * t) img.setScale(img.scaleX * ((tallest * t) / img.displayHeight));
    things.set(th.id, img);
    layer.add(img);
    if (th.kind === 'gate' && map.gates.find((g) => g.id === th.id)?.look === 'crack') {
      // Laid exactly over its tiles like the wall around it, with a crack across.
      img.setOrigin(0).setPosition(th.x * t, th.y * t).setDisplaySize(th.w * t, th.h * t);
      layer.add(img.setData('crack', crackOver(scene, map, th)).getData('crack') as Phaser.GameObjects.Graphics);
    }
    if (th.kind === 'chest') {
      const sp = scene.add.text((th.x + 0.5) * t, (th.y - 0.2) * t, '✦', { fontSize: '22px', color: '#fff6a0' }).setOrigin(0.5).setDepth(99999).setAlpha(0);
      sparkles.set(th.id, sp);
      layer.add(sp);
    }
  }
  const groups: MapObjects['groups'] = new Map();
  for (const g of s.groups) {
    // A mimic wears a closed chest, a tile high (decision 045).
    const mimic = scene.textures.exists(textureKey(MIMIC_ART)) ? textureKey(MIMIC_ART) : key(scene, 'adv_chest', 'closed');
    const img = scene.add.image(0, 0, g.disguised ? mimic : key(scene, g.art)).setOrigin(0.5, 1);
    const size = g.disguised ? 1 : g.size;
    const ratio = img.height > 0 ? img.width / img.height : 1;
    img.setDisplaySize(size * t * ratio, size * t);
    // Corruption darkens the picture toward violet; a golden variant shines gold instead.
    img.setTint(g.disguised ? 0xffffff : g.affix?.golden ? 0xffe27a : (CORRUPTION_TINT[g.corruption - 1] ?? 0xffffff));
    const shadow = scene.add.ellipse(0, 0, size * t * ratio * 0.7, size * t * 0.18, g.corruption >= 3 ? 0x3a0a4a : 0x000000, g.corruption >= 3 ? 0.4 : 0.22);
    const aura = g.corruption >= 3 && !g.disguised ? scene.add.image(0, 0, 'adv-fx-blob').setDisplaySize(size * t * ratio * 1.3, size * t * 0.75).setTint(0x4a0f6a).setAlpha(0) : null;
    const zzz = g.asleep ? sleepMark(scene, t) : null;
    const marks = g.disguised ? NO_MARKS : corruptionMarks(scene, g.corruption, size * t, ratio);
    const phase = [...g.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % 100;
    const label = foeLabel(scene, g.kind, g.elements, g.count, g.affix?.name ?? g.title, g.corruption, g.asleep);
    groups.set(g.id, { img, sx: img.scaleX, sy: img.scaleY, phase, shadow, label, aura, zzz, marks });
    layer.add([shadow, ...(marks.veins ? [marks.veins] : []), ...(aura ? [aura] : []), ...marks.spikes, img, ...(zzz ? [zzz] : []), label]);
  }
  const gates: MapObjects['gates'] = new Map();
  for (const e of map.exits) {
    const view = s.exits.find((x) => x.id === e.id);
    const cx = (e.x + e.w / 2) * t;
    const feet = (e.y + e.h) * t;
    const glow = scene.add.image(cx, feet - t * 1.4, 'adv-fx-blob').setDisplaySize(t * 3.4, t * 3.4).setTint(view?.forward ? 0x9ae6ff : 0xd8ffd0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
    const img = standOn(scene, gateKey(scene, !!view?.open), map, e.x - 0.5, e.y, e.w + 1, e.h, 1.05);
    const words = scene.add.text(0, -6, lockWords(view?.lock ?? null), { fontSize: '15px', fontStyle: 'bold', color: '#fff6e0', backgroundColor: '#5b3a1cdd', padding: { x: 8, y: 4 } }).setOrigin(0.5, 1);
    const lockKey = textureKey('ui_icon_lock');
    const lockIcon = scene.textures.exists(lockKey) ? [scene.add.image(0, -words.height - 22, lockKey).setDisplaySize(34, 34)] : [];
    const lock = scene.add.container(cx, (e.y - 0.4) * t, [words, ...lockIcon]).setVisible(false);
    gates.set(e.id, { img, glow, lock, words });
    layer.add([glow, img, lock]);
  }
  const covers = new Map<string, Phaser.GameObjects.Container>();
  for (const c of map.covers) covers.set(c.id, drawCover(scene, map, c));
  layer.once(Phaser.GameObjects.Events.DESTROY, () => covers.forEach((g) => g.destroy()));
  return { layer, things, groups, sparkles, gates, dressing, covers };
}

/** The crack across a false wall: a dark zigzag over its rock. */
function crackOver(scene: Phaser.Scene, map: AreaMap, th: { x: number; y: number; w: number; h: number }): Phaser.GameObjects.Graphics {
  const cx = (th.x + th.w / 2) * map.tile;
  const top = (th.y + 0.12) * map.tile;
  const h = th.h * map.tile * 0.76;
  const g = scene.add.graphics().lineStyle(3, 0x2a1d14, 0.85);
  g.beginPath().moveTo(cx - 4, top);
  for (let i = 1; i <= 5; i += 1) g.lineTo(cx + (i % 2 === 0 ? -7 : 7), top + (h * i) / 5);
  return g.strokePath();
}

/** What a shut exit says when the party comes close (decision 043). */
const lockWords = (lock: AdventureSceneState['exits'][number]['lock']): string =>
  lock === 'shortcut' ? vi.adventure.explore.shortcutLocked : lock === 'zone' ? vi.adventure.explore.zoneLocked : vi.adventure.explore.gateLocked;

/** Tint of a group's picture by corruption 1–5 (decision 045): from its own colours toward a sick violet. */
const CORRUPTION_TINT = [0xffffff, 0xf0e2f6, 0xe0c8ee, 0xcfaae6, 0xb98ad8];

/** Re-points the things whose state changed (a chest opened, a gate gone, a portal lit, a teleport gate opened). */
export function refreshThings(scene: Phaser.Scene, map: AreaMap, objs: MapObjects, s: AdventureSceneState, time = 0, near: { x: number; y: number } | null = null) {
  for (const e of map.exits) {
    const g = objs.gates.get(e.id);
    const view = s.exits.find((x) => x.id === e.id);
    if (!g || !view) continue;
    const k = gateKey(scene, view.open);
    if (g.img.texture.key !== k) g.img.setTexture(k);
    g.img.setTint(view.open ? 0xffffff : 0x9a9aa8);
    // An open gate breathes light; a shut one is dark and says why when the party comes close.
    g.glow.setVisible(view.open).setAlpha(0.45 + 0.25 * Math.sin(time / 380)).setRotation(time / 1600);
    const close = !!near && Math.hypot(near.x - (e.x + e.w / 2) * map.tile, near.y - (e.y + e.h / 2) * map.tile) < map.tile * 4;
    const words = lockWords(view.lock);
    if (g.words.text !== words) g.words.setText(words);
    g.lock.setVisible(!view.open && close);
  }
  for (const th of thingsOf(map)) {
    const img = objs.things.get(th.id);
    if (!img) continue;
    if (th.kind === 'gate') {
      img.setVisible(!s.openedGates.includes(th.id));
      (img.getData('crack') as Phaser.GameObjects.Graphics | undefined)?.setVisible(img.visible);
      continue;
    }
    const a = thingArt(th, map, s, (id) => scene.textures.exists(textureKey(id)));
    const k = key(scene, a.id, a.state);
    if (img.texture.key !== k) img.setTexture(k);
    if (th.kind === 'puzzle' && a.id === 'adv_shrine') img.setTint(s.litPuzzles.includes(th.id) ? 0xfff2b0 : 0x8a8a9a);
    const used = (th.kind === 'node' || th.kind === 'npc' || th.kind === 'shrine') && s.usedSpots.includes(th.id);
    img.setAlpha(used || (th.kind === 'spring' && s.springUsed) ? 0.55 : 1);
  }
}
