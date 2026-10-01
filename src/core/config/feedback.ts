// Feedback timings and particle bursts (spec §11.3). Design pixels and milliseconds.
export const FEEDBACK = {
  /** Delay between pigs of one staggered event (PIG_CLEANED). */
  STAGGER_MS: 140,
  TWEEN: {
    bounce: { dropPx: 220, ms: 700 },
    hop: { px: 36, ms: 220 },
    shake: { px: 8, ms: 50, repeat: 3 },
    clean: { deg: 6, ms: 90, repeat: 3 },
    eat: { deg: 8, ms: 250, repeat: 2 },
    exit: { px: 140, ms: 450 },
    popIn: { from: 0.2, ms: 420, moveMs: 900 },
    grow: { from: 0.85, ms: 600 },
    wiggle: { deg: 4, ms: 80, repeat: 3 },
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
  /** Where `top` bursts appear (normalised), e.g. LEVEL_UP near the top bar. */
  TOP_POINT: { x: 0.5, y: 0.08 },
} as const;
