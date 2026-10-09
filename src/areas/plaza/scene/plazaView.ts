// Look of the plaza scene (design px, depths, tints). The layout (positions, sizes) is content; these
// are drawing choices of the scene.
export const PLAZA_VIEW = {
  /** Sky and grass rectangles extend this many frame widths so a wide window never shows the edge. */
  bleed: 3,
  /** The grass starts this far above the walk area's top edge. */
  horizonAbove: 90,
  skyDepth: -10_000,
  groundDepth: -9_000,
  /** Outline of a painted ellipse (the cobbled square, the shore). */
  edgeWidth: 6,
  /** Pixels with alpha above this count as a hit on a door. */
  hitAlpha: 20,
  /** Data key marking a door image for pointer picking. */
  doorData: 'plazaDoor',
  closedTint: 0xaeb2bf,
  /** A click on a door walks until within this share of its reach. */
  clickArriveShare: 0.45,
  /** The padlock on a closed door: size, and where on the art (share of its height from the top). */
  lock: { size: 72, at: 0.35 },
  /** Door name under its art (same plate as the farm's object labels). */
  label: {
    fontPx: 24,
    fontFamily: '"Baloo 2", system-ui, "Segoe UI", sans-serif',
    color: '#7a4f2a',
    background: '#fff6e6',
    padX: 10,
    padY: 3,
    offsetY: 6,
  },
} as const;
