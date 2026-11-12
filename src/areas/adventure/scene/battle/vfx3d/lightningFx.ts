// Single-target lightning effects in 3D (prototype, decision 059). `thunder_strike` (Lôi Kích): a sigil, then a bolt from the sky.
// `chain_lightning` (Chuỗi Sét): a bolt leaps from the caster and chains over three foes. `spark_peck` (Mổ Tia Điện): a quick arc.
// `lightning_dive` (Bổ Nhào): a blazing streak from the sky and a crashing bolt. Times are ms from the start of the act.
import * as THREE from 'three';
import { chestOf, mouthOf, shards } from './earthParts';
import { clamp, cloud, easeOut, rng, ripple, smooth } from './effectParts';
import { bolt, flick, glare, sigil } from './lightningParts';
import { sparks } from './metalParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const SKY = 6;

export function thunderStrike(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const goal = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const top = new THREE.Vector3(env.origin.x + 0.3, SKY, env.origin.z);
  const bolts = [bolt(root, top, goal, 171, 0xcfe0ff, 0.09), bolt(root, top, goal, 172, 0xcfe0ff, 0.09)];
  const sg = sigil(root);
  sg.mesh.position.set(goal.x, 2.8, goal.z);
  const spark = sparks(root, 70);
  const glint = glare(root);
  const ring = ripple(root, 3, 2.3, 0xffe25a, 0xffffff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const scorch = ripple(root, 1.6, 1.2, 0x302010, 0x706040);
  scorch.mesh.position.set(goal.x, 0.02, goal.z);
  return {
    update(ms) {
      sg.set(1.6 * easeOut(clamp((ms - 300) / 170)), 1.2 * easeOut(clamp((ms - 300) / 170)), ms / 1000, smooth(300, 380, ms) * (1 - smooth(470, 700, ms)));
      bolts[0]!.set(flick(ms, 470, 260));
      bolts[1]!.set(flick(ms, 640, 160) * 0.7);
      const t = (ms - 470) / 1000;
      spark.set(t, new THREE.Vector3(goal.x, 0.3, goal.z), 1.1, 0.7);
      glint(new THREE.Vector3(goal.x, 0.6, goal.z), t, 3);
      ring.set(t, smooth(0, 0.06, t) * (1 - smooth(0.35, 0.8, t)));
      scorch.set(t * 0.2, smooth(0, 0.1, t) * 0.8 * (1 - smooth(0.5, 1, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function sparkPeck(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const arcs = [bolt(root, mouth, goal, 191, 0xffe25a, 0.11, 0.6), bolt(root, mouth, goal, 192, 0xffe25a, 0.11, 0.6)];
  const spark = sparks(root, 60);
  const glint = glare(root, 0xfff0a0);
  return {
    update(ms) {
      arcs[0]!.set(flick(ms, 380, 200));
      arcs[1]!.set(flick(ms, 470, 160));
      const t = (ms - 380) / 1000;
      spark.set(t, goal, 1, 0.6);
      glint(goal, t, 2.2);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function lightningDive(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(193);
  const goal = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const top = new THREE.Vector3(env.origin.x - 0.5, SKY + 1, env.origin.z);
  const main = bolt(root, top, goal, 193, 0xcfe0ff, 0.12, 0.3);
  const streak = cloud(root, 120, 0.4, 0xfff0a0);
  const sd = Array.from({ length: streak.n }, () => [rand(), rand() - 0.5, rand() - 0.5] as const);
  const spark = sparks(root, 90, 0.14);
  const glint = glare(root);
  const ring = ripple(root, 3.2, 2.5, 0xffe25a, 0xffffff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const chips = shards(root, 14, 0.1, new THREE.MeshStandardMaterial({ color: 0x8a7a66, flatShading: true }), 193);
  return {
    update(ms) {
      for (let i = 0; i < streak.n; i++) {
        const [b, jx, jz] = sd[i]!;
        const born = 400 + b * 300;
        const age = ms - born;
        if (age < 0 || age > 260) {
          streak.pos.setXYZ(i, 0, -50, 0);
          continue;
        }
        const k = clamp((born - 400) / 300);
        streak.pos.setXYZ(i, top.x + (goal.x - top.x) * k + jx * 0.35, top.y + (0.5 - top.y) * k, goal.z + jz * 0.35);
      }
      streak.pos.needsUpdate = true;
      main.set(flick(ms, 700, 300));
      const t = (ms - 700) / 1000;
      spark.set(t, new THREE.Vector3(goal.x, 0.3, goal.z), 1.3, 0.8);
      glint(new THREE.Vector3(goal.x, 0.6, goal.z), t, 3.4);
      ring.set(t, smooth(0, 0.06, t) * (1 - smooth(0.4, 0.9, t)));
      chips.set(t, new THREE.Vector3(goal.x, 0.2, goal.z), 1.1);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
