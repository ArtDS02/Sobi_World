// Farm seasons (SE task, DECISIONS SE-1): which season a local calendar month is in and how each
// season dresses the farm. The layout never changes: buildings / props swap to their seasonal file
// (manifest `seasons`, falling back to the default file), the painted backdrop takes the season's
// palette and an optional particle weather (petals, sun motes, leaves, snow) drifts over the world.
// Adding a season = one id here, one row in each table below, and sheet art for scripts/cut-seasons.

export const SEASON_IDS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type SeasonId = (typeof SEASON_IDS)[number];

/**
 * Local calendar month (1–12) → season. Vietnamese seasons follow the lunar calendar, about one
 * month after the astronomical ones: spring Feb–Apr (Tết), summer May–Jul, autumn Aug–Oct, winter
 * Nov–Jan.
 */
export const SEASON_BY_MONTH: Readonly<Record<number, SeasonId>> = {
  1: 'winter',
  2: 'spring',
  3: 'spring',
  4: 'spring',
  5: 'summer',
  6: 'summer',
  7: 'summer',
  8: 'autumn',
  9: 'autumn',
  10: 'autumn',
  11: 'winter',
  12: 'winter',
};

/** Colours of the painted backdrop (view/backdropPaint): hills back to front, grass, roam oval. */
export interface BackdropPalette {
  hills: readonly string[];
  grass: string;
  dot: string;
  oval: string;
  petal: string;
  flowerCore: string;
}

/** Falling / floating particles over the farm; `count: 0` = none. Colours are 0xRRGGBB. */
export interface SeasonWeather {
  kind: 'petal' | 'mote' | 'leaf' | 'snow';
  count: number;
  colors: readonly number[];
  /** Size range in design px. */
  size: readonly [number, number];
  /** Fall speed range, design px per second (negative = rising). */
  fall: readonly [number, number];
  /** Sideways sway amplitude, design px. */
  sway: number;
  alpha: number;
}

export interface SeasonLook {
  backdrop: BackdropPalette;
  weather: SeasonWeather;
}

export const SEASON_LOOKS: Readonly<Record<SeasonId, SeasonLook>> = {
  spring: {
    backdrop: {
      hills: ['#cdeeb0', '#b4e295'],
      grass: '#a6da74',
      dot: '#f7c6d9',
      oval: '#bfe796',
      petal: '#ffd1e3',
      flowerCore: '#f7b733',
    },
    weather: {
      kind: 'petal',
      count: 26,
      colors: [0xffc4da, 0xffe0ec, 0xf9a8c8],
      size: [5, 9],
      fall: [18, 34],
      sway: 26,
      alpha: 0.9,
    },
  },
  summer: {
    // The original farm palette (farm layout rework) is the summer look.
    backdrop: {
      hills: ['#c4e8a4', '#acdc86'],
      grass: '#9ed36a',
      dot: '#b2df84',
      oval: '#b7e28a',
      petal: '#ffffff',
      flowerCore: '#f7b733',
    },
    weather: {
      kind: 'mote',
      count: 14,
      colors: [0xfff3b0, 0xffe27a],
      size: [3, 5],
      fall: [-10, -4],
      sway: 18,
      alpha: 0.55,
    },
  },
  autumn: {
    backdrop: {
      hills: ['#e2cf8f', '#d4b46a'],
      grass: '#b9c56a',
      dot: '#e0a04a',
      oval: '#cdd282',
      petal: '#f2a541',
      flowerCore: '#b5541c',
    },
    weather: {
      kind: 'leaf',
      count: 22,
      colors: [0xe8742a, 0xf2a541, 0xc8461f, 0xe9c046],
      size: [7, 11],
      fall: [24, 44],
      sway: 34,
      alpha: 0.95,
    },
  },
  winter: {
    backdrop: {
      hills: ['#e8f1f7', '#d6e6f0'],
      grass: '#dfeaf0',
      dot: '#ffffff',
      oval: '#f2f7fa',
      petal: '#ffffff',
      flowerCore: '#9cc3dd',
    },
    weather: {
      kind: 'snow',
      count: 60,
      colors: [0xffffff, 0xeef6ff],
      size: [3, 6],
      fall: [26, 52],
      sway: 16,
      alpha: 0.9,
    },
  },
};

/** How often the farm re-reads the calendar (a season changes at most once a month). */
export const SEASON_VIEW = {
  pollMs: 60_000,
  /** Weather draws above the world and pigs, under the day / night tint (FARM_VIEW.OVERLAY_DEPTH). */
  weatherDepthBelowOverlay: 3,
} as const;
