// Day / night presentation (DN task): phases follow the player's local clock. Visual only — no
// gameplay number depends on it. The DAY_NIGHT block between the admin markers is rewritten by the
// admin dashboard (`npm run admin` → Ngày/Đêm); keep it a plain object literal.

export const DAY_PHASES = ['dawn', 'morning', 'day', 'afternoon', 'sunset', 'night'] as const;
export type DayPhase = (typeof DAY_PHASES)[number];

export interface DayNightSettings {
  /** Off: the farm always shows the `day` look and the HUD clock is hidden. */
  enabled: boolean;
  /** Local start time "HH:MM" of each phase, increasing in DAY_PHASES order. */
  phases: Record<DayPhase, string>;
  /** Minutes over which one phase blends into the next, centred on the start time. */
  blendMinutes: number;
  /** On-screen tween (ms) whenever the shown look changes (minute step, preview switch). */
  transitionMs: number;
}

// <admin:dayNight>
export const DAY_NIGHT: DayNightSettings = {
  enabled: true,
  phases: {
    dawn: '05:00',
    morning: '07:00',
    day: '10:00',
    afternoon: '16:00',
    sunset: '18:00',
    night: '20:00',
  },
  blendMinutes: 60,
  transitionMs: 3000,
};
// </admin:dayNight>

/** Admin limits for DAY_NIGHT (validated by dayNightIssues). */
export const DAY_NIGHT_LIMITS = { blendMaxMinutes: 120, transitionMaxMs: 20000 } as const;

/**
 * What one phase looks like. Colours are 0xRRGGBB. `ambient` multiplies the whole farm (0xffffff =
 * unchanged), so the night stays a cool dim tint instead of a black veil over the art.
 */
export interface PhaseLook {
  skyTop: number;
  skyBottom: number;
  ambient: number;
  /** Multiplier on every soft shadow's alpha. */
  shadow: number;
  /** 0..1 visibility of the stars, the moon and the warm glow of the buildings. */
  stars: number;
  moon: number;
  lights: number;
}

/** `day` equals the farm before day / night existed (BACKDROP.sky, no tint). */
export const PHASE_LOOKS: Record<DayPhase, PhaseLook> = {
  dawn: {
    skyTop: 0x7f8fd0,
    skyBottom: 0xf6c4c8,
    ambient: 0xd9d2ec,
    shadow: 0.5,
    stars: 0.25,
    moon: 0.3,
    lights: 0.45,
  },
  morning: {
    skyTop: 0x9fd2f6,
    skyBottom: 0xfbe6d0,
    ambient: 0xfff3e6,
    shadow: 0.85,
    stars: 0,
    moon: 0,
    lights: 0,
  },
  day: {
    skyTop: 0xa9dcff,
    skyBottom: 0xd9f1ff,
    ambient: 0xffffff,
    shadow: 1,
    stars: 0,
    moon: 0,
    lights: 0,
  },
  afternoon: {
    skyTop: 0x9fd0f2,
    skyBottom: 0xf3ecc8,
    ambient: 0xfff2dc,
    shadow: 1,
    stars: 0,
    moon: 0,
    lights: 0,
  },
  sunset: {
    skyTop: 0x8a7bc4,
    skyBottom: 0xffb27a,
    ambient: 0xffd2b0,
    shadow: 0.7,
    stars: 0.1,
    moon: 0.25,
    lights: 0.6,
  },
  night: {
    skyTop: 0x1d2654,
    skyBottom: 0x46578f,
    ambient: 0xa4aee0,
    shadow: 0.35,
    stars: 1,
    moon: 1,
    lights: 1,
  },
};

/** Phaser presentation of the looks (design px on the 1600×900 frame). */
export const DAY_NIGHT_VIEW = {
  /** Polls the local clock this often (ms); the look only changes per minute. */
  pollMs: 20000,
  /** Stars scattered over the sky band above `starsMaxY`, per 100×100 world cell. */
  starsPerCell: 1.2,
  starsMaxY: 150,
  starR: [1.6, 3.2],
  starColor: 0xfffbe8,
  moon: { x: 1180, y: 58, r: 30, color: 0xfff6d2, halo: 0xfff6d2, haloR: 70, haloAlpha: 0.18 },
  /** Warm additive glow over clickable buildings at night, relative to their display size. */
  glow: { color: 0xffc46b, alpha: 0.55, width: 0.95, height: 0.75, centerY: 0.55 },
  /** World objects (by their click action) that light up at night: houses and the shop. */
  litActions: ['collection', 'inventory', 'shop'] as readonly string[],
  /** Depths just under the fx overlay band (FARM_VIEW.OVERLAY_DEPTH). */
  ambientDepthBelowOverlay: 2,
  glowDepthBelowOverlay: 1,
  skyDepth: -2000000,
  backdropDepth: -1000000,
} as const;

/**
 * Global pig sleep (DECISIONS PS-1): every pig on the farm sleeps through these phases and is
 * awake in the others. One day/night signal drives all pigs; the stagger only offsets each pig's
 * start (by its id) so the herd does not blink in unison. Visual only, TUNABLE.
 */
export const PIG_SLEEP = {
  phases: ['night'] as readonly DayPhase[],
  /** Falling asleep: heavy lids + settling down. */
  fallAsleepMs: 1800,
  /** Waking up: heavy lids + stretch. */
  wakeUpMs: 1600,
  /** Sleeping pose: body settles (by < 1, bx > 1) and breathes slowly. */
  settle: { bx: 1.04, by: 0.9 },
  breathe: { amount: 0.025, ms: 2600 },
  /** Waking stretch peak before the pig stands normally again. */
  stretch: { bx: 0.96, by: 1.08 },
} as const;

/**
 * Optional painted sky per phase (asset id → manifest `environment` row). Empty today: the sky is
 * a code gradient. Adding a row here crossfades that image over the gradient, no logic change.
 */
export const SKY_ART: Partial<Record<DayPhase, string>> = {};
