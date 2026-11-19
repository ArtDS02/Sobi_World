// The small life of Đầm Sương's two made things (code only, no new art): the water wheel turning once it is lit (pale glints that ride
// its rim round, drops that spill off its top and fall back into the water), and the ruined hut's window, a warm lamp that breathes.
// Additive and dim (nothing reaches the bloom's threshold); every position is a function of the clock and the index only.
import * as THREE from 'three';
import { TILT } from './cards';
import { hash2 } from './noise';

/** A point of a leaning picture: `u` along its width from the left, `v` down its height from the top (0–1), `lift` tiles in front of it. */
function onCard(foot: THREE.Vector3, w: number, h: number, u: number, v: number, lift = 0.08): [number, number, number] {
  const up = (1 - v) * h;
  return [foot.x + (u - 0.5) * w, foot.y + up * Math.cos(TILT), foot.z + lift - up * Math.sin(TILT)];
}

const sprite = (blob: THREE.Texture, color: THREE.Color, opacity = 1): THREE.Sprite => new THREE.Sprite(new THREE.SpriteMaterial({ map: blob, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));

const RIM = 10;
const DROPS = 7;

export class WheelSpin {
  readonly group = new THREE.Group();
  private readonly rim: THREE.Sprite[] = [];
  private readonly drops: THREE.Sprite[] = [];

  /** `foot`: the middle of the wheel picture's foot (x, ground y, z); `w`, `h`: the picture's size in world units. */
  constructor(
    private readonly foot: THREE.Vector3,
    private readonly w: number,
    private readonly h: number,
    blob: THREE.Texture,
  ) {
    const glint = new THREE.Color(0.55, 0.95, 1.1);
    for (let i = 0; i < RIM; i += 1) {
      const s = sprite(blob, glint);
      this.rim.push(s);
      this.group.add(s);
    }
    for (let i = 0; i < DROPS; i += 1) {
      const s = sprite(blob, new THREE.Color(0.5, 0.85, 1.05));
      this.drops.push(s);
      this.group.add(s);
    }
  }

  /** Poses the glints and the drops at time `t` (s): the wheel turns once every 5 s. */
  update(t: number) {
    this.rim.forEach((s, i) => {
      const a = (t / 5 + i / RIM) * Math.PI * 2;
      // The wheel's face is an ellipse leaning away to the left (centre ~ 58 % across, 50 % down).
      s.position.set(...onCard(this.foot, this.w, this.h, 0.58 + Math.cos(a) * 0.27, 0.5 + Math.sin(a) * 0.33));
      const front = 0.5 + 0.5 * Math.sin(a);
      s.scale.setScalar(0.24 + 0.14 * front);
      s.material.opacity = 0.5 + 0.45 * front;
    });
    this.drops.forEach((s, i) => {
      const r = (c: number) => hash2(i + 5, 3, c);
      const f = (t * (0.5 + r(1) * 0.3) + r(2)) % 1;
      // Spills off the top of the wheel and falls to the water at its foot.
      s.position.set(...onCard(this.foot, this.w, this.h, 0.26 + r(3) * 0.2 - f * 0.03, 0.18 + f * 0.78, 0.14));
      s.scale.setScalar(0.1 + 0.05 * r(4));
      s.material.opacity = 0.75 * Math.sin(Math.PI * f) ** 0.6;
    });
  }
}

export class WindowLamp {
  readonly group = new THREE.Group();
  private readonly glow: THREE.Sprite;

  /** `foot`, `w`, `h`: the hut picture's foot, width and height in world units; `u`, `v`: the window's place on it. */
  constructor(foot: THREE.Vector3, w: number, h: number, blob: THREE.Texture, u: number, v: number) {
    this.glow = sprite(blob, new THREE.Color(1.25, 0.82, 0.38), 0.5);
    this.glow.position.set(...onCard(foot, w, h, u, v, 0.1));
    this.glow.scale.set(w * 0.13, w * 0.13, 1);
    this.group.add(this.glow);
  }

  /** Breathes the lamp at time `t` (s). */
  update(t: number) {
    this.glow.material.opacity = 0.42 + 0.12 * Math.sin(t * 1.3) + 0.05 * Math.sin(t * 3.1);
  }
}
