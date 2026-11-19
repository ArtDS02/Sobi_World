// What bars a shut way in the diorama (a closed exit, a gate not yet opened): the picture the 2D map draws for it (by id through the
// resolver), two clumps per blocked tile so the barrier fills the way and never spills more than a quarter tile past it, each clump
// with dark ember-red thorns poking out of its top and sides. It is never cut by the see-through circle: it is what the party must see
// bars the way. Code only, no new art.
import * as THREE from 'three';
import { TILT, cardBatch, type CardUniforms, type Placed } from './cards';
import { hash2 } from './noise';
import type { Card } from './textures';

/** Width of one clump, tiles: a tile and a quarter on each side at most. */
const CLUMP_W = 1.5;
/** Clumps stand a little taller than the picture's own shape: about the leader's height, so the wall reads from afar. */
const STRETCH = 1.25;
const THORN = new THREE.ConeGeometry(0.045, 0.3, 4).translate(0, 0.15, 0);

/** A barrier over the tiles of `r` (x, y, w, h in tiles), each clump a copy of `picture`. */
export function buildBarrier(picture: Card, r: { x: number; y: number; w: number; h: number }, u: CardUniforms, ground: (x: number, z: number) => number, seed: number, stretch = STRETCH): THREE.Group {
  const group = new THREE.Group();
  const card: Card = { ...picture, aspect: picture.aspect / stretch };
  const items: Placed[] = [];
  for (let ty = r.y; ty < r.y + r.h; ty += 1)
    for (let tx = r.x; tx < r.x + r.w; tx += 1) {
      // Two clumps a tile, one behind the other, so the wall is thick from the camera's side too.
      for (const [row, dz] of [[0, 0.42], [1, 0.88]] as const) {
        const k = hash2(tx * 2 + row, ty, seed);
        const x = tx + 0.5 + (k - 0.5) * 0.14;
        const z = ty + dz;
        items.push({ x, z, y: ground(x, z), h: (CLUMP_W - k * 0.2) / card.aspect, flip: k < 0.5 });
      }
    }
  // Slightly reddened, so a bramble barrier does not melt into the green bushes of the woods around it.
  const wall = cardBatch(card, items, u, { sway: 0.15, tilt: TILT }, 0xf6e0d4);
  // No shadow falls on it: a tree's moon shadow over a clump made a black column in the wall by night, and the barrier must always read.
  wall.traverse((o) => void (o.receiveShadow = false));
  group.add(wall);
  // Ember thorns: dark red-brown, smouldering faintly of their own (a fire bramble), the same by day and by night.
  const thorn = new THREE.MeshLambertMaterial({ color: 0x5a2014, emissive: 0x4a0c02 });
  const thorns: THREE.Matrix4[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  items.forEach((it, i) => {
    const w = it.h * card.aspect;
    // Thorns round the upper outline of the clump, in the leaning plane of the picture, pointing outward.
    for (let j = 0; j < 9; j += 1) {
      const a = Math.PI * (0.05 + (0.9 * (j + hash2(i, j, seed + 1))) / 9);
      const ox = Math.cos(a) * w * 0.42;
      const oy = it.h * (0.42 + Math.sin(a) * 0.4);
      e.set(-TILT, 0, a - Math.PI / 2 + (hash2(i, j, seed + 2) - 0.5) * 0.5);
      q.setFromEuler(e);
      const s = 0.7 + hash2(i, j, seed + 3) * 0.6;
      thorns.push(new THREE.Matrix4().compose(new THREE.Vector3(it.x + ox, it.y + oy * Math.cos(TILT), it.z + 0.04 - oy * Math.sin(TILT)), q, one.clone().multiplyScalar(s)));
    }
  });
  const spikes = new THREE.InstancedMesh(THORN, thorn, thorns.length);
  thorns.forEach((t, i) => spikes.setMatrixAt(i, m.copy(t)));
  spikes.instanceMatrix.needsUpdate = true;
  group.add(spikes);
  return group;
}
