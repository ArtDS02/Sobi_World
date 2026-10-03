// Loading screen (DECISIONS AM-1): a countryside morning — sky, drifting clouds, hills, crop beds and
// a front fence — with a wooden farm sign in the middle: a pig peeking over the top, the title, a
// progress bar, the percent and the current loading step. Design px on the 1600×900 frame (the
// camera always shows the whole frame; wider/taller windows see more scenery). Drawn with shapes:
// nothing is loaded yet. Colours follow the wooden HUD + pink pig palette of the game.

/** Loading steps in order; `at` = overall progress when the step starts (see game/scenes/PreloadScene). */
export const LOADING_STEPS = [
  { id: 'config', at: 0 },
  { id: 'farm', at: 0.08 },
  { id: 'pigs', at: 0.45 },
  { id: 'world', at: 0.92 },
  { id: 'ready', at: 1 },
] as const;
export type LoadingStepId = (typeof LOADING_STEPS)[number]['id'];
/** Share of the bar the file loader covers (between the `farm` start and the `world` start). */
export const LOADING_FILES_SPAN = { from: 0.08, to: 0.92 } as const;

export const LOADING_SCREEN = {
  wood: { dark: 0x7a4a26, mid: 0xb7763f, light: 0xd9a066, face: 0xe5b47a, grain: 0xc28a52, highlight: 0xf6d3a1, nail: 0x5b3a22 },
  sign: {
    x: 800, y: 330, width: 680, height: 340, radius: 40, framePx: 16, plankCount: 3,
    shadow: { dy: 14, color: 0x3b2a14, alpha: 0.24 },
    posts: { dx: 250, width: 38, bottom: 790 },
    panel: { inset: 46, top: 58, bottom: 40, radius: 28, color: 0xfff4de, border: 0xeccb9c, borderPx: 4 },
  },
  pig: {
    y: 300, r: 62, body: 0xffb8c6, cheek: 0xff8fab, snout: 0xff90a8, outline: 0x3b2a26,
    blinkEveryMs: 3400, blinkMs: 120, earWiggleDeg: 8, earMs: 900, bobPx: 6, bobMs: 1400,
  },
  title: { y: 448, lineGap: 46, px: 42, color: '#6b3e1f', stroke: '#fffaf0', strokePx: 6 },
  bar: {
    y: 540, width: 470, height: 36, framePx: 5, frame: 0x8a5a33, track: 0xf3dcc0,
    fill: 0xf27c9b, fillDark: 0xd95f81, shine: 0xffffff, stripeEveryPx: 26, stripeMs: 900,
  },
  percent: { y: 588, px: 26, color: '#8a4b2a' },
  status: { y: 626, px: 24, color: '#8a6a55' },
  tip: { y: 735, px: 21, color: '#6b4c3b', pill: 0xfff6e6, pillAlpha: 0.92, padX: 22, height: 40, everyMs: 3200 },
  sky: { top: 0x8fd3ff, bottom: 0xe6f7ff },
  clouds: {
    color: 0xffffff, alpha: 0.95, shade: 0xdcefff, driftPx: 60, driftMs: 26000,
    list: [
      { x: 180, y: 110, s: 1.1 }, { x: 560, y: 70, s: 0.8 }, { x: 1080, y: 120, s: 1.25 },
      { x: 1420, y: 64, s: 0.9 }, { x: -260, y: 90, s: 1 }, { x: 1880, y: 110, s: 1.05 },
    ],
  },
  crops: {
    soil: 0x9a6a43, soilDark: 0x7e5434, leaf: 0x6cbf4a, leafDark: 0x4c9a35, carrot: 0xf28b30,
    beds: [{ x: -360, y: 770, width: 700, rows: 2 }, { x: 1260, y: 770, width: 700, rows: 2 }],
    plantEveryPx: 54, rowGapPx: 36,
  },
  fence: { y: 806, height: 70, postEveryPx: 88, postWidth: 18, railPx: 12, color: 0xd59a5c, outline: 0x8a5a33, from: -800, to: 2400 },
  grass: { y: 896, color: 0x7cc75a, dark: 0x5ea845, tufts: 34, swayDeg: 5, swayMs: 1800 },
  sparkles: { count: 16, color: 0xfff6b0, riseMs: 5200, risePx: 160, minY: 180, maxY: 760 },
  leaves: { count: 6, colors: [0x8fd06a, 0xf2c14e, 0x6cbf4a], fallMs: 9000, driftPx: 220 },
} as const;
