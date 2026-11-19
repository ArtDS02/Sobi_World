// Rừng Sâu's accent (docs/agent-loop/forest-diorama/design.md §C.2): slanted shafts of sun that fall through gaps of the canopy, a
// warm pool of light where each lands and a few motes of dust drifting inside it. Each shaft is one additive quad along the sun's
// ray (faint, so it never reaches the bloom's threshold), swaying slowly over 8 s. A shaft fades out near the party (it never
// covers it) and none shows at night. The places come from the tile grid alone (`shaftSpots`, pure); the frame only poses them.
import * as THREE from 'three';
import type { Grid } from './field';
import { hash2 } from './noise';

export interface ShaftSpot {
  x: number;
  z: number;
  /** Width across the shaft, tiles. */
  w: number;
  phase: number;
}

/** Cell of the jittered grid the shafts are laid on (about one per cell, so any frame of the view holds several). */
const CELL = { x: 8, z: 7 };
/** Height of the shaft's top above the ground, world units (above the crowns), and how far it fades round the party, tiles. */
const RISE = 6.2;
const CLEAR = [2.4, 5] as const;
const PERIOD = 8;
/** Camera forward (the diorama's fixed 3/4 view): the shaft's quad turns to face it. */
const VIEW = new THREE.Vector3(0, -Math.sin((52 * Math.PI) / 180), -Math.cos((52 * Math.PI) / 180));

/** Where the shafts land: one in most cells of a jittered grid, on a tile (and its two side tiles) the party may stand on. Pure. */
export function shaftSpots(g: Grid): ShaftSpot[] {
  const free = (x: number, z: number) => x >= 0 && z >= 0 && x < g.cols && z < g.rows && !g.blocked[z * g.cols + x];
  const out: ShaftSpot[] = [];
  for (let cz = 0; cz * CELL.z < g.rows; cz += 1)
    for (let cx = 0; cx * CELL.x < g.cols; cx += 1) {
      if (hash2(cx, cz, 71) > 0.86) continue;
      for (let k = 0; k < 8; k += 1) {
        const x = cx * CELL.x + hash2(cx * 13 + k, cz, 72) * CELL.x;
        const z = cz * CELL.z + hash2(cx * 13 + k, cz, 73) * CELL.z;
        const [tx, tz] = [Math.floor(x), Math.floor(z)];
        if (!free(tx, tz) || !free(tx - 1, tz) || !free(tx + 1, tz)) continue;
        out.push({ x, z, w: 2.6 + hash2(cx, cz, 74) * 1.6, phase: hash2(cx, cz, 75) * Math.PI * 2 });
        break;
      }
    }
  return out;
}

let streaks: THREE.Texture | null = null;
/** The shaft's picture: soft across, fading in at the top and out at the foot, with faint lengthwise streaks. */
function streakTexture(): THREE.Texture {
  if (streaks) return streaks;
  const [w, h] = [64, 256];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const d = g.createImageData(w, h);
  for (let y = 0; y < h; y += 1) {
    const t = y / (h - 1);
    const along = Math.min(1, t / 0.14) * (1 - 0.55 * t) * Math.min(1, (1 - t) / 0.1);
    for (let x = 0; x < w; x += 1) {
      const u = x / (w - 1);
      const across = Math.sin(Math.PI * u) ** 1.7;
      const streak = 0.62 + 0.38 * Math.sin(u * 23 + hash2(Math.floor(u * 9), 3, 76) * 6);
      const i = (y * w + x) * 4;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
      d.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, along * across * streak)));
    }
  }
  g.putImageData(d, 0, 0);
  streaks = new THREE.CanvasTexture(c);
  return streaks;
}

/** Frees the shared picture (when the whole view goes). */
export function disposeShaftTexture() {
  streaks?.dispose();
  streaks = null;
}

interface Shaft {
  spot: ShaftSpot;
  beam: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  pool: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  motes: THREE.Sprite[];
  y: number;
}

export class SunShafts {
  readonly group = new THREE.Group();
  private readonly shafts: Shaft[] = [];
  private readonly sun = new THREE.Vector3(-0.5, 1, -0.3).normalize();
  private readonly across = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private strength = 1;
  private len = RISE;

  constructor(spots: readonly ShaftSpot[], blob: THREE.Texture, ground: (x: number, z: number) => number, motesEach: number) {
    const quad = new THREE.PlaneGeometry(1, 1);
    const flat = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mat = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    for (const spot of spots) {
      const y = ground(spot.x, spot.z);
      const beam = new THREE.Mesh(quad, mat(streakTexture()));
      const pool = new THREE.Mesh(flat, mat(blob));
      beam.renderOrder = pool.renderOrder = 5;
      pool.position.set(spot.x, y + 0.04, spot.z);
      pool.scale.set(spot.w * 1.5, 1, spot.w * 1.0);
      const motes = Array.from({ length: motesEach }, () => new THREE.Sprite(new THREE.SpriteMaterial({ map: blob, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })));
      this.group.add(beam, pool, ...motes);
      this.shafts.push({ spot, beam, pool, motes, y });
    }
  }

  /**
   * How bright the shafts are (0 at night: they are hidden), their colour and whether the sun is low. The real sun stands behind the
   * camera (shafts along it would be seen end-on), so the shafts lean the way the light travels across the picture: from the upper
   * left, steeper at midday, flatter at dusk.
   */
  setSun(strength: number, tint: number, low: boolean) {
    this.sun.set(low ? -0.85 : -0.5, low ? 0.8 : 1, -0.3).normalize();
    this.strength = strength;
    this.group.visible = strength > 0.01;
    this.len = Math.min(RISE / this.sun.y, 11);
    this.across.crossVectors(this.sun, VIEW).normalize();
    const n = new THREE.Vector3().crossVectors(this.across, this.sun);
    this.q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(this.across, this.sun, n));
    for (const s of this.shafts) {
      s.beam.quaternion.copy(this.q);
      s.beam.scale.set(s.spot.w, this.len, 1);
      s.beam.material.color.set(tint);
      s.pool.material.color.set(tint);
      s.motes.forEach((m) => m.material.color.set(tint));
    }
  }

  /** Poses the shafts near the camera's target for time `t` (s); `party` is where the party stands (they fade away from it). */
  update(t: number, target: THREE.Vector3, party: THREE.Vector3) {
    if (!this.group.visible) return;
    const sx = this.sun.x * this.len;
    const sz = this.sun.z * this.len;
    const wave = (Math.PI * 2) / PERIOD;
    for (const s of this.shafts) {
      const { x, z, w, phase } = s.spot;
      const near = Math.abs(x - target.x) < 21 && Math.abs(z - target.z) < 16;
      s.beam.visible = s.pool.visible = near;
      for (const m of s.motes) m.visible = near;
      if (!near) continue;
      // Distance from the party to the shaft's line on the ground (foot to top): inside the circle the shaft is gone.
      const [px, pz] = [party.x - x, party.z - z];
      const along = sx * sx + sz * sz > 1e-6 ? Math.max(0, Math.min(1, (px * sx + pz * sz) / (sx * sx + sz * sz))) : 0;
      const d = Math.hypot(px - sx * along, pz - sz * along);
      const clear = THREE.MathUtils.smoothstep(d, CLEAR[0], CLEAR[1]);
      const sway = Math.sin(t * wave + phase);
      const k = this.strength * clear;
      s.beam.position.set(x + sx / 2 + this.across.x * sway * 0.5, s.y + (this.sun.y * this.len) / 2, z + sz / 2 + this.across.z * sway * 0.5);
      s.beam.scale.x = w * (1 + 0.07 * Math.sin(t * wave * 0.5 + phase));
      s.beam.material.opacity = 0.5 * k * (0.86 + 0.14 * Math.sin(t * wave + phase * 2));
      s.pool.material.opacity = 0.5 * k;
      s.motes.forEach((m, i) => {
        const r = (c: number) => hash2(i + 1, Math.round(phase * 100), c);
        const f = (t * 0.035 + r(1)) % 1;
        const lat = (r(2) - 0.5) * w * 0.55 + Math.sin(t * 0.6 + r(3) * 9) * 0.18;
        m.position.set(x + sx * f * 0.8 + this.across.x * lat, s.y + this.sun.y * this.len * f * 0.8 + 0.4, z + sz * f * 0.8 + this.across.z * lat);
        m.scale.setScalar(0.07 + r(4) * 0.06);
        m.material.opacity = 0.75 * k * Math.sin(Math.PI * f);
      });
    }
  }
}
