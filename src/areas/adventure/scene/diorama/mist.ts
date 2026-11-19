// Đầm Sương's accent (docs/agent-loop/forest-diorama/design.md §C.6): low cold mist drifting over the water and the meadows. Flat soft
// wisps that lie just above the ground and slide across the map on a slow air, each a function of the clock and its index only. The
// party is never fogged: a wisp fades out well before it reaches the party (nothing within about three tiles of it), the bridges and
// the dirt paths are kept clear of it, and the mist thickens over water. No new art: one wispy texture drawn in code.
import * as THREE from 'three';
import type { Deck } from './decks';
import { weightsAt, type Grid } from './field';
import { hash2, rng } from './noise';

/** The box of wisps around what the camera looks at (tiles, half sizes): it wraps, so the view is never empty. */
const BOX = { x: 24, z: 15 };
/** Strength and tint of the mist at each hour (the wisps are unlit, so the tint carries the light). */
const HOUR = { day: { k: 1, tint: 0xd3e3ec }, golden: { k: 0.9, tint: 0xe6d8cf }, night: { k: 0.85, tint: 0x6e86a6 } } as const;

let wisp: THREE.Texture | null = null;
/** A wispy bank of mist: many soft overlapping streaks, long along x, fading to nothing at every edge. */
function wispTexture(): THREE.Texture {
  if (wisp) return wisp;
  const [W, H] = [256, 128];
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const r = rng(77);
  for (let i = 0; i < 26; i += 1) {
    const x = W * (0.12 + r() * 0.76);
    const y = H * (0.2 + r() * 0.6);
    const rx = 30 + r() * 60;
    const ry = 8 + r() * 16;
    g.save();
    g.translate(x, y);
    g.scale(rx, ry);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, `rgba(255,255,255,${0.3 + r() * 0.25})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, 1, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  // Fade every edge to nothing (no visible rectangle).
  g.globalCompositeOperation = 'destination-in';
  const mask = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  mask.addColorStop(0, 'rgba(255,255,255,1)');
  mask.addColorStop(0.55, 'rgba(255,255,255,0.7)');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  g.save();
  g.translate(0, H / 2);
  g.scale(1, H / W);
  g.translate(0, -H / 2);
  g.fillStyle = mask;
  g.fillRect(0, -W / 2, W, W * 2);
  g.restore();
  wisp = new THREE.CanvasTexture(c);
  wisp.colorSpace = THREE.SRGBColorSpace;
  return wisp;
}

/** Frees the shared wisp picture. */
export function disposeMistTexture() {
  wisp?.dispose();
  wisp = null;
}

interface Puff {
  mesh: THREE.Mesh;
  w: number;
  d: number;
  seed: number;
}

export class Mist {
  readonly group = new THREE.Group();
  private readonly puffs: Puff[] = [];
  private hour: (typeof HOUR)[keyof typeof HOUR] = HOUR.day;
  private readonly color = new THREE.Color();

  constructor(
    private readonly g: Grid,
    private readonly decks: readonly Deck[],
    count: number,
  ) {
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    for (let i = 0; i < count; i += 1) {
      const mat = new THREE.MeshBasicMaterial({ map: wispTexture(), transparent: true, depthWrite: false, opacity: 0, fog: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 4;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.puffs.push({ mesh, w: 8 + hash2(i, 5, 71) * 8, d: 3.6 + hash2(i, 6, 71) * 3.4, seed: i + 1 });
    }
  }

  /** The hour: the tint and strength of the mist. */
  setTime(time: 'day' | 'golden' | 'night') {
    this.hour = HOUR[time];
    this.color.set(this.hour.tint);
  }

  /** Poses the wisps at time `t` (s) around the camera's `at`, fading them away from the party `party` (both x, z in tiles). */
  update(t: number, at: THREE.Vector3, party: THREE.Vector3, ground: (x: number, z: number) => number) {
    const wrap = (v: number, c: number, size: number) => c + ((((v - c + size) % (size * 2)) + size * 2) % (size * 2)) - size;
    for (const p of this.puffs) {
      const r = (k: number) => hash2(p.seed, k, 73);
      // Drifts east-south-east at its own pace (0.22–0.5 tiles/s), swaying a little across.
      const speed = 0.22 + r(1) * 0.28;
      const x = wrap(at.x + (r(2) - 0.5) * BOX.x * 2 + t * speed, at.x, BOX.x);
      const z = wrap(at.z + (r(3) - 0.5) * BOX.z * 2 + t * speed * 0.18 + Math.sin(t * 0.13 + r(4) * 6.28) * 0.9, at.z, BOX.z);
      // Where it may show: over water in full, over open meadow thinner, little over the paths, none over a bridge or its approach.
      const [path, forest, water] = weightsAt(this.g, x, z);
      let k = (0.35 + 0.65 * Math.min(1, water * 1.6)) * (1 - 0.75 * Math.min(1, path * 1.4)) * (1 - 0.55 * Math.min(1, forest * 1.5));
      for (const dk of this.decks) {
        const dx = Math.max(0, Math.abs(x - dk.cx) - dk.w / 2);
        const dz = Math.max(0, Math.abs(z - dk.cz) - dk.d / 2);
        k *= 0.12 + 0.88 * smooth(2, 7, Math.hypot(dx, dz));
      }
      // Never near the party: the wisp's edge must be 1.5+ tiles away to show at all, fully shown beyond 5 tiles.
      const e = Math.hypot((party.x - x) / (p.w / 2), (party.z - z) / (p.d / 2));
      k *= smooth(1.5, 5, (e - 1) * Math.min(p.w, p.d) * 0.5);
      // Breathes slowly, so the banks thicken and thin as they pass.
      const breathe = 0.78 + 0.22 * Math.sin(t * (0.25 + r(5) * 0.2) + r(6) * 6.28);
      const m = p.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.8 * k * breathe * this.hour.k;
      m.color.copy(this.color);
      p.mesh.visible = m.opacity > 0.004;
      p.mesh.position.set(x, ground(x, z) + 0.28 + r(7) * 0.5, z);
      p.mesh.scale.set(p.w, 1, p.d);
      p.mesh.rotation.y = (r(8) - 0.5) * 0.4;
    }
  }
}

const smooth = (a: number, b: number, v: number): number => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
