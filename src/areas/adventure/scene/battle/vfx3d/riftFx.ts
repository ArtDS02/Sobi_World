// Void skills rebuilt on the rift parts (decision 059). `void_fist` (Va Chạm Thuần): motes of space are pulled into a core of night
// before the caster, it shrinks hard (the wind-up), shoots straight at the foe leaving a tear behind it, and on the impact space
// cracks open in a star round the foe, splits its colours, throws out fragments, and closes again into silence. `void_vortex`
// (Xoáy Hư Không): a whirl of night opens on the ground under the foes' row and spins up, drawing streaks of space in and up; on
// the impact every foe in turn is cracked by it; then it collapses to a point and is gone. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, smooth } from './effectParts';
import { h, pulse } from './fxKit';
import { quads } from './quads';
import { VOID_HOT, pull, rift, shatter, voidCore } from './riftParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
type Rift = ReturnType<typeof rift>;

/** `n` rifts crossing at one point (a star-shaped crack), each turned in the picture's plane. */
function starCrack(root: THREE.Object3D, n: number, seed: number): Rift[] {
  return Array.from({ length: n }, (_, k) => {
    const r = rift(root, seed + k);
    r.mesh.rotation.set(TILT, 0, (k / n) * Math.PI + (h(k, 1, seed) - 0.5) * 0.5);
    return r;
  });
}
/** Opens the crack at `at` for an `age` (ms) after the blow: it snaps open in 60 ms, holds, closes by `close`. */
function crackAt(cr: Rift[], at: THREE.Vector3, len: number, age: number, sec: number, close = 420) {
  cr.forEach((r, k) => {
    r.mesh.position.copy(at);
    r.mesh.scale.set(len * (0.7 + 0.5 * h(k, 2, 9)), len * 0.5, 1);
    r.set(age > 0 ? clamp(age / 60) * (1 - smooth(close * 0.5, close, age)) : 0, age > 0 ? 1 - smooth(close * 0.7, close, age) : 0, sec);
  });
}

export function voidFist(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const src = new THREE.Vector3(env.from.x + dir * 0.8, env.tall * 0.6, env.from.z);
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const core = voidCore(root);
  core.mesh.rotation.x = TILT;
  const trail = rift(root, 4);
  trail.mesh.rotation.set(TILT, 0, Math.atan2(chest.y - src.y, chest.x - src.x));
  const crack = starCrack(root, 4, 11);
  const light = quads(root, Math.round(120 * env.quality) + 4, true, F.star);
  const paint = quads(root, Math.round(40 * env.quality), false, F.shard);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3.6, [0.7, 0.6, 1.6]);
  const FIRE = 300;
  const HIT = 560;
  const S = 0.6 + env.tall * 0.25;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // The core: it swells as space is pulled in, then shrinks hard before it is loosed (squash of the wind-up).
      const grow = easeOut(clamp(ms / 200)) * (1 - 0.45 * smooth(200, FIRE, ms));
      const fly = clamp((ms - FIRE) / (HIT - FIRE));
      p.copy(src).lerp(chest, fly * fly);
      core.mesh.position.copy(p);
      const squash = hit > 0 ? 1 + 1.2 * clamp(hit / 70) : 1;
      core.mesh.scale.set(S * grow * squash * (1 + 0.5 * fly), (S * grow) / squash, 1);
      core.set(sec, smooth(0, 80, ms) * (1 - smooth(20, 110, hit)), 0.42, 2);
      const n0 = Math.floor((light.n - 4) * 0.4);
      pull(light, 4, n0, 1, clamp(ms / FIRE), src, 1.6 + env.tall * 0.3);
      // The tear left behind it along the flight: it opens behind the core and closes after the blow.
      const len = src.distanceTo(chest);
      trail.mesh.position.copy(src).lerp(p, 0.5);
      trail.mesh.scale.set(Math.max(0.01, len * fly), 0.9, 1);
      trail.set(ms > FIRE ? 0.6 * (1 - smooth(0, 220, hit)) : 0, ms > FIRE ? 1 - smooth(120, 260, hit) : 0, sec);
      // The blow: a star crack, a ring torn over the ground, fragments that hang and go, glints.
      crackAt(crack, chest, 1.0 + env.tall * 0.55, hit, sec, 330);
      shatter(paint, 0, paint.n, light, 4 + n0, light.n - 4 - n0, 3, hit / 1000, chest, 1);
      for (let k = 0; k < 4; k++) light.hide(k);
      light.put(0, chest.x, chest.y, chest.z + 0.3, 1.6 * pulse(ms, HIT, 20, 90) + 0.01, VOID_HOT[0], VOID_HOT[1], VOID_HOT[2], pulse(ms, HIT, 20, 90));
      light.look(0, F.soft);
      light.flush();
      paint.flush();
      ring(hit / 360, hit > 0 ? 1 - smooth(180, 360, hit) : 0);
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
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const foes = env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z));
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
  const whirl = voidCore(root);
  whirl.mesh.rotation.x = -Math.PI / 2;
  whirl.mesh.position.set(mid.x, 0.04, mid.z);
  const cracks = foes.map((_, i) => starCrack(root, 3, 20 + i * 5));
  const rings = foes.map((f) => shock(root, new THREE.Vector3(f.x, 0, f.z), 2.8, [0.7, 0.6, 1.6]));
  const swirl = quads(root, Math.round(160 * env.quality), true, F.streak);
  const per = Math.round(24 * env.quality);
  const paint = quads(root, foes.length * per, false, F.shard);
  const glints = quads(root, foes.length * 10, true, F.star);
  const HIT = 850;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // The whirl opens, spins up, and after the blows collapses to a point with a last pulse.
      const open = easeOut(clamp((ms - 150) / 450));
      const collapse = smooth(HIT + 250, HIT + 520, ms);
      const sz = span * 0.95 * open * (1 - collapse) * (1 + 0.15 * pulse(ms, HIT, 30, 150));
      whirl.mesh.scale.set(sz, sz * 0.42, 1);
      whirl.set(sec, smooth(150, 300, ms) * (1 - smooth(HIT + 420, HIT + 560, ms)), 0.14 + 0.08 * smooth(300, HIT, ms), 2 + 3 * smooth(200, HIT, ms));
      // Streaks of space spiral in toward the middle and up (a funnel), faster as it spins up.
      const live = smooth(200, 400, ms) * (1 - collapse);
      for (let i = 0; i < swirl.n; i++) {
        const k = (((ms - 200) / 700) * (1 + 0.6 * smooth(300, HIT, ms)) + h(i, 0, 5)) % 1;
        const r = span * 0.75 * (0.35 + 0.65 * h(i, 1, 5)) * (1 - k);
        const a = h(i, 2, 5) * 6.283 + k * 5.5;
        p.set(mid.x + Math.cos(a) * r, 0.1 + k * k * env.tall * 1.4, mid.z + Math.sin(a) * r * 0.45);
        const on = ms > 200 && live > 0.01;
        swirl.put(i, p.x, p.y, p.z, on ? 0.16 : 0, VOID_HOT[0], VOID_HOT[1], VOID_HOT[2], on ? live * smooth(0, 0.15, k) * (1 - smooth(0.8, 1, k)) * 0.9 : 0);
        swirl.stretch(i, -Math.sin(a) * r * 0.25, 0.15, Math.cos(a) * r * 0.12);
        swirl.look(i, F.streak, 0, 0.5);
      }
      swirl.flush();
      // The blows: each foe cracked in turn, 60 ms apart; fragments and a ring.
      foes.forEach((f, i) => {
        const age = hit - i * 60;
        crackAt(cracks[i]!, f, 0.7 + env.tall * 0.4, age, sec, 300);
        shatter(paint, i * per, per, glints, i * 10, 10, 40 + i, age / 1000, f, 0.7);
        rings[i]!(age / 320, age > 0 ? 1 - smooth(160, 320, age) : 0);
      });
      paint.flush();
      glints.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
