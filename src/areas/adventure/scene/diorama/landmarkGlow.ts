// The small life of a landmark (Rừng Sâu's mossy stone ring): soft green-gold motes that rise round it and a few faint runes that
// breathe on its stones. All additive and kept dim (nothing reaches the bloom's threshold), code only, no new art.
import * as THREE from 'three';
import { TILT } from './cards';
import { hash2 } from './noise';

/** Where the runes sit on the picture (shares of its width from the left, and of its height from the top). */
const RUNES: readonly (readonly [number, number])[] = [
  [0.31, 0.2],
  [0.69, 0.17],
  [0.1, 0.32],
  [0.89, 0.3],
  [0.3, 0.84],
  [0.68, 0.86],
  [0.5, 0.52],
];
const MOTES = 16;

let glyphs: THREE.Texture | null = null;
/** A rune: a ring, a stroke through it and two ticks, drawn thin and soft. */
function runeTexture(): THREE.Texture {
  if (glyphs) return glyphs;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.shadowColor = '#ffffff';
  g.shadowBlur = 8;
  g.beginPath();
  g.arc(32, 32, 16, 0, Math.PI * 2);
  g.moveTo(32, 8);
  g.lineTo(32, 56);
  g.moveTo(20, 42);
  g.lineTo(32, 32);
  g.lineTo(44, 42);
  g.stroke();
  glyphs = new THREE.CanvasTexture(c);
  return glyphs;
}

/** Frees the shared rune picture. */
export function disposeRuneTexture() {
  glyphs?.dispose();
  glyphs = null;
}

export class LandmarkGlow {
  readonly group = new THREE.Group();
  private readonly motes: THREE.Sprite[] = [];
  private readonly runes: THREE.Sprite[] = [];

  /** `foot`: the middle of the picture's foot (x, ground y, z); `w`, `h`: the picture's size in world units. */
  constructor(
    private readonly foot: THREE.Vector3,
    private readonly w: number,
    private readonly h: number,
    blob: THREE.Texture,
  ) {
    const color = new THREE.Color(0.55, 1, 0.62);
    for (let i = 0; i < MOTES; i += 1)
      this.add(this.motes, new THREE.SpriteMaterial({ map: blob, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    for (let i = 0; i < RUNES.length; i += 1) {
      this.add(this.runes, new THREE.SpriteMaterial({ map: runeTexture(), color: new THREE.Color(0.6, 1, 0.7), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      const [u, v] = RUNES[i]!;
      // A point of the picture: along its width, then up the leaning card.
      const up = (1 - v) * h;
      this.runes[i]!.position.set(foot.x + (u - 0.5) * w, foot.y + up * Math.cos(TILT), foot.z + 0.06 - up * Math.sin(TILT));
      this.runes[i]!.scale.setScalar(0.5);
    }
  }

  private add(list: THREE.Sprite[], m: THREE.SpriteMaterial) {
    const s = new THREE.Sprite(m);
    list.push(s);
    this.group.add(s);
  }

  /** Poses the motes and breathes the runes at time `t` (s); `k` is the glow's strength (a little more by night). */
  update(t: number, k: number) {
    this.motes.forEach((m, i) => {
      const r = (c: number) => hash2(i + 1, 7, c);
      const f = (t * (0.05 + r(1) * 0.04) + r(2)) % 1;
      const a = r(3) * Math.PI * 2 + t * 0.12 * (r(4) - 0.5);
      const rad = this.w * (0.18 + r(5) * 0.3);
      const up = 0.4 + f * this.h * 0.55;
      m.position.set(this.foot.x + Math.cos(a) * rad, this.foot.y + up * Math.cos(TILT), this.foot.z + 0.1 + Math.sin(a) * 0.5 - up * Math.sin(TILT));
      m.scale.setScalar(0.1 + r(6) * 0.09);
      m.material.opacity = 0.85 * k * Math.sin(Math.PI * f);
    });
    this.runes.forEach((m, i) => {
      const pulse = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / (3.2 + hash2(i, 3, 9)) + i * 1.7);
      m.material.opacity = k * (0.25 + 0.5 * pulse);
    });
  }
}
