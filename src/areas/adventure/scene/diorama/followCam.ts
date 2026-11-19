// The diorama's camera: a fixed 3/4 angle that eases after the party, looks a little ahead of where it walks, stays inside the area
// like the 2D camera (the forest margin round the area is the most it may show), and is then pulled just far enough that the party
// and its head stay inside the middle of the frame, wherever the edge clamp or the easing would put it.
import * as THREE from 'three';
import type { Grid } from './field';

/** Pitch of the view, and the camera distance: about 34 tiles show across at 16:9 (the first version, 41, showed 28). */
export const PITCH = THREE.MathUtils.degToRad(52);
export const DIST = 49;
const FOLLOW_S = 0.14;
/** The party stays within this share of the frame's half size from its centre (0.58: the middle ~60 %). */
const MID = 0.58;
const HALF_FOV_TAN = Math.tan(THREE.MathUtils.degToRad(11));

export class FollowCam {
  /** The point the camera looks at (ground level). */
  readonly target = new THREE.Vector3();
  /** Where the camera leads the party (it looks a little ahead of where it walks). */
  private readonly lead = new THREE.Vector3();
  private readonly v = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  /** Eases the look-at point after the party `at` heading `heading` (share of walking speed per axis), `dt` seconds on. */
  aim(at: THREE.Vector3, heading: { x: number; y: number }, snap: boolean, dt: number, g: Grid, lookAhead: boolean) {
    const tanH = HALF_FOV_TAN * DIST;
    const halfW = tanH * this.camera.aspect * 0.92;
    if (snap) this.lead.set(0, 0, 0);
    else if (lookAhead) this.lead.lerp(this.v.set(heading.x * 2.6, 0, heading.y * 1.6), 1 - Math.exp(-dt / 0.7));
    const want = new THREE.Vector3(THREE.MathUtils.clamp(at.x + this.lead.x, halfW, g.cols - halfW), 0, THREE.MathUtils.clamp(at.z + 0.6 + this.lead.z, 11.4, g.rows - 6.6));
    if (snap) this.target.copy(want);
    else this.target.lerp(want, 1 - Math.exp(-dt / FOLLOW_S));
    for (let i = 0; i < 4; i += 1) {
      this.place();
      let moved = false;
      for (const lift of [0, 1.9]) {
        this.v.set(at.x, at.y + lift, at.z).project(this.camera);
        const ex = this.v.x - THREE.MathUtils.clamp(this.v.x, -MID, MID);
        const ey = this.v.y - THREE.MathUtils.clamp(this.v.y, -MID, MID);
        if (ex || ey) {
          this.target.x += ex * tanH * this.camera.aspect;
          this.target.z -= (ey * tanH) / Math.sin(PITCH);
          moved = true;
        }
      }
      if (!moved) return;
    }
    this.place();
  }

  private place() {
    this.camera.position.set(this.target.x, this.target.y + Math.sin(PITCH) * DIST, this.target.z + Math.cos(PITCH) * DIST);
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }
}
