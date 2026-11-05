// The skeleton (decision 050): bones carried by their parents (forward kinematics) from a local pose, and chains (tails, fins,
// tentacles, a fish's spine) bent segment by segment. The result is a flat draw list in the rig's canvas (feet at the origin), sorted by
// depth, so a back leg can sit behind the body and the near leg in front of it. Non-uniform scales are carried as a rotation and two
// scales (no skew): a puppet only squashes its leaves and its trunk, where that is invisible. Pure.
import type { BoneData, ChainData, RigData } from '../../../content/schemas/anim/rig';
import { REST, type Local, type LocalPose } from './clip';

/** A bone in the canvas: where its joint is, its turn (rad) and its scales. */
export interface World {
  x: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
}

export interface DrawnPart {
  kind: 'part';
  /** The bone that carries it and the picture (a key of the rig's `parts`). */
  bone: string;
  part: string;
  x: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
  z: number;
}

export interface DrawnChain {
  kind: 'chain';
  id: string;
  part: string;
  points: { x: number; y: number }[];
  z: number;
}

export type Drawn = DrawnPart | DrawnChain;

const RAD = Math.PI / 180;

/** Per segment of a chain, the extra bend (deg) the caller adds on top of the rest direction (waves, drag). */
export type ChainBend = (c: ChainData, segment: number) => number;

/**
 * Solves the rig at a local pose. `faces` picks the picture of each face slot (its rest picture otherwise). `root` places the whole
 * body (canvas px, deg). The world of every bone is written to `worlds` (by id) for the springs and the effects anchors.
 */
export function solve(
  rig: RigData,
  pose: LocalPose,
  faces: ReadonlyMap<string, string>,
  bend: ChainBend,
  worlds: Map<string, World> = new Map(),
): Drawn[] {
  worlds.clear();
  const drawn: Drawn[] = [];
  const byId = new Map<string, BoneData>(rig.bones.map((b) => [b.id, b]));
  for (const b of rig.bones) {
    const l: Readonly<Local> = pose.get(b.id) ?? REST;
    const parent = b.parent ? worlds.get(b.parent) : undefined;
    const pAt: readonly [number, number] = b.parent ? byId.get(b.parent)!.at : [0, 0];
    // The joint's rest offset from its parent's joint, plus the clip's offset, in the parent's frame.
    const ox = b.at[0] - pAt[0] + l.x;
    const oy = b.at[1] - pAt[1] + l.y;
    let w: World;
    if (!parent) w = { x: ox, y: oy, rot: l.rot * RAD, sx: l.sx, sy: l.sy };
    else {
      const c = Math.cos(parent.rot);
      const s = Math.sin(parent.rot);
      const px = ox * parent.sx;
      const py = oy * parent.sy;
      w = { x: parent.x + px * c - py * s, y: parent.y + px * s + py * c, rot: parent.rot + l.rot * RAD, sx: parent.sx * l.sx, sy: parent.sy * l.sy };
    }
    worlds.set(b.id, w);
    const part = b.slot ? (b.slot.pictures[faces.get(b.slot.name) ?? b.slot.rest] ?? b.slot.pictures[b.slot.rest]) : b.part;
    if (part) drawn.push({ kind: 'part', bone: b.id, part, x: w.x, y: w.y, rot: w.rot, sx: w.sx, sy: w.sy, z: b.z });
  }
  for (const c of rig.chains) {
    const onBone = byId.get(c.parent);
    // A chain on the tip of another chain starts where that one ends, going on in its direction.
    const parent = onBone ? worlds.get(c.parent) : worlds.get(`${c.parent}:tip`);
    if (!parent) continue;
    const l: Readonly<Local> = pose.get(c.id) ?? REST;
    let x = parent.x;
    let y = parent.y;
    if (onBone) {
      const cs = Math.cos(parent.rot);
      const sn = Math.sin(parent.rot);
      const ox = (c.at[0] - onBone.at[0] + l.x) * parent.sx;
      const oy = (c.at[1] - onBone.at[1] + l.y) * parent.sy;
      x += ox * cs - oy * sn;
      y += ox * sn + oy * cs;
    }
    // The whole chain turns with its parent.
    let dir = parent.rot + (c.dir + l.rot) * RAD;
    const step = (c.len * l.sx * (onBone ? Math.abs(parent.sx) : 1)) / c.segments;
    const points = [{ x, y }];
    for (let i = 0; i < c.segments; i++) {
      dir += bend(c, i) * RAD;
      x += Math.cos(dir) * step;
      y += Math.sin(dir) * step;
      points.push({ x, y });
    }
    worlds.set(c.id, { x: points[0]!.x, y: points[0]!.y, rot: dir, sx: l.sx, sy: l.sy });
    worlds.set(`${c.id}:tip`, { x, y, rot: dir, sx: 1, sy: 1 });
    drawn.push({ kind: 'chain', id: c.id, part: c.part, points, z: c.z });
  }
  // Stable: equal depths keep the rig's order.
  return drawn.map((d, i) => ({ d, i })).sort((a, b) => a.d.z - b.d.z || a.i - b.i).map((e) => e.d);
}

/**
 * The bend of segment `i` of a chain from a travelling wave: the root barely moves, the tip the most (`taper`), the crest running from
 * root to tip. `amp` is the swing at the tip (deg), spread over the segments.
 */
export function waveBend(c: ChainData, i: number, timeS: number, wave: { amp: number; speed: number; phase?: number | undefined; curl?: number | undefined }): number {
  const along = (i + 1) / c.segments;
  const weight = (1 + (c.taper - 1) * along) / c.segments;
  // The weights over all segments add up to ~ (1 + taper) / 2: the curl is spread so that it totals `curl` degrees.
  const curl = ((wave.curl ?? c.curl) * weight * 2) / (1 + c.taper);
  return curl + wave.amp * weight * 2 * Math.sin(2 * Math.PI * wave.speed * timeS - (wave.phase ?? c.wave.phase) * i);
}
