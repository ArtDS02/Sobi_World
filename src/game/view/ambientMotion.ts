// Ambient motion rules (spec §11.1, R12A): which placements move, and how a cloud drifts. Pure.
import { AMBIENT_DRIFT_PREFIX, AMBIENT_SWAY_IDS } from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';

export type AmbientKind = 'drift' | 'sway' | null;

/** Which ambient motion a placement gets. Pure. */
export function ambientKind(id: string): AmbientKind {
  if (id.startsWith(AMBIENT_DRIFT_PREFIX)) return 'drift';
  return AMBIENT_SWAY_IDS.includes(id) ? 'sway' : null;
}

/** Next x of a drifting cloud: moves right, re-enters from the left once fully off-scene. Pure. */
export function driftX(x: number, halfWidth: number, sceneWidth: number, dtMs: number): number {
  const next = x + (FARM_VIEW.AMBIENT.cloudSpeedPx * dtMs) / 1000;
  return next - halfWidth > sceneWidth ? -halfWidth : next;
}
