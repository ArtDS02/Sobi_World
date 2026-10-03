// Farm canvas presentation numbers (spec §11, §11.1, §11.4; art standard §2.4, §5).
// Positions in the manifest layout are normalised; everything here is in design pixels.
export const FARM_VIEW = {
  /**
   * The 1600×900 frame is always shown whole (camera fit); extra screen space shows more painted
   * backdrop around it, at most this many design sizes per axis.
   */
  VIEW_MAX_EXTEND: 2,
  /** On-screen height of an adult pig at the front of the walk area (scale 1). */
  PIG_DISPLAY_PX: 200,
  /** growthProgress 0 → baby, 100 → adult (spec §11: baby small, adult larger). */
  PIG_GROWTH_SCALE: { baby: 0.6, adult: 1 },
  /** Overlay (fx_*) size at pig scale 1, and the gap between stacked overlays. */
  FX_DISPLAY_PX: 64,
  FX_STACK_GAP_PX: 8,
  /** Pigs are spread over the walk area by slot (golden-ratio sequence) and id hash. */
  PIG_SPREAD_STEP: 0.618034,
  PIG_SPREAD_OFFSET: 0.1,
  /** Default origin of a placement without originX / originY: centre bottom (DECISIONS R04-2). */
  PLACEMENT_ORIGIN: { x: 0.5, y: 1 },
  /** Depth bands: layers 0–3 below every actor, layer 4 sorted by Y (px), layer 5 above all. */
  BACK_LAYER_DEPTH: -10000,
  BACK_LAYER_STEP: 1000,
  OVERLAY_DEPTH: 100000,
  /** Selection marker under the pig's feet, relative to the pig's display height. */
  SELECTION: {
    width: 0.7,
    height: 0.16,
    color: 0xfff3b0,
    alpha: 0.9,
    stroke: 0xe8708a,
    strokeWidth: 2,
  },
  /**
   * Small name plate on top of each clickable world object (R05C-1, U05). Drawn just above its
   * object in depth, so pigs walking in front cover the plate instead of the plate covering them.
   */
  LABEL: {
    fontPx: 22,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    offsetY: 4,
    color: '#7a4f2a',
    background: '#fff6e6',
    padX: 10,
    padY: 3,
    depthAbove: 0.1,
  },
  /**
   * Pig name plate under the feet (U05): it never covers a pig — pigs further front are drawn over
   * it, pigs behind are above it on screen. Plates that collide shift down by a row.
   */
  NAMEPLATE: {
    fontPx: 17,
    gapPx: 4,
    padX: 7,
    padY: 1,
    rowGapPx: 2,
    maxShift: 3,
    /** Text only (no plate): deep pink, thin white outline + soft shadow so it reads on grass. */
    color: '#c94d69',
    stroke: '#ffffff',
    strokePx: 3,
    shadow: { x: 0, y: 1, color: 'rgba(59, 42, 38, 0.3)', blur: 2 },
    depthAbove: 0.2,
  },
  /** Visual-only strolls inside layout.walkArea (spec §11). Radius is normalised to width. */
  WANDER: {
    /** Vertical moves are slower than horizontal ones (perspective). */
    ySpeed: 0.8,
    speedPx: 70,
    minWalkMs: 600,
    /** A target closer than this to another pig's spot is re-rolled (names never stack). */
    minGapPx: 120,
    /** Speed of the push apart between standing pigs closer than minGapPx (px per second). */
    pushPx: 40,
    tries: 8,
  },
  /** Ambient motion (R12A), off with reduceMotion. Speeds in design px per second. */
  AMBIENT: {
    cloudSpeedPx: 12,
    /** Trees: a slow vertical stretch from the base plus a small side shift. */
    sway: { scaleY: 0.012, dxPx: 3, ms: 2600 },
    /** Tiled grass: the tile pattern rocks sideways. */
    grassPx: 6,
    /** Fade-in of the farm after the preload screen (R12A). */
    fadeInMs: 450,
  },
  /**
   * Painted backdrop (farm layout rework): sky, two hill bands, the back fence, grass with dots, a
   * lighter oval behind the pigs and a few small flowers. All in design px on the 1600×900 frame.
   */
  BACKDROP: {
    sky: { top: '#a9dcff', bottom: '#d9f1ff', gradientEndY: 215 },
    hills: [
      { color: '#c4e8a4', baseY: 190, amp: 26, waves: 2.2, phase: 0.3 },
      { color: '#acdc86', baseY: 238, amp: 20, waves: 3.1, phase: 1.7 },
    ],
    grass: { color: '#9ed36a', top: 290, dot: '#b2df84', dots: 260, dotR: 3 },
    oval: { color: '#b7e28a', cx: 800, cy: 590, rx: 560, ry: 250 },
    fence: {
      y: 315,
      height: 52,
      postEvery: 64,
      postW: 14,
      railH: 9,
      wood: '#b9824f',
      dark: '#7a4f2a',
    },
    flowers: [
      { x: 520, y: 870 },
      { x: 420, y: 760 },
      { x: 780, y: 385 },
    ],
    flowerR: 7,
    petal: '#ffffff',
    flowerCore: '#f7b733',
  },
  /** Soft shadow under every world object and pig, relative to its display width. */
  SHADOW: { width: 0.78, height: 0.14, color: 0x3b5a2a, alpha: 0.18 },
  /** Hover "boing" on clickable objects (scale pulse), off with reduceMotion. */
  HOVER: { scaleX: 1.05, scaleY: 0.95, ms: 140 },
  /** Notification badge on objects with `badge` (orders count). */
  BADGE: { r: 16, color: 0xff6b81, ring: 0xffffff, ringPx: 3, fontPx: 18, pulse: 1.15, ms: 700 },
  /** Gift placement (U06): inside walkArea minus this margin, clear of objects and pig homes. */
  GIFT_SPOT: { marginPx: 60, clearPx: 70, pigHomePx: 90, giftPx: 110, tries: 24 },
  /** How long the sick tint takes to fade after a cure (§11.3 PIG_TREATED). */
  SICK_TINT_FADE_MS: 600,
  /** Sick pigs are tinted green on top of the fx_sick overlay (spec §11 table). */
  SICK_TINT: 0xb6e3a2,
  /** Alpha threshold for pixel-perfect pig clicks. */
  HIT_ALPHA: 1,
  /**
   * Preload screen (design px, centred on the 1600×900 frame): the painted farm, a cream card with a
   * bobbing pig, a pill progress bar and a rotating tip. Colours follow the HUD tokens.
   */
  LOADING: {
    card: { width: 600, height: 260, y: 380, radius: 40, color: 0xfff6e6, border: 0xffffff, borderPx: 6 },
    shadow: { dy: 10, color: 0x3b5a2a, alpha: 0.16 },
    pig: { y: 372, r: 56, bobPx: 10, bobMs: 520, body: 0xffb8c6, snout: 0xff90a8, outline: 0x3b2a26 },
    title: { y: 468, px: 34, color: '#3b2a26' },
    bar: { y: 520, width: 460, height: 30, track: 0xffe9e1, fill: 0xe8708a, shine: 0xffffff },
    percent: { y: 520, px: 18, color: '#ffffff', dark: '#c94d69' },
    tip: { y: 580, px: 21, color: '#85706a', everyMs: 2600 },
  },
} as const;

/** Flat colour fills drawn when environment / prop / fx files are missing (spec §11.4). */
export const FARM_FALLBACK = {
  SKY: 0xbfe6ff,
  GROUND: 0x9bd37a,
  /** Ground line when the layout has no layer-2 environment placement. */
  GROUND_Y: 0.56,
  PROP: { width: 160, height: 120, radius: 20, color: 0xc8a27a },
  FX: { size: 64, color: 0xffffff },
  PIG: { size: 512, bodyWidth: 0.7, bodyHeight: 0.5, radius: 96, stroke: 8, outline: 0x3b2a26 },
} as const;
