// A pool of the corruption's ink under a boss (Lõi Rừng): a soft dark-violet patch with a faint purple ring that breathes, so the boss
// stands out of the grey ground. Code only, lies on the ground, never over the party.
import * as THREE from 'three';

export class InkPool {
  readonly group = new THREE.Group();
  private readonly ring: THREE.Mesh;

  /** `x`, `z`: the boss's foot (tiles); `y`: the ground height there. */
  constructor(blob: THREE.Texture, x: number, y: number, z: number) {
    const flat = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const dark = new THREE.Mesh(flat, new THREE.MeshBasicMaterial({ map: blob, color: 0x120620, transparent: true, opacity: 0.95, depthWrite: false }));
    dark.scale.set(5.6, 1, 3.6);
    dark.renderOrder = 3;
    this.ring = new THREE.Mesh(flat, new THREE.MeshBasicMaterial({ map: blob, color: 0x7a4fb0, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.ring.scale.set(7, 1, 4.4);
    this.ring.renderOrder = 2;
    this.group.add(this.ring, dark);
    this.group.position.set(x, y + 0.06, z);
  }

  /** Breathes the ring on the ink's slow 3 s pulse. */
  update(t: number) {
    (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.14 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2.0944));
  }
}
