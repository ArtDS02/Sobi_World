// Void effects in 3D (prototype, decision 059). `void_fist` (Va Chạm Thuần): a rift opens at the caster and a fist of void flies out and strikes.
// `void_vortex` (Xoáy Hư Không): a vortex spins over the row and pulls it in, then bursts. `sky_bell` (Bầu Trời Trong Chuông): a great bell falls over
// the row and tolls three times, each toll a ring, then the sky breaks. `mythic_awakening` (Huyền Thoại Thức Tỉnh): a spirit circle opens behind the
// caster and four coloured beams strike the row, then stars rain on the team. Times are ms from the start of the act.
import * as THREE from 'three';
import { chestOf } from './earthParts';
import { clamp, cloud, easeOut, park, rng, ripple, smooth } from './effectParts';
import { glare } from './lightningParts';
import { sparks } from './metalParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

export const add = (color: number) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
export const VOID = 0x9a6aff;

/** A tilted ring of light with a dark heart: a rift. */
function rift(parent: THREE.Object3D, radius: number) {
  const g = new THREE.Group();
  const ringMat = add(0xc8a8ff);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.1, 8, 40), ringMat);
  const heartMat = new THREE.MeshBasicMaterial({ color: 0x05020c, transparent: true, depthWrite: false });
  const heart = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.92, 28), heartMat);
  g.add(heart, ring);
  g.visible = false;
  parent.add(g);
  return {
    g,
    set(open: number, fade: number, ms: number) {
      g.visible = fade > 0.01 && open > 0.01;
      g.scale.setScalar(Math.max(0.001, open));
      ring.rotation.z = ms * 0.004;
      ringMat.opacity = fade;
      heartMat.opacity = 0.9 * fade;
    },
  };
}

export function voidFist(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const from = new THREE.Vector3(env.from.x + dir * 0.7, 0.7, env.from.z);
  const goal = chestOf(env);
  const r = rift(root, 0.55);
  r.g.position.copy(from);
  r.g.rotation.y = Math.PI / 2 * 0.8;
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a1a5a, emissive: 0x7a4aff, emissiveIntensity: 0.9, roughness: 0.4, transparent: true });
  const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), mat);
  root.add(fist);
  const trail = cloud(root, 60, 0.3, VOID);
  const ts = seeds(trail.n, rng(281));
  const sp = sparks(root, 70);
  const glint = glare(root, 0xc8a8ff);
  const ring = ripple(root, 2.6, 2, VOID, 0xe8d8ff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const ring2 = ripple(root, 4, 3, 0x7a4ad6, 0xd8b8ff);
  ring2.mesh.position.set(goal.x, 0.02, goal.z);
  const at = (t: number) => new THREE.Vector3().lerpVectors(from, goal, easeOut(clamp((t - 300) / 260)));
  return {
    update(ms) {
      r.set(easeOut(clamp(ms / 280)), smooth(0, 120, ms) * (1 - smooth(480, 760, ms)), ms);
      fist.visible = ms > 280 && ms < 580;
      fist.position.copy(at(ms));
      fist.rotation.set(ms * 0.02, ms * 0.015, 0);
      fist.scale.setScalar(0.8 + 0.4 * smooth(280, 560, ms));
      for (let i = 0; i < trail.n; i++) {
        const [b, jx, jy] = ts[i]!;
        const born = 300 + b * 260;
        const age = ms - born;
        if (age < 0 || age > 300) {
          park(trail, i);
          continue;
        }
        const q = at(born);
        trail.pos.setXYZ(i, q.x + jx * 0.3, q.y + jy * 0.3, q.z);
      }
      trail.pos.needsUpdate = true;
      (trail.pts.material as THREE.PointsMaterial).opacity = 0.9;
      const t = (ms - 560) / 1000;
      sp.set(t, goal, 1.2, 0.7);
      glint(goal, t, 3);
      ring.set(t, smooth(0, 0.06, t) * (1 - smooth(0.35, 0.8, t)));
      ring2.set(t - 0.06, smooth(0, 0.06, t) * (1 - smooth(0.4, 0.9, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function voidVortex(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(283);
  const spread = Math.min(2.4, env.unit);
  const o = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const spin = cloud(root, 260, 0.26, VOID);
  const ss = seeds(spin.n, rand);
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0x05020c, transparent: true }));
  root.add(heart);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 36), add(0xc8a8ff));
  halo.rotation.x = Math.PI / 2;
  root.add(halo);
  const disk = ripple(root, 5 * spread + 1, 3.2 * spread + 0.8, VOID, 0xe8d8ff);
  disk.mesh.position.set(o.x, 0.02, o.z);
  const burst = cloud(root, 120, 0.22, 0xe0c8ff);
  const bs = seeds(burst.n, rand);
  const glint = glare(root, 0xc8a8ff);
  return {
    update(ms) {
      const grow = easeOut(clamp((ms - 350) / 400)) * (1 - smooth(900, 1100, ms));
      heart.position.set(o.x, 1.2, o.z);
      heart.scale.setScalar(Math.max(0.001, grow * (1 + 0.3 * smooth(700, 850, ms))));
      halo.position.copy(heart.position);
      halo.scale.setScalar(Math.max(0.001, grow * 1.8));
      halo.rotation.z = ms * 0.01;
      (halo.material as THREE.Material).opacity = grow;
      heart.visible = grow > 0.01;
      for (let i = 0; i < spin.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const k = clamp((ms - 350) / 500);
        const rad = (0.4 + b * 2.4) * spread * (1 - 0.7 * smooth(500, 850, ms)) * easeOut(k);
        const a = ph + ms * 0.006 * (1 + (1 - b)) + rad * 0.8;
        if (ms < 350 || ms > 1100) park(spin, i);
        else spin.pos.setXYZ(i, o.x + Math.cos(a) * rad * 1.2, 1.2 + jy * 1.4 * (1 - b) + Math.sin(ms * 0.004 + ph) * 0.1, o.z + Math.sin(a) * rad * 0.7 + jx * 0.1);
      }
      spin.pos.needsUpdate = true;
      (spin.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(950, 1100, ms));
      const t = (ms - 850) / 1000;
      for (let i = 0; i < burst.n; i++) {
        const [b, jx, jy, ph] = bs[i]!;
        const tt = t - b * 0.05;
        if (tt <= 0 || tt > 0.8) park(burst, i);
        else burst.pos.setXYZ(i, o.x + Math.cos(ph) * (0.5 + b) * tt * 4 * spread, 1.2 + jy * tt * 3, o.z + Math.sin(ph) * (0.4 + b) * tt * 2.2 + jx * 0.2);
      }
      burst.pos.needsUpdate = true;
      (burst.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(0.4, 0.8, t));
      disk.set((ms - 350) / 1000 + 0.2, smooth(350, 550, ms) * (1 - smooth(1100, 1500, ms)));
      glint(new THREE.Vector3(o.x, 1.2, o.z), t, 4);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
