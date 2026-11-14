// Team buffs, rebuilt per kind (decision 059); each ally is reached in turn from `HIT`, 110 ms apart, with chevrons in the colours
// of the stats raised. `ink_veil` (Màn Mực, dark): a veil of ink mist drifts over each ally and thins away (evasion up).
// `guiding_lamp` (Đèn Dẫn Lối, light): a lantern of light floats up over the team and casts a beam onto each ally (accuracy and
// magic attack up). `swift_bolt` (Tốc Lôi, lightning): sparks crawl up each ally and yellow streaks run off behind it (speed up).
// `rally_wave` (Khích Lệ): a ring of warm light pulses out from the caster through the team and each ally flares (attack and
// magic attack up). `howl_wave` (Tru Lên) and `roar_wave` (Tiếng Gầm Rồng): rings of sound roll out of the monster's mouth over
// its side, red chevrons on each; the roar is wider, with embers, and lifts the roarer's magic attack too.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { ACC, ATK, EVA, MATK, SPD, rgbOf, signsUp } from './boonParts';
import { clamp, easeOut, smooth } from './effectParts';
import { HOT } from './flameParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { GOLD, SUN, halo } from './glowParts';
import { forked, lines } from './lines';
import { quads } from './quads';
import { murk } from './shadeParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { BOLT, shock } from './stormParts';

const TILT = -0.45;
const GAP = 110;
const team = (env: Vfx3dEnv) => env.targets.map((t) => new THREE.Vector3(t.x, 0, t.z));
function handle(env: Vfx3dEnv, build: (root: THREE.Group, allies: THREE.Vector3[]) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const step = build(root, team(env));
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
/** Chevrons of one or two stats on every ally (16 particles a stat a unit). */
function teamUp(q: ReturnType<typeof quads>, ms: number, hit: number, allies: THREE.Vector3[], tall: number, a: Rgb, b: Rgb | null, seed: number) {
  allies.forEach((f, i) => {
    const age = ms - hit - i * GAP;
    signsUp(q, i * 32, 8, seed + i, age / 1000, f, tall, a, 'up');
    if (b) signsUp(q, i * 32 + 16, 8, seed + 10 + i, (age - 90) / 1000, f, tall, b, 'up');
    else for (let k = 16; k < 32; k++) q.hide(i * 32 + k);
  });
  q.flush();
}

export const inkVeil = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const veils = allies.map((_, i) => {
    const m = murk(root, 3 + i, 4);
    m.mesh.rotation.x = TILT;
    return m;
  });
  const signs = quads(root, allies.length * 32, true, F.disc);
  const HIT = 300;
  return (ms, sec) => {
    allies.forEach((f, i) => {
      const age = ms - HIT - i * GAP;
      // The veil drifts across the ally (from its side), thin enough to see through, and frays away.
      const v = veils[i]!;
      v.mesh.position.set(f.x + 0.6 * (1 - easeOut(clamp((age + 250) / 300))), env.tall * 0.55, f.z + 0.25);
      v.mesh.scale.set(0.9 + env.tall * 0.45, 0.9 + env.tall * 0.5, 1);
      v.set(sec, age > -250 ? 0.45 * smooth(-250, -100, age) * (1 - smooth(150, 400, age)) : 0, 0.8 - 0.4 * smooth(100, 400, age));
    });
    teamUp(signs, ms, HIT, allies, env.tall, EVA, null, 1);
  };
});

export const guidingLamp = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const xs = allies.map((a) => a.x);
  const lampAt = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, env.tall * 1.35, allies.reduce((s, a) => s + a.z, 0) / allies.length + 0.2);
  // The beams are pure light (a ray's painted wash would cover the lantern, whatever the draw order).
  const beams = lines(root, allies.length * 2);
  const lamp = halo(root, GOLD, 0.6);
  lamp.mesh.rotation.x = TILT;
  lamp.mesh.renderOrder = 8;
  const core = quads(root, 2 + Math.round(30 * env.quality), true, F.soft);
  core.mesh.renderOrder = 9;
  const signs = quads(root, allies.length * 32, true, F.disc);
  const HIT = 500;
  return (ms, sec) => {
    // The lantern floats up from the caster's side to above the team and glows.
    const up = easeOut(clamp(ms / 400));
    const p = new THREE.Vector3(env.from.x, env.tall * 0.8, env.from.z).lerp(lampAt, up);
    p.y += 0.08 * Math.sin(sec * 4);
    lamp.mesh.position.copy(p);
    lamp.mesh.scale.setScalar(1.4 + env.tall * 0.6);
    lamp.set(sec, smooth(0, 120, ms) * (1 - smooth(HIT + 450, HIT + 700, ms)));
    core.put(0, p.x, p.y, p.z + 0.05, 0.9 + env.tall * 0.3, 2.2, 1.8, 0.8, smooth(0, 120, ms) * (1 - smooth(HIT + 450, HIT + 700, ms)));
    core.look(0, F.soft);
    core.hide(1);
    rise(core, 2, core.n - 2, 2, { sec: ms / 1000, dur: 1, life: 0.7, at: () => p, rise: 0.6, jitter: 0.6, size: 0.12, color: SUN, to: GOLD, frame: F.star, grow: 0.3 });
    core.flush();
    // A beam from the lantern onto each ally in turn.
    allies.forEach((f, i) => {
      const age = ms - HIT - i * GAP;
      const chest = new THREE.Vector3(f.x, env.tall * 0.6, f.z);
      const reach = clamp((age + 120) / 120);
      const g = age > -120 ? 1 - smooth(250, 420, age) : 0;
      beams.put(i * 2, p, new THREE.Vector3().copy(p).lerp(chest, reach), 0.16, 0.1, SUN[0], SUN[1], SUN[2], g);
      beams.put(i * 2 + 1, p, new THREE.Vector3().copy(p).lerp(chest, reach), 0.05, 0.03, 2, 2, 2, g);
    });
    beams.show(allies.length * 2, 1);
    beams.flush();
    teamUp(signs, ms, HIT, allies, env.tall, ACC, MATK, 3);
  };
});

export const swiftBolt = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const arcs = lines(root, allies.length * 40);
  const trail = quads(root, allies.length * Math.round(26 * env.quality), true, F.streak);
  const tp = Math.round(26 * env.quality);
  const signs = quads(root, allies.length * 32, true, F.disc);
  const HIT = 400;
  const dir = env.origin.x >= env.from.x ? -1 : 1;
  return (ms) => {
    let n = 0;
    allies.forEach((f, i) => {
      const age = ms - HIT - i * GAP;
      // Two small sparks crawl up the ally, re-drawn every 50 ms (lightning jitters).
      if (age > -200 && age < 300) {
        const g = smooth(-200, -120, age) * (1 - smooth(150, 300, age));
        for (let k = 0; k < 2; k++) {
          const y0 = env.tall * (0.1 + 0.4 * k);
          const a = new THREE.Vector3(f.x + (k ? 0.3 : -0.3), y0, f.z + 0.25);
          const b = new THREE.Vector3(f.x + (k ? -0.25 : 0.25), y0 + env.tall * 0.55, f.z + 0.25);
          n = forked(arcs, n, a, b, Math.floor(ms / 50) * 7 + i * 3 + k, { width: 0.07, jag: 0.25, forks: 3, color: BOLT, gain: g * 2.2 });
        }
      }
      // Yellow streaks run off behind it (speed).
      for (let k = 0; k < tp; k++) {
        const t = (age + 150 - h(k, 0, 20 + i) * 350) / 300;
        const idx = i * tp + k;
        if (t <= 0 || t >= 1) {
          trail.hide(idx);
          continue;
        }
        trail.put(idx, f.x + dir * t * 1.6, env.tall * (0.15 + 0.7 * h(k, 1, 20 + i)), f.z + 0.2, 0.42, SPD[0] * 1.3, SPD[1] * 1.3, SPD[2] * 1.3, (1 - t));
        trail.stretch(idx, dir * 0.8, 0, 0);
        trail.look(idx, F.streak, 0, 0.5);
      }
    });
    arcs.show(n, 1);
    arcs.flush();
    trail.flush();
    teamUp(signs, ms, HIT, allies, env.tall, SPD, null, 5);
  };
});

export const rallyWave = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const c = rgbOf(env.color, ATK);
  const from = new THREE.Vector3(env.from.x, 0, env.from.z);
  const reach = Math.max(2.5, ...allies.map((a) => a.distanceTo(from) * 2 + 1.5));
  const rings = [0, 1].map(() => shock(root, from, reach, c));
  const flare = quads(root, allies.length * 12, true, F.ember);
  const signs = quads(root, allies.length * 32, true, F.disc);
  const HIT = 550;
  return (ms) => {
    rings.forEach((r, k) => r((ms - 200 - k * 150) / 450, ms > 200 + k * 150 ? 0.7 * (1 - smooth(300, 450, ms - 200 - k * 150)) : 0));
    allies.forEach((f, i) => burst(flare, i * 12, 12, 30 + i, { sec: (ms - HIT - i * GAP) / 1000, at: new THREE.Vector3(f.x, env.tall * 0.3, f.z + 0.2), life: 0.7, speed: 0.8, up: 2.6, grav: 1, drag: 1, size: 0.14, color: HOT, to: c, frame: F.ember, wide: 0.5, alpha: 0.9 }));
    flare.flush();
    teamUp(signs, ms, HIT, allies, env.tall, ATK, MATK, 7);
  };
});

function roar(env: Vfx3dEnv, big: boolean) {
  return handle(env, (root, allies) => {
    const mouth = new THREE.Vector3(env.from.x, env.tall * 0.6, env.from.z);
    const N = big ? 4 : 3;
    const waves = Array.from({ length: N }, () => {
      const m = halo(root, big ? [1.5, 0.55, 0.3] : [1.4, 0.75, 0.45], 0);
      m.mesh.rotation.x = TILT;
      return m;
    });
    const embers = quads(root, big ? Math.round(60 * env.quality) : 1, true, F.ember);
    const signs = quads(root, (allies.length + 1) * 32, true, F.disc);
    const HIT = big ? 550 : 600;
    return (ms, sec) => {
      // Rings of sound roll out of the mouth, one after another, growing and thinning.
      waves.forEach((w, k) => {
        const t = clamp((ms - 150 - k * 120) / 600);
        w.mesh.position.copy(mouth);
        w.mesh.scale.setScalar((0.6 + t * (big ? 6 : 4.5)) * (0.8 + env.tall * 0.2));
        w.set(sec, t > 0 ? 0.8 * (1 - t) : 0);
      });
      if (big) burst(embers, 0, embers.n, 40, { sec: (ms - 200) / 1000, at: mouth, life: 0.9, speed: 3, up: 1.4, grav: 0.5, drag: 1.2, size: 0.12, color: HOT, to: [1.2, 0.3, 0.05], frame: F.ember, spread: 0.3, alpha: 0.9 });
      embers.flush();
      teamUp(signs, ms, HIT, allies, env.tall, ATK, null, 9);
      if (big) signsUp(signs, allies.length * 32, 8, 50, (ms - HIT - 150) / 1000, new THREE.Vector3(env.from.x, 0, env.from.z), env.tall, MATK, 'up');
      signs.flush();
    };
  });
}
export const howlWave = (env: Vfx3dEnv) => roar(env, false);
export const roarWave = (env: Vfx3dEnv) => roar(env, true);
