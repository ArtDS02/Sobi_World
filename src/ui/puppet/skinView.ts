// The skin of a puppet on screen (decision 050): the creature's approved picture on the grid systems/animation/skin.ts bends — one
// grid per key pose (pose to pose, 2026-11-06 (5)): the clip says which pose shows, the new one fades in over the old, eased, longer
// on the first change after a clip starts (systems/animation/poseFade.ts).
// A grid is drawn as Ropes, one per band of rows (Phaser's rope batch holds 1536 vertices); their vertices are written here every
// frame in strip order and Phaser never recomputes them (no setDirty). Without WebGL the pose's picture stands still.
import * as Phaser from 'phaser';
import { buildSkin, deformSkin, fadeWeight, poseFadeMs, type Frame, type RigData, type SkinMesh } from '../../systems/animation';

interface PoseView {
  group: Phaser.GameObjects.Container;
  mesh: SkinMesh | null;
  pos: Float32Array;
  img: string;
}

export class SkinView {
  readonly object: Phaser.GameObjects.Container;
  private readonly views = new Map<string, PoseView>();
  private shown = '';
  private previous = '';
  private since = 0;
  private fade = 0;
  private clip = '';
  private clipSince = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly rig: RigData,
  ) {
    this.object = scene.add.container(0, 0);
  }

  private partOf(pose: string): string {
    const sk = this.rig.skin!;
    return pose !== 'rest' ? (sk.poses[pose] ?? sk.part) : sk.part;
  }

  private view(pose: string): PoseView {
    const known = this.views.get(pose);
    if (known) return known;
    const part = this.rig.parts[this.partOf(pose)]!;
    const group = this.scene.add.container(0, 0);
    let mesh: SkinMesh | null = null;
    if (this.scene.game.renderer.type !== Phaser.WEBGL) {
      const [x, y, w, h] = part.box;
      group.add(this.scene.add.image(x + w / 2, y + h / 2, part.img).setScale(1 / this.rig.res));
    } else {
      mesh = buildSkin(this.rig, 1400, pose)!;
      for (const strip of mesh.strips) {
        const count = Math.ceil(strip.length / 2);
        const rope = this.scene.add.rope(0, 0, part.img, undefined, count as unknown as Phaser.Types.Math.Vector2Like[], true);
        const f = rope.frame;
        for (let k = 0; k < count * 2; k++) {
          const v = strip[Math.min(k, strip.length - 1)]!;
          rope.uv[k * 2] = f.u0 + (f.u1 - f.u0) * mesh.uv[v * 2]!;
          rope.uv[k * 2 + 1] = f.v0 + (f.v1 - f.v0) * mesh.uv[v * 2 + 1]!;
        }
        group.add(rope);
      }
    }
    this.object.add(group);
    const v = { group, mesh, pos: new Float32Array(mesh ? mesh.rest.length : 0), img: part.img };
    this.views.set(pose, v);
    return v;
  }

  private bend(v: PoseView, f: Frame, tint: number | null) {
    if (!v.mesh) {
      for (const o of v.group.list) {
        const img = o as Phaser.GameObjects.Image;
        if (tint !== null) img.setTint(tint);
        else img.clearTint();
      }
      return;
    }
    const pos = deformSkin(v.mesh, f.worlds, f.chains, v.pos);
    v.group.list.forEach((o, b) => {
      const rope = o as Phaser.GameObjects.Rope;
      const strip = v.mesh!.strips[b]!;
      const verts = rope.vertices;
      const n = verts.length / 2;
      for (let k = 0; k < n; k++) {
        const i = strip[Math.min(k, strip.length - 1)]!;
        verts[k * 2] = pos[i * 2]!;
        verts[k * 2 + 1] = pos[i * 2 + 1]!;
      }
      rope.setColors(tint ?? 0xffffff);
    });
  }

  /** Bends the pose the frame shows (and the one it fades from) and tints it (null = as drawn). `now` in ms of the puppet's clock. */
  draw(f: Frame, tint: number | null, now: number) {
    const pose = this.rig.skin!.poses[f.pose] ? f.pose : 'rest';
    if (f.clip !== this.clip) {
      this.clip = f.clip;
      this.clipSince = now;
    }
    if (pose !== this.shown) {
      this.previous = this.shown;
      this.shown = pose;
      this.since = now;
      this.fade = poseFadeMs(this.rig, f.clip, now - this.clipSince);
    }
    const k = this.previous ? fadeWeight(now - this.since, this.fade) : 1;
    const cur = this.view(pose);
    for (const [name, v] of this.views) v.group.setVisible(name === pose || (k < 1 && name === this.previous));
    if (k < 1) this.bend(this.view(this.previous), f, tint);
    this.bend(cur, f, tint);
    cur.group.setAlpha(k);
    this.object.bringToTop(cur.group);
  }

  /** The pose showing, at rest, as a ghost copy's transform (centre of its box, texture px → canvas px). */
  restBox(): { x: number; y: number; scale: number; img: string } {
    const p = this.rig.parts[this.partOf(this.shown || 'rest')]!;
    return { x: p.box[0] + p.box[2] / 2, y: p.box[1] + p.box[3] / 2, scale: 1 / this.rig.res, img: p.img };
  }
}
