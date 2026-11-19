// A flock crossing the sky of the diorama (G0, round 3): a V of small birds flapping high over the view now and then, by day and
// at dusk, each with its shadow sliding over the ground along the sun — the shadow is what the eye catches from this camera.
// A pure function of time around what the camera looks at.
import * as THREE from 'three';
import { birdTexture } from './extraArt';

const N = 7;
const PERIOD = 17;
const HEIGHT = 7.5;

export class Birds {
  readonly group = new THREE.Group();
  private readonly birds: THREE.Sprite[] = [];
  private readonly shadows: THREE.Mesh[] = [];
  private sun = new THREE.Vector3(-0.55, 1, 0.62).normalize();
  private shown = 1;

  constructor(blob: THREE.Texture) {
    const tex = birdTexture();
    const shadowMat = new THREE.MeshBasicMaterial({ map: blob, color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    for (let i = 0; i < N; i += 1) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.3 }));
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadowMat);
      this.birds.push(s);
      this.shadows.push(sh);
      this.group.add(s, sh);
    }
  }

  /** Direction toward the sun (shadows fall the other way) and whether birds fly at this hour (0–1). */
  setSky(sunDir: readonly [number, number, number], shown: number) {
    this.sun.set(...sunDir).normalize();
    this.shown = shown;
  }

  update(t: number, at: THREE.Vector3, ground: (x: number, z: number) => number) {
    const cycle = Math.floor(t / PERIOD);
    const k = (t % PERIOD) / PERIOD;
    const flying = this.shown > 0.3 && k < 0.75;
    // Each pass crosses on its own line, left to right and a little up the screen.
    const lane = Math.sin(cycle * 12.9898) * 6;
    const p = k / 0.75;
    const cx = at.x - 26 + p * 52;
    const cz = at.z + 6 + lane - p * 12;
    this.birds.forEach((s, i) => {
      const row = Math.ceil(i / 2);
      const side = i === 0 ? 0 : i % 2 ? -1 : 1;
      const x = cx - row * 1.1;
      const z = cz + side * row * 0.9;
      const y = HEIGHT + Math.sin(t * 1.3 + i) * 0.25;
      const flap = Math.abs(Math.sin(t * 9 + i * 0.7));
      s.visible = flying;
      s.position.set(x, y, z);
      s.scale.set(0.55, 0.28 * (0.35 + flap * 0.65), 1);
      s.material.rotation = -0.22;
      const sh = this.shadows[i]!;
      sh.visible = flying;
      const gy = ground(x, z);
      const run = (y - gy) / Math.max(0.2, this.sun.y);
      const sx = x - this.sun.x * run;
      const sz = z - this.sun.z * run;
      sh.position.set(sx, ground(sx, sz) + 0.05, sz);
      sh.scale.set(0.5 * (0.5 + flap * 0.5), 1, 0.22);
    });
  }
}
