// Freeing what a diorama built.
import type * as THREE from 'three';

/** Frees every geometry and material under `root` (textures of the kit stay in its cache). */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((x) => x.dispose());
  });
}
