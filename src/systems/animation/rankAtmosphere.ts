// The atmosphere of a cloud tier / garden zone by upgrade rank (decision 056), as plain data. Instead of pasting extra pictures over
// the backdrop, a higher rank adds LIGHT and LIFE to the picture that is already there: a soft vignette, shafts of light, a warm
// bloom over the plots, twinkling sparkles, falling petals / leaves and wandering fireflies — all drawn by code, tinted by the
// skin's mood. Presentation only; the scenes draw it (ui/world/rankAtmosphere.ts) and stand still for "Giảm chuyển động".

export interface AtmosphereLevel {
  /** Edge darkening, 0..1 opacity. */
  vignette: number;
  /** Shafts of light from above: how many and how strong. */
  rays: number;
  rayAlpha: number;
  /** Bloom over the plots: 0 everywhere on purpose (owner: never wash the whole field in light); kept for tuning. */
  glow: number;
  sparkles: number;
  petals: number;
  fireflies: number;
}

const L = (vignette: number, rays: number, rayAlpha: number, glow: number, sparkles: number, petals: number, fireflies: number): AtmosphereLevel => ({ vignette, rays, rayAlpha, glow, sparkles, petals, fireflies });

/** Index = rank 1..5. Rank 1 adds nothing: the scene is exactly the plain one. */
export const ATMOSPHERE: readonly AtmosphereLevel[] = [L(0, 0, 0, 0, 0, 0, 0), L(0.05, 0, 0, 0, 4, 0, 0), L(0.07, 2, 0.06, 0, 8, 3, 0), L(0.09, 3, 0.08, 0, 12, 6, 4), L(0.11, 4, 0.10, 0, 18, 10, 8)];

export const atmosphereAt = (rank: number): AtmosphereLevel => ATMOSPHERE[Math.min(Math.max(rank, 1), 5) - 1]!;

/** The most of each kind any rank uses: the scene builds this many and shows a share. */
export const ATMOSPHERE_MAX = { rays: 4, sparkles: 18, petals: 10, fireflies: 8 } as const;

export type ParticleKind = 'petal' | 'firefly' | 'both' | 'none';

/** How many petals and fireflies show at `rank` for a skin's particle kind (a single kind gets the other's share too). */
export function particleCounts(rank: number, kind: ParticleKind): { petals: number; fireflies: number } {
  const a = atmosphereAt(rank);
  const both = a.petals + a.fireflies;
  switch (kind) {
    case 'none':
      return { petals: 0, fireflies: 0 };
    case 'petal':
      return { petals: Math.min(ATMOSPHERE_MAX.petals, Math.round(both * 0.8)), fireflies: 0 };
    case 'firefly':
      return { petals: 0, fireflies: Math.min(ATMOSPHERE_MAX.fireflies, Math.round(both * 0.6)) };
    default:
      return { petals: a.petals, fireflies: a.fireflies };
  }
}

/** What the plain look (no skin) uses: a warm, neutral mood per Area. Colours are 0xRRGGBB. */
export interface AtmosphereColours {
  /** Colour of the light shafts and the bloom. */
  light: number;
  /** Colour of the falling petals / leaves. */
  petal: number;
  /** Colour of the fireflies and sparkles. */
  spark: number;
  /** Colour of the vignette. */
  shade: number;
}
export const PLAIN_COLOURS = {
  cloud: { light: 0xfff2d2, petal: 0xffc2d6, spark: 0xfff6c0, shade: 0x4a3f7a },
  garden: { light: 0xfff0c0, petal: 0xa6d672, spark: 0xfff2a0, shade: 0x3d4a22 },
} as const satisfies Record<string, AtmosphereColours>;

/** Slow breathing of the bloom and the rays, 0..1; constant when still. */
export const breathe = (timeMs: number, periodMs: number, phase = 0, still = false): number => (still ? 0.5 : 0.5 + 0.5 * Math.sin((timeMs / periodMs) * Math.PI * 2 + phase));
