// Drawing an area in the Map Editor (decision 047, GĐ6): its painted background (the same chunks the game lays, `sceneChunks`), the
// ground as colours (all of it on an area drawn from tiles, see-through over a painting when "Va chạm" is on), the grid, heights,
// every object with its letter (props with their picture), the selection and the shape being drawn. One screen px = `scale` / tile;
// `ox`, `oy` = the tile at the canvas' top-left — tiles stay the game's own, the zoom only changes the drawing.
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { DECOR, PROPS } from '../../src/areas/adventure/logic/config/content';
import { decorOf } from '../../src/areas/adventure/logic/scenery';
import { sceneChunks } from '../../src/areas/adventure/scene/mapScene';
import { COLOUR } from './mapCanvas';
import { objectsOf, refKey, type EditObj, type ObjKind, type Tile } from './mapEditModel';
import { artUrl } from './store';

export interface View {
  scale: number;
  ox: number;
  oy: number;
}

/** What is shown, as the game's own layers (the renderer has no VFX layer of its own on the map). */
export interface Layers {
  /** Terrain background: the painting. */
  background: boolean;
  /** Ground details: decorations lying flat. */
  ground: boolean;
  /** Environment: props and decorations sorted with the walkers. */
  environment: boolean;
  /** Interactive objects: spawns, portal, exits, chests, gates… */
  objects: boolean;
  /** Characters and creatures: the enemy groups. */
  creatures: boolean;
  /** Foreground / cover: decorations over the party and the hidden-way covers. */
  foreground: boolean;
  /** Navigation overlay: blocked ground (and decoration feet), grid, heights. */
  collision: boolean;
  grid: boolean;
  elevation: boolean;
}

export const LAYER_LABEL: Record<keyof Layers, string> = {
  background: 'Nền vẽ',
  ground: 'Chi tiết mặt đất',
  environment: 'Môi trường (cây, đá…)',
  objects: 'Vật tương tác',
  creatures: 'Nhóm quái',
  foreground: 'Tiền cảnh / lớp che',
  collision: 'Va chạm',
  grid: 'Lưới (G)',
  elevation: 'Độ cao',
};

/** The layer an object is drawn in. */
function layerOf(map: AreaMap, o: EditObj): keyof Layers {
  if (o.kind === 'scenery') {
    const d = map.scenery?.find((x) => x.id === o.id);
    const mode = d?.mode ?? DECOR[d?.asset ?? '']?.mode ?? 'occluder';
    return mode === 'normal' ? 'ground' : mode === 'occluder' ? 'environment' : 'foreground';
  }
  if (o.kind === 'props') return 'environment';
  if (o.kind === 'covers') return 'foreground';
  if (o.kind === 'groups') return 'creatures';
  return 'objects';
}

/** What is being dragged out: a rectangle of tiles (ground, cover, selection) or tiles under the brush. */
export type Ghost = { kind: 'rect'; a: Tile; b: Tile; colour: string } | { kind: 'tiles'; tiles: Tile[]; colour: string } | null;

export const OBJ_STYLE: Record<ObjKind, [letter: string, colour: string]> = {
  spawn: ['S', '#ffffff'],
  spawns: ['S', '#ffd84a'],
  portal: ['P', '#b98cf0'],
  shrine: ['R', '#f29bc6'],
  exits: ['>', '#ff9b3d'],
  groups: ['Q', '#e05050'],
  chests: ['C', '#f2c14e'],
  nodes: ['H', '#9fd36b'],
  gates: ['G', '#e0703a'],
  covers: ['▒', '#2a5e28'],
  puzzles: ['Z', '#f0d060'],
  springs: ['W', '#5fb8e8'],
  npcs: ['N', '#c79bf2'],
  lore: ['L', '#d8cbb0'],
  props: ['▲', '#3f6b35'],
  scenery: ['✿', '#7fd0a0'],
};

/** Pictures by URL, loaded once; `onLoad` redraws when one arrives. */
export class ImageCache {
  private readonly images = new Map<string, HTMLImageElement>();
  constructor(private readonly onLoad: () => void) {}

  get(url: string | null): HTMLImageElement | null {
    if (!url) return null;
    let img = this.images.get(url);
    if (!img) {
      img = new Image();
      img.onload = this.onLoad;
      img.src = url;
      this.images.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }
}

export const tileAtScreen = (view: View, sx: number, sy: number): Tile => ({ x: Math.floor(sx / view.scale + view.ox), y: Math.floor(sy / view.scale + view.oy) });

/** The view that shows the whole area in a canvas of this size. */
export function fitView(map: AreaMap, w: number, h: number): View {
  const scale = Math.max(2, Math.min(w / map.cols, h / map.rows));
  return { scale, ox: -(w / scale - map.cols) / 2, oy: -(h / scale - map.rows) / 2 };
}

export function drawEditor(
  canvas: HTMLCanvasElement,
  map: AreaMap,
  view: View,
  layers: Layers,
  images: ImageCache,
  selected: ReadonlySet<string>,
  ghost: Ghost,
) {
  const g = canvas.getContext('2d')!;
  const s = view.scale;
  const px = (tx: number) => (tx - view.ox) * s;
  const py = (ty: number) => (ty - view.oy) * s;
  g.fillStyle = '#17121f';
  g.fillRect(0, 0, canvas.width, canvas.height);
  // Background: the painting, or the ground colours of an area drawn from tiles.
  const chunks = sceneChunks(map);
  let painted = false;
  if (layers.background && chunks.length) {
    for (const c of chunks) {
      const img = images.get(artUrl(c.id));
      const x = c.x / map.tile;
      const y = c.y / map.tile;
      if (img) {
        g.drawImage(img, px(x), py(y), (c.w / map.tile) * s, (c.h / map.tile) * s);
        painted = true;
      } else {
        g.fillStyle = '#2b3a2a';
        g.fillRect(px(x), py(y), (c.w / map.tile) * s, (c.h / map.tile) * s);
      }
    }
  }
  const showGround = !painted || layers.collision;
  if (showGround) {
    g.globalAlpha = painted ? 0.45 : 1;
    map.terrain.forEach((row, y) =>
      [...row].forEach((c, x) => {
        // Over a painting only the blocked ground is tinted, so the picture still reads.
        if (painted && '.,=^sc'.includes(c)) return;
        g.fillStyle = COLOUR[c] ?? '#000';
        g.fillRect(px(x), py(y), s + 0.5, s + 0.5);
      }),
    );
    g.globalAlpha = 1;
  }
  if (layers.elevation && map.scene?.elevation && s >= 10) {
    g.font = `700 ${Math.round(s * 0.55)}px system-ui`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffffcc';
    map.scene.elevation.forEach((row, y) => [...row].forEach((h, x) => h !== '0' && g.fillText(h, px(x + 0.5), py(y + 0.5))));
  }
  if (layers.grid && s >= 6) {
    g.strokeStyle = '#ffffff22';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= map.cols; x += 1) {
      g.moveTo(Math.round(px(x)) + 0.5, py(0));
      g.lineTo(Math.round(px(x)) + 0.5, py(map.rows));
    }
    for (let y = 0; y <= map.rows; y += 1) {
      g.moveTo(px(0), Math.round(py(y)) + 0.5);
      g.lineTo(px(map.cols), Math.round(py(y)) + 0.5);
    }
    g.stroke();
  }
  g.strokeStyle = '#ffffff88';
  g.strokeRect(px(0), py(0), map.cols * s, map.rows * s);
  for (const o of objectsOf(map)) if (layers[layerOf(map, o)]) drawObject(g, map, o, px, py, s, images, selected.has(refKey(o)));
  // Decoration feet: the tiles they block, over everything when the navigation overlay is on.
  if (layers.collision) {
    g.strokeStyle = '#ff5050';
    g.lineWidth = 2;
    for (const d of decorOf(map)) for (const r of d.foot) g.strokeRect(px(r.x) + 1, py(r.y) + 1, r.w * s - 2, r.h * s - 2);
    g.lineWidth = 1;
  }
  if (ghost) {
    g.fillStyle = ghost.colour;
    g.globalAlpha = 0.45;
    const tiles = ghost.kind === 'tiles' ? ghost.tiles : [];
    for (const t of tiles) g.fillRect(px(t.x), py(t.y), s, s);
    if (ghost.kind === 'rect') {
      const x = Math.min(ghost.a.x, ghost.b.x);
      const y = Math.min(ghost.a.y, ghost.b.y);
      g.fillRect(px(x), py(y), (Math.abs(ghost.a.x - ghost.b.x) + 1) * s, (Math.abs(ghost.a.y - ghost.b.y) + 1) * s);
    }
    g.globalAlpha = 1;
  }
}

function drawObject(g: CanvasRenderingContext2D, map: AreaMap, o: EditObj, px: (x: number) => number, py: (y: number) => number, s: number, images: ImageCache, sel: boolean) {
  const [letter, colour] = OBJ_STYLE[o.kind];
  const x = px(o.x);
  const y = py(o.y);
  const w = o.w * s;
  const h = o.h * s;
  if (o.kind === 'covers') {
    g.fillStyle = '#2a5e2855';
    g.fillRect(x, y, w, h);
    g.setLineDash([6, 4]);
    g.strokeStyle = '#7fe07a';
    g.strokeRect(x, y, w, h);
    g.setLineDash([]);
  } else if (o.kind === 'scenery') {
    const d = decorOf(map).find((x) => x.id === o.id);
    const img = d ? images.get(artUrl(d.art)) : null;
    if (d && img) {
      const dw = d.w * s;
      const dh = d.h !== null ? d.h * s : (img.naturalHeight / img.naturalWidth) * dw;
      g.save();
      g.translate(px(d.x), py(d.y));
      g.rotate((d.rotate * Math.PI) / 180);
      g.scale(d.flip ? -1 : 1, 1);
      g.globalAlpha = d.mode === 'cover' ? 0.8 : 1;
      g.drawImage(img, -dw / 2, -dh * (1 - d.anchorY), dw, dh);
      g.restore();
    } else {
      g.fillStyle = `${colour}aa`;
      g.fillRect(x, y, w, h);
    }
  } else if (o.kind === 'props') {
    const prop = PROPS[map.props[Number(o.id)]!.prop];
    const img = prop ? images.get(artUrl(prop.art)) : null;
    if (img) {
      // Feet on the footprint's bottom edge, as wide as the footprint × its scale (like the game).
      const dw = w * (prop?.scale ?? 1);
      const dh = (img.naturalHeight / img.naturalWidth) * dw;
      g.drawImage(img, x + (w - dw) / 2, y + h - dh, dw, dh);
    } else {
      g.fillStyle = `${colour}cc`;
      g.fillRect(x, y, w, h);
    }
  } else {
    g.fillStyle = colour;
    g.globalAlpha = o.kind === 'exits' || o.kind === 'gates' ? 0.75 : 0.95;
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.globalAlpha = 1;
    if (s >= 8) {
      g.fillStyle = '#1d1410';
      g.font = `700 ${Math.round(Math.min(s, 28) * 0.7)}px system-ui`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(letter, x + w / 2, y + h / 2 + 1);
    }
  }
  if (sel) {
    g.lineWidth = 2;
    g.strokeStyle = '#ff2fd0';
    g.strokeRect(x - 1, y - 1, w + 2, h + 2);
    if (o.sizable) {
      g.fillStyle = '#ff2fd0';
      g.fillRect(x + w - Math.max(4, s / 3), y + h - Math.max(4, s / 3), Math.max(4, s / 3), Math.max(4, s / 3));
    }
    g.lineWidth = 1;
  }
}
