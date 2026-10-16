// How each kind of sea creature moves (decision 035): a fish beats its tail, an eel ripples its whole body, a jellyfish
// pulses up and sinks, an octopus jets, a turtle paddles, a ray flaps its wings, a seahorse floats upright, a dolphin
// porpoises in waves, a boxfish hovers on fluttering fins, a pufferfish now and then puffs up. Presentation only: the
// numbers shape fishSwim.ts / fishBody.ts and are never state. Pure; unit-tested.

/** Where the body bends: the tail, the whole body (eel), only the tentacles, the wing tips, or not at all. */
export type BendMode = 'tail' | 'body' | 'tentacles' | 'wing' | 'none';

/** The special motions on top of steering. */
export type SwimKind = 'fish' | 'eel' | 'jelly' | 'octopus' | 'turtle' | 'ray' | 'seahorse' | 'dolphin' | 'hover' | 'puffer';

export interface SwimStyle {
  kind: SwimKind;
  bend: BendMode;
  /** Top speed, tail beat rate and bend, as multiples of AQUARIUM_VIEW.swim. */
  speed: number;
  beat: number;
  bendMul: number;
  /** How much the body tilts with a climb (0 = stays level / upright). */
  tilt: number;
  /** Chance multiplier of a dart. */
  dart: number;
  /** Rests for longer (×) between legs. */
  rest: number;
  /** Prefers the bottom half of the water (eels, rays, octopus). */
  low: boolean;
  /** Turning round: a sliver flip (a flat-sided fish) or a plain mirror (round bodies). */
  narrowTurn: boolean;
}

const base: SwimStyle = { kind: 'fish', bend: 'tail', speed: 1, beat: 1, bendMul: 1, tilt: 1, dart: 1, rest: 1, low: false, narrowTurn: true };
const style = (over: Partial<SwimStyle>): SwimStyle => ({ ...base, ...over });

export const SWIM_STYLES = {
  fish: base,
  /** Small quick fish (guppy, neon, perch): fast beats, darts often. */
  darter: style({ speed: 1.25, beat: 1.35, dart: 2.2, rest: 0.7 }),
  /** Long graceful fish (koi, arowana, betta): slow deep strokes, long glides. */
  graceful: style({ speed: 0.8, beat: 0.7, bendMul: 1.35, dart: 0.4, rest: 1.3 }),
  /** Tall flat fish (angelfish, discus, butterflyfish, moonfish): a stiff body that glides on small tail flicks. */
  flat: style({ speed: 0.75, beat: 0.8, bendMul: 0.45, tilt: 0.5, dart: 0.5, rest: 1.4 }),
  /** Eels and loaches: the whole body ripples, near the bottom. */
  eel: style({ kind: 'eel', bend: 'body', speed: 0.7, beat: 0.75, bendMul: 1.1, tilt: 0.4, dart: 0.3, low: true }),
  /** Whiskered bottom feeders (catfish): slow, low, a lazy tail. */
  bottom: style({ speed: 0.7, beat: 0.75, rest: 1.6, low: true, dart: 0.3 }),
  /** Boxfish: a stiff box that hovers on a buzz of tiny fins. */
  hover: style({ kind: 'hover', bend: 'none', speed: 0.55, tilt: 0.2, dart: 0, rest: 1.5, narrowTurn: false }),
  /** Pufferfish: hovers like a boxfish and now and then puffs up round. */
  puffer: style({ kind: 'puffer', bend: 'tail', bendMul: 0.4, speed: 0.6, tilt: 0.25, dart: 0, rest: 1.4, narrowTurn: false }),
  /** Jellyfish: pulses its bell to rise, then sinks slowly (the upright bell does not bend). */
  jelly: style({ kind: 'jelly', bend: 'none', speed: 0.45, tilt: 0, dart: 0, rest: 0.6, narrowTurn: false }),
  /** Octopus: squeezes and jets forward, then drifts with curling arms. */
  octopus: style({ kind: 'octopus', bend: 'tentacles', speed: 0.9, tilt: 0.2, dart: 0, rest: 1.2, low: true, narrowTurn: false }),
  /** Sea turtle: slow paddle strokes that surge it forward and rock it. */
  turtle: style({ kind: 'turtle', bend: 'none', speed: 0.6, tilt: 0.6, dart: 0, rest: 1.3, narrowTurn: false }),
  /** Manta ray: long gliding arcs on slow flaps of its wings. */
  ray: style({ kind: 'ray', bend: 'wing', speed: 0.85, beat: 0.35, bendMul: 0.8, tilt: 1.2, dart: 0, rest: 0.5, low: true, narrowTurn: false }),
  /** Seahorse: upright, slow, bobbing on a fluttering back fin. */
  seahorse: style({ kind: 'seahorse', bend: 'none', speed: 0.4, tilt: 0, dart: 0, rest: 1.6, narrowTurn: false }),
  /** Dolphin: fast, porpoising up and down, its tail beating up and down. */
  dolphin: style({ kind: 'dolphin', bend: 'tail', speed: 1.7, beat: 0.6, bendMul: 0.9, tilt: 2.2, dart: 1.5, rest: 0.4 }),
} as const satisfies Record<string, SwimStyle>;

export type SwimStyleId = keyof typeof SWIM_STYLES;

/** The style of each species; a species not listed swims as a plain fish. */
export const SPECIES_SWIM: Readonly<Record<string, SwimStyleId>> = {
  fish_goldfish: 'fish',
  fish_perch: 'darter',
  fish_carp: 'graceful',
  fish_clownfish: 'fish',
  fish_pufferfish: 'puffer',
  fish_angelfish: 'flat',
  fish_glowfish: 'darter',
  fish_betta: 'graceful',
  fish_lanternfish: 'bottom',
  fish_seahorse: 'seahorse',
  fish_dragon_koi: 'graceful',
  fish_moonfish: 'flat',
  fish_guppy: 'darter',
  fish_neon_tetra: 'darter',
  fish_catfish: 'bottom',
  fish_loach: 'eel',
  fish_gourami: 'fish',
  fish_molly: 'fish',
  fish_butterflyfish: 'flat',
  fish_boxfish: 'hover',
  fish_blue_tang: 'fish',
  fish_discus: 'flat',
  fish_lionfish: 'graceful',
  fish_parrotfish: 'fish',
  fish_jellyfish: 'jelly',
  fish_octopus: 'octopus',
  fish_sea_turtle: 'turtle',
  fish_manta: 'ray',
  fish_arowana: 'graceful',
  fish_dolphin: 'dolphin',
};

export const swimStyleOf = (species: string): SwimStyle => SWIM_STYLES[SPECIES_SWIM[species] ?? 'fish'];

/** Bend of the body at `u` (0 = the back end of the sprite, 1 = the front), as a share of the sprite's height. */
export function bendAt(mode: BendMode, u: number, phase: number, amount: number): number {
  switch (mode) {
    case 'none':
      return 0;
    case 'body': {
      // A full S that travels from head to tail, a little stronger at the tail.
      const env = 0.55 + 0.45 * (1 - u);
      return amount * env * Math.sin(phase + u * Math.PI * 2.2);
    }
    case 'tentacles': {
      // Only the trailing arms (the back 45 %) curl, quicker than the body moves.
      const env = Math.pow(Math.max(0, 1 - u / 0.45), 1.2);
      return amount * env * Math.sin(phase * 1.3 + u * 7);
    }
    case 'wing':
      // A slow wave across the whole width: the wing tips rise and fall.
      return amount * 0.6 * Math.sin(phase + u * 3);
    case 'tail': {
      const tail = Math.pow(Math.max(0, 1 - u / 0.68), 1.6);
      const head = Math.max(0, (u - 0.8) / 0.2) * 0.12;
      // The wave runs from the head to the tail (phase leads at the nose), so the tail lags behind the body.
      return amount * (tail * Math.sin(phase + u * 2.6) - head * Math.sin(phase + 2.6));
    }
  }
}

/** 0..1 through one pulse of `periodMs`, offset by `seed` so creatures of a kind do not pulse together. */
export const pulseAt = (time: number, periodMs: number, seed: number): number => (((time + seed * periodMs) % periodMs) + periodMs) % periodMs / periodMs;

/**
 * The extra a kind adds to one frame: a speed factor (jets, strokes, pulses), a squash of the picture (sx, sy), a
 * rotation and a vertical drift (px/s). `p` is the kind's pulse 0..1.
 */
export function kindFrame(kind: SwimKind, p: number, time: number, seed: number): { speed: number; sx: number; sy: number; rot: number; drift: number } {
  const s = Math.sin(p * Math.PI * 2);
  switch (kind) {
    case 'jelly': {
      // Contract in the first third (narrow and tall → rise), relax wide and sink for the rest.
      const contract = p < 0.33 ? Math.sin((p / 0.33) * Math.PI) : 0;
      return { speed: 0.3 + contract * 2.4, sx: 1 - contract * 0.16, sy: 1 + contract * 0.12 - (p >= 0.33 ? 0.04 * Math.sin(((p - 0.33) / 0.67) * Math.PI) : 0), rot: Math.sin(time / 900 + seed) * 0.06, drift: contract > 0 ? -contract * 26 : 9 };
    }
    case 'octopus': {
      // Squeeze (0..0.25), jet (0.25..0.45), then drift with arms out.
      const squeeze = p < 0.25 ? Math.sin((p / 0.25) * (Math.PI / 2)) : p < 0.45 ? 1 - (p - 0.25) / 0.2 : 0;
      const jet = p >= 0.25 && p < 0.55 ? Math.sin(((p - 0.25) / 0.3) * Math.PI) : 0;
      return { speed: 0.25 + jet * 2.6, sx: 1 - squeeze * 0.14 + jet * 0.12, sy: 1 + squeeze * 0.1 - jet * 0.06, rot: 0, drift: 0 };
    }
    case 'turtle':
      // Two strokes per pulse: each one surges it and rocks it a little.
      return { speed: 0.45 + Math.max(0, Math.sin(p * Math.PI * 4)) * 0.9, sx: 1, sy: 1, rot: Math.sin(p * Math.PI * 4) * 0.05, drift: 0 };
    case 'ray':
      // The wings flap slowly: the picture opens and closes in height.
      return { speed: 0.85 + Math.max(0, -s) * 0.4, sx: 1, sy: 1 + s * 0.13, rot: 0, drift: 0 };
    case 'seahorse':
      // Upright bobbing; the back fin flutters (a fast, tiny width wobble).
      return { speed: 1, sx: 1 + Math.sin(time / 38 + seed) * 0.02, sy: 1, rot: Math.sin(time / 1300 + seed) * 0.05, drift: Math.sin(time / 800 + seed) * 10 };
    case 'hover':
      // A buzz of tiny fins: a fast little rock.
      return { speed: 1, sx: 1, sy: 1, rot: Math.sin(time / 70 + seed) * 0.025, drift: 0 };
    case 'puffer': {
      // Now and then (the last fifth of a long pulse) it puffs up round and slows down.
      const puff = p > 0.8 ? Math.sin(((p - 0.8) / 0.2) * Math.PI) : 0;
      return { speed: 1 - puff * 0.7, sx: 1 + puff * 0.28, sy: 1 + puff * 0.34, rot: Math.sin(time / 90 + seed) * 0.02 * (1 - puff), drift: 0 };
    }
    case 'dolphin':
      // Porpoising: up and down along the way.
      return { speed: 1, sx: 1, sy: 1, rot: 0, drift: s * 38 };
    case 'eel':
    case 'fish':
      return { speed: 1, sx: 1, sy: 1, rot: 0, drift: 0 };
  }
}

/** Pulse period (ms) of each kind. */
export const KIND_PERIOD_MS: Readonly<Record<SwimKind, number>> = {
  fish: 1000,
  eel: 1000,
  jelly: 2200,
  octopus: 2600,
  turtle: 2400,
  ray: 3000,
  seahorse: 1000,
  dolphin: 2400,
  hover: 1000,
  puffer: 16_000,
};
