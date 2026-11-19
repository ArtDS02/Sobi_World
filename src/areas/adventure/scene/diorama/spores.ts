// Thung Nấm's accent (docs/agent-loop/forest-diorama/design.md §C.4): warm-gold spores that rise round the giant mushroom's cap, drift
// sideways on a slow air and fade out above it, over a faint warm breath on the cap. Additive, small and sparse (never dense enough to
// hide the party), no new art: a soft blob and the time. Every spore's path is a function of the clock and its index only.
import * as THREE from 'three';
import { TILT } from './cards';
import { hash2 } from './noise';

export class Spores {
  readonly group = new THREE.Group();
  private readonly motes: THREE.Sprite[] = [];
  private readonly breath: THREE.Sprite;

  /** `foot`: the middle of the picture's foot (x, ground y, z); `w`, `h`: the picture's size in world units; `count`: how many spores. */
  constructor(
    private readonly foot: THREE.Vector3,
    private readonly w: number,
    private readonly h: number,
    blob: THREE.Texture,
    count: number,
  ) {
    const color = new THREE.Color(1.3, 0.95, 0.4);
    for (let i = 0; i < count; i += 1) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blob, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      this.motes.push(s);
      this.group.add(s);
    }
    // The cap's warm breath: one wide dim blob on the cap (the cap fills the upper half of the picture).
    this.breath = new THREE.Sprite(new THREE.SpriteMaterial({ map: blob, color: new THREE.Color(1, 0.78, 0.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.12 }));
    const up = h * 0.72;
    this.breath.position.set(foot.x, foot.y + up * Math.cos(TILT), foot.z + 0.2 - up * Math.sin(TILT));
    this.breath.scale.set(w * 0.8, h * 0.36, 1);
    this.group.add(this.breath);
  }

  /** Poses the spores at time `t` (s); `k` is the strength (0 off, 1 full). */
  update(t: number, k: number) {
    this.breath.material.opacity = k * (0.1 + 0.05 * Math.sin(t * 0.9));
    this.motes.forEach((m, i) => {
      const r = (c: number) => hash2(i + 3, 11, c);
      // Each spore lives 9–16 s: born on the cap's rim, rises and drifts on a slow sway, fades at both ends.
      const life = 9 + r(1) * 7;
      const f = (t / life + r(2)) % 1;
      const side = (r(3) - 0.5) * this.w * 1.15;
      const up = this.h * (0.62 + f * 0.9);
      const sway = Math.sin(t * 0.55 + r(4) * 6.28) * 0.35 + (f - 0.3) * (r(5) - 0.5) * 1.6;
      const depth = Math.sin(t * 0.4 + r(6) * 6.28) * 0.3;
      m.position.set(this.foot.x + side + sway, this.foot.y + up * Math.cos(TILT), this.foot.z + 0.25 + depth - up * Math.sin(TILT));
      m.scale.setScalar(0.26 + r(7) * 0.24);
      m.material.opacity = 1 * k * Math.sin(Math.PI * f) ** 1.5 * (0.7 + 0.3 * Math.sin(t * 2.3 + i));
    });
  }
}
