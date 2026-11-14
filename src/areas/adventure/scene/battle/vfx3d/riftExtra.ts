// The new void skills (decision 060), on the rift parts. `void_drain` (Chạm Hư Vô): a tear opens beside the target and a pale glint
// (one good state) is pulled out of it, sucked into the tear, and the tear seals. `rift_pulse` (Xung Khe Nứt): a black rift opens in
// the middle of the row and throbs, rings of distortion rolling out over each foe, motes pulled toward it. `null_gaze` (Ánh Nhìn
// Trống Rỗng): two rings face each other like an eye in front of the monster, a violet gaze runs through the target with its colours
// split. `void_stars` (Sao Rơi Vô Định): exactly four void stars fall onto the beat's targets in turn, 200 ms apart. `null_ward` (Kết
// Giới Trống): a clear dome with stars inside closes round every ally (a shield). Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { dome } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h } from './fxKit';
import { lines } from './lines';
import { quads } from './quads';
import { VOID, VOID_HOT, pull, rift, shatter, voidCore } from './riftParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
type Ctx = { root: THREE.Group; dir: number; src: THREE.Vector3; chest: THREE.Vector3; foes: THREE.Vector3[] };
function handle(env: Vfx3dEnv, build: (x: Ctx) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const step = build({ root, dir, src: new THREE.Vector3(env.from.x + dir * 0.7, env.tall * 0.65, env.from.z), chest: new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z), foes: env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z)) });
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export const voidDrain = (env: Vfx3dEnv) => handle(env, ({ root, dir, chest }) => {
  const tear = rift(root, 8);
  const at = new THREE.Vector3(chest.x - dir * (0.6 + env.tall * 0.25), chest.y + 0.1, chest.z + 0.2);
  tear.mesh.position.copy(at);
  tear.mesh.rotation.set(TILT, 0, Math.PI / 2 - 0.2);
  const glint = quads(root, 1 + Math.round(20 * env.quality), true, F.star);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 2.2, [0.7, 0.6, 1.6]);
  const HIT = 330;
  return (ms, sec) => {
    tear.mesh.scale.set(env.tall * 1.2, 0.8, 1);
    tear.set(easeOut(clamp(ms / 200)) * (1 - smooth(HIT + 350, HIT + 500, ms)), smooth(0, 80, ms) * (1 - smooth(HIT + 400, HIT + 550, ms)), sec);
    // The good state: a pale glint lifted off the target and drawn into the tear, shrinking.
    const k = easeOut(clamp((ms - HIT) / 330));
    const p = new THREE.Vector3().copy(chest).setZ(chest.z + 0.3).lerp(at, k);
    glint.put(0, p.x, p.y + 0.3 * Math.sin(k * Math.PI), p.z, 0.5 * (1 - 0.7 * k), 1.6, 1.5, 1.2, ms > HIT - 40 ? 1 - smooth(HIT + 280, HIT + 340, ms) : 0);
    glint.look(0, F.star, ms * 0.01);
    pull(glint, 1, glint.n - 1, 2, clamp((ms - HIT) / 400), at, 1.1);
    glint.flush();
    ring((ms - HIT) / 300, ms > HIT ? 1 - smooth(150, 300, ms - HIT) : 0);
  };
});

export const riftPulse = (env: Vfx3dEnv) => handle(env, ({ root, foes }) => {
  // The rift lies across the ground in the middle of the row (standing up, it would cover a foe).
  const mid = new THREE.Vector3(env.origin.x, 0.05, env.origin.z);
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
  const tear = rift(root, 12);
  tear.mesh.rotation.set(-Math.PI / 2 + 0.2, 0, 0.12);
  tear.mesh.position.copy(mid);
  const rings = [0, 1, 2].map(() => shock(root, new THREE.Vector3(mid.x, 0, mid.z), span * 1.3, [0.7, 0.6, 1.7]));
  const motes = quads(root, Math.round(60 * env.quality), true, F.star);
  const per = Math.round(12 * env.quality);
  const shards = quads(root, foes.length * per, false, F.shard);
  const HIT = 500;
  return (ms, sec) => {
    tear.mesh.scale.set(span * 0.9, 1.4, 1);
    tear.set((0.6 + 0.4 * Math.sin(ms * 0.03)) * easeOut(clamp((ms - 100) / 300)) * (1 - smooth(HIT + 500, HIT + 700, ms)), smooth(100, 200, ms) * (1 - smooth(HIT + 550, HIT + 750, ms)), sec);
    rings.forEach((r, k) => r((ms - HIT + 100 - k * 140) / 450, ms > HIT - 100 + k * 140 ? 0.8 * (1 - smooth(300, 450, ms - HIT + 100 - k * 140)) : 0));
    pull(motes, 0, motes.n, 3, clamp((ms - 100) / 600), mid, span * 0.6);
    motes.flush();
    foes.forEach((f, i) => shatter(shards, i * per, per, null, 0, 0, 20 + i, (ms - HIT - i * 80) / 1000, f, 0.6));
    shards.flush();
  };
});

export const nullGaze = (env: Vfx3dEnv) => handle(env, ({ root, dir, src, chest }) => {
  const eye = [0, 1].map(() => voidCore(root));
  const gaze = lines(root, 3);
  const sparks = quads(root, Math.round(24 * env.quality), true, F.star);
  const FIRE = 420;
  const HIT = 560;
  return (ms, sec) => {
    eye.forEach((e, k) => {
      e.mesh.position.set(src.x + dir * 0.15, src.y + (k ? -0.17 : 0.17), src.z + 0.1);
      e.mesh.rotation.x = TILT;
      e.mesh.scale.set(0.9 + env.tall * 0.3, (0.9 + env.tall * 0.3) * 0.45 * easeOutBack(clamp((ms - 80) / 260)), 1);
      e.set(sec, smooth(80, 160, ms) * (1 - smooth(HIT + 150, HIT + 350, ms)), 0.38, k ? -2 : 2);
    });
    const run = clamp((ms - FIRE) / (HIT - FIRE));
    const g = ms > FIRE ? 1 - smooth(HIT + 120, HIT + 300, ms) : 0;
    const to = new THREE.Vector3().copy(src).lerp(new THREE.Vector3(chest.x + dir * 0.6, chest.y, chest.z), run);
    gaze.put(0, src, to, 0.06, 0.09, VOID[0], VOID[1], VOID[2], g);
    // The split colours: a blue line just above, a magenta one just below.
    gaze.put(1, src.clone().setY(src.y + 0.06), to.clone().setY(to.y + 0.06), 0.02, 0.03, 0.4, 0.8, 1.8, g * 0.8);
    gaze.put(2, src.clone().setY(src.y - 0.06), to.clone().setY(to.y - 0.06), 0.02, 0.03, 1.6, 0.4, 1.4, g * 0.8);
    gaze.show(3, 1);
    gaze.flush();
    burst(sparks, 0, sparks.n, 4, { sec: (ms - HIT) / 1000, at: chest, life: 0.6, speed: 2, up: 0.6, grav: 0, drag: 3, size: 0.13, color: VOID_HOT, frame: F.star, alpha: 0.9 });
    sparks.flush();
  };
});

export const voidStars = (env: Vfx3dEnv) => handle(env, ({ root, foes }) => {
  const HITS = [320, 520, 720, 920] as const;
  const stars = quads(root, HITS.length * 10, true, F.star);
  const per = Math.round(10 * env.quality);
  const shards = quads(root, HITS.length * per, false, F.shard);
  const rings = HITS.map((_, k) => shock(root, new THREE.Vector3(foes[k % foes.length]!.x, 0, foes[k % foes.length]!.z), 2.4, [0.7, 0.6, 1.7]));
  return (ms) => {
    HITS.forEach((t, k) => {
      const f = foes[k % foes.length]!;
      // A star falls from high above (slanting a little), with a short tail of fading copies.
      for (let j = 0; j < 10; j++) {
        const u = clamp((ms - t + 260 - j * 14) / 260);
        const on = ms > t - 260 && ms < t ? 1 : 0;
        const p = new THREE.Vector3(f.x - 1.2 * (1 - u), f.y + env.tall * 2.4 * (1 - u), f.z);
        stars.put(k * 10 + j, p.x, p.y, p.z + 0.2, (j ? 0.55 - j * 0.04 : 1.1) * (0.8 + env.tall * 0.15), VOID[0] * 1.3, VOID[1] * 1.3, VOID[2] * 1.3, on * (j ? 0.7 * (1 - j / 10) : 1));
        stars.look(k * 10 + j, F.star, ms * 0.01);
      }
      shatter(shards, k * per, per, null, 0, 0, 30 + k, (ms - t) / 1000, f, 0.7);
      rings[k]!((ms - t) / 300, ms > t ? 1 - smooth(150, 300, ms - t) : 0);
    });
    stars.flush();
    shards.flush();
  };
});

export const nullWard = (env: Vfx3dEnv) => handle(env, ({ root }) => {
  const allies = env.targets.map((t) => new THREE.Vector3(t.x, 0, t.z));
  const domes = allies.map(() => dome(root, [0.75, 0.68, 1.6]));
  const stars = quads(root, allies.length * 10, true, F.star);
  const HIT = 470;
  return (ms, sec) => {
    allies.forEach((a, i) => {
      const t0 = HIT - 120 + i * 110;
      const d = domes[i]!;
      d.mesh.position.set(a.x, env.tall * 0.5, a.z + 0.3);
      d.mesh.rotation.x = -0.22;
      d.mesh.scale.set(1 + env.tall * 0.55, 1 + env.tall * 0.6, 1);
      d.set(easeOutBack(clamp((ms - t0) / 220)) * 0.97, smooth(t0, t0 + 60, ms) * (1 - smooth(t0 + 800, t0 + 1050, ms)), sec, ms > t0 + 120 ? Math.exp(-(ms - t0 - 120) / 120) : 0);
      // Stars twinkle inside the dome.
      for (let k = 0; k < 10; k++) {
        const on = smooth(t0 + 60, t0 + 200, ms) * (1 - smooth(t0 + 750, t0 + 1000, ms));
        stars.put(i * 10 + k, a.x + (h(k, 1, i) - 0.5) * (0.8 + env.tall * 0.4), env.tall * (0.2 + 0.7 * h(k, 2, i)), a.z + 0.35, 0.12, VOID_HOT[0], VOID_HOT[1], VOID_HOT[2], on * (0.5 + 0.5 * Math.sin(sec * 8 + k)));
        stars.look(i * 10 + k, F.star);
      }
    });
    stars.flush();
  };
});
