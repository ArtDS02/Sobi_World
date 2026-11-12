// Single-target metal effects in 3D (prototype, decision 059). `steel_slash` (Chém Thép): a bright cut and sparks. `armor_break` (Phá Giáp): a
// beam, then armour plates burst off. `steel_charge` (Húc Thép): a rolling blur of sparks and a crashing blow. `metal_claw` (Vuốt Thép): three
// rake marks. `bronze_fist` (Nghiền Đồng): a bronze fist falls. Times are ms from the start of the act.
import * as THREE from 'three';
import { chestOf, mouthOf, shards } from './earthParts';
import { clamp, cloud, easeInOut, easeOut, park, rng, ripple, smooth, sprite } from './effectParts';
import { bronzeMat, slashArc, sparks, steelMat } from './metalParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const flashAt = (root: THREE.Object3D, color: number) => {
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(f);
  return (at: THREE.Vector3, sec: number, size: number) => {
    const b = sec > 0 ? Math.exp(-sec / 0.11) : 0;
    f.position.copy(at);
    f.scale.setScalar(Math.max(0.001, size * (0.4 + b)));
    (f.material as THREE.SpriteMaterial).opacity = b;
    f.visible = b > 0.01;
  };
};

export function steelSlash(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const goal = chestOf(env);
  const arc = slashArc(root, 2.4, 0xa8c8ff);
  arc.mesh.position.copy(goal);
  arc.mesh.rotation.z = -0.9;
  arc.mesh.scale.setScalar(2.1);
  const spark = sparks(root, 60);
  const glint = flashAt(root, 0xffffff);
  return {
    update(ms) {
      const k = clamp((ms - 380) / 220);
      arc.set(easeOut(k), smooth(380, 420, ms) * (1 - smooth(650, 950, ms)));
      spark.set((ms - 560) / 1000, goal, 1.1, 0.7);
      glint(goal, (ms - 560) / 1000, 2.2);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function armorBreak(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(151);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const mat = steelMat();
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const len = mouth.distanceTo(goal);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 8), beamMat);
  beam.position.copy(mouth).lerp(goal, 0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), goal.clone().sub(mouth).normalize());
  root.add(beam);
  const plates = Array.from({ length: 8 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.07), mat);
    const a = (i / 8) * 6.2832;
    root.add(m);
    return { m, a, home: new THREE.Vector3(goal.x + Math.cos(a) * 0.45, goal.y + Math.sin(a) * 0.4, goal.z + 0.3), spin: (rand() - 0.5) * 10, v: 1.4 + rand() * 1.6 };
  });
  const spark = sparks(root, 80);
  const ring = ripple(root, 2.4, 1.8, 0xa8c8ff, 0xffffff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const glint = flashAt(root, 0xffffff);
  return {
    update(ms) {
      beamMat.opacity = smooth(280, 340, ms) * (1 - smooth(560, 640, ms));
      beam.visible = beamMat.opacity > 0.01;
      const lock = smooth(300, 560, ms);
      const t = (ms - 660) / 1000;
      for (const p of plates) {
        p.m.visible = ms > 400 && ms < 1500;
        if (t <= 0) {
          p.m.position.copy(p.home).multiplyScalar(1).lerp(goal.clone().setZ(p.home.z), 1 - lock);
          p.m.rotation.set(0, 0, p.a);
        } else {
          p.m.position.set(p.home.x + Math.cos(p.a) * p.v * t, p.home.y + Math.sin(p.a) * p.v * t * 0.6 + (1.2 * t - 4.9 * t * t) * 0.6, p.home.z + t * 1.2);
          p.m.rotation.set(t * p.spin, t * p.spin * 0.6, p.a);
        }
      }
      mat.opacity = smooth(400, 480, ms) * (1 - smooth(1200, 1500, ms));
      spark.set(t, goal, 1.2, 0.7);
      ring.set(t, smooth(0, 0.07, t) * (1 - smooth(0.4, 0.9, t)));
      glint(goal, t, 2.6);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function steelCharge(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(153);
  const from = new THREE.Vector3(env.from.x, 0.2, env.from.z);
  const goal = chestOf(env);
  const mat = steelMat();
  const roll = spark2(root);
  const blur = cloud(root, 120, 0.5, 0xc8d0e0, false, 0.45);
  const bs = seeds(blur.n, rand);
  const chips = shards(root, 16, 0.11, mat, 153);
  const ring = ripple(root, 3, 2.3, 0xa8c8ff, 0xffffff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const glint = flashAt(root, 0xffffff);
  const spark = sparks(root, 70);
  return {
    update(ms) {
      for (let i = 0; i < blur.n; i++) {
        const [b, jx, jy, ph] = bs[i]!;
        const born = 400 + b * 260;
        const age = ms - born;
        if (age < 0 || age > 420) {
          park(blur, i);
          continue;
        }
        const k = easeInOut(clamp((born - 400) / 260));
        blur.pos.setXYZ(i, from.x + (goal.x - from.x) * k + jx * 0.3, 0.25 + Math.abs(jy) * 0.6, from.z + (goal.z - from.z) * k + Math.sin(ph) * 0.15);
      }
      blur.pos.needsUpdate = true;
      (blur.pts.material as THREE.PointsMaterial).opacity = 0.45 * (1 - smooth(800, 1000, ms));
      const k = easeInOut(clamp((ms - 400) / 260));
      roll.set(ms > 400 && ms < 700 ? 1 : 0, new THREE.Vector3().lerpVectors(from, goal, k), ms);
      chips.set((ms - 660) / 1000, goal, 1.2);
      mat.opacity = 1 - smooth(1000, 1200, ms);
      ring.set((ms - 660) / 1000, smooth(0, 0.07, (ms - 660) / 1000) * (1 - smooth(0.4, 0.9, (ms - 660) / 1000)));
      spark.set((ms - 660) / 1000, goal, 1.3, 0.7);
      glint(goal, (ms - 660) / 1000, 2.6);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

/** A glowing ring of light that rolls with the charger (a spinning wheel of steel). */
function spark2(parent: THREE.Object3D) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 24), new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  parent.add(ring);
  return {
    set(on: number, at: THREE.Vector3, ms: number) {
      ring.visible = on > 0;
      ring.position.set(at.x, 0.55, at.z);
      ring.rotation.set(ms * 0.02, ms * 0.015, 0);
    },
  };
}

export function metalClaw(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const goal = chestOf(env);
  const marks = [0, 1, 2].map((i) => {
    const a = slashArc(root, 1.5, 0xc8dcff);
    a.mesh.position.set(goal.x + (i - 1) * 0.28, goal.y + 0.1 - (i - 1) * 0.05, goal.z);
    a.mesh.rotation.z = -1.4 + (i - 1) * 0.0;
    a.mesh.scale.set(2.6, 2.6, 1);
    return { a, t0: 400 + i * 80 };
  });
  const spark = sparks(root, 70);
  const glint = flashAt(root, 0xffffff);
  return {
    update(ms) {
      for (const { a, t0 } of marks) a.set(easeOut(clamp((ms - t0) / 140)), smooth(t0, t0 + 30, ms) * (1 - smooth(t0 + 250, t0 + 550, ms)));
      spark.set((ms - 560) / 1000, goal, 1, 0.6);
      glint(goal, (ms - 560) / 1000, 2);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function bronzeFist(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const goal = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const mat = bronzeMat();
  const fist = new THREE.Group();
  const add = (g: THREE.BufferGeometry, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    fist.add(m);
  };
  add(new THREE.BoxGeometry(1.3, 0.9, 1.0), 0, 0.6, 0);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.3, 0.7, 0.45), -0.48 + i * 0.32, 0.15, 0.4);
  add(new THREE.BoxGeometry(0.45, 0.35, 0.4), 0.7, 0.3, 0.2);
  add(new THREE.CylinderGeometry(0.42, 0.52, 0.7, 8), 0, 1.2, 0);
  fist.scale.set(1.5, 1.5, 1.5);
  root.add(fist);
  const spark = sparks(root, 90, 0.14);
  const ring = ripple(root, 3.6, 2.8, 0xd89a50, 0xfff0c0);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const glint = flashAt(root, 0xffd890);
  return {
    update(ms) {
      const k = clamp((ms - 450) / 300);
      fist.position.set(goal.x, 3.4 * (1 - k * k * k), goal.z);
      fist.visible = ms > 440 && ms < 1300;
      fist.scale.y = ms > 750 ? 1 - 0.22 * Math.exp(-(ms - 750) / 150) : 1;
      mat.opacity = smooth(440, 520, ms) * (1 - smooth(1100, 1300, ms));
      spark.set((ms - 750) / 1000, new THREE.Vector3(goal.x, 0.2, goal.z), 1.3, 0.8);
      ring.set((ms - 750) / 1000, smooth(0, 0.07, (ms - 750) / 1000) * (1 - smooth(0.4, 0.9, (ms - 750) / 1000)));
      glint(new THREE.Vector3(goal.x, 0.4, goal.z), (ms - 750) / 1000, 2.6);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
