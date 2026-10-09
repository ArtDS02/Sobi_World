// Where each fx overlay of a pig goes (spec §11, art standard §5). Pure: the anchor mirrors with
// the pig's facing (x' = 1 - x, R05A), stacked overlays spread around it.
import { anchorOffset, type Anchors } from '../../../../core/assets/anchors';
import type { AnchorName, FxId } from '../../../../core/config/assetIds';
import { FARM_VIEW } from '../config/farmView';

export interface OverlayInput {
  fx: readonly FxId[];
  anchors: Anchors;
  anchorOf: (fx: FxId) => AnchorName;
  flipX: boolean;
  scale: number;
  displayW: number;
  displayH: number;
  x: number;
  y: number;
}

export function overlayLayout(f: OverlayInput): { x: number; y: number; size: number }[] {
  const size = FARM_VIEW.FX_DISPLAY_PX * f.scale;
  const step = size + FARM_VIEW.FX_STACK_GAP_PX * f.scale;
  const n = f.fx.length;
  return f.fx.map((fx, i) => {
    const off = anchorOffset(f.anchors, f.anchorOf(fx), f.flipX, f.displayW, f.displayH);
    return { x: f.x + off.x + (i - (n - 1) / 2) * step, y: f.y + off.y, size };
  });
}
