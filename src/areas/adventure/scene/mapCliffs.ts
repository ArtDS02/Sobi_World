// The cliff faces of an area in 3/4 (decision 045): along the front of each plateau (the `F` band, at most 3 tiles deep, with the
// plateau `^` above it and open ground or a lower terrace below) the zone's cliff strip is laid and repeated, the stairs (`s`) and the waterfall (`w`)
// cut into it get their own picture, and a run that meets a side wall ends on a rounded cap. The side and back rims of a plateau stay
// tinted tiles (seen from above). `cliffFaces` is pure; `drawCliffs` lays the pictures in the area's ground pass. Phaser.
import type * as Phaser from 'phaser';
import { textureKey } from '../../../ui/world/keys';
import type { AreaMap } from '../logic/config/content';
import { CLIFF_ART } from './mapKit';

export interface CliffRun {
  kind: 'cliff' | 'stairs' | 'waterfall';
  /** Columns [x0, x1) and rows top..bottom (inclusive) of the face. */
  x0: number;
  x1: number;
  top: number;
  bottom: number;
  /** A side wall goes on past this end: a rounded cap closes it. */
  capL: boolean;
  capR: boolean;
}

const FACE = new Set(['F', 's', 'w']);
/** A plateau face is at most this deep; a deeper `F` column is a side wall. */
const MAX_DEPTH = 3;

/** The plateau fronts of `map`, left to right, top to bottom. */
export function cliffFaces(map: AreaMap): CliffRun[] {
  const at = (x: number, y: number) => map.terrain[y]?.[x] ?? '#';
  const cols: { x: number; top: number; bottom: number; kind: CliffRun['kind'] }[] = [];
  for (let x = 0; x < map.cols; x += 1)
    for (let y = 0; y < map.rows; y += 1) {
      if (!FACE.has(at(x, y)) || FACE.has(at(x, y + 1))) continue;
      let top = y;
      while (top > 0 && FACE.has(at(x, top - 1))) top -= 1;
      const column = Array.from({ length: y - top + 1 }, (_, i) => at(x, top + i));
      const kind = column.includes('w') ? 'waterfall' : column.includes('s') ? 'stairs' : 'cliff';
      // On top: the plateau, or for a waterfall the stream it falls from.
      const above = at(x, top - 1);
      if (y - top + 1 > MAX_DEPTH || !(above === '^' || (kind === 'waterfall' && (above === '~' || above === '=')))) continue;
      cols.push({ x, top, bottom: y, kind });
    }
  cols.sort((a, b) => a.bottom - b.bottom || a.x - b.x);
  const runs: CliffRun[] = [];
  for (const c of cols) {
    const last = runs[runs.length - 1];
    if (last && last.x1 === c.x && last.top === c.top && last.bottom === c.bottom && last.kind === c.kind) last.x1 += 1;
    else runs.push({ kind: c.kind, x0: c.x, x1: c.x + 1, top: c.top, bottom: c.bottom, capL: false, capR: false });
  }
  const face = new Set(cols.map((c) => `${c.x},${c.bottom}`));
  for (const r of runs) {
    if (r.kind !== 'cliff') continue;
    r.capL = at(r.x0 - 1, r.bottom) === 'F' && !face.has(`${r.x0 - 1},${r.bottom}`);
    r.capR = at(r.x1, r.bottom) === 'F' && !face.has(`${r.x1},${r.bottom}`);
  }
  return runs;
}

/** How far a face reaches up over the plateau's edge (its grass lip), in tiles. */
const LIP = 0.35;

/** Lays the zone's cliff faces into `layer` (call right after the ground tiles). Missing art = the tinted tiles stay. */
export function drawCliffs(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, map: AreaMap, zone: string) {
  const art = CLIFF_ART[zone];
  if (!art) return;
  const t = map.tile;
  const has = (id: string | undefined): id is string => !!id && scene.textures.exists(textureKey(id));
  for (const r of cliffFaces(map)) {
    const x = r.x0 * t;
    const y = (r.top - LIP) * t;
    const w = (r.x1 - r.x0) * t;
    const h = (r.bottom - r.top + 1 + LIP) * t;
    if (r.kind === 'waterfall' && has(art.waterfall)) {
      // A little wider than its stream, falling into the pool below.
      layer.add(scene.add.image(x + w / 2, y + h + t * 0.4, textureKey(art.waterfall)).setOrigin(0.5, 1).setDisplaySize(w * 1.25, h + t * 0.4));
      continue;
    }
    if (r.kind === 'stairs' && has(art.stairs)) {
      layer.add(scene.add.image(x, y, textureKey(art.stairs)).setOrigin(0).setDisplaySize(w, h));
      continue;
    }
    if (!has(art.cliff)) continue;
    const key = textureKey(art.cliff);
    const src = scene.textures.get(key).getSourceImage();
    const scale = h / Math.max(1, src.height);
    // One strip repeated along the run; its pattern continues from the world's left edge, so two runs side by side line up.
    const strip = scene.add.tileSprite(x, y, w, h, key).setOrigin(0).setTileScale(scale, scale);
    strip.tilePositionX = x / scale;
    layer.add(strip);
    for (const [on, id, left] of [[r.capL, art.endL, true], [r.capR, art.endR, false]] as const) {
      if (!on || !has(id)) continue;
      const cap = scene.add.image(0, y, textureKey(id)).setOrigin(0);
      const cw = (h * cap.width) / Math.max(1, cap.height);
      cap.setDisplaySize(cw, h).setX(left ? x - t : x + w + t - cw);
      layer.add(cap);
    }
  }
}
