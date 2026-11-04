// The Adventure's camera on a trip (decision 045; ×1 since decision 046, so the painted maps show at their own scale): the fitted frame
// (about 40 × 22 tiles show), kept inside the area with room above and below for the HUD, and easing after the party.
import type * as Phaser from 'phaser';
import { farmCamera } from '../../../systems/layout/camera';
import type { AreaMap } from '../logic/config/content';
import { snapToPixel } from '../logic/walkMotion';

/** The Adventure's design frame: the fitted zoom shows it whole on any stage. */
export const ADVENTURE_DESIGN = { width: 1600, height: 900 } as const;

/** The zoom that fits the design frame into a stage of `size`. */
export const fitZoom = (size: { width: number; height: number }): number => farmCamera(size.width, size.height, ADVENTURE_DESIGN.width, ADVENTURE_DESIGN.height).zoom;

/** Room (design px, at the fitted zoom) the camera may scroll past the area's edges, so the HUD on top and the key hint below never hide a tile. */
const HUD_TOP = 270;
const HUD_BOTTOM = 70;
const EXPLORE_ZOOM = 1;
/** How fast the camera catches up with the party (ms to close ~63 % of the gap). */
const FOLLOW_MS = 110;

export class MapCamera {
  private at: { x: number; y: number } | null = null;
  private zoom = 0;

  constructor(private readonly cam: Phaser.Cameras.Scene2D.Camera) {}

  /** Forgets the zoom and the spot, so the next `fit` and `follow` start over (another area, or back to the camp). */
  reset() {
    this.zoom = 0;
    this.at = null;
  }

  /** Jumps to the party on the next `follow` (they were put somewhere else). */
  snapNext() {
    this.at = null;
  }

  /** Zooms in on the area and bounds the scroll, the HUD's room shrunk by the zoom so it stays the same on screen. */
  fit(map: AreaMap, fitZoom: number) {
    const zoom = fitZoom * EXPLORE_ZOOM;
    if (zoom === this.zoom) return;
    this.zoom = zoom;
    const top = HUD_TOP / EXPLORE_ZOOM;
    const bottom = HUD_BOTTOM / EXPLORE_ZOOM;
    this.cam.setZoom(zoom).setBounds(0, -top, map.cols * map.tile, map.rows * map.tile + top + bottom);
  }

  /** Eases after the party; `snap` jumps there (reduced motion). */
  follow(pos: { x: number; y: number }, delta: number, snap: boolean) {
    if (!this.at || snap) this.at = { x: pos.x, y: pos.y };
    else {
      const k = 1 - Math.exp(-delta / FOLLOW_MS);
      this.at.x += (pos.x - this.at.x) * k;
      this.at.y += (pos.y - this.at.y) * k;
    }
    this.cam.centerOn(this.at.x, this.at.y);
    // Whole screen pixels only, so the sprites do not shimmer against the ground while the camera eases after them.
    this.cam.setScroll(snapToPixel(this.cam.scrollX, this.zoom), snapToPixel(this.cam.scrollY, this.zoom));
  }
}
