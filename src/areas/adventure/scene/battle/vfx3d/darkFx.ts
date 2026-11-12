// Single-target dark effects in 3D (prototype, decision 059). `ink_spray` (Phun Mực): a blob of ink flies and splashes over the target.
// `nightmare` (Ác Mộng): a violet mask swells behind the target and a rune lock closes. `shadow_bite` (Cắn Trong Bóng Tối): the caster melts into
// shadow, jaws of darkness bite. `wraith_touch` (Chạm Hồn Ma): a pale hand reaches out of the ground and grasps. Times are ms from the start of the act.
import * as THREE from 'three';
import { chestOf, mouthOf } from './earthParts';
import { clamp, cloud, easeInOut, easeOut, easeOutBack, park, rng, ripple, smooth, sprite } from './effectParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const dark = (color: number) => new THREE.MeshStandardMaterial({ color, emissive: 0x4a1a8a, emissiveIntensity: 0.5, roughness: 0.5, flatShading: true, transparent: true });

/** Dark smoke (normal blending) that swells and rises round `at` for 900 ms from `t0`. */
function smokeAt(c: ReturnType<typeof cloud>, sd: ReturnType<typeof seeds>, ms: number, at: THREE.Vector3, t0: number, reach: number, rise = 0.8) {
  const t = (ms - t0) / 900;
  for (let i = 0; i < c.n; i++) {
    const [b, jx, jy, ph] = sd[i]!;
    if (t <= 0 || t > 1) {
      park(c, i);
      continue;
    }
    const r = (0.15 + b * 0.85) * reach * easeOut(clamp(t * 1.5));
    c.pos.setXYZ(i, at.x + Math.cos(ph) * r * 1.2, at.y - 0.3 + t * rise + jy * 0.4, at.z + Math.sin(ph) * r * 0.85 + jx * 0.2);
  }
  c.pos.needsUpdate = true;
  (c.pts.material as THREE.PointsMaterial).opacity = 0.6 * smooth(0, 0.1, t) * (1 - smooth(0.5, 1, t));
}

export function inkSpray(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(261);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const blob = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1a0a30, emissive: 0x3a1a6a, emissiveIntensity: 0.5, roughness: 0.3, transparent: true }));
  root.add(blob);
  const drips = cloud(root, 60, 0.3, 0x24123e, false, 0.95);
  const ds = seeds(drips.n, rand);
  const splat = cloud(root, 90, 0.35, 0x1a0a30, false, 0.9);
  const ss = seeds(splat.n, rand);
  const smoke = cloud(root, 60, 0.9, 0x3a2a5a, false, 0.5);
  const ms2 = seeds(smoke.n, rand);
  const puddle = ripple(root, 2.2, 1.7, 0x2a1a4a, 0x6a4aa0);
  puddle.mesh.position.set(goal.x, 0.02, goal.z);
  const at = (t: number) => {
    const e = easeInOut(clamp((t - 260) / 360));
    return new THREE.Vector3().lerpVectors(mouth, goal, e).setY(mouth.y + (goal.y - mouth.y) * e + Math.sin(Math.PI * e) * 0.5);
  };
  return {
    update(ms) {
      blob.visible = ms > 200 && ms < 620;
      blob.position.copy(ms < 260 ? mouth : at(ms));
      blob.scale.setScalar(0.28 * smooth(200, 300, ms) * (1 + 0.1 * Math.sin(ms * 0.05)));
      for (let i = 0; i < drips.n; i++) {
        const [b, jx, jy] = ds[i]!;
        const born = 280 + b * 340;
        const age = ms - born;
        if (age < 0 || age > 380) {
          park(drips, i);
          continue;
        }
        const q = at(born);
        drips.pos.setXYZ(i, q.x + jx * 0.2, q.y + jy * 0.2 - (age / 380) * 0.5, q.z);
      }
      drips.pos.needsUpdate = true;
      const t = (ms - 620) / 1000;
      for (let i = 0; i < splat.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const tt = t - b * 0.05;
        if (tt <= 0 || tt > 0.9) {
          park(splat, i);
          continue;
        }
        splat.pos.setXYZ(i, goal.x + Math.cos(ph) * (0.2 + b) * tt * 2.4, goal.y + 0.3 + (jy + 0.5) * tt * 2 - 3 * tt * tt, goal.z + Math.sin(ph) * 0.35 * tt * 2 + jx * 0.2);
      }
      splat.pos.needsUpdate = true;
      (splat.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(0.5, 0.9, t));
      smokeAt(smoke, ms2, ms, goal, 760, 0.9);
      puddle.set(t, smooth(0, 0.08, t) * (1 - smooth(0.5, 1, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function nightmare(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(263);
  const goal = chestOf(env);
  const mask = new THREE.Group();
  const mat = dark(0x3a1a5a);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 14), mat);
  face.scale.set(1, 1.25, 0.35);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc89aff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const x of [-0.32, 0.32]) {
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), eyeMat);
    e.rotation.z = Math.PI / 2 + (x > 0 ? 0.35 : -0.35);
    e.position.set(x, 0.2, 0.32);
    mask.add(e);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 6, 16, Math.PI), eyeMat);
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.35, 0.32);
  mask.add(face, mouth);
  mask.position.set(goal.x, goal.y + 0.8, goal.z - 0.6);
  root.add(mask);
  const wisps = cloud(root, 70, 0.7, 0x5a3a8a, false, 0.5);
  const ws = seeds(wisps.n, rand);
  const lockMat = new THREE.MeshBasicMaterial({ color: 0xc89aff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const lock = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.55 - i * 0.2, 0.04, 6, 32), lockMat);
    lock.add(r);
  }
  for (let i = 0; i < 6; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.05), lockMat);
    bar.rotation.z = (i / 6) * Math.PI;
    lock.add(bar);
  }
  lock.position.copy(goal);
  root.add(lock);
  const puff = cloud(root, 60, 0.8, 0x9a6ad6, false, 0.55);
  const ps = seeds(puff.n, rand);
  const ring = ripple(root, 2.4, 1.8, 0x7a4ad6, 0xd8b8ff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  return {
    update(ms) {
      const g = easeOutBack(clamp((ms - 360) / 460));
      const fade = smooth(360, 460, ms) * (1 - smooth(1000, 1250, ms));
      mask.visible = fade > 0.01;
      mask.scale.setScalar(Math.max(0.001, g * 1.2 * (1 + 0.04 * Math.sin(ms * 0.02))));
      mat.opacity = fade * 0.9;
      eyeMat.opacity = fade;
      for (let i = 0; i < wisps.n; i++) {
        const [b, jx, jy, ph] = ws[i]!;
        const a = ph + ms * 0.002 * (1 + b);
        wisps.pos.setXYZ(i, goal.x + Math.cos(a) * (0.5 + b * 1.1), goal.y + jy * 1.3 + 0.2, goal.z + Math.sin(a) * 0.5 + jx * 0.3 - 0.2);
      }
      wisps.pos.needsUpdate = true;
      (wisps.pts.material as THREE.PointsMaterial).opacity = 0.5 * smooth(360, 700, ms) * (1 - smooth(1000, 1250, ms));
      const t = (ms - 820) / 1000;
      const lk = easeOut(clamp(t / 0.2));
      lock.visible = t > 0 && t < 0.7;
      lock.scale.setScalar(Math.max(0.001, lk * 1.4));
      lock.rotation.z = t * 3;
      lockMat.opacity = smooth(0, 0.05, t) * (1 - smooth(0.4, 0.7, t));
      smokeAt(puff, ps, ms, goal, 820, 0.9);
      ring.set(t, smooth(0, 0.08, t) * (1 - smooth(0.5, 1, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function shadowBite(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(265);
  const from = new THREE.Vector3(env.from.x, 0.6, env.from.z);
  const goal = chestOf(env);
  const cloudA = cloud(root, 90, 0.9, 0x3a2a5a, false, 0.6);
  const sa = seeds(cloudA.n, rand);
  const mat = dark(0x2a1648);
  const fangMat = new THREE.MeshBasicMaterial({ color: 0xe8d8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const jaws = [1, -1].map((dir) => {
    const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.4), mat);
    g.add(bar);
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8 - Math.abs(i - 2) * 0.12, 7), fangMat);
      f.position.set(-0.52 + i * 0.26, -dir * 0.42, 0);
      f.rotation.z = dir > 0 ? Math.PI : 0;
      g.add(f);
    }
    g.position.copy(goal);
    root.add(g);
    return { g, dir };
  });
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: 0xb89aff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(flash);
  const poof = cloud(root, 60, 0.8, 0x4a3a6a, false, 0.5);
  const pd = seeds(poof.n, rand);
  const ring = ripple(root, 2.4, 1.8, 0x7a4ad6, 0xd8b8ff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  return {
    update(ms) {
      smokeAt(cloudA, sa, ms, from, 0, 0.9, 0.5);
      (cloudA.pts.material as THREE.PointsMaterial).opacity = 0.6 * smooth(0, 0.1, ms / 900) * (1 - smooth(0.5, 1, ms / 900));
      const close = easeInOut(clamp((ms - 440) / 80));
      const appear = smooth(300, 440, ms) * (1 - smooth(700, 900, ms));
      const gap = 0.1 + (1 - close) * 0.8;
      for (const j of jaws) {
        j.g.position.set(goal.x, goal.y + j.dir * gap, goal.z);
        j.g.visible = appear > 0.01;
        j.g.scale.setScalar(1.3);
      }
      mat.opacity = appear;
      fangMat.opacity = appear;
      const b = Math.exp(-Math.max(0, ms - 520) / 130) * (ms > 520 ? 1 : 0);
      flash.position.copy(goal);
      flash.scale.setScalar(Math.max(0.001, 0.8 + 2.4 * b));
      (flash.material as THREE.SpriteMaterial).opacity = b;
      smokeAt(poof, pd, ms, goal, 600, 0.7);
      ring.set((ms - 520) / 1000, smooth(0, 0.08, (ms - 520) / 1000) * (1 - smooth(0.4, 0.9, (ms - 520) / 1000)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function wraithTouch(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(267);
  const goal = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8e0ff, emissive: 0x8a9aff, emissiveIntensity: 1.2, roughness: 0.4, transparent: true, opacity: 0.9 });
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat);
  palm.scale.set(1, 0.9, 0.5);
  hand.add(palm);
  const fingers = [-0.2, -0.07, 0.07, 0.2].map((x, i) => {
    const f = new THREE.Group();
    const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.34, 3, 6), mat);
    seg.position.y = 0.2;
    f.add(seg);
    f.position.set(x, 0.15, 0);
    f.userData.i = i;
    hand.add(f);
    return f;
  });
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1, 8), mat);
  hand.scale.setScalar(2.3);
  root.add(arm, hand);
  const mist = cloud(root, 80, 0.8, 0x8a9aff, false, 0.45);
  const ms2 = seeds(mist.n, rand);
  const chill = ripple(root, 2.4, 1.8, 0x6a7aff, 0xe0e8ff);
  chill.mesh.position.set(goal.x, 0.02, goal.z);
  return {
    update(ms) {
      const rise = easeOut(clamp((ms - 300) / 330));
      const h = 1.5 * rise;
      const fade = smooth(300, 380, ms) * (1 - smooth(850, 1100, ms));
      arm.scale.set(2.2, Math.max(0.001, h), 2.2);
      arm.position.set(goal.x, h / 2, goal.z);
      hand.position.set(goal.x, h + 0.2, goal.z);
      hand.rotation.z = Math.sin(ms * 0.01) * 0.12;
      const grasp = smooth(620, 700, ms);
      for (const f of fingers) f.rotation.x = -0.5 + grasp * 1.6 - f.userData.i * 0.05;
      mat.opacity = 0.85 * fade;
      arm.visible = hand.visible = fade > 0.01;
      smokeAt(mist, ms2, ms, goal, 400, 1.1, 0.9);
      const t = (ms - 650) / 1000;
      chill.set(t, smooth(0, 0.08, t) * (1 - smooth(0.4, 0.9, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
