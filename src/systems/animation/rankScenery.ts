// Scenery of a cloud tier / garden zone by upgrade rank (decision 056), as plain data: which layers a rank shows and how a layer
// moves. Presentation only; the scenes draw it (ui/world/rankScenery.ts) and stop the motion for "Giảm chuyển động".
// Rank 2: border and path. Rank 3: the landmark of that tier / zone. Rank 4: lanterns, night glow, a small creature.
// Rank 5: the large accent (Cloud: cloud waterfall and halo; Garden: old tree and a small village market).

export type SceneryKind = 'border' | 'fence' | 'path' | 'landmark' | 'lanterns' | 'critter' | 'waterfall' | 'halo' | 'tree' | 'market';

export interface SceneryLayer {
  kind: SceneryKind;
  /** One art id, or one per tier / zone (index = group) for the landmarks. */
  art: string | readonly string[];
  /** The rank (1..5) from which the layer shows. */
  minRank: number;
  /** Design px: where it stands (centre of the art, or its feet for `feet`). */
  x: number;
  y: number;
  scale?: number;
  depth: number;
  /** The art stands on its bottom edge at (x, y) instead of being centred there. */
  feet?: boolean;
  additive?: boolean;
}

/** The art ids a layer list needs in the manifest. */
export const sceneryArtIds = (layers: readonly SceneryLayer[]): string[] => layers.flatMap((l) => (typeof l.art === 'string' ? [l.art] : [...l.art]));

/** The layers a rank shows. */
export const layersAtRank = (layers: readonly SceneryLayer[], rank: number): SceneryLayer[] => layers.filter((l) => l.minRank <= rank);

export interface SceneryPose {
  /** Vertical offset in design px. */
  dy: number;
  /** Opacity multiplier 0..1. */
  alpha: number;
}

/** How a layer moves at `timeMs`; `still` (reduced motion) freezes it at its resting pose. Pure and deterministic. */
export function sceneryMotion(kind: SceneryKind, timeMs: number, night: boolean, still: boolean): SceneryPose {
  if (still) return { dy: 0, alpha: kind === 'halo' ? 0.45 : kind === 'lanterns' ? (night ? 1 : 0.85) : 1 };
  const s = Math.sin(timeMs / 1000);
  switch (kind) {
    case 'critter':
      return { dy: Math.sin(timeMs / 450) * 5, alpha: 1 };
    case 'halo':
      return { dy: 0, alpha: 0.4 + 0.1 * s };
    case 'waterfall':
      return { dy: 0, alpha: 0.85 + 0.1 * Math.sin(timeMs / 260) };
    case 'lanterns':
      return { dy: 0, alpha: night ? 0.92 + 0.08 * Math.sin(timeMs / 330) : 0.85 };
    default:
      return { dy: 0, alpha: 1 };
  }
}
