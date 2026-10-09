// Feedback timings and particle bursts (spec §11.3). Design pixels and milliseconds.
export const FEEDBACK = {
  /** Delay between pigs of one staggered event (PIG_CLEANED). */
  STAGGER_MS: 140,
  TWEEN: {
    bounce: { dropPx: 220, ms: 700 },
    happy: { px: 36, ms: 220, repeat: 1 },
    shake: { px: 8, ms: 50, repeat: 3 },
    clean: { deg: 6, ms: 90, repeat: 3 },
    eat: { deg: 8, ms: 250, repeat: 2 },
    exit: { px: 140, ms: 450 },
    popIn: { from: 0.2, ms: 420, moveMs: 900 },
    grow: { from: 0.85, ms: 600 },
    wiggle: { deg: 4, ms: 80, repeat: 3 },
    /** Brightness lift while cleaning (colour matrix, WebGL only). */
    cleanBright: { amount: 0.35, ms: 180 },
  },
  /** Continuous pose tweens (art standard §2.4, §3): idle breathing, walk squash, turn. */
  POSE: {
    breathe: { amount: 0.025, ms: 1300 },
    squash: { x: 1.04, y: 0.95, ms: 170 },
    turnMs: 120,
  },
  PARTICLE: {
    count: 8,
    speedMin: 80,
    speedMax: 220,
    lifespanMs: 800,
    /** On-screen particle size in design px, whatever the fx texture size (256 or 64). */
    sizePx: 48,
    /** Emission cone, degrees (Phaser: 270 = straight up). */
    angleMin: 220,
    angleMax: 320,
    gravityY: 260,
  },
  /** Pig tap sound thresholds (spec §12): hunger < 30 → hungry oink, happiness >= 50 → happy. */
  TAP_SOUND: { hungryBelow: 30, happyFrom: 50 },
  /** Gift boxes (U06): smoke → short wait → pop 0 → 1.15 → 0.95 → 1 → idle float; open: 1.1 → pop. */
  GIFT: {
    displayPx: 96,
    anticipationMs: 160,
    popMs: [180, 120, 110],
    popScale: [1.15, 0.95, 1],
    popAngleDeg: 6,
    idle: { px: 5, ms: 1400 },
    open: { squeeze: 1.1, squeezeMs: 120, pop: 1.35, popMs: 180 },
    /** Reward text rising from the box. */
    float: { fontPx: 30, risePx: 70, ms: 1100, lineGapPx: 34, color: '#b8860b', stroke: '#fff7f3' },
  },
  /** Where `top` bursts appear (normalised), e.g. LEVEL_UP near the top bar. */
  TOP_POINT: { x: 0.5, y: 0.08 },
} as const;
