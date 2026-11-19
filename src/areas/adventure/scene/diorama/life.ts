// What floats and flies in the diorama (G0): fireflies (bright enough for the bloom, at dusk and night), leaves falling and turning
// in the wind, warm motes in the light by day, a few butterflies flapping over the grass. All of it lives in a box around what the
// camera looks at, so the view is never empty wherever the party goes. Pure functions of time and a seed.
import * as THREE from 'three';
import { hash2 } from './noise';
import { blobTexture, leafTexture, type Card } from './textures';

interface Mote {
  s: THREE.Sprite;
  seed: number;
  kind: 'fly' | 'leaf' | 'petal' | 'mote' | 'wing' | 'ink';
}

const BOX = { x: 17, z: 11 };

export class Life {
  readonly group = new THREE.Group();
  private readonly motes: Mote[] = [];
  private fireflies = 0;
  private daylight = 1;
  /** Dry leaves fall slower. */
  private readonly slow: number;
  private readonly ink: { x: number; z: number; r: number } | null;

  /** `mix`: which of the optional kinds show (butterflies, blossom petals) and the multiple of the falling leaves (default: all, 1). */
  constructor(
    butterfly: Card | null,
    quality: number,
    mix: { wings: boolean; petals: boolean; leaves: number; dry?: boolean; flies?: number; flakes?: number } = { wings: true, petals: true, leaves: 1 },
    ink: { x: number; y: number; r: number } | null = null,
  ) {
    this.slow = mix.dry ? 1.8 : 1;
    this.ink = ink ? { x: ink.x, z: ink.y, r: ink.r } : null;
    const blob = blobTexture();
    const leaf = leafTexture();
    const add = (kind: Mote['kind'], n: number, make: (i: number) => THREE.SpriteMaterial) => {
      for (let i = 0; i < Math.round(n * quality); i += 1) {
        const s = new THREE.Sprite(make(i));
        this.group.add(s);
        this.motes.push({ s, seed: this.motes.length + 1, kind });
      }
    };
    add('fly', 46 * (mix.flies ?? 1), () => new THREE.SpriteMaterial({ map: blob, color: new THREE.Color(2.2, 2.0, 0.75), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    const leafTones = mix.dry ? [0x8a7a5a, 0x6e6254, 0x9a7048, 0x5c5060] : [0x8fbf45, 0xc9b23a, 0x6e9e34, 0xe08a3a];
    add('leaf', 44 * mix.leaves, (i) => new THREE.SpriteMaterial({ map: leaf, color: leafTones[i % leafTones.length], transparent: true, depthWrite: false }));
    // Petals (and a few close leaves above): they drift near the camera in the gusts, so the wind shows even where the trees stand still.
    const petalTones = [0xffc4dc, 0xffffff, 0xffe2a8];
    if (mix.petals) add('petal', 26, (i) => new THREE.SpriteMaterial({ map: leaf, color: petalTones[i % petalTones.length], transparent: true, depthWrite: false }));
    // Flakes of ink that peel off the corruption's pool and rise, turning, as it breathes.
    if (ink && mix.flakes) add('ink', 26 * mix.flakes, (i) => new THREE.SpriteMaterial({ map: leaf, color: i % 3 ? 0x2a1840 : 0x7a4fb0, transparent: true, depthWrite: false }));
    add('mote', 40, () => new THREE.SpriteMaterial({ map: blob, color: new THREE.Color(1.3, 1.2, 0.9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
    if (butterfly && mix.wings) add('wing', 4, () => new THREE.SpriteMaterial({ map: butterfly.tex, transparent: true, alphaTest: 0.4 }));
  }

  /** How much of each kind shows: fireflies 0–1, daylight 0–1 (motes, butterflies). */
  setMood(fireflies: number, daylight: number) {
    this.fireflies = fireflies;
    this.daylight = daylight;
  }

  /** Poses everything for time `t` (s) around `at`; `ground` gives the floor height. */
  update(t: number, at: THREE.Vector3, wind: number, ground: (x: number, z: number) => number) {
    for (const m of this.motes) {
      const r = (k: number) => hash2(m.seed, k, 31);
      // Each mote lives in a cell of the box that wraps around the view.
      const wrap = (v: number, c: number, size: number) => c + ((((v - c + size) % (size * 2)) + size * 2) % (size * 2)) - size;
      const bx = at.x + (r(1) - 0.5) * BOX.x * 2;
      const bz = at.z + (r(2) - 0.5) * BOX.z * 2;
      if (m.kind === 'fly') {
        const x = wrap(bx + Math.sin(t * 0.3 + r(3) * 9) * 1.5, at.x, BOX.x);
        const z = wrap(bz + Math.cos(t * 0.23 + r(4) * 9) * 1.2, at.z, BOX.z);
        const pulse = Math.max(0, Math.sin(t * (1.2 + r(5)) + r(6) * 20));
        m.s.position.set(x, ground(x, z) + 0.5 + r(7) * 1.4 + Math.sin(t * 0.9 + r(8) * 6) * 0.25, z);
        m.s.scale.setScalar(0.13 + pulse * 0.09);
        m.s.material.opacity = this.fireflies * (0.25 + pulse * 0.75);
        m.s.visible = this.fireflies > 0.01;
      } else if (m.kind === 'leaf') {
        const life = (4.5 + r(3) * 3.5) * this.slow;
        const k = ((t + r(4) * life) % life) / life;
        const x = wrap(bx + k * 3 * wind + Math.sin(t * 1.3 + r(5) * 9) * 0.6, at.x, BOX.x);
        const z = wrap(bz + k * 1.2, at.z, BOX.z);
        const y = ground(x, z) + (1 - k) * (4 + r(6) * 2.5);
        m.s.position.set(x, y, z);
        const size = r(10) > 0.65 ? 0.32 : 0.2;
        m.s.scale.set(size, size * Math.abs(Math.cos(t * 2.2 + r(7) * 6)) + 0.04, 1);
        m.s.material.rotation = t * (1 + r(8)) + r(9) * 6;
        m.s.material.opacity = Math.min(1, (1 - k) * 4) * Math.min(1, k * 10);
      } else if (m.kind === 'ink' && this.ink) {
        const life = 5 + r(3) * 4;
        const k = ((t + r(4) * life) % life) / life;
        const a = r(5) * Math.PI * 2;
        const rad = this.ink.r * (0.15 + r(6) * 0.8);
        const x = this.ink.x + Math.cos(a) * rad + Math.sin(t * 0.7 + r(7) * 9) * 0.3;
        const z = this.ink.z + Math.sin(a) * rad * 0.8;
        m.s.position.set(x, ground(x, z) + 0.15 + k * (1.8 + r(8) * 1.4), z);
        const size = 0.1 + r(9) * 0.1;
        m.s.scale.set(size, size * Math.abs(Math.cos(t * 1.6 + r(7) * 6)) + 0.03, 1);
        m.s.material.rotation = t * (0.8 + r(8)) + r(9) * 6;
        m.s.material.opacity = 0.9 * Math.min(1, (1 - k) * 3) * Math.min(1, k * 8);
      } else if (m.kind === 'petal') {
        // Falls from about 3.5 units in 4–6 s, blown across with a swing, tumbling.
        const life = 4 + r(3) * 2;
        const k = ((t + r(4) * life) % life) / life;
        const x = wrap(bx + k * 4.5 * wind + Math.sin(t * 1.9 + r(5) * 9) * 0.5, at.x, BOX.x);
        const z = wrap(bz + k * 1.5 + Math.cos(t * 1.4 + r(6) * 9) * 0.3, at.z, BOX.z);
        m.s.position.set(x, ground(x, z) + (1 - k) * 3.5 + 0.3, z);
        m.s.scale.set(0.15, 0.15 * Math.abs(Math.cos(t * 3 + r(7) * 6)) + 0.03, 1);
        m.s.material.rotation = t * (1.5 + r(8)) + r(9) * 6;
        m.s.material.opacity = Math.min(1, (1 - k) * 4) * Math.min(1, k * 8) * this.daylight;
        m.s.visible = this.daylight > 0.05;
      } else if (m.kind === 'mote') {
        const x = wrap(bx + t * 0.25 * wind, at.x, BOX.x);
        const z = wrap(bz + Math.sin(t * 0.2 + r(3) * 9) * 0.8, at.z, BOX.z);
        m.s.position.set(x, ground(x, z) + 0.8 + r(4) * 2.4 + Math.sin(t * 0.5 + r(5) * 9) * 0.3, z);
        m.s.scale.setScalar(0.09 + r(6) * 0.07);
        m.s.material.opacity = 0.45 * this.daylight;
        m.s.visible = this.daylight > 0.05;
      } else {
        const x = wrap(bx + Math.sin(t * 0.21 + r(3) * 9) * 3, at.x, BOX.x);
        const z = wrap(bz + Math.sin(t * 0.17 + r(4) * 9) * 2, at.z, BOX.z);
        m.s.position.set(x, ground(x, z) + 0.9 + Math.sin(t * 1.1 + r(5) * 6) * 0.35, z);
        const flap = Math.abs(Math.sin(t * 14 + r(6) * 9));
        m.s.scale.set(0.42 * (0.25 + flap * 0.75), 0.42, 1);
        m.s.visible = this.daylight > 0.5;
      }
    }
  }
}
