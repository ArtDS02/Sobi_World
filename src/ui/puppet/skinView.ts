// The skin of a puppet on screen (decision 050, 2026-11-06): the creature's picture on the grid systems/animation/skin.ts bends. Drawn as
// Ropes, one per band of grid rows (Phaser's rope batch holds 1536 vertices): a rope's vertices are written here every frame in strip
// order and Phaser never recomputes them (no setDirty). Without WebGL the picture stands still (the face slots still act on top).
import * as Phaser from 'phaser';
import { deformSkin, type Frame, type RigData, type SkinMesh } from '../../systems/animation';

export class SkinView {
  readonly object: Phaser.GameObjects.Container | Phaser.GameObjects.Image;
  private readonly pos: Float32Array;

  constructor(
    scene: Phaser.Scene,
    private readonly rig: RigData,
    private readonly mesh: SkinMesh,
  ) {
    const part = rig.parts[rig.skin!.part]!;
    this.pos = new Float32Array(mesh.rest.length);
    if (scene.game.renderer.type !== Phaser.WEBGL) {
      const [x, y, w, h] = part.box;
      this.object = scene.add.image(x + w / 2, y + h / 2, part.img).setScale(1 / rig.res);
      return;
    }
    const group = scene.add.container(0, 0);
    for (const strip of mesh.strips) {
      const count = Math.ceil(strip.length / 2);
      const rope = scene.add.rope(0, 0, part.img, undefined, count as unknown as Phaser.Types.Math.Vector2Like[], true);
      const f = rope.frame;
      for (let k = 0; k < count * 2; k++) {
        const v = strip[Math.min(k, strip.length - 1)]!;
        rope.uv[k * 2] = f.u0 + (f.u1 - f.u0) * mesh.uv[v * 2]!;
        rope.uv[k * 2 + 1] = f.v0 + (f.v1 - f.v0) * mesh.uv[v * 2 + 1]!;
      }
      group.add(rope);
    }
    this.object = group;
  }

  /** Bends the picture to a solved frame and tints it (null = as drawn). */
  draw(f: Frame, tint: number | null) {
    const obj = this.object;
    if (!(obj instanceof Phaser.GameObjects.Container)) {
      if (tint !== null) obj.setTint(tint);
      else obj.clearTint();
      return;
    }
    const pos = deformSkin(this.mesh, f.worlds, f.chains, this.pos);
    obj.list.forEach((o, b) => {
      const rope = o as Phaser.GameObjects.Rope;
      const strip = this.mesh.strips[b]!;
      const verts = rope.vertices;
      const n = verts.length / 2;
      for (let k = 0; k < n; k++) {
        const v = strip[Math.min(k, strip.length - 1)]!;
        verts[k * 2] = pos[v * 2]!;
        verts[k * 2 + 1] = pos[v * 2 + 1]!;
      }
      rope.setColors(tint ?? 0xffffff);
    });
  }

  /** The picture at rest as a ghost copy's transform (centre of its box, texture px → canvas px). */
  restBox(): { x: number; y: number; scale: number; img: string } {
    const p = this.rig.parts[this.rig.skin!.part]!;
    return { x: p.box[0] + p.box[2] / 2, y: p.box[1] + p.box[3] / 2, scale: 1 / this.rig.res, img: p.img };
  }
}
