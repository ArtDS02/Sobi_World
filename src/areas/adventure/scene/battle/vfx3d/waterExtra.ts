// The new water skills (decision 060), on the water parts. `tide_slap` (Quật Sóng): a small wave rises beside the monster and lashes
// sideways across the target, foam bursting. `whirlpool_row` (Xoáy Nước) and `great_whirlpool` (Xoáy Nước Cổ): a whirl of water stands
// up in the middle of the row and spins, drawing streams round every foe; the great one is wider and taller, white with foam, and each
// foe is swept round once (a spout bursts on each). `rising_tide` (Triều Dâng): a sheet of water swells under the ally and lifts it,
// drops falling back, then a thin water dome closes on it (healing and a shield). Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { HEAL, dome, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h, type Rgb } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { pool, surge, waveRing, whirl } from './waterParts';

const FOAM: Rgb = [1.3, 1.5, 1.7];
const SEA: Rgb = [0.35, 0.75, 1.2];
type Ctx = { root: THREE.Group; dir: number; chest: THREE.Vector3; foes: THREE.Vector3[] };
function handle(env: Vfx3dEnv, build: (x: Ctx) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const step = build({ root, dir, chest: new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z), foes: env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z)) });
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
const foam = (q: ReturnType<typeof quads>, from: number, n: number, seed: number, sec: number, at: THREE.Vector3, power = 1) =>
  burst(q, from, n, seed, { sec, at, life: 0.8, speed: 2.4 * power, up: 3.4 * power, grav: 9, drag: 1, size: 0.16, color: FOAM, to: SEA, frame: F.drop, stretch: 0.03 });

export const tideSlap = (env: Vfx3dEnv) => handle(env, ({ root, dir, chest }) => {
  const wave = surge(root);
  const drops = quads(root, Math.round(40 * env.quality), false, F.drop);
  const HIT = 320;
  return (ms, sec) => {
    // The wave runs in from the caster's side across the target, curling over on the impact.
    const k = clamp((ms - 60) / (HIT - 60 + 160));
    wave.mesh.position.set(chest.x - dir * (1.4 - 1.8 * k), 0, chest.z + 0.4);
    wave.mesh.scale.set(dir * (1.2 + env.tall * 0.5), env.tall * 0.9 * (0.5 + 0.5 * smooth(0, HIT, ms)), 1);
    wave.set(sec, smooth(60, 140, ms) * (1 - smooth(HIT + 150, HIT + 320, ms)), smooth(HIT - 100, HIT, ms));
    foam(drops, 0, drops.n, 1, (ms - HIT) / 1000, chest);
    drops.flush();
  };
});

function whirlpool(env: Vfx3dEnv, big: boolean) {
  return handle(env, ({ root, foes }) => {
    const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
    const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
    const floor = whirl(root);
    floor.mesh.rotation.x = -Math.PI / 2;
    floor.mesh.position.set(mid.x, 0.04, mid.z);
    // A low rim of water standing round the whirl (a tall one hides the foes behind it).
    const column = waveRing(root, 0.25, big ? 0.3 : 0.1);
    column.mesh.position.copy(mid);
    const streams = quads(root, Math.round((big ? 160 : 100) * env.quality), false, F.drop);
    const per = 14;
    const spouts = quads(root, foes.length * per, false, F.drop);
    const HIT = big ? 600 : 550;
    const S = big ? 1.25 : 0.9;
    return (ms, sec) => {
      const open = easeOut(clamp((ms - 100) / 400)) * (1 - smooth(HIT + 450, HIT + 700, ms));
      floor.mesh.scale.set(span * S * open, span * S * 0.5 * open, 1);
      floor.set(sec * (1.5 + smooth(200, HIT, ms)), smooth(100, 200, ms) * (1 - smooth(HIT + 500, HIT + 700, ms)), 0.4 + 0.5 * smooth(200, HIT, ms));
      column.mesh.scale.set(1, 1, 0.5);
      column.set(0.5 + span * 0.2 * S, env.tall * (big ? 0.55 : 0.35) * open, sec, 0.8 * smooth(150, 300, ms) * (1 - smooth(HIT + 300, HIT + 500, ms)));
      // Streams of water spiral round the row, rising, faster as it spins up.
      for (let i = 0; i < streams.n; i++) {
        const t = ((ms / (big ? 520 : 650)) + h(i, 0, 3)) % 1;
        const a = h(i, 1, 3) * 6.283 + t * 6;
        const r = span * 0.55 * S * (0.4 + 0.6 * h(i, 2, 3));
        const on = open * smooth(0, 0.15, t) * (1 - smooth(0.8, 1, t));
        streams.put(i, mid.x + Math.cos(a) * r, 0.1 + t * env.tall * (big ? 1.4 : 0.9), mid.z + Math.sin(a) * r * 0.45, big ? 0.17 : 0.14, i % 4 ? SEA[0] : FOAM[0], i % 4 ? SEA[1] : FOAM[1], i % 4 ? SEA[2] : FOAM[2], on * 0.9);
        streams.stretch(i, -Math.sin(a) * r * 0.2, 0.05, Math.cos(a) * r * 0.1);
        streams.look(i, F.drop, 0, 0.6);
      }
      streams.flush();
      foes.forEach((f, i) => foam(spouts, i * per, per, 10 + i, (ms - HIT - i * 90) / 1000, f, big ? 1.1 : 0.8));
      spouts.flush();
    };
  });
}
export const whirlpoolRow = (env: Vfx3dEnv) => whirlpool(env, false);
export const greatWhirlpool = (env: Vfx3dEnv) => whirlpool(env, true);

export const risingTide = (env: Vfx3dEnv) => handle(env, ({ root }) => {
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const sheet = pool(root, 1.8 + env.tall * 0.6, 1 + env.tall * 0.3);
  sheet.mesh.position.set(feet.x, 0.015, feet.z);
  const swell = waveRing(root, 0.1, 0);
  swell.mesh.position.copy(feet);
  swell.mesh.scale.set(1, 1, 0.5);
  const drops = quads(root, Math.round(30 * env.quality), false, F.drop);
  const d = dome(root, [0.5, 1, 1.5]);
  const signs = quads(root, 20, true, F.disc);
  const HIT = 350;
  return (ms, sec) => {
    const hit = ms - HIT;
    sheet.set(easeOut(clamp(ms / 300)), sec, smooth(0, 100, ms) * (1 - smooth(500, 800, hit)));
    swell.set(0.3 + env.tall * 0.15, env.tall * 0.35 * easeOut(clamp(ms / HIT)) * (1 - smooth(100, 350, hit)), sec, smooth(0, 80, ms) * (1 - smooth(250, 450, hit)));
    foam(drops, 0, drops.n, 2, (hit - 50) / 1000, new THREE.Vector3(feet.x, env.tall * 0.4, feet.z + 0.2), 0.6);
    drops.flush();
    d.mesh.position.set(feet.x, env.tall * 0.5, feet.z + 0.3);
    d.mesh.rotation.x = -0.22;
    d.mesh.scale.set(1 + env.tall * 0.55, 1 + env.tall * 0.6, 1);
    d.set(easeOutBack(clamp((hit - 80) / 220)) * 0.97, smooth(80, 140, hit) * (1 - smooth(700, 950, hit)), sec, hit > 200 ? Math.exp(-(hit - 200) / 120) : 0);
    signsUp(signs, 0, 10, 3, hit / 1000, feet, env.tall, HEAL, 'plus');
    signs.flush();
  };
});
