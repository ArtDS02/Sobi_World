// The Adventure's camera on a trip (decision 045): zoomed in ×2 on the fitted frame (about 20 × 11 tiles show), kept inside the
// area with room above and below for the HUD, and easing after the party.
import type * as Phaser from 'phaser';
import type { AreaMap } from '../logic/config/content';

/** Room (design px, at the fitted zoom) the camera may scroll past the area's edges, so the HUD on top and the key hint below never hide a tile. */
const HUD_TOP = 270;
const HUD_BOTTOM = 70;
const EXPLORE_ZOOM = 2;
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
  }
}
