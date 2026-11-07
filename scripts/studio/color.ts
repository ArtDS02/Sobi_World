// Colour helpers: hex <-> linear RGB, OKLab for deriving outline colours.
import type { V3 } from './math.ts';

export function hexToSrgb(hex: string): V3 {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`bad colour "${hex}" (expected #rrggbb)`);
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

export const srgbToLinear = (c: V3): V3 => [toLin(c[0]), toLin(c[1]), toLin(c[2])];
export const linearToSrgb = (c: V3): V3 => [toSrgb(c[0]), toSrgb(c[1]), toSrgb(c[2])];
export const hexToLinear = (hex: string): V3 => srgbToLinear(hexToSrgb(hex));

export function linearToOklab(c: V3): V3 {
  const l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
  const m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
  const s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinear(c: V3): V3 {
  const l = (c[0] + 0.3963377774 * c[1] + 0.2158037573 * c[2]) ** 3;
  const m = (c[0] - 0.1055613458 * c[1] - 0.0638541728 * c[2]) ** 3;
  const s = (c[0] - 0.0894841775 * c[1] - 1.291485548 * c[2]) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Outline colour for a fill: darker, a little more saturated, pulled towards a warm ink hue. */
export function outlineOf(
  fill: V3,
  lightness: number,
  chroma: number,
  ink: V3,
  inkMix: number,
): V3 {
  const lab = linearToOklab(fill);
  const inkLab = linearToOklab(ink);
  const out: V3 = [lab[0] * lightness, lab[1] * chroma, lab[2] * chroma];
  return oklabToLinear([
    out[0] + (inkLab[0] - out[0]) * inkMix,
    out[1] + (inkLab[1] - out[1]) * inkMix,
    out[2] + (inkLab[2] - out[2]) * inkMix,
  ]);
}
