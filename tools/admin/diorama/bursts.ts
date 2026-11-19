// Small one-shot life in the diorama (G0): dust puffs at the party's feet as it walks, and rings spreading on the water (a fish, a
// frog, a footstep by the bank). Fixed pools, nothing allocated while it runs; each burst is a function of its age.
import * as THREE from 'three';

interface Burst {
  obj: THREE.Object3D;
  mat: THREE.SpriteMaterial | THREE.MeshBasicMaterial;
  born: number;
  life: number;
  x: number;
  y: number;
  z: number;
  size: number;
}

export class Bursts {
  readonly group = new THREE.Group();
  private readonly puffs: Burst[] = [];
  private readonly rings: Burst[] = [];
  private nextPuff = 0;
  private nextRing = 0;
  private now = 0;

  constructor(blob: THREE.Texture) {
    for (let i = 0; i < 28; i += 1) {
      const mat = new THREE.SpriteMaterial({ map: blob, color: 0xd8c39a, transparent: true, depthWrite: false, opacity: 0 });
      const s = new THREE.Sprite(mat);
      s.visible = false;
      this.group.add(s);
      this.puffs.push({ obj: s, mat, born: -9, life: 0.7, x: 0, y: 0, z: 0, size: 0.4 });
    }
    const ringGeo = new THREE.RingGeometry(0.86, 1, 40).rotateX(-Math.PI / 2);
    for (let i = 0; i < 18; i += 1) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 });
      const m = new THREE.Mesh(ringGeo, mat);
      m.visible = false;
      m.renderOrder = 4;
      this.group.add(m);
      this.rings.push({ obj: m, mat, born: -9, life: 1.5, x: 0, y: 0, z: 0, size: 0.8 });
    }
  }

  puff(x: number, y: number, z: number, size = 0.4) {
    const b = this.puffs[this.nextPuff++ % this.puffs.length]!;
    Object.assign(b, { born: this.now, x, y, z, size });
  }

  ripple(x: number, z: number, size = 0.8) {
    const b = this.rings[this.nextRing++ % this.rings.length]!;
    Object.assign(b, { born: this.now, x, y: -0.085, z, size });
  }

  update(t: number) {
    this.now = t;
    for (const b of this.puffs) {
      const k = (t - b.born) / b.life;
      b.obj.visible = k >= 0 && k < 1;
      if (!b.obj.visible) continue;
      b.obj.position.set(b.x + k * 0.15, b.y + 0.12 + k * 0.35, b.z);
      b.obj.scale.setScalar(b.size * (0.5 + k * 1.1));
      b.mat.opacity = 0.55 * (1 - k) * Math.min(1, k * 6);
    }
    for (const b of this.rings) {
      const k = (t - b.born) / b.life;
      b.obj.visible = k >= 0 && k < 1;
      if (!b.obj.visible) continue;
      b.obj.position.set(b.x, b.y, b.z);
      b.obj.scale.setScalar(b.size * (0.12 + k * 0.9));
      b.mat.opacity = 0.55 * (1 - k);
    }
  }
}
