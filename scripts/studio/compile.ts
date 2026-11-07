// Recipe + style -> render jobs for the Unity renderer (studio/Assets/Sobi/Editor/Renderer.cs).
// All recipe logic (hierarchy, mirroring, poses, clips, colours, eyes) lives here so it is unit-tested.
import { hexToLinear, outlineOf } from './color.ts';
import {
  type V3,
  type Xf,
  add,
  apply3,
  basisRows,
  compose,
  cross,
  eulerRows,
  inverseRows,
  matMul,
  lerp,
  mul,
  norm,
  point,
  scaleOf,
  sub,
  xfFrom,
} from './math.ts';
import type { Clip, Output, Paint, Part, PartDelta, Pose, Recipe, Style } from './schema.ts';
import { StudioError } from './recipes.ts';

export const TOOL_VERSION = 1;

const SHAPE_ID: Record<string, number> = {
  sphere: 0,
  ellipsoid: 1,
  box: 2,
  cone: 3,
  arc: 4,
  cylinder: 5,
  wedge: 6,
};
const SHAPE_ARITY: Record<string, number> = {
  sphere: 1,
  ellipsoid: 3,
  box: 4,
  cone: 3,
  arc: 3,
  cylinder: 3,
  wedge: 4,
  eye: 1,
};
const FLAG_BIT = { unlit: 1, noline: 2, gloss: 4, tintcut: 8 } as const;
const PAINT_DECAL = 1;
const PAINT_UNLIT = 2;
const OP_ID = { add: 0, cut: 1, intersect: 2 } as const;
export const PRIM_FLOATS = 36;
export const PAINT_FLOATS = 24;

export interface JobFrame {
  prims: number[];
  primInfo: number[];
  paints: number[];
  paintInfo: number[];
}
export interface Job {
  id: string;
  output: string;
  width: number;
  height: number;
  supersample: number;
  mode: 'sdf' | 'flat';
  camCenter: V3;
  camRight: V3;
  camUp: V3;
  camFwd: V3;
  halfW: number;
  halfH: number;
  far: number;
  eps: number;
  cols: number;
  style: {
    lightDir: V3;
    lightColor: V3;
    shadowTint: V3;
    aoTint: V3;
    bands: number[];
    rim: number[];
    ao: number[];
    lines: number[];
    paint: number[];
  };
  frames: JobFrame[];
}

export interface Camera {
  right: V3;
  up: V3;
  fwd: V3;
}

export function cameraOf(yaw: number, pitch: number): Camera {
  const y = (yaw * Math.PI) / 180;
  const p = (pitch * Math.PI) / 180;
  const fwd: V3 = norm([-Math.cos(p) * Math.sin(y), -Math.sin(p), -Math.cos(p) * Math.cos(y)]);
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = norm(cross(right, fwd));
  return { right, up, fwd };
}

/** Palette lookup through the recipe's colour roles. */
export function colorOf(style: Style, recipe: Recipe, key: string, where: string): V3 {
  const name = recipe.colors[key] ?? key;
  const hex = style.palette[name];
  if (!hex)
    throw new StudioError(
      `${recipe.id}: ${where}: colour "${key}" is not a palette key or colour role`,
    );
  return hexToLinear(hex);
}

function lineOf(
  style: Style,
  recipe: Recipe,
  fill: V3,
  explicit: string | undefined,
  where: string,
): V3 {
  if (explicit) return colorOf(style, recipe, explicit, where);
  const o = style.outline;
  return outlineOf(
    fill,
    o.lightness,
    o.chroma,
    colorOf(style, recipe, o.ink, 'style.outline.ink'),
    o.inkMix,
  );
}

/** Expand `repeat` parts/paints into numbered copies: name#i (grid: name#i_j). Children keep their parent. */
export function expandRepeat<T extends Part | Paint>(items: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [name, p] of Object.entries(items)) {
    const r = p.repeat;
    if (!r) {
      out[name] = p;
      continue;
    }
    for (let j = 0; j < r.n2; j++)
      for (let i = 0; i < r.n; i++) {
        const k = r.n2 > 1 ? `${name}#${i}_${j}` : `${name}#${i}`;
        const odd = j % 2 === 1 ? r.stagger : ([0, 0, 0] as V3);
        const base = p.at ?? [0, 0, 0];
        out[k] = {
          ...p,
          repeat: undefined,
          at: add(add(base, add(mul(r.step, i), mul(r.step2, j))), odd),
          rot: add(p.rot ?? [0, 0, 0], mul(r.turn, i)),
        };
      }
  }
  return out;
}

/** Expand `mirror: true` parts/paints: name_l -> name_r, mirrored across z. A parent named *_l becomes *_r. */
export function expandMirror<T extends Part | Paint>(items: Record<string, T>): [string, T][] {
  const out: [string, T][] = [];
  const flip = (v?: V3): V3 | undefined => (v ? [v[0], v[1], -v[2]] : v);
  const flipRot = (v?: V3): V3 | undefined => (v ? [-v[0], -v[1], v[2]] : v);
  const rename = (n?: string) => n?.replace(/_l(#[0-9_]+)?$/, '_r$1');
  for (const [name, p] of Object.entries(items)) {
    out.push([name, p]);
    if (!p.mirror) continue;
    const mirrorName = /_l(#[0-9_]+)?$/.test(name) ? rename(name)! : `${name}_m`;
    out.push([
      mirrorName,
      {
        ...p,
        mirror: false,
        at: flip(p.at),
        offset: flip(p.offset),
        rot: flipRot(p.rot),
        parent: rename(p.parent),
      },
    ]);
  }
  return out;
}

const EASE = {
  linear: (t: number) => t,
  in: (t: number) => t * t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
  inout: (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
};

function poseByRef(recipe: Recipe, ref: string | Pose, where: string): Pose {
  if (typeof ref !== 'string') return ref;
  const p = recipe.poses[ref];
  if (!p) throw new StudioError(`${recipe.id}: ${where}: unknown pose "${ref}"`);
  return p;
}

const lerpV = (a: V3 | undefined, b: V3 | undefined, t: number): V3 | undefined => {
  if (!a && !b) return undefined;
  const x = a ?? [0, 0, 0];
  const y = b ?? [0, 0, 0];
  return [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
};

function blendDelta(a: PartDelta | undefined, b: PartDelta | undefined, t: number): PartDelta {
  const A = a ?? {};
  const B = b ?? {};
  const out: PartDelta = {};
  const rot = lerpV(A.rot, B.rot, t);
  const at = lerpV(A.at, B.at, t);
  const offset = lerpV(A.offset, B.offset, t);
  if (rot) out.rot = rot;
  if (at) out.at = at;
  if (offset) out.offset = offset;
  if (A.scale !== undefined || B.scale !== undefined)
    out.scale = lerp(A.scale ?? 1, B.scale ?? 1, t);
  if (A.size && B.size && A.size.length === B.size.length)
    out.size = A.size.map((v, i) => lerp(v, B.size![i]!, t));
  else if (A.size || B.size) out.size = (t < 0.5 ? A.size : B.size) ?? A.size ?? B.size;
  if (A.bend !== undefined || B.bend !== undefined) out.bend = lerp(A.bend ?? 0, B.bend ?? 0, t);
  if (A.noisePhase !== undefined || B.noisePhase !== undefined)
    out.noisePhase = lerp(A.noisePhase ?? 0, B.noisePhase ?? 0, t);
  const hide = t < 0.5 ? (A.hide ?? false) : (B.hide ?? false);
  const show = t < 0.5 ? (A.show ?? false) : (B.show ?? false);
  if (hide) out.hide = true;
  if (show) out.show = true;
  return out;
}

/** Pose of a clip at time t in [0, 1]. */
export function sampleClip(recipe: Recipe, clipName: string, clip: Clip, t: number): Pose {
  const keys = [...clip.keys].sort((a, b) => a.t - b.t);
  const where = `clip ${clipName}`;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1]!.t <= t) i++;
  const k0 = keys[i]!;
  const k1 = keys[Math.min(i + 1, keys.length - 1)]!;
  const p0 = poseByRef(recipe, k0.pose, where);
  if (k0 === k1 || k1.t <= k0.t) return p0;
  const p1 = poseByRef(recipe, k1.pose, where);
  const u = EASE[k0.ease ?? 'inout'](Math.min(1, Math.max(0, (t - k0.t) / (k1.t - k0.t))));
  const out: Pose = {};
  for (const name of new Set([...Object.keys(p0), ...Object.keys(p1)]))
    out[name] = blendDelta(p0[name], p1[name], u);
  return out;
}

export function clipTimes(clip: Clip): number[] {
  const n = clip.frames;
  return Array.from({ length: n }, (_, i) => (clip.loop ? i / n : n === 1 ? 0 : i / (n - 1)));
}

interface Ctx {
  style: Style;
  recipe: Recipe;
  cam: Camera;
  groups: Map<string, number>;
  phase: number;
}

function groupIndex(ctx: Ctx, name: string): number {
  let g = ctx.groups.get(name);
  if (g === undefined) {
    g = ctx.groups.size;
    if (g > 30) throw new StudioError(`${ctx.recipe.id}: more than 31 groups`);
    ctx.groups.set(name, g);
  }
  return g;
}

function shapeParams(shape: string, size: number[], where: string): number[] {
  const n = SHAPE_ARITY[shape];
  if (n === undefined) throw new StudioError(`${where}: unknown shape ${shape}`);
  if (size.length < n)
    throw new StudioError(`${where}: shape ${shape} needs ${n} size values, got ${size.length}`);
  const p = [...size.slice(0, 4)];
  while (p.length < 4) p.push(0);
  if (shape === 'arc') p[2] = (p[2]! * Math.PI) / 180;
  if (shape === 'cone' && Math.abs(p[0]! - p[1]!) >= p[2]!)
    throw new StudioError(`${where}: cone radii differ by more than its height`);
  return p;
}

type Node = { xf: Xf; part: Part };

/** World transforms of every node (joint frames) for one pose. */
function solveNodes(
  ctx: Ctx,
  items: [string, Part][],
  pose: Pose,
  root: Xf,
  where: string,
): Map<string, Node> {
  const byName = new Map(items);
  const solved = new Map<string, Node>();
  const visiting = new Set<string>();
  const solve = (name: string): Node => {
    const done = solved.get(name);
    if (done) return done;
    const part = byName.get(name);
    if (!part) throw new StudioError(`${ctx.recipe.id}: ${where}: unknown parent "${name}"`);
    if (visiting.has(name))
      throw new StudioError(`${ctx.recipe.id}: ${where}: parent cycle at "${name}"`);
    visiting.add(name);
    const d = deltaOf(pose, name);
    const parent = part.parent ? solve(part.parent).xf : root;
    const at = add(part.at ?? [0, 0, 0], d.at ?? [0, 0, 0]);
    const rot = add(part.rot ?? [0, 0, 0], d.rot ?? [0, 0, 0]);
    const scale = (part.scale ?? 1) * (d.scale ?? 1);
    let xf = compose(parent, xfFrom(at, rot, scale));
    if (part.billboard) {
      const s = scaleOf(xf);
      const cam = basisRows(ctx.cam.right, ctx.cam.up, mul(ctx.cam.fwd, -1));
      xf = { r: matMul(cam, eulerRows(rot)).map((row) => mul(row, s)) as Xf['r'], t: xf.t };
    }
    const node = { xf, part };
    solved.set(name, node);
    visiting.delete(name);
    return node;
  };
  for (const [name] of items) solve(name);
  return solved;
}

/** Pose delta for a node; copies made by `repeat` (name#i) follow their source's delta. */
function deltaOf(pose: Pose, name: string): PartDelta {
  return pose[name] ?? pose[name.replace(/#[0-9_]+$/, '')] ?? {};
}

function shapeXf(node: Node, d: PartDelta): Xf {
  const off = add(node.part.offset ?? [0, 0, 0], d.offset ?? [0, 0, 0]);
  return { r: node.xf.r, t: point(node.xf, off) };
}

function flagsOf(flags: readonly (keyof typeof FLAG_BIT)[] | undefined): number {
  return (flags ?? []).reduce((a, f) => a | FLAG_BIT[f], 0);
}

function sortParts<T extends Part>(items: [string, T][]): [string, T][] {
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => (a.it[1].order ?? 0) - (b.it[1].order ?? 0) || a.i - b.i)
    .map((x) => x.it);
}

function visible(p: Part, d: PartDelta | undefined): boolean {
  if (d?.show) return true;
  if (d?.hide) return false;
  return !p.hide;
}

function pushPrim(
  frame: JobFrame,
  xf: Xf,
  params: number[],
  col: V3,
  k: number,
  line: V3,
  noise: { amp: number; freq: number; phase: number },
  bend: number,
  bands: { mid: V3; core: V3; b1: number; b2: number },
  info: [number, number, number, number],
) {
  frame.prims.push(
    ...inverseRows(xf),
    ...params,
    ...col,
    k,
    ...line,
    noise.amp,
    noise.freq,
    noise.phase,
    scaleOf(xf),
    bend,
    ...bands.mid,
    bands.b1,
    ...bands.core,
    bands.b2,
  );
  frame.primInfo.push(...info);
}

const NO_NOISE = { amp: 0, freq: 0, phase: 0 };
const NO_BANDS = { mid: [0, 0, 0] as V3, core: [0, 0, 0] as V3, b1: 0, b2: 0 };

export function buildFrame(ctx: Ctx, pose: Pose): JobFrame {
  const { recipe, style, cam } = ctx;
  const frame: JobFrame = { prims: [], primInfo: [], paints: [], paintInfo: [] };
  const r = recipe.root ?? {};
  const root = xfFrom(r.at ?? [0, 0, 0], r.rot ?? [0, 0, 0], r.scale ?? 1);
  const parts = sortParts(expandMirror(expandRepeat(recipe.parts)));
  const paints = expandMirror(expandRepeat(recipe.paints));
  // Paints may hang off parts: solve both in one hierarchy (paints are never parents).
  const nodes = solveNodes(
    ctx,
    [...parts, ...paints.map(([n, p]) => [`paint:${n}`, p] as [string, Part])],
    pose,
    root,
    'parts',
  );

  for (const [name, part] of parts) {
    const d = deltaOf(pose, name);
    if (!visible(part, d)) continue;
    const where = `${recipe.id}: part ${name}`;
    if (!part.shape) continue; // a joint: only moves its children
    const node = nodes.get(name)!;
    const xf = shapeXf(node, d);
    const size = d.size ?? part.size;
    if (!size) throw new StudioError(`${where}: missing size`);
    const col = colorOf(style, recipe, part.color ?? 'white', `part ${name}`);
    const line = lineOf(style, recipe, col, part.line, `part ${name}`);
    const group = groupIndex(ctx, part.group ?? 'body');
    const op = OP_ID[part.op ?? 'add'];
    const flags = flagsOf(part.flags);
    const noise = part.noise
      ? {
          amp: part.noise.amp,
          freq: part.noise.freq,
          phase: part.noise.speed * ctx.phase + (d.noisePhase ?? 0),
        }
      : NO_NOISE;
    const bands = part.bands
      ? {
          mid: colorOf(style, recipe, part.bands.mid, `part ${name} bands`),
          core: colorOf(style, recipe, part.bands.core ?? part.bands.mid, `part ${name} bands`),
          b1: part.bands.b1,
          b2: part.bands.b2 ?? 0,
        }
      : NO_BANDS;
    if (part.shape === 'eye') throw new StudioError(`${where}: eyes are paints (billboard decals)`);
    pushPrim(
      frame,
      xf,
      shapeParams(part.shape, size, where),
      col,
      part.blend ?? 0,
      line,
      noise,
      (part.bend ?? 0) + (d.bend ?? 0),
      bands,
      [SHAPE_ID[part.shape]!, op, group, flags],
    );
  }

  for (const [name, paint] of paints) {
    const d = deltaOf(pose, `paint:${name}`);
    if (!visible(paint, d)) continue;
    const where = `${recipe.id}: paint ${name}`;
    if (!paint.shape) throw new StudioError(`${where}: missing shape`);
    const size = d.size ?? paint.size;
    if (!size) throw new StudioError(`${where}: missing size`);
    const xf = shapeXf(nodes.get(`paint:${name}`)!, d);
    const mask = paint.on
      ? paint.on.reduce((m, g) => m | (1 << groupIndex(ctx, g)), 0)
      : 0x7fffffff;
    const flags =
      (paint.billboard ? PAINT_DECAL : 0) | (paint.flags?.includes('unlit') ? PAINT_UNLIT : 0);
    const push = (
      x: Xf,
      shape: string,
      p: number[],
      col: V3,
      soft: number,
      opacity: number,
      fl: number,
    ) => {
      frame.paints.push(
        ...inverseRows(x),
        ...shapeParams(shape, p, where),
        ...col,
        soft,
        opacity,
        scaleOf(x),
        0,
        0,
      );
      frame.paintInfo.push(SHAPE_ID[shape]!, mask, fl, 0);
    };
    const soft = paint.soft ?? 0.004;
    const opacity = paint.opacity ?? 1;
    if (paint.shape !== 'eye') {
      push(
        xf,
        paint.shape,
        size,
        colorOf(style, recipe, paint.color ?? 'white', where),
        soft,
        opacity,
        flags,
      );
      continue;
    }
    // Eye decal (style.eyes): dark ellipse, lighter iris below, two highlights.
    if (!paint.billboard) throw new StudioError(`${where}: eye paints must be billboard decals`);
    const [rx, ry] = [size[0]!, size[1] ?? size[0]!];
    const E = style.eyes;
    const at = (dx: number, dy: number): Xf => ({ r: xf.r, t: point(xf, [dx, dy, 0]) });
    push(
      xf,
      'ellipsoid',
      [rx, ry, 1],
      colorOf(style, recipe, paint.color ?? 'eye', where),
      soft,
      opacity,
      PAINT_DECAL,
    );
    if (recipe.colors.iris)
      push(
        at(0, -ry * E.irisDown),
        'ellipsoid',
        [rx * E.irisScale, ry * E.irisScale, 1],
        colorOf(style, recipe, 'iris', where),
        rx * E.irisSoft,
        opacity,
        PAINT_DECAL,
      );
    const hc = colorOf(style, recipe, E.highlightColor, 'style.eyes.highlightColor');
    for (const h of [E.highlight, E.highlight2])
      push(
        at(h.side * rx, h.up * ry),
        'sphere',
        [h.size * rx],
        hc,
        soft,
        opacity,
        PAINT_DECAL | PAINT_UNLIT,
      );
  }
  void cam;
  return frame;
}

export interface ViewSpec {
  canvas: [number, number];
  ppu: number;
  origin: [number, number];
}

export function viewOf(
  style: Style,
  recipe: Recipe,
  out: Output,
): ViewSpec & { kind: Style['kinds'][string] } {
  const kind = style.kinds[recipe.kind];
  if (!kind) throw new StudioError(`${recipe.id}: unknown kind "${recipe.kind}" (style.kinds)`);
  return {
    kind,
    canvas: out.view?.canvas ?? kind.canvas,
    ppu: out.view?.ppu ?? kind.ppu,
    origin: out.view?.origin ?? kind.origin,
  };
}

export function compileOutput(style: Style, recipe: Recipe, out: Output): Job {
  const v = viewOf(style, recipe, out);
  const cam = cameraOf(v.kind.camera.yaw, v.kind.camera.pitch);
  const [w, h] = v.canvas;
  const ss = style.supersample;
  const halfW = w / 2 / v.ppu;
  const halfH = h / 2 / v.ppu;
  const center = add(
    mul(cam.right, (w / 2 - v.origin[0]) / v.ppu),
    mul(cam.up, (v.origin[1] - h / 2) / v.ppu),
  );
  const ctx: Ctx = { style, recipe, cam, groups: new Map(), phase: 0 };
  const frames: JobFrame[] = [];
  if (out.clip) {
    const clip = recipe.clips[out.clip];
    if (!clip)
      throw new StudioError(`${recipe.id}: output ${out.file}: unknown clip "${out.clip}"`);
    const times = clipTimes(clip);
    const picked = out.frame !== undefined ? [times[out.frame]] : times;
    if (picked.some((t) => t === undefined))
      throw new StudioError(`${recipe.id}: output ${out.file}: frame out of range`);
    for (const t of picked as number[]) {
      ctx.phase = clip.phase ? lerp(clip.phase[0], clip.phase[1], t) : 0;
      frames.push(buildFrame(ctx, sampleClip(recipe, out.clip, clip, t)));
    }
  } else {
    frames.push(buildFrame(ctx, out.pose ? poseByRef(recipe, out.pose, `output ${out.file}`) : {}));
  }
  const L = style.light;
  const ldir = norm(
    add(add(mul(cam.right, L.dir[0]), mul(cam.up, L.dir[1])), mul(cam.fwd, -L.dir[2])),
  );
  const lineScale = v.kind.lineScale;
  return {
    id: `${recipe.id}:${out.file}`,
    output: out.file,
    width: w,
    height: h,
    supersample: ss,
    mode: v.kind.mode,
    camCenter: center,
    camRight: cam.right,
    camUp: cam.up,
    camFwd: cam.fwd,
    halfW,
    halfH,
    far: Math.max(halfW, halfH) * 2 + 4,
    eps: 0.35 / (v.ppu * ss),
    cols: out.cols ?? frames.length,
    style: {
      lightDir: ldir,
      lightColor: hexToLinear(L.color),
      shadowTint: L.shadowTint,
      aoTint: L.aoTint,
      bands: [L.bands.shadow, L.bands.soft, L.bands.highlight, L.bands.highlightAmount],
      rim: [L.rim.strength, L.rim.power, L.specular.strength, L.specular.power],
      ao: [L.ao.strength, L.ao.step, L.ao.falloff, 0],
      paint: [style.paint.grain, style.paint.grainFreq, style.paint.gradient, 0],
      lines: [
        style.outline.px * ss * lineScale,
        style.outline.innerPx * ss * lineScale,
        style.outline.depthJump,
        style.outline.groupJump,
      ],
    },
    frames,
  };
}

export function compileRecipe(style: Style, recipe: Recipe): Job[] {
  if (recipe.outputs.length === 0) throw new StudioError(`${recipe.id}: no outputs`);
  return recipe.outputs.map((o) => compileOutput(style, recipe, o));
}

// re-exported for tests
export { apply3, sub };
