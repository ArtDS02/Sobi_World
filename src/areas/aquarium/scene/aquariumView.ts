import type { FishView } from '../logic/derived';

// Look of the Aquarium scene (design px, depths, colours). What swims is state; these are the drawing choices of the
// scene: where the tank and the dock stand, the box the fish swim in, how big a fish is at its age.
export const AQUARIUM_DESIGN = { width: 1600, height: 900 } as const;

export const AQUARIUM_VIEW = {
  /** The tank: its art stands on this point (bottom centre) and is drawn this wide. */
  tank: { x: 620, y: 760, width: 980 },
  /** The water inside the glass: fish swim in this box. */
  water: { left: 215, right: 1025, top: 230, bottom: 575 },
  /** The sand strip where the eggs lie. */
  sandY: 600,
  /** The dock and the pile of scales. */
  dock: { x: 1360, y: 800 },
  scales: { x: 1010, y: 640 },
  /** Colours of the backdrop outside the art (the camera shows more than the frame on wide windows). */
  sea: 0x60aad6,
  sky: 0xbae2f6,
  murk: 0x6b8f4a,
  night: 0x10204a,
  depth: { ground: -1000, tank: 10, egg: 15, fish: 20, murk: 25, dock: 30, bubble: 40, night: 4000, badge: 5000 },
  label: { fontPx: 24, fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif', color: '#2f4f6a', background: '#e8f6ff', padX: 10, padY: 3 },
  badge: { fontPx: 28, color: '#ffffff', background: '#4aa86b' },
  /** Swimming: speed (design px per second) at a fish scale of 1, and the pause between two targets. */
  swim: { speed: 70, sickFactor: 0.4, pauseMs: [400, 2200] as const },
  sickTint: 0xa8d890,
  hungryIcon: '🍽',
  sickIcon: '🤒',
} as const;

/** Picture scale of a fish at a growth: a hatchling is small, a grown one full size. */
export const fishScale = (progress: number): number => 0.34 + (0.46 * Math.min(100, Math.max(0, progress))) / 100;

/** The part of the picture of a fish that the draw cares about: which way it faces and its icon. */
export function fishIcon(view: Pick<FishView, 'sick' | 'hunger'>): string {
  return view.sick ? AQUARIUM_VIEW.sickIcon : view.hunger < 30 ? AQUARIUM_VIEW.hungryIcon : '';
}

/** Where egg `index` of `count` lies on the sand (design px). */
export function eggSpot(index: number): { x: number; y: number } {
  return { x: AQUARIUM_VIEW.water.left + 90 + index * 46, y: AQUARIUM_VIEW.sandY + (index % 2) * 12 };
}
