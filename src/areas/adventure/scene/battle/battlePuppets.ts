// The fighters that have a rig (decision 050) are drawn as puppets instead of one picture: their parts move (legs, head, ears, fins,
// tentacles), their faces change, and the battle's whole-body tween (the dash, the knock-back) carries them. A rig's `feel.root` damps
// the tween's turn and squash, since the body now does that itself. A fighter without a rig keeps its picture (battleUnits.ts).
import * as Phaser from 'phaser';
import { rigOf, type Want } from '../../../../systems/animation';
import { Puppet, type PartCopy } from '../../../../ui/puppet/puppet';
import type { BodyPose } from '../../ui/battlePose';
import type { StageUnit } from './battleUnits';

/** The canvas of a rig is the same 512 px square as a key-pose picture: a puppet stands as big as the picture it replaces. */
const CANVAS = 512;

export class BattlePuppets {
  private puppets = new Map<string, Puppet>();
  /** The puppets' own clock (ms): it stops during a hit stop and slows with slow motion, like the rest of the stage. */
  private clock = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly want: (id: string) => void,
  ) {}

  /** Advances the puppets' clock by `dt` real ms at `rate` (0 while the stage holds still). */
  tick(dt: number, rate: number) {
    this.clock += dt * rate;
  }

  /** The puppet of a unit whose art has a rig (made the first time), or null. */
  of(u: StageUnit): Puppet | null {
    const known = this.puppets.get(u.id);
    if (known) return known;
    const rig = rigOf(u.art);
    if (!rig) return null;
    const p = new Puppet(this.scene, rig, u.id, this.want);
    this.puppets.set(u.id, p);
    return p;
  }

  /** Keeps a puppet only for the units still on the field. */
  sync(ids: ReadonlySet<string>) {
    for (const [id, p] of this.puppets) {
      if (ids.has(id)) continue;
      p.destroy();
      this.puppets.delete(id);
    }
  }

  /**
   * Draws a unit as its puppet; false when it has none (or its parts are not loaded yet: the caller draws the picture meanwhile).
   * `pose` null is reduced motion: the puppet stands at rest, its clock stopped.
   */
  draw(u: StageUnit, pose: BodyPose | null, want: Want, look: { bright: number; gray: number; tint: number | null; glow: number | null; glowAlpha: number; opacity: number }, depth: number): boolean {
    const p = this.of(u);
    if (!p || !p.loaded()) return false;
    const fit = Math.min(u.width, u.height) / CANVAS;
    const root = p.rig.feel.root;
    const rot = pose ? pose.rot * root.rot : 0;
    const sx = pose ? 1 + (pose.sx - 1) * root.squash : 1;
    const sy = pose ? 1 + (pose.sy - 1) * root.squash : 1;
    const clock = pose ? this.clock : 0;
    p.update(clock, pose ? want : { action: u.down ? 'ko' : 'idle', key: 'still', timing: { t: u.down ? 10_000 : 0 } }, { x: u.feet.x + (pose?.dx ?? 0), y: u.feet.y + (pose?.dy ?? 0), scale: fit, mirrored: u.mirrored, rot, sx, sy, depth, alpha: look.opacity }, look);
    return true;
  }

  hide(id: string) {
    this.puppets.get(id)?.hide();
  }

  hideAll() {
    for (const p of this.puppets.values()) p.hide();
  }

  /** The parts of a unit's puppet as they stand (ghosts, trails, colour splits), or null when it is not a puppet. */
  copies(id: string): PartCopy[] | null {
    const p = this.puppets.get(id);
    return p && p.container.visible ? p.copies() : null;
  }

  /** Where a named anchor of a unit's puppet is now (`mouth`, `tail`…: the rig's `anchors`; a chain anchors at its tip). */
  anchor(id: string, name: string): { x: number; y: number } | null {
    const p = this.puppets.get(id);
    const at = p?.rig.anchors[name];
    if (!p || !at) return null;
    return p.rig.chains.some((c) => c.id === at) ? p.point(`${at}:tip`) : p.point(at);
  }

  /** Where a unit's head is now (its eyes, else its head bone), for the effects that land on it. */
  head(id: string): { x: number; y: number } | null {
    const p = this.puppets.get(id);
    if (!p) return null;
    return p.point('eyes') ?? p.point('head');
  }
}
