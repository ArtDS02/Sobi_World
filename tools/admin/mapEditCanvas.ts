// Drawing an area in the Map Editor (decision 047, GĐ6): its painted background (the same chunks the game lays, `sceneChunks`), the
// ground as colours (all of it on an area drawn from tiles), the walk overlay (what the game really blocks: ground, props, things,
// decoration feet — `blockedTiles` — in strong see-through colours, each kind switchable), the grid (fading out when zoomed far),
// heights, every object with its letter (props with their picture), the selection, the hovered tile, the shape being drawn, the
// problem markers of the checks and the rulers. View units are CSS px: `scale` px per tile; `ox`, `oy` = the tile at the canvas'
// top-left — tiles stay the game's own, the zoom only changes the drawing.
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { DECOR, PROPS } from '../../src/areas/adventure/logic/config/content';
import { blockedTiles } from '../../src/areas/adventure/logic/maps';
import { decorOf } from '../../src/areas/adventure/logic/scenery';
import { sceneChunks } from '../../src/areas/adventure/scene/mapScene';
import { COLOUR } from './mapCanvas';
import type { EditorIssue, IssueLevel } from './mapIssues';
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
  /** Navigation overlay: walkable / blocked / special / water tiles. */
  collision: boolean;
  grid: boolean;
  elevation: boolean;
}

export const LAYER_LABEL: Record<keyof Layers, string> = {
  background: 'Nền bản đồ',
  ground: 'Chi tiết mặt đất',
  environment: 'Môi trường (cây, đá…)',
  objects: 'Vật thể tương tác',
  creatures: 'Nhóm quái',
  foreground: 'Tiền cảnh / lớp che',
  collision: 'Vùng chặn di chuyển',
  grid: 'Lưới',
  elevation: 'Độ cao',
};

/** The walk overlay's kinds of tile. */
export interface Overlays {
  walk: boolean;
  block: boolean;
  special: boolean;
  water: boolean;
}

export const OVERLAY_STYLE: Record<keyof Overlays, { label: string; fill: string; alpha: number; edge: string }> = {
  walk: { label: 'Có thể di chuyển', fill: '#16a34a', alpha: 0.28, edge: '#4ade80' },
  block: { label: 'Không thể di chuyển', fill: '#dc2626', alpha: 0.4, edge: '#f87171' },
  special: { label: 'Vùng đặc biệt', fill: '#f59e0b', alpha: 0.42, edge: '#fbbf24' },
  water: { label: 'Nước', fill: '#2563eb', alpha: 0.46, edge: '#60a5fa' },
};

/** Bridges, high ground, stone steps, corrupted ground: walkable, with a rule or a look of their own. */
const SPECIAL = new Set(['=', '^', 's', 'c']);
const WATER = new Set(['~', 'w']);

/** The overlay kind of every tile, as the game walks it (closed element gates block). */
export function overlayKinds(map: AreaMap): (keyof Overlays)[] {
  const blocked = blockedTiles(map);
  const out: (keyof Overlays)[] = [];
  for (let y = 0; y < map.rows; y += 1)
    for (let x = 0; x < map.cols; x += 1) {
      const c = map.terrain[y]?.[x] ?? '#';
      out.push(WATER.has(c) ? 'water' : blocked[y * map.cols + x] ? 'block' : SPECIAL.has(c) ? 'special' : 'walk');
    }
  return out;
}

/** The layer an object is drawn in. */
export function layerOf(map: AreaMap, o: { kind: ObjKind; id: string }): keyof Layers {
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

export const LEVEL_COLOUR: Record<IssueLevel, string> = { error: '#ef4444', warn: '#f59e0b', info: '#3b82f6' };
const LEVEL_RANK: Record<IssueLevel, number> = { error: 0, warn: 1, info: 2 };

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

/** The view that shows the whole area in a canvas of this size (CSS px), with a margin around it. */
export function fitView(map: AreaMap, w: number, h: number, margin = 28): View {
  const scale = Math.max(2, Math.min((w - margin * 2) / map.cols, (h - margin * 2) / map.rows));
  return { scale, ox: -(w / scale - map.cols) / 2, oy: -(h / scale - map.rows) / 2 };
}

/** A view of the same scale with tile (x, y) in the middle of a w × h canvas. */
export const centredOn = (scale: number, x: number, y: number, w: number, h: number): View => ({ scale, ox: x - w / scale / 2, oy: y - h / scale / 2 });

/** One marker on the map: the problems of one tile, drawn as a badge at its top-right corner. */
export interface MarkerSpot {
  /** `x,y` of the tile. */
  key: string;
  x: number;
  y: number;
  level: IssueLevel;
  issues: EditorIssue[];
  /** The badge centre and radius, screen px. */
  cx: number;
  cy: number;
  r: number;
}

/** The markers of `issues` (those with a tile), one per tile, the worst level showing. */
export function markerSpots(view: View, issues: readonly EditorIssue[]): MarkerSpot[] {
  const byTile = new Map<string, EditorIssue[]>();
  for (const i of issues) if (i.x !== undefined && i.y !== undefined) byTile.set(`${i.x},${i.y}`, [...(byTile.get(`${i.x},${i.y}`) ?? []), i]);
  const s = view.scale;
  const r = Math.max(7, Math.min(12, s * 0.34));
  return [...byTile.entries()].map(([key, list]) => {
    const [x, y] = key.split(',').map(Number) as [number, number];
    const level = list.reduce<IssueLevel>((worst, i) => (LEVEL_RANK[i.level] < LEVEL_RANK[worst] ? i.level : worst), 'info');
    return { key, x, y, level, issues: list, cx: (x + 1 - view.ox) * s, cy: (y - view.oy) * s, r };
  });
}

/** The marker under a screen point. */
export const markerAt = (spots: readonly MarkerSpot[], sx: number, sy: number): MarkerSpot | undefined =>
  [...spots].reverse().find((m) => Math.hypot(m.cx - sx, m.cy - sy) <= m.r + 3);

export interface DrawOptions {
  /** CSS px of the canvas and the device pixel ratio it is drawn at. */
  width: number;
  height: number;
  dpr: number;
  layers: Layers;
  overlays: Overlays;
  images: ImageCache;
  selected: ReadonlySet<string>;
  ghost: Ghost;
  /** The tiles under the pointer (the brush's footprint). */
  hover: readonly Tile[];
  rulers: boolean;
  /** Problem markers (hidden while something is dragged: they would lag behind). */
  markers: readonly MarkerSpot[];
  /** The marker picked (its tile glows). */
  activeMarker: string | null;
  /** A tile to show after "Đi tới": pulsing ring, `phase` 0–1. */
  focus: { x: number; y: number; w: number; h: number; phase: number } | null;
}

export function drawEditor(canvas: HTMLCanvasElement, map: AreaMap, view: View, o: DrawOptions) {
  const g = canvas.getContext('2d')!;
  g.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
  const s = view.scale;
  const px = (tx: number) => (tx - view.ox) * s;
  const py = (ty: number) => (ty - view.oy) * s;
  const { layers } = o;
  g.fillStyle = '#12101c';
  g.fillRect(0, 0, o.width, o.height);
  // A soft shadow under the area so it stands off the workspace.
  g.save();
  g.shadowColor = '#000a';
  g.shadowBlur = 24;
  g.fillStyle = '#1d1a2a';
  g.fillRect(px(0), py(0), map.cols * s, map.rows * s);
  g.restore();
  // Background: the painting, or the ground colours of an area drawn from tiles.
  const chunks = sceneChunks(map);
  let painted = false;
  if (layers.background && chunks.length) {
    for (const c of chunks) {
      const img = o.images.get(artUrl(c.id));
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
  if (!painted && layers.background) {
    map.terrain.forEach((row, y) =>
      [...row].forEach((c, x) => {
        g.fillStyle = COLOUR[c] ?? '#000';
        g.fillRect(px(x), py(y), s + 0.5, s + 0.5);
      }),
    );
  }
  // The walk overlay: strong see-through fills, and at close zoom the edge of each blocked / water region drawn solid.
  if (layers.collision) {
    const kinds = overlayKinds(map);
    for (let y = 0; y < map.rows; y += 1)
      for (let x = 0; x < map.cols; x += 1) {
        const k = kinds[y * map.cols + x]!;
        if (!o.overlays[k]) continue;
        g.globalAlpha = OVERLAY_STYLE[k].alpha;
        g.fillStyle = OVERLAY_STYLE[k].fill;
        g.fillRect(px(x), py(y), s + 0.5, s + 0.5);
      }
    g.globalAlpha = 1;
    if (s >= 10) {
      g.lineWidth = s >= 24 ? 2 : 1.5;
      for (const k of ['block', 'water'] as const) {
        if (!o.overlays[k]) continue;
        g.strokeStyle = OVERLAY_STYLE[k].edge;
        g.beginPath();
        for (let y = 0; y < map.rows; y += 1)
          for (let x = 0; x < map.cols; x += 1) {
            if (kinds[y * map.cols + x] !== k) continue;
            const other = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < map.cols && yy < map.rows && kinds[yy * map.cols + xx] !== k;
            const edge = (x0: number, y0: number, x1: number, y1: number) => {
              g.moveTo(px(x0), py(y0));
              g.lineTo(px(x1), py(y1));
            };
            if (other(x, y - 1)) edge(x, y, x + 1, y);
            if (other(x, y + 1)) edge(x, y + 1, x + 1, y + 1);
            if (other(x - 1, y)) edge(x, y, x, y + 1);
            if (other(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
          }
        g.stroke();
      }
      g.lineWidth = 1;
    }
  }
  if (layers.elevation && map.scene?.elevation && s >= 10) {
    g.font = `700 ${Math.round(s * 0.5)}px system-ui`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 3;
    g.strokeStyle = '#000a';
    g.fillStyle = '#fff';
    map.scene.elevation.forEach((row, y) =>
      [...row].forEach((h, x) => {
        if (h === '0') return;
        g.strokeText(h, px(x + 0.5), py(y + 0.5));
        g.fillText(h, px(x + 0.5), py(y + 0.5));
      }),
    );
    g.lineWidth = 1;
  }
  // The grid: every tile when close, only every 5th line when far (no noise over the picture), fading in with the zoom.
  if (layers.grid && s >= 4) {
    const near = s >= 10;
    const k = Math.min(1, Math.max(0, (s - 10) / 22));
    const line = (step: number, colour: string) => {
      g.strokeStyle = colour;
      g.beginPath();
      for (let x = 0; x <= map.cols; x += step) {
        g.moveTo(Math.round(px(x)) + 0.5, py(0));
        g.lineTo(Math.round(px(x)) + 0.5, py(map.rows));
      }
      for (let y = 0; y <= map.rows; y += step) {
        g.moveTo(px(0), Math.round(py(y)) + 0.5);
        g.lineTo(px(map.cols), Math.round(py(y)) + 0.5);
      }
      g.stroke();
    };
    g.lineWidth = 1;
    if (near) line(1, `rgba(12, 8, 24, ${(0.22 + 0.2 * k).toFixed(2)})`);
    line(5, `rgba(12, 8, 24, ${near ? 0.55 : 0.35})`);
    if (near && s >= 18) line(1, `rgba(255, 255, 255, ${(0.06 + 0.06 * k).toFixed(2)})`);
  }
  g.strokeStyle = '#ffffff99';
  g.strokeRect(px(0) - 0.5, py(0) - 0.5, map.cols * s + 1, map.rows * s + 1);
  for (const obj of objectsOf(map)) if (layers[layerOf(map, obj)]) drawObject(g, map, obj, px, py, s, o.images, o.selected.has(refKey(obj)));
  // Decoration feet: the tiles they block.
  if (layers.collision && o.overlays.block) {
    g.strokeStyle = '#ff5050';
    g.lineWidth = 2;
    g.setLineDash([4, 3]);
    for (const d of decorOf(map)) for (const r of d.foot) g.strokeRect(px(r.x) + 1, py(r.y) + 1, r.w * s - 2, r.h * s - 2);
    g.setLineDash([]);
    g.lineWidth = 1;
  }
  if (o.ghost) {
    g.fillStyle = o.ghost.colour;
    g.globalAlpha = 0.4;
    const tiles = o.ghost.kind === 'tiles' ? o.ghost.tiles : [];
    for (const t of tiles) g.fillRect(px(t.x), py(t.y), s, s);
    if (o.ghost.kind === 'rect') {
      const x = Math.min(o.ghost.a.x, o.ghost.b.x);
      const y = Math.min(o.ghost.a.y, o.ghost.b.y);
      const w = (Math.abs(o.ghost.a.x - o.ghost.b.x) + 1) * s;
      const h = (Math.abs(o.ghost.a.y - o.ghost.b.y) + 1) * s;
      g.fillRect(px(x), py(y), w, h);
      g.globalAlpha = 1;
      g.strokeStyle = o.ghost.colour;
      g.lineWidth = 2;
      g.strokeRect(px(x), py(y), w, h);
      g.lineWidth = 1;
    }
    g.globalAlpha = 1;
  }
  // The hovered tiles: a bright outline over everything but the markers.
  if (o.hover.length) {
    g.fillStyle = '#ffffff22';
    for (const t of o.hover) g.fillRect(px(t.x), py(t.y), s, s);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    const xs = o.hover.map((t) => t.x);
    const ys = o.hover.map((t) => t.y);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    g.strokeRect(px(x0) + 1, py(y0) + 1, (Math.max(...xs) - x0 + 1) * s - 2, (Math.max(...ys) - y0 + 1) * s - 2);
    g.lineWidth = 1;
  }
  drawMarkers(g, o.markers, o.activeMarker, s, px, py);
  if (o.focus) {
    const f = o.focus;
    const grow = 6 + 10 * f.phase;
    g.strokeStyle = '#ffffff';
    g.globalAlpha = 1 - f.phase * 0.8;
    g.lineWidth = 3;
    g.strokeRect(px(f.x) - grow, py(f.y) - grow, f.w * s + grow * 2, f.h * s + grow * 2);
    g.globalAlpha = 1;
    g.strokeStyle = '#facc15';
    g.lineWidth = 3;
    g.strokeRect(px(f.x) - 2, py(f.y) - 2, f.w * s + 4, f.h * s + 4);
    g.lineWidth = 1;
  }
  if (o.rulers) drawRulers(g, map, view, o, px, py);
}

function drawMarkers(g: CanvasRenderingContext2D, spots: readonly MarkerSpot[], active: string | null, s: number, px: (x: number) => number, py: (y: number) => number) {
  for (const m of spots) {
    const colour = LEVEL_COLOUR[m.level];
    g.globalAlpha = m.key === active ? 0.5 : 0.3;
    g.fillStyle = colour;
    g.fillRect(px(m.x), py(m.y), s, s);
    g.globalAlpha = 1;
    g.strokeStyle = colour;
    g.lineWidth = m.key === active ? 3 : 2;
    g.strokeRect(px(m.x) + 1, py(m.y) + 1, s - 2, s - 2);
  }
  g.lineWidth = 1;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const m of spots) {
    g.beginPath();
    g.arc(m.cx, m.cy, m.r + (m.key === active ? 2 : 0), 0, Math.PI * 2);
    g.fillStyle = LEVEL_COLOUR[m.level];
    g.shadowColor = '#000c';
    g.shadowBlur = 6;
    g.fill();
    g.shadowBlur = 0;
    g.lineWidth = 2;
    g.strokeStyle = '#fff';
    g.stroke();
    g.fillStyle = '#fff';
    g.font = `800 ${Math.round(m.r * 1.25)}px system-ui`;
    g.fillText(m.issues.length > 1 ? String(m.issues.length) : m.level === 'info' ? 'i' : '!', m.cx, m.cy + 0.5);
  }
  g.lineWidth = 1;
}

/** Tile numbers along the top and left edges, the hovered column / row lit. */
function drawRulers(g: CanvasRenderingContext2D, map: AreaMap, view: View, o: DrawOptions, px: (x: number) => number, py: (y: number) => number) {
  const s = view.scale;
  const step = s >= 22 ? 1 : s >= 9 ? 5 : 10;
  const hx = o.hover[0]?.x;
  const hy = o.hover[0]?.y;
  g.fillStyle = '#12101cdd';
  g.fillRect(0, 0, o.width, 18);
  g.fillRect(0, 0, 26, o.height);
  g.font = '600 10px system-ui';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let x = 0; x < map.cols; x += 1) {
    if (x % step && x !== hx) continue;
    const cx = px(x + 0.5);
    if (cx < 26 || cx > o.width) continue;
    g.fillStyle = x === hx ? '#facc15' : '#a99fc0';
    g.fillText(String(x), cx, 9);
  }
  g.textAlign = 'right';
  for (let y = 0; y < map.rows; y += 1) {
    if (y % step && y !== hy) continue;
    const cy = py(y + 0.5);
    if (cy < 18 || cy > o.height) continue;
    g.fillStyle = y === hy ? '#facc15' : '#a99fc0';
    g.fillText(String(y), 22, cy);
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
    const r = Math.min(4, s / 5);
    g.beginPath();
    g.roundRect(x + 1, y + 1, w - 2, h - 2, r);
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = '#0008';
    g.stroke();
    if (s >= 8) {
      g.fillStyle = '#1d1410';
      g.font = `800 ${Math.round(Math.min(s, 28) * 0.62)}px system-ui`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(letter, x + w / 2, y + h / 2 + 1);
    }
  }
  if (sel) {
    // A bright cyan frame with a dark rim (reads on light and dark ground), corner handles, the resize handle for sizable ones.
    g.lineWidth = 4;
    g.strokeStyle = '#0b0a14';
    g.strokeRect(x - 2, y - 2, w + 4, h + 4);
    g.lineWidth = 2;
    g.strokeStyle = '#22d3ee';
    g.shadowColor = '#22d3ee';
    g.shadowBlur = 10;
    g.strokeRect(x - 2, y - 2, w + 4, h + 4);
    g.shadowBlur = 0;
    const hs = Math.max(5, Math.min(9, s / 3));
    g.fillStyle = '#22d3ee';
    for (const [cx, cy] of [[x - 2, y - 2], [x + w + 2, y - 2], [x - 2, y + h + 2]] as const) g.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
    g.fillStyle = o.sizable ? '#facc15' : '#22d3ee';
    g.fillRect(x + w + 2 - hs / 2, y + h + 2 - hs / 2, hs, hs);
    g.lineWidth = 1;
  }
}
