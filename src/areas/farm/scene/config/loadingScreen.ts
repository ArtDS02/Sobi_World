// Loading screen (DECISIONS AM-1, AM-2 = the user's reference mock-up): a bright summer farm — sun
// rays, hills, terraced crop beds, trees, butterflies — a green-gold swirl of leaves and vegetables
// around an ornate wooden sign; on the sign's crest a medallion with the real pink pig hopping out of
// it (dust puffs, sparkles); inside a cream panel the title (= current loading step), a leafy progress
// bar with the percent, carrots and corn, and a tip with a pig icon. Design px on the 1600×900 frame
// (the camera always shows the whole frame; wider/taller windows see more scenery).
import type { BreedId } from '../../logic/config/ids';

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

/** The pig on the sign: this breed's real art, loaded first (BootScene); a drawn pig until then. */
export const LOADING_PIG_BREED: BreedId = 'PIG_EARTH_PINK';

export const LOADING_SCREEN = {
  icons: {
    carrot: 0xf58a2a, carrotDark: 0xc9621a, corn: 0xf7d046, cornDark: 0xd9a722, tomato: 0xe8483a, tomatoDark: 0xb32f25,
    leaf: 0x6cc04a, leafDark: 0x3f8a2e, leafLight: 0xb8e68f, flower: 0xf6a3c0, flowerCenter: 0xffe066, sparkle: 0xffe27a,
  },
  wood: { dark: 0x6b3d1e, mid: 0xa8693a, light: 0xc98a52, highlight: 0xf2c58e, nail: 0x4a2a14 },
  sign: {
    x: 800, y: 330, width: 680, height: 320, radius: 34, framePx: 18,
    crest: { width: 230, height: 44 }, curl: { r: 26 },
    shadow: { dy: 16, color: 0x2e4a1a, alpha: 0.3 },
    panel: { inset: 30, radius: 24, color: 0xfff6e4, edge: 0xf0dcb8 },
  },
  medallion: { y: 318, r: 66, ring: 0x6b3d1e, face: 0xa8693a, hole: 0x7a4a26 },
  pig: {
    y: 236, size: 210, hopPx: 26, hopMs: 520, squash: 0.08,
    drawn: { r: 58, body: 0xffb8c6, cheek: 0xff8fab, snout: 0xff90a8, outline: 0x3b2a26 },
    dust: { color: 0xe9e2d6, alpha: 0.85, everyMs: 520, count: 3, risePx: 40, ms: 700 },
    sparkles: [{ x: -150, y: -70, s: 1.4 }, { x: 140, y: -110, s: 1.1 }, { x: 170, y: 10, s: 0.9 }, { x: -120, y: 30, s: 0.8 }, { x: 40, y: -160, s: 0.9 }],
  },
  title: { y: 430, px: 42, color: '#5a3416', stroke: '#fffaf0', strokePx: 4 },
  bar: {
    y: 506, width: 440, height: 32, framePx: 6, frame: 0x7a4a26, track: 0x5c3a1f,
    fill: 0x8fd14f, fillDark: 0x5fae35, shine: 0xffffff, stripeEveryPx: 28, stripeMs: 1100,
    vine: 0x4f9a2f, percentPx: 22, percentColor: '#ffffff', percentStroke: '#3f6e1f',
  },
  tip: { y: 572, px: 23, color: '#6b4c3b', iconGap: 26, everyMs: 3400 },
  sky: { top: 0x7fcaf5, bottom: 0xdff3ff },
  rays: { x: 1640, y: -120, color: 0xfffbe0, alpha: 0.11, count: 5, length: 1300, spreadDeg: 30, fromDeg: 105, pulseMs: 3200 },
  glow: { x: 800, y: 470, rx: 760, ry: 470, inner: 'rgba(214,255,140,0.55)', outer: 'rgba(214,255,140,0)' },
  vignette: { inner: 0.55, color: 'rgba(30,50,15,0.38)' },
  swirl: {
    cx: 800, cy: 470, rx: 470, ry: 250, tiltDeg: -14, color: 0xeef7a0, alpha: 0.42, widthPx: 12, arcFrom: 150, arcTo: 395,
    items: 10, orbitMs: 26000,
  },
  trees: [{ x: -40, y: 420, s: 1.2 }, { x: 110, y: 330, s: 0.9 }, { x: 60, y: 610, s: 1.3 }, { x: 1560, y: 340, s: 0.8 }, { x: 1700, y: 430, s: 1.1 }],
  beds: {
    soil: 0x8c5a33, soilDark: 0x6e4424, grassEdge: 0x7cc75a,
    // Terraced strips: corners in design px (back-left, back-right, front-right, front-left), crop.
    list: [
      { pts: [-300, 360, 320, 300, 300, 360, -300, 430], crop: 'cabbage' },
      { pts: [-300, 470, 290, 400, 260, 470, -300, 560], crop: 'carrot' },
      { pts: [-300, 610, 240, 520, 200, 610, -300, 720], crop: 'cabbage' },
      { pts: [1280, 300, 1900, 360, 1900, 430, 1300, 360], crop: 'cabbage' },
      { pts: [1310, 400, 1900, 470, 1900, 560, 1340, 470], crop: 'tomato' },
      { pts: [1100, 760, 1900, 640, 1900, 900, 1180, 900], crop: 'corn' },
    ],
    plantEveryPx: 46,
  },
  hay: { x: 330, y: 840, width: 180, height: 80, color: 0xe9c25a, dark: 0xc79a33 },
  butterflies: [
    { x: 160, y: 300, color: 0xf2994a, edge: 0x5a2e10, s: 1.3 }, { x: 1440, y: 620, color: 0x6fb7f2, edge: 0x1f3f66, s: 1.1 },
    { x: 1500, y: 700, color: 0xf2994a, edge: 0x5a2e10, s: 1.5 }, { x: 260, y: 650, color: 0xf6c1d6, edge: 0x7a3b55, s: 1 },
  ],
  flutter: { flapMs: 140, driftPx: 60, driftMs: 4200 },
} as const;
