// Single-target nature effects in 3D (prototype, decision 059). `thorn_volley` (Gai Độc): thorns fly over and stick in, a poison cloud
// blooms. `vine_whip` (Quất Dây Leo): a vine lashes out and snaps back. `spore_cone` (Bào Tử Độc): a cone of spores over the target.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, cloud, easeInOut, easeOut, park, rng, ripple, smooth, sprite } from './effectParts';
import { aim, blow, seeds, setThornOpacity, thornMesh } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const mouthOf = (env: Vfx3dEnv) => new THREE.Vector3(env.from.x + (env.origin.x >= env.from.x ? 0.45 : -0.45), 0.65, env.from.z);
const chestOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, 0.55, env.origin.z);

export function thornVolley(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(101);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const thorns = Array.from({ length: 7 }, (_, i) => {
    const m = thornMesh(2.6);
    root.add(m);
    return { m, t0: 300 + i * 45, off: new THREE.Vector3((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6, (rand() - 0.5) * 0.5), arc: 0.3 + rand() * 0.4 };
  });
  const leaves = cloud(root, 90, 0.12, 0x7ccf5a, false, 0.9);
  const lseed = seeds(90, rand);
  const fog = cloud(root, 70, 0.9, 0x9a5ad8, false, 0.5);
  const fseed = seeds(70, rand);
  const drops = cloud(root, 50, 0.12, 0xb8ff70);
  const dseed = seeds(50, rand);
  const ring = ripple(root, 2.2, 1.7, 0x9a5ad8, 0xe8c8ff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const pos = (t: THREE.Vector3, k: number, th: (typeof thorns)[number]) => new THREE.Vector3().lerpVectors(mouth, goal.clone().add(th.off), k).setY(mouth.y + (goal.y + th.off.y - mouth.y) * k + Math.sin(Math.PI * k) * th.arc + t.y);
  return {
    update(ms) {
      const zero = new THREE.Vector3();
      const opacity = 1 - smooth(950, 1100, ms);
      for (const th of thorns) {
        const k = clamp((ms - th.t0) / 300);
        const p = pos(zero, easeInOut(k), th);
        const p2 = pos(zero, easeInOut(Math.min(1, k + 0.05)), th);
        th.m.visible = ms >= th.t0 && opacity > 0.01;
        th.m.position.copy(p);
        aim(th.m, p2.sub(p).add(new THREE.Vector3(0, 0.0001, 0)));
        // A flying thorn points the way it goes; one that has landed leans where it stuck.
        if (k >= 1) aim(th.m, new THREE.Vector3(goal.x - mouth.x, 0.3, goal.z - mouth.z));
      }
      setThornOpacity(opacity);
      for (let i = 0; i < leaves.n; i++) {
        const [b, jx, jy, ph] = lseed[i]!;
        const born = 300 + b * 320;
        const age = ms - born;
        if (age < 0 || age > 500) {
          park(leaves, i);
          continue;
        }
        const th = thorns[i % thorns.length]!;
        const k = clamp((born - th.t0) / 300);
        const q = pos(zero, easeInOut(k), th);
        leaves.pos.setXYZ(i, q.x + jx * 0.4, q.y + jy * 0.3 - (age / 500) * 0.5 + Math.sin(ph + age * 0.01) * 0.05, q.z + (ph - 3) * 0.04);
      }
      leaves.pos.needsUpdate = true;
      const t = (ms - 600) / 1000;
      for (let i = 0; i < fog.n; i++) {
        const [b, jx, jy, ph] = fseed[i]!;
        if (t <= 0 || t > 1) {
          park(fog, i);
          continue;
        }
        const r = (0.2 + b * 0.8) * easeOut(clamp(t * 1.4));
        fog.pos.setXYZ(i, goal.x + Math.cos(ph) * r * 1.3, 0.3 + t * 0.9 + jy * 0.5, goal.z + Math.sin(ph) * r * 0.9 + jx * 0.2);
      }
      fog.pos.needsUpdate = true;
      (fog.pts.material as THREE.PointsMaterial).opacity = 0.5 * smooth(0, 0.1, t) * (1 - smooth(0.5, 1, t));
      for (let i = 0; i < drops.n; i++) {
        const [b, jx, jy, ph] = dseed[i]!;
        const dt = t - b * 0.15;
        if (dt <= 0 || dt > 0.7) {
          park(drops, i);
          continue;
        }
        drops.pos.setXYZ(i, goal.x + Math.cos(ph) * (0.4 + jx) * dt * 2, 0.4 + (1.6 + jy * 2) * dt - 4.9 * dt * dt, goal.z + Math.sin(ph) * (0.3 + jx) * dt * 1.4);
      }
      drops.pos.needsUpdate = true;
      ring.set(t, smooth(0, 0.08, t) * (1 - smooth(0.4, 0.9, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function vineWhip(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(103);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  // The vine is one tube on an S-shaped curve from the caster to the target; how much of it is drawn is its reach.
  const pts: THREE.Vector3[] = [];
  const side = new THREE.Vector3(0, 0, 1);
  for (let j = 0; j <= 14; j++) {
    const t = j / 14;
    pts.push(new THREE.Vector3().lerpVectors(mouth, goal, t).addScaledVector(side, Math.sin(t * 9) * 0.5 * (1 - t) + 0.0).add(new THREE.Vector3(0, Math.sin(t * 6) * 0.3 * (1 - t) + 0.25 * Math.sin(Math.PI * t), 0)));
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 56, 0.1, 7);
  const mat = new THREE.MeshStandardMaterial({ color: 0x4f8a2a, emissive: 0x1a4a10, emissiveIntensity: 0.4, roughness: 0.7, flatShading: true, transparent: true });
  const vine = new THREE.Mesh(geo, mat);
  root.add(vine);
  const count = geo.index!.count;
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: 0xe8ffc0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(flash);
  const leaves = cloud(root, 60, 0.16, 0x7ccf5a, false, 0.95);
  const sd = seeds(60, rand);
  return {
    update(ms) {
      const reach = easeOut(clamp((ms - 300) / 260));
      const back = easeInOut(clamp((ms - 620) / 260));
      const from = Math.floor((back * count) / 3) * 3;
      const to = Math.floor((reach * count) / 3) * 3;
      geo.setDrawRange(from, Math.max(0, to - from));
      vine.visible = ms > 300 && ms < 900;
      mat.opacity = 1;
      const b = Math.exp(-Math.max(0, ms - 560) / 110) * (ms > 560 ? 1 : 0);
      flash.position.copy(goal);
      flash.scale.setScalar(0.6 + 1.6 * b);
      (flash.material as THREE.SpriteMaterial).opacity = b;
      const t = (ms - 560) / 1000;
      for (let i = 0; i < leaves.n; i++) {
        const [r, jx, jy, ph] = sd[i]!;
        const lt = t - r * 0.1;
        if (lt <= 0 || lt > 0.9) {
          park(leaves, i);
          continue;
        }
        leaves.pos.setXYZ(i, goal.x + Math.cos(ph) * (0.5 + jx) * lt * 2.2, goal.y + (1.4 + jy * 2) * lt - 3.2 * lt * lt, goal.z + Math.sin(ph) * (0.4 + jx) * lt * 1.5);
      }
      leaves.pos.needsUpdate = true;
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function sporeCone(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(107);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const mist = cloud(root, 100, 1.0, 0x9c6ad6, false, 0.45);
  const spores = cloud(root, 300, 0.17, 0xe0b8ff);
  const floaters = cloud(root, 60, 0.2, 0x8fe060, false, 0.9);
  const ms1 = seeds(mist.n, rand);
  const ss = seeds(spores.n, rand);
  const fs = seeds(floaters.n, rand);
  const puffs = cloud(root, 70, 0.9, 0x7a4aa8, false, 0.5);
  const ps = seeds(puffs.n, rand);
  const ring = ripple(root, 2.2, 1.7, 0x9a5ad8, 0xe8c8ff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  return {
    update(ms) {
      blow(mist, ms1, ms, mouth, goal, 350, 350, 420, 1.3);
      blow(spores, ss, ms, mouth, goal, 350, 350, 380, 0.9);
      blow(floaters, fs, ms, mouth, goal, 350, 350, 520, 1.1);
      (mist.pts.material as THREE.PointsMaterial).opacity = 0.45 * easeOut(clamp((ms - 350) / 200)) * (1 - smooth(900, 1150, ms));
      (spores.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(900, 1150, ms));
      (floaters.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(900, 1150, ms));
      const t = (ms - 700) / 1000;
      for (let i = 0; i < puffs.n; i++) {
        const [b, jx, jy, ph] = ps[i]!;
        if (t <= 0 || t > 0.9) {
          park(puffs, i);
          continue;
        }
        const r = (0.15 + b * 0.7) * easeOut(clamp(t * 1.6));
        puffs.pos.setXYZ(i, goal.x + Math.cos(ph) * r * 1.2, 0.35 + t * 0.7 + jy * 0.5, goal.z + Math.sin(ph) * r * 0.9 + jx * 0.2);
      }
      puffs.pos.needsUpdate = true;
      (puffs.pts.material as THREE.PointsMaterial).opacity = 0.5 * smooth(0, 0.08, t) * (1 - smooth(0.5, 0.9, t));
      ring.set(t, smooth(0, 0.08, t) * (1 - smooth(0.4, 0.9, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
