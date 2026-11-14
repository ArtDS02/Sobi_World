// The new earth skills (decision 060), on the stone parts. `boulder_toss` (Ném Tảng): a boulder bigger than the monster is wrenched up,
// thrown on a high arc, and bursts on the target into chunks and dust, a crater cracking under it. `sand_veil` (Màn Cát): wind whips sand
// across the foes' row into a curtain that hangs over them (accuracy down). `boulder_roll` (Lăn Tảng): a boulder as tall as the caster
// rolls in from behind it, gathers speed, crushes over the target with a jolt, and leaves a furrow of cracks. `dust_cloud` (Mây Bụi): a
// thick cloud of dust boils up under the row and rolls over every foe. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, smooth } from './effectParts';
import { h, rise, type Rgb } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { DUST, STONE, boulder, cracks, rock, rubble } from './stoneParts';
import { shock } from './stormParts';

const SAND: Rgb = [0.86, 0.72, 0.48];
type Ctx = { root: THREE.Group; dir: number; chest: THREE.Vector3; foes: THREE.Vector3[]; mid: THREE.Vector3; span: number };
function handle(env: Vfx3dEnv, build: (x: Ctx) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const foes = env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z));
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
  const step = build({ root, dir, chest: new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z), foes, mid, span });
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export const boulderToss = (env: Vfx3dEnv) => handle(env, ({ root, dir, chest }) => {
  const stone = rock(STONE);
  const ball = new THREE.Mesh(boulder(5, 1), stone.mat);
  root.add(ball);
  const crater = cracks(root, new THREE.Vector3(chest.x, 0.02, chest.z), 2.4, 3);
  const chips = quads(root, Math.round(30 * env.quality), false, F.shard);
  const dust = quads(root, Math.round(20 * env.quality), false, F.smoke);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3, [1.2, 1, 0.8]);
  const LIFT = 250;
  const HIT = 560;
  const from = new THREE.Vector3(env.from.x + dir * 0.7, env.tall * 0.4, env.from.z);
  const R = 0.45 + env.tall * 0.3;
  return (ms, sec) => {
    const up = easeOut(clamp(ms / LIFT));
    const fly = clamp((ms - LIFT) / (HIT - LIFT));
    const p = new THREE.Vector3().copy(from).lerp(chest, fly);
    p.y = from.y + up * R * 1.3 + Math.sin(fly * Math.PI) * env.tall * 1.4 - fly * (from.y + R * 1.3 - chest.y);
    ball.position.copy(p);
    ball.rotation.set(sec * 4 * dir, sec * 2, 0);
    ball.scale.setScalar(R * (0.4 + 0.6 * up));
    ball.visible = ms < HIT;
    stone.set(smooth(0, 60, ms));
    crater(clamp((ms - HIT) / 200), ms > HIT ? 1 - smooth(500, 800, ms - HIT) : 0);
    rubble(chips, 0, chips.n, dust, 0, dust.n, 6, (ms - HIT) / 1000, chest, 1.3);
    chips.flush();
    dust.flush();
    ring((ms - HIT) / 320, ms > HIT ? 1 - smooth(160, 320, ms - HIT) : 0);
  };
});

export const sandVeil = (env: Vfx3dEnv) => handle(env, ({ root, dir, foes, mid, span }) => {
  const sand = quads(root, Math.round(140 * env.quality), false, F.smoke);
  const grains = quads(root, Math.round(80 * env.quality), false, F.streak);
  const HIT = 550;
  return (ms, sec) => {
    const live = smooth(100, 300, ms) * (1 - smooth(HIT + 500, HIT + 800, ms));
    // The curtain: puffs of sand blown in from the monster's side and hanging over the row, thickest on each foe.
    for (let i = 0; i < sand.n; i++) {
      const f = foes[i % foes.length]!;
      const arrive = clamp((ms - 100 - h(i, 0, 1) * 300) / 400);
      const x = f.x - dir * (2.5 * (1 - easeOut(arrive))) + (h(i, 1, 1) - 0.5) * 1.3 + 0.15 * Math.sin(sec * 3 + i);
      sand.put(i, x, env.tall * (0.15 + 0.8 * h(i, 2, 1)), f.z + 0.3 + (h(i, 3, 1) - 0.5) * 0.4, 0.55 + 0.4 * h(i, 4, 1), SAND[0], SAND[1], SAND[2], live * arrive * 0.38);
      sand.look(i, F.smoke, h(i, 5, 1) * 6 + sec);
    }
    sand.flush();
    for (let i = 0; i < grains.n; i++) {
      const t = ((ms / 450) + h(i, 0, 2)) % 1;
      const x = mid.x - dir * span * 0.7 + dir * span * 1.4 * t;
      grains.put(i, x, env.tall * (0.1 + 1.0 * h(i, 1, 2)), mid.z + (h(i, 2, 2) - 0.5) * 1.2, 0.22, 0.95, 0.82, 0.58, live * 0.8);
      grains.stretch(i, dir * 0.7, 0, 0);
      grains.look(i, F.streak, 0, 0.5);
    }
    grains.flush();
  };
});

export const boulderRoll = (env: Vfx3dEnv) => handle(env, ({ root, dir, chest }) => {
  const stone = rock(STONE);
  const ball = new THREE.Mesh(boulder(9, 1), stone.mat);
  root.add(ball);
  const furrow = cracks(root, new THREE.Vector3(chest.x - dir * 0.6, 0.02, chest.z), 2.6, 7);
  const chips = quads(root, Math.round(30 * env.quality), false, F.shard);
  const dust = quads(root, Math.round(30 * env.quality), false, F.smoke);
  const trail = quads(root, Math.round(30 * env.quality), false, F.smoke);
  const HIT = 520;
  const R = 0.4 + env.tall * 0.3;
  const start = new THREE.Vector3(env.from.x - dir * 0.8, R, env.from.z + 0.3);
  const end = new THREE.Vector3(chest.x + dir * 1.6, R, chest.z + 0.3);
  return (ms) => {
    // It rolls from behind the caster through the target and on, quickening; it turns as far as it rolls.
    const k = clamp((ms - 60) / (HIT - 60 + 260));
    const u = k * k * (0.6 + 0.4 * k) / 1;
    const p = new THREE.Vector3().copy(start).lerp(end, u);
    const bump = ms > HIT ? 0.12 * Math.exp(-(ms - HIT) / 80) : 0;
    ball.position.set(p.x, p.y + bump, p.z);
    ball.rotation.z = -dir * (p.x - start.x) / R;
    ball.scale.setScalar(R);
    stone.set(smooth(40, 120, ms) * (1 - smooth(HIT + 250, HIT + 400, ms)));
    rise(trail, 0, trail.n, 3, { sec: (ms - 80) / 1000, dur: 0.6, life: 0.7, at: (b) => new THREE.Vector3().copy(start).lerp(end, Math.min(1, ((b * 1000 + 80 - 60) / (HIT + 200)) ** 2)).setY(0.15), rise: 0.4, jitter: 0.3, size: 0.6, color: DUST, to: [0.5, 0.44, 0.36], frame: F.smoke, grow: 1.8, alpha: 0.4 });
    trail.flush();
    furrow(clamp((ms - HIT + 100) / 300), ms > HIT - 100 ? 1 - smooth(600, 900, ms - HIT) : 0);
    rubble(chips, 0, chips.n, dust, 0, dust.n, 8, (ms - HIT) / 1000, chest, 1.1);
    chips.flush();
    dust.flush();
  };
});

export const dustCloud = (env: Vfx3dEnv) => handle(env, ({ root, foes, mid, span }) => {
  const cloud = quads(root, Math.round(150 * env.quality), false, F.smoke);
  const rings = foes.map((f) => shock(root, new THREE.Vector3(f.x, 0, f.z), 2.4, [1.1, 0.95, 0.7]));
  const HIT = 550;
  return (ms, sec) => {
    const live = 1 - smooth(HIT + 500, HIT + 850, ms);
    for (let i = 0; i < cloud.n; i++) {
      const f = foes[i % foes.length]!;
      const born = 150 + h(i, 0, 4) * 350;
      const t = clamp((ms - born) / 500);
      const base = i < cloud.n / 3 ? mid : f;
      const x = base.x + (h(i, 1, 4) - 0.5) * (i < cloud.n / 3 ? span : 1.6);
      const y = env.tall * (0.1 + 0.9 * h(i, 2, 4)) * easeOut(t) + 0.1;
      cloud.put(i, x + 0.2 * Math.sin(sec * 2 + i), y, base.z + 0.3 + (h(i, 3, 4) - 0.5) * 0.6, (0.5 + 0.5 * h(i, 4, 4)) * (0.6 + 0.6 * t), DUST[0], DUST[1], DUST[2], ms > born ? live * 0.42 * smooth(0, 0.2, t) : 0);
      cloud.look(i, F.smoke, h(i, 5, 4) * 6 + sec * 0.5);
    }
    cloud.flush();
    foes.forEach((_f, i) => rings[i]!((ms - HIT - i * 80) / 320, ms > HIT + i * 80 ? 0.7 * (1 - smooth(160, 320, ms - HIT - i * 80)) : 0));
  };
});
