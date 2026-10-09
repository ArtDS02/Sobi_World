// Ambient motion rules (spec §11.1, R12A): which placements move, and how a cloud drifts. Pure.
import { AMBIENT_DRIFT_PREFIX, AMBIENT_SWAY_IDS } from '../../../../core/config/assetIds';
import { FARM_VIEW } from '../config/farmView';

export type AmbientKind = 'drift' | 'sway' | null;

/** Which ambient motion a placement gets. Pure. */
export function ambientKind(id: string): AmbientKind {
  if (id.startsWith(AMBIENT_DRIFT_PREFIX)) return 'drift';
  return AMBIENT_SWAY_IDS.includes(id) ? 'sway' : null;
}

/**
 * Next x of a drifting cloud: moves right, re-enters at `left` once fully past `right`. Pure.
 */
export function driftX(
  x: number,
  halfWidth: number,
  right: number,
  dtMs: number,
  left = 0,
): number {
  const next = x + (FARM_VIEW.AMBIENT.cloudSpeedPx * dtMs) / 1000;
  return next - halfWidth > right ? left - halfWidth : next;
}
