// The numbers of the plaza's living details (design px, ms, 0..1): clouds, water, the fountain, the portal,
// butterflies, signs, lamps, dust, the fade behind buildings. Looks only; where things stand is the layout.
export const PLAZA_AMBIENT = {
  clouds: {
    /** Cloud art ids (manifest rows), drifting right and wrapping round. */
    ids: ['env_cloud_a', 'env_cloud_b', 'env_cloud_c', 'env_cloud_d', 'env_cloud_e', 'env_cloud_f', 'env_cloud_g'],
    /** Band of the frame they float in (fraction of the frame height). */
    band: { from: 0.02, to: 0.15 },
    /** px per second, per cloud (cycled). */
    speeds: [9, 6, 12, 7, 10, 5, 8],
    /** On-screen width, design px (cycled). */
    widths: [260, 200, 150, 220, 180, 170, 240],
    alpha: 0.95,
    depth: -8_900,
  },
  water: {
    /** Foam lines along the shore: how many, how far they travel, and how long a wave takes. */
    waves: 9,
    travel: 14,
    periodMs: 3200,
    lineWidth: 5,
    color: 0xffffff,
    alpha: 0.7,
    sparkles: 10,
    depth: -8_800,
  },
  fountain: {
    /** Droplets from the top of the fountain art (share of its height from the top). */
    spoutAt: 0.12,
    frequencyMs: 90,
    lifespanMs: 900,
    speed: [70, 130] as [number, number],
    gravity: 380,
    color: 0xbfeaff,
    scale: [0.9, 1.5] as [number, number],
  },
  portal: {
    glowColor: 0xb06bff,
    glowAlpha: [0.14, 0.34] as [number, number],
    glowPeriodMs: 2600,
    /** Share of the gate's width/height the glow covers, and where its centre is (from the top). */
    glowSize: { w: 0.75, h: 0.7 },
    glowCentre: 0.45,
    sparkleMs: { far: 380, near: 140 },
    sparkleLifeMs: 1400,
    sparkleColor: 0xe2c6ff,
  },
  butterflies: {
    count: 6,
    ids: ['prop_butterfly_blue', 'prop_butterfly_violet', 'prop_butterfly_orange', 'prop_butterfly_azure', 'prop_butterfly_white', 'prop_butterfly_red'],
    /** Their flight area: the garden art's bounds grown by this many px. */
    marginPx: 70,
    width: 30,
    speed: [34, 70] as [number, number],
    /** How sharply they may turn (rad/s) and how long they keep a heading (ms). */
    turnRate: 2.4,
    headingMs: [700, 1800] as [number, number],
    flapHz: 7,
  },
  signs: {
    /** A gentle sway all the time; a bigger bounce when the character comes close. */
    swayDeg: 1.2,
    swayMs: 2200,
    nearBounceDeg: 5,
    fontPx: 18,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#5a3a1c',
    /** Where the writing goes on the sign art: the board's centre (share of the art's height from its top) and width. */
    board: { centre: 0.27, width: 0.86 },
    sparkles: 4,
  },
  lamps: {
    glowColor: 0xffd48a,
    radius: 120,
    /** Glow alpha by how dark it is (the day look's `lights` 0..1): [by day, at night], flicker amount. */
    alpha: [0.0, 0.55] as [number, number],
    flicker: 0.08,
    flickerMs: 1300,
  },
  animals: {
    /** Idle moves: how far (px / rad), and how long one takes (ms). */
    breathe: { scale: 0.045, ms: 1500 },
    peck: { angle: 0.35, ms: 380, everyMs: [1400, 3600] as [number, number] },
    hop: { height: 9, ms: 260, everyMs: [1800, 4200] as [number, number] },
    sway: { angle: 0.05, ms: 2000 },
  },
  dust: {
    /** Each puff lives this long; at most this many alive at once. */
    lifeMs: 520,
    color: 0xe9d3a6,
    maxAlive: 24,
  },
  fade: {
    /** Opacity of a building the character stands behind, and how fast it follows (per second). */
    behindAlpha: 0.5,
    ratePerSecond: 7,
    /** The character counts as behind from this far over the art's left/right edges (px). */
    marginPx: 6,
  },
  shadow: { alpha: 0.28 },
  light: {
    /** The evening tint is a multiply layer over the world; this much of its strength is used (keeps the character readable). */
    strength: 0.85,
    depth: 90_000,
    pollMs: 20_000,
    transitionMs: 1200,
  },
} as const;
