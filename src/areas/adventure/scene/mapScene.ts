// An area painted as one continuous 3/4 picture (docs/maps/v3/M2_PLAN.md): its background, cut from that one picture into a few
// chunks (`map.scene`), laid edge to edge under everything else instead of the tiles. The chunks are loaded when the area is entered and
// dropped when it is left, so the big pictures never wait in memory. `sceneChunks` is pure; `layScene` draws. Phaser.
import type * as Phaser from 'phaser';
import { textureKey } from '../../../ui/world/keys';
import type { AreaMap } from '../logic/config/content';

export interface SceneChunk {
  /** Manifest id of the chunk picture. */
  id: string;
  /** Where it lies, design px (the area's own frame). */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Chunk edges on whole tiles, as `scripts/art/map_v3/bg_prepare.py` cuts them. */
const edges = (tiles: number, n: number, t: number): number[] =>
  Array.from({ length: n + 1 }, (_, i) => Math.round((tiles * i) / n) * t);

/** The chunks of a painted area, column by column inside each row; none when the area is drawn from its tiles. */
export function sceneChunks(map: AreaMap): SceneChunk[] {
  if (!map.scene) return [];
  const [cols, rows] = map.scene.chunks;
  const xs = edges(map.cols, cols, map.tile);
  const ys = edges(map.rows, rows, map.tile);
  const out: SceneChunk[] = [];
  for (let j = 0; j < rows; j += 1)
    for (let i = 0; i < cols; i += 1)
      out.push({
        id: `${map.scene.art}_c${i}${j}`,
        x: xs[i]!,
        y: ys[j]!,
        w: xs[i + 1]! - xs[i]!,
        h: ys[j + 1]! - ys[j]!,
      });
  return out;
}

/** True when every chunk of the area's picture is loaded. */
export const sceneReady = (scene: Phaser.Scene, map: AreaMap): boolean =>
  sceneChunks(map).every((c) => scene.textures.exists(textureKey(c.id)));

/** Lays the area's picture under everything else; until its chunks arrive, the area's edge colour stands in (never the old tiles). */
export function layScene(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  map: AreaMap,
  fill: number,
) {
  for (const c of sceneChunks(map)) {
    const k = textureKey(c.id);
    if (scene.textures.exists(k))
      layer.add(scene.add.image(c.x, c.y, k).setOrigin(0).setDisplaySize(c.w, c.h).setDepth(-10));
    else layer.add(scene.add.rectangle(c.x, c.y, c.w, c.h, fill).setOrigin(0).setDepth(-10));
  }
}

/**
 * Loads a painted area's chunks when the area is entered (each arrival makes the scene rebuild the area) and drops them when another
 * area is entered; the camp or a battle in between keeps them, so the area comes back at once.
 */
export class PaintedArt {
  private readonly asked = new Set<string>();
  private last: AreaMap | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly image: (id: string) => { url: string } | null,
  ) {}

  /** `map` is entered (or built again). */
  enter(map: AreaMap) {
    if (this.last && this.last.id !== map.id) this.drop(this.last);
    this.last = map;
    let queued = false;
    for (const c of sceneChunks(map)) {
      const k = textureKey(c.id);
      const url = this.scene.textures.exists(k) || this.asked.has(k) ? null : this.image(c.id)?.url;
      if (!url) continue;
      this.asked.add(k);
      this.scene.load.image(k, url);
      queued = true;
    }
    if (queued && !this.scene.load.isLoading()) this.scene.load.start();
  }

  private drop(map: AreaMap) {
    for (const c of sceneChunks(map)) {
      const k = textureKey(c.id);
      this.asked.delete(k);
      if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    }
  }
}
