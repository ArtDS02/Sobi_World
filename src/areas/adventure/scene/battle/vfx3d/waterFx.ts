// Water skills rebuilt on the water parts (decision 059). `bubble_shot` (Bong Bóng Nước): a bubble swells at the caster, wobbles
// across in an arc, swallows the foe for a moment and bursts into water. `bubble_spray` (Phun Bọt): a stream of small bubbles hosed
// from the monster's mouth, three bigger ones bursting on the target. `tsunami_sweep` (Sóng Thần Cổ): one great wave rears up on the
// caster's side, runs across and breaks over the foes' row; every foe gets its own spout as the water passes, then it drains away.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeInOut, easeOut, easeOut3, easeOutBack, smooth } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';
import { bubbleSkin, pool, surge, waveRing } from './waterParts';

const WATER: Rgb = [0.3, 0.7, 1];
const FOAM: Rgb = [0.9, 0.98, 1];
const SPRAY: Rgb = [0.55, 0.8, 1];
const mouth = (env: Vfx3dEnv) => new THREE.Vector3(env.from.x + (env.origin.x >= env.from.x ? 0.55 : -0.55), env.tall * 0.55, env.from.z);

export function bubbleShot(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const from = mouth(env);
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const skin = bubbleSkin();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), skin.mat);
  ball.renderOrder = 7;
  root.add(ball);
  const drops = quads(root, Math.round(150 * env.quality), false, F.drop);
  const light = quads(root, Math.round(70 * env.quality) + 12, true, F.bubble);
  const sheet = pool(root, 3.2, 2.2);
  sheet.mesh.position.set(feet.x, 0.015, feet.z);
  const ring = shock(root, feet, 3.2, [0.4, 0.8, 1.2]);
  const p = new THREE.Vector3();
  const POP = 860;
  return {
    update(ms) {
      const sec = ms / 1000;
      const swell = easeOutBack(clamp(ms / 300));
      const fly = easeInOut(clamp((ms - 300) / 420));
      p.copy(from).lerp(chest, fly);
      p.y += Math.sin(fly * Math.PI) * 1.3 + 0.08 * Math.sin(ms * 0.02);
      // Big enough to swallow the foe; it wobbles as it flies and stretches the moment before it bursts.
      const r = (0.25 + 0.3 * swell + (0.25 + env.tall * 0.3) * smooth(0.6, 1, fly)) * (1 + 0.1 * smooth(POP - 90, POP, ms));
      const wob = 0.09 * Math.sin(ms * 0.028);
      ball.position.copy(p);
      ball.scale.set(r * (1 + wob), r * (1 - wob), r);
      ball.visible = ms < POP;
      skin.set(sec, smooth(0, 120, ms));
      // Little bubbles shed along the way.
      rise(light, 12, light.n - 12, 2, { sec: sec - 0.15, dur: 0.6, life: 0.5, at: (born) => p.copy(from).lerp(chest, easeInOut(clamp((born * 1000 - 150) / 420))).setY(from.y + Math.sin(clamp((born * 1000 - 150) / 420) * Math.PI) * 1.3), rise: 0.5, jitter: 0.5, size: 0.16, color: SPRAY, frame: F.bubble, grow: 0.6, alpha: 0.9 });
      const pop = (ms - POP) / 1000;
      const g = pop >= 0 ? Math.exp(-pop / 0.08) : 0;
      light.put(0, chest.x, chest.y, chest.z, 1.4 + 2 * g, 0.9, 1.3, 1.6, g);
      light.look(0, F.star, 0.5);
      burst(light, 1, 11, 3, { sec: pop, at: chest, life: 0.5, speed: 3.5, up: 2, grav: 2, size: 0.3, color: [0.6, 0.9, 1.2], to: [0.2, 0.4, 0.7], frame: F.ring, alpha: 0.8, shrink: 1.6 });
      light.flush();
      burst(drops, 0, drops.n, 4, { sec: pop, at: chest, life: 0.85, speed: 4.2, up: 4.5, grav: 12, drag: 1.2, size: 0.17, color: FOAM, to: WATER, frame: F.drop, stretch: 0.04 });
      drops.flush();
      sheet.set(easeOut3(clamp(pop / 0.5)), sec, pop > 0 ? smooth(0, 0.08, pop) * (1 - smooth(0.3, 0.52, pop)) : 0);
      ring(pop / 0.4, pop > 0 ? 1 - smooth(0.2, 0.4, pop) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function bubbleSpray(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const from = mouth(env);
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const stream = quads(root, Math.round(110 * env.quality), false, F.bubble);
  const drops = quads(root, Math.round(120 * env.quality), false, F.drop);
  const skins = [0, 1, 2].map(() => bubbleSkin());
  const balls = skins.map((s) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), s.mat);
    m.renderOrder = 7;
    root.add(m);
    return m;
  });
  const sheet = pool(root, 2.8, 1.9);
  sheet.mesh.position.set(feet.x, 0.015, feet.z);
  const POPS = [720, 760, 800] as const;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      // The hose of small bubbles: each flies from the mouth to the target, spreading and bobbing.
      for (let i = 0; i < stream.n; i++) {
        const t = (ms - 300 - h(i, 0, 1) * 480) / 380;
        if (t <= 0 || t >= 1) {
          stream.hide(i);
          continue;
        }
        p.copy(from).lerp(chest, t);
        const wide = 0.15 + 0.7 * t;
        stream.put(i, p.x, p.y + (h(i, 1, 1) - 0.5) * wide + 0.25 * Math.sin(t * Math.PI) + 0.06 * Math.sin(ms * 0.02 + i), p.z + (h(i, 2, 1) - 0.5) * wide * 0.5, 0.14 + 0.2 * h(i, 3, 1) * (0.5 + t), SPRAY[0] * 1.3, SPRAY[1] * 1.15, 1, 0.95 * smooth(0, 0.1, t) * (1 - smooth(0.85, 1, t)));
      }
      stream.flush();
      const each = Math.floor(drops.n / 3);
      POPS.forEach((t, i) => {
        const fly = clamp((t - ms) / 300);
        p.copy(chest).lerp(from, fly * 0.7);
        p.y += (i - 1) * 0.3 + Math.sin(fly * Math.PI) * 0.4;
        p.x += (i - 1) * 0.12;
        const r = 0.2 + 0.14 * i + 0.1 * (1 - fly);
        balls[i]!.position.copy(p);
        balls[i]!.scale.setScalar(r * (1 + 0.08 * Math.sin(ms * 0.03 + i)));
        balls[i]!.visible = ms > t - 320 && ms < t;
        skins[i]!.set(sec + i, 1);
        p.copy(chest).setY(chest.y + (i - 1) * 0.3);
        burst(drops, i * each, each, 5 + i, { sec: (ms - t) / 1000, at: p, life: 0.7, speed: 3 + i * 0.5, up: 3.6, grav: 12, size: 0.14, color: FOAM, to: WATER, frame: F.drop, stretch: 0.035 });
      });
      drops.flush();
      const k = (ms - 720) / 1000;
      sheet.set(easeOut3(clamp(k / 0.45)), sec, k > 0 ? smooth(0, 0.08, k) * (1 - smooth(0.3, 0.52, k)) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

const CRASH = 1050;

export function tsunamiSweep(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const q = env.quality;
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const row = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const far = Math.max(...env.targets.map((t) => (t.x - env.from.x) * dir));
  const x0 = env.from.x + dir * 0.8;
  const x1 = env.from.x + dir * (far + 1.6);
  const wave = surge(root);
  const back = surge(root);
  const drops = quads(root, Math.round(360 * q), false, F.drop);
  const mist = quads(root, Math.round(120 * q), true, F.foam);
  const sheet = pool(root, (far + 3.5) * 1.2, 3.4);
  sheet.mesh.position.set((x0 + x1) / 2, 0.015, row.z);
  // The wave reaches the foes in the order they stand along its way.
  const hits = env.targets.map((t) => ({ p: t.clone().setY(0), d: (t.x - env.from.x) * dir })).sort((a, b) => a.d - b.d).map((x, i) => ({ ...x, t: CRASH + i * 90, spout: waveRing(root, 0.5, 1) }));
  hits.forEach((x) => x.spout.mesh.position.copy(x.p));
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      // Rears up beside the caster (the water drawn back first), runs, towers over the row, breaks.
      const rear = easeOut(clamp((ms - 250) / 450));
      const run = clamp((ms - 620) / (CRASH + 180 - 620));
      const x = x0 + (x1 - x0) * run * run * (3 - 2 * run);
      const broke = smooth(CRASH, CRASH + 420, ms);
      const H = (0.6 + 2.6 * rear) * (1 - 0.8 * broke) * (1 + 0.05 * Math.sin(ms * 0.02));
      const L = 3.6 + 2.2 * run;
      wave.mesh.position.set(x, 0, row.z + 0.25);
      wave.mesh.scale.set(L * dir, H, 1);
      wave.set(sec, smooth(250, 420, ms) * (1 - smooth(CRASH + 150, CRASH + 480, ms)), smooth(500, CRASH, ms));
      // A second, lower swell behind it gives the wave depth.
      back.mesh.position.set(x - dir * 0.9, 0, row.z - 0.5);
      back.mesh.scale.set(L * 0.8 * dir, H * 0.7, 1);
      back.set(sec + 3, 0.6 * smooth(320, 500, ms) * (1 - smooth(CRASH + 100, CRASH + 400, ms)), smooth(600, CRASH, ms) * 0.6);
      // Spray off the crest while it runs; the crash throws water up along the whole row.
      const crestN = Math.floor(mist.n * 0.6);
      rise(mist, 0, crestN, 1, { sec: sec - 0.35, dur: 0.85, life: 0.4, at: (born) => { const r = clamp((born * 1000 + 350 - 620) / (CRASH + 180 - 620)); return p.set(x0 + (x1 - x0) * r * r * (3 - 2 * r), (0.6 + 2.6 * easeOut(clamp((born * 1000 + 100) / 450))) * 0.9, row.z + 0.3); }, rise: 0.8, jitter: 0.7, size: 0.5, color: [0.5, 0.7, 0.85], to: [0.1, 0.2, 0.3], frame: F.foam, grow: 1.5, alpha: 0.5 });
      rise(mist, crestN, mist.n - crestN, 2, { sec: (ms - CRASH - 250) / 1000, dur: 0.6, life: 0.8, at: (_b, k) => p.set(x0 + (x1 - x0) * h(k, 8, 2), 0.2, row.z + (h(k, 9, 2) - 0.5) * 1.6), rise: 0.9, jitter: 0.3, size: 0.8, color: [0.25, 0.4, 0.5], to: [0.05, 0.1, 0.15], frame: F.smoke, grow: 1.8, alpha: 0.45 });
      mist.flush();
      const each = Math.floor(drops.n / (hits.length + 1));
      burst(drops, 0, each, 3, { sec: (ms - CRASH) / 1000, at: p.set(row.x, 0.3, row.z), life: 1.1, speed: 5.5, up: 7.5, grav: 13, drag: 1, size: 0.2, color: FOAM, to: WATER, frame: F.drop, stretch: 0.045, spread: 0.12 });
      hits.forEach((hit, i) => {
        const k = (ms - hit.t) / 650;
        hit.spout.set(0.18 + 0.3 * easeOut(clamp(k)), (0.7 + 0.5 * env.tall) * Math.sin(Math.PI * clamp(k) ** 0.6), sec + i, k > 0 && k < 1 ? smooth(0, 0.1, k) * (1 - smooth(0.6, 1, k)) : 0);
        burst(drops, (i + 1) * each, each, 10 + i, { sec: (ms - hit.t) / 1000, at: p.set(hit.p.x, 0.2, hit.p.z), life: 0.9, speed: 2.4, up: 6.5, grav: 13, size: 0.17, color: FOAM, to: WATER, frame: F.drop, stretch: 0.04, wide: 0.7 });
      });
      drops.flush();
      // The water left behind: a sheet that spreads under the row and drains back.
      const k = (ms - CRASH + 150) / 1000;
      sheet.set(easeOut3(clamp(k / 0.6)) * (1 - 0.35 * smooth(0.8, 1.2, k)), sec, k > 0 ? smooth(0, 0.12, k) * (1 - smooth(0.85, 1.25, k)) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
