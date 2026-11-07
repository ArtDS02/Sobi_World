// Small 3D math kit for the Sobi Studio compiler (no dependencies).
export type V3 = [number, number, number];
/** Row-major 3x3 rotation/scale part + translation. */
export interface Xf {
  r: [V3, V3, V3]; // rows of the linear part (rotation * scale)
  t: V3;
}

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Rotation from Euler degrees, applied X, then Y, then Z (R = Rz * Ry * Rx). */
export function eulerRows(e: V3): [V3, V3, V3] {
  const [x, y, z] = [rad(e[0]), rad(e[1]), rad(e[2])];
  const cx = Math.cos(x),
    sx = Math.sin(x),
    cy = Math.cos(y),
    sy = Math.sin(y),
    cz = Math.cos(z),
    sz = Math.sin(z);
  return [
    [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
    [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
    [-sy, cy * sx, cy * cx],
  ];
}

export function matMul(a: [V3, V3, V3], b: [V3, V3, V3]): [V3, V3, V3] {
  const row = (r: V3): V3 => [
    r[0] * b[0][0] + r[1] * b[1][0] + r[2] * b[2][0],
    r[0] * b[0][1] + r[1] * b[1][1] + r[2] * b[2][1],
    r[0] * b[0][2] + r[1] * b[1][2] + r[2] * b[2][2],
  ];
  return [row(a[0]), row(a[1]), row(a[2])];
}

export const apply3 = (m: [V3, V3, V3], v: V3): V3 => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];

export const IDENTITY: Xf = {
  r: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  t: [0, 0, 0],
};

export function xfFrom(at: V3, rot: V3, scale: number): Xf {
  const r = eulerRows(rot).map((row) => mul(row, scale)) as [V3, V3, V3];
  return { r, t: at };
}

/** parent ∘ child */
export function compose(p: Xf, c: Xf): Xf {
  return { r: matMul(p.r, c.r), t: add(apply3(p.r, c.t), p.t) };
}

export const point = (x: Xf, v: V3): V3 => add(apply3(x.r, v), x.t);

/** Uniform scale of a transform built from rotations and uniform scales. */
export const scaleOf = (x: Xf): number => len([x.r[0][0], x.r[1][0], x.r[2][0]]);

/** World -> local rows (3x4) for a rotation * uniform-scale transform. */
export function inverseRows(x: Xf): number[] {
  const s = scaleOf(x);
  const s2 = s * s || 1;
  // inverse of (s R) is R^T / s = (s R)^T / s^2
  const [r0, r1, r2] = x.r;
  const rows: V3[] = [
    [r0[0] / s2, r1[0] / s2, r2[0] / s2],
    [r0[1] / s2, r1[1] / s2, r2[1] / s2],
    [r0[2] / s2, r1[2] / s2, r2[2] / s2],
  ];
  return rows.flatMap((row) => [row[0], row[1], row[2], -dot(row, x.t)]);
}

/** Orientation whose local X/Y/Z are the given world axes (columns). */
export function basisRows(xAxis: V3, yAxis: V3, zAxis: V3): [V3, V3, V3] {
  return [
    [xAxis[0], yAxis[0], zAxis[0]],
    [xAxis[1], yAxis[1], zAxis[1]],
    [xAxis[2], yAxis[2], zAxis[2]],
  ];
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
