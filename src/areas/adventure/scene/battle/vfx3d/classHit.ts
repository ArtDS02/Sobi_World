// Class blows on one foe, rebuilt per kind (decision 059), in the caster's element colour (`$color`); each lands at its `HIT`.
// `power_cleave` (Chém Mạnh): a gleam runs along the edge, then one great crescent cleave in 70 ms with an echo, a clang and a ring
// torn over the ground. `armor_crush` (Phá Giáp): an overhead cut slams straight down and grey plates of armour burst off the foe.
// `rend_tear` (Xé Giáp): three thin rips claw across the foe one after another, flakes of armour fly. `vital_pierce` (Đòn Hiểm):
// a sighting ring closes on the foe, then a needle-thin thrust runs through it with a hard star (a vital spot). `finisher_x` (Tuyệt
// Kỹ): motes gather on the caster while it charges, then two huge cuts cross in an X on the foe, a heavy clang and a wide ring.
// `combo_slash` (Liên Hoàn): three cuts at 220 / 470 / 720, crossing back and forth, the last the widest (1-2-BANG).
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { rgbOf, sigil } from './boonParts';
import { clamp, easeOut, smooth } from './effectParts';
import { burst, gather, type Rgb } from './fxKit';
import { lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { clang, cut, type Cut } from './steelParts';
import { shock } from './stormParts';

const TILT = -0.45;
type Q = ReturnType<typeof quads>;
const colorOf = (env: Vfx3dEnv): Rgb => {
  const c = rgbOf(env.color, [0.8, 0.95, 1.3]);
  // Kept under the bloom's threshold so a cut keeps its colour instead of burning white.
  return [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85];
};
function handle(env: Vfx3dEnv, build: (root: THREE.Group, chest: THREE.Vector3, c: Rgb) => (ms: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const step = build(root, new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z), colorOf(env));
  return {
    update: (ms) => step(ms),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
/** A cut drawn over `draw` ms ending at `t`, at `at`, turned `angle`, world size `size`; it fades by `t + hold`. */
function slash(cu: Cut, ms: number, t: number, at: THREE.Vector3, angle: number, size: number, draw = 70, hold = 260) {
  cu.mesh.position.set(at.x, at.y, at.z + 0.3);
  cu.mesh.rotation.set(TILT, 0, angle);
  cu.mesh.scale.setScalar(size);
  const r = clamp((ms - t + draw) / draw);
  cu.set(r + 0.6 * smooth(t + hold * 0.4, t + hold, ms), ms > t - draw ? 1 - smooth(t + hold * 0.6, t + hold, ms) : 0);
}
/** A clang of `power` at `at` on `t`, into `q` (its whole range). */
const spray = (q: Q, ms: number, t: number, at: THREE.Vector3, power: number, seed: number) => {
  clang(q, 0, q.n, null, 0, 0, seed, (ms - t) / 1000, at, power);
  q.flush();
};

export const powerCleave = (env: Vfx3dEnv) => handle(env, (root, chest, c) => {
  const main = cut(root, c);
  const echo = cut(root, [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6]);
  const gleam = lines(root, 1);
  const sparks = quads(root, Math.round(40 * env.quality) + 2, true, F.streak);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3.4, c);
  const HIT = 280;
  const S = 1.05 + env.tall * 0.5;
  return (ms) => {
    // The gleam: a thin line of light runs along where the edge will pass, just before the cut.
    const g = smooth(HIT - 200, HIT - 120, ms) * (1 - smooth(HIT - 80, HIT - 40, ms));
    gleam.put(0, new THREE.Vector3(chest.x - S * 0.4, chest.y + S * 0.35, chest.z + 0.3), new THREE.Vector3(chest.x + S * 0.4, chest.y - S * 0.35, chest.z + 0.3), 0.03, 0.01, c[0], c[1], c[2], g);
    gleam.show(1, 1);
    gleam.flush();
    slash(main, ms, HIT, chest, -0.6, S);
    slash(echo, ms, HIT + 40, chest, -0.45, S * 0.85, 70, 220);
    spray(sparks, ms, HIT, chest, 0.5, 1);
    ring((ms - HIT) / 340, ms > HIT ? 1 - smooth(170, 340, ms - HIT) : 0);
  };
});

export const armorCrush = (env: Vfx3dEnv) => handle(env, (root, chest, c) => {
  const blow = cut(root, c);
  const sparks = quads(root, Math.round(30 * env.quality) + 2, true, F.streak);
  const plates = quads(root, Math.round(14 * env.quality), false, F.shard);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3, [1.2, 1.1, 0.9]);
  const HIT = 280;
  const S = 0.95 + env.tall * 0.45;
  return (ms) => {
    slash(blow, ms, HIT, chest, -Math.PI / 2 + 0.15, S, 60);
    spray(sparks, ms, HIT, chest, 0.45, 2);
    burst(plates, 0, plates.n, 3, { sec: (ms - HIT) / 1000, at: chest, life: 0.9, speed: 3.4, up: 3.6, grav: 11, drag: 1, size: 0.28, color: [0.78, 0.82, 0.9], to: [0.42, 0.45, 0.52], frame: F.shard, shrink: 0.8 });
    plates.flush();
    ring((ms - HIT) / 300, ms > HIT ? 1 - smooth(150, 300, ms - HIT) : 0);
  };
});

export const rendTear = (env: Vfx3dEnv) => handle(env, (root, chest, c) => {
  const rips = [0, 1, 2].map(() => cut(root, c, true));
  const sparks = quads(root, Math.round(24 * env.quality) + 2, true, F.streak);
  const flakes = quads(root, Math.round(14 * env.quality), false, F.shard);
  const HIT = 280;
  const S = 0.85 + env.tall * 0.4;
  return (ms) => {
    rips.forEach((r, k) => slash(r, ms, HIT - 80 + k * 40, new THREE.Vector3(chest.x + (k - 1) * S * 0.12, chest.y + (k - 1) * S * 0.05, chest.z), 0.75, S, 50, 240));
    spray(sparks, ms, HIT, chest, 0.35, 4);
    burst(flakes, 0, flakes.n, 5, { sec: (ms - HIT) / 1000, at: chest, life: 0.8, speed: 2.6, up: 2.6, grav: 9, drag: 1, size: 0.18, color: [0.75, 0.78, 0.86], frame: F.shard, shrink: 0.8 });
    flakes.flush();
  };
});

export const vitalPierce = (env: Vfx3dEnv) => handle(env, (root, chest, c) => {
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const sight = sigil(root, c, 4);
  sight.mesh.rotation.x = TILT;
  const needle = lines(root, 2);
  const glint = quads(root, Math.round(20 * env.quality) + 2, true, F.streak);
  const HIT = 280;
  return (ms) => {
    const k = easeOut(clamp(ms / (HIT - 40)));
    sight.mesh.position.set(chest.x, chest.y, chest.z + 0.3);
    sight.mesh.scale.setScalar((0.5 + env.tall * 0.25) * (2.4 - 1.4 * k));
    sight.set(1, smooth(0, 60, ms) * (1 - smooth(HIT - 20, HIT + 40, ms)), ms / 300);
    // The thrust: a needle of light runs through the foe from the caster's side and out the back.
    const run = clamp((ms - HIT + 40) / 60);
    const a = new THREE.Vector3(chest.x - dir * 1.4, chest.y, chest.z + 0.3);
    const b = new THREE.Vector3(chest.x - dir * 1.4 + dir * 3 * run, chest.y, chest.z + 0.3);
    const gg = ms > HIT - 40 ? 1 - smooth(HIT + 60, HIT + 200, ms) : 0;
    needle.put(0, a, b, 0.05, 0.02, c[0], c[1], c[2], gg);
    needle.put(1, a, b, 0.015, 0.008, 2, 2, 2, gg);
    needle.show(2, 1);
    needle.flush();
    spray(glint, ms, HIT, chest, 0.4, 6);
  };
});

export const finisherX = (env: Vfx3dEnv) => handle(env, (root, chest, c) => {
  const a = cut(root, c);
  const b = cut(root, c);
  const charge = quads(root, Math.round(50 * env.quality), true, F.star);
  const sparks = quads(root, Math.round(60 * env.quality) + 2, true, F.streak);
  const rings = [0, 1].map((k) => shock(root, new THREE.Vector3(chest.x, 0, chest.z), 4.5 + k * 1.5, c));
  const HIT = 280;
  const S = 1.35 + env.tall * 0.65;
  return (ms) => {
    gather(charge, 0, charge.n, 7, { k: clamp(ms / (HIT - 100)), to: new THREE.Vector3(env.from.x, env.tall * 0.6, env.from.z), radius: 1.6, turns: 1, size: 0.15, color: c, frame: F.star, tall: 1.2 });
    charge.flush();
    slash(a, ms, HIT - 40, chest, -0.75, S, 60, 320);
    slash(b, ms, HIT, chest, 0.75 + Math.PI, S, 60, 320);
    spray(sparks, ms, HIT, chest, 0.75, 8);
    rings.forEach((r, k) => r((ms - HIT - k * 90) / 420, ms > HIT + k * 90 ? 1 - smooth(210, 420, ms - HIT - k * 90) : 0));
  };
});

export const comboSlash = (env: Vfx3dEnv) => handle(env, (root, chest, c) => {
  const HITS = [220, 470, 720] as const;
  const cuts = HITS.map(() => cut(root, c));
  const sparks = HITS.map(() => quads(root, Math.round(24 * env.quality) + 2, true, F.streak));
  const S = 0.9 + env.tall * 0.42;
  return (ms) => {
    HITS.forEach((t, k) => {
      const last = k === 2;
      slash(cuts[k]!, ms, t, chest, last ? 0.05 : k ? 0.65 : -0.65, S * (last ? 1.35 : 1), 60, 220);
      spray(sparks[k]!, ms, t, chest, last ? 0.6 : 0.35, 10 + k);
    });
  };
});
