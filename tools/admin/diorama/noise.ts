// Seeded value noise for the diorama prototype (G0): the same area always looks the same. Pure.

/** A hash of two ints and a seed in [0, 1). */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise in [0, 1). */
export function noise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = fade(x - xi);
  const fy = fade(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Three octaves of `noise2`, in [0, 1). */
export function fbm2(x: number, y: number, seed = 0): number {
  return (noise2(x, y, seed) * 0.57 + noise2(x * 2.03, y * 2.03, seed + 7) * 0.29 + noise2(x * 4.1, y * 4.1, seed + 13) * 0.14);
}

/** A seeded random stream (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** GLSL value noise + fbm, shared by the shaders. */
export const GLSL_NOISE = /* glsl */ `
float dHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float dNoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(dHash(i), dHash(i+vec2(1.,0.)), f.x), mix(dHash(i+vec2(0.,1.)), dHash(i+vec2(1.,1.)), f.x), f.y); }
float dFbm(vec2 p){ return dNoise(p)*.57 + dNoise(p*2.03+7.1)*.29 + dNoise(p*4.1+13.7)*.14; }
`;
