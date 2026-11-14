// Team-wide healing and cleansing, rebuilt per kind (decision 059); each ally is reached in turn from `HIT`, 110 ms apart.
// `tide_song` (Khúc Ca Triều, water): a ribbon of water flows out from the caster along the team; at each ally a ring of water
// rises, washes a dark mote off it, and teal pluses float. `blossom_regen` (Hoa Hồi Sinh, nature): a flower opens at each ally's
// feet and petals swirl up round it, with green pluses that keep coming (regeneration). `healing_rain` (Mưa Hồi Phục): a soft
// cloud gathers over the team and glowing drops fall on each ally, splashing into pluses. `aura_regen` (Hào Quang): a ring runs
// out over the ground from the caster through the team; each ally stands in a column of light with green pluses and blue
// chevrons (defence up). `purify` (Thanh Tẩy): a band of white light sweeps over the team; dark motes rise off each ally and
// turn to sparkles, a clean ring under each. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { DEF, HEAL, pillar, rgbOf, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { flower, stem } from './plantParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';
import { spiralUp } from './mendFx';

const TEAL: Rgb = [0.5, 1.35, 1.3];
const INKY: Rgb = [0.1, 0.06, 0.18];
const GAP = 110;
type Q = ReturnType<typeof quads>;
const team = (env: Vfx3dEnv) => env.targets.map((t) => new THREE.Vector3(t.x, 0, t.z));
function handle(env: Vfx3dEnv, build: (root: THREE.Group) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const step = build(root);
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
const darkOff = (q: Q, from: number, count: number, seed: number, sec: number, f: THREE.Vector3, tall: number, to: Rgb) =>
  rise(q, from, count, seed, { sec, dur: 0.25, life: 0.7, at: (_b, k) => new THREE.Vector3(f.x + (h(k, 8, seed) - 0.5) * 0.7, tall * (0.3 + 0.4 * h(k, 9, seed)), f.z + 0.2), rise: 1.4, jitter: 0.2, size: 0.26, color: INKY, to, frame: F.smoke, grow: 0.3, alpha: 0.85 });

export const tideSong = (env: Vfx3dEnv) => handle(env, (root) => {
  const allies = team(env);
  const from = new THREE.Vector3(env.from.x, env.tall * 0.7, env.from.z);
  const xs = allies.map((a) => a.x);
  const far = new THREE.Vector3(Math.min(...xs) - 0.8, 0, (Math.min(...allies.map((a) => a.z)) + Math.max(...allies.map((a) => a.z))) / 2);
  const ribbon = stem(root, 30, [0.15, 0.45, 0.85], [0.6, 1.1, 1.4], 0.001);
  const swirls = allies.map(() => quads(root, Math.round(30 * env.quality), false, F.drop));
  const per = 8;
  const marks = quads(root, allies.length * 4, false, F.smoke);
  const signs = quads(root, allies.length * per * 2, true, F.disc);
  const HIT = 600;
  return (ms) => {
    // The ribbon of water flows out over the team, waving, and drains away after the last ally.
    const run = easeOut(clamp((ms - 150) / 500));
    ribbon.set((u, out) => {
      const x = from.x + (far.x - from.x) * u;
      return out.set(x, env.tall * (0.9 + 0.25 * Math.sin(u * 9 - ms * 0.008)), from.z + (far.z - from.z) * u + 0.6 * Math.sin(u * 4));
    }, (u) => 0.1 * (1 - 0.5 * u), run, smooth(150, 250, ms) * (1 - smooth(HIT + 500, HIT + 800, ms)));
    allies.forEach((a, i) => {
      const age = ms - HIT - i * GAP;
      spiralUp(swirls[i]!, a, env.tall, ms, age > -200 ? smooth(-200, -80, age) * (1 - smooth(150, 400, age)) : 0, 20 + i);
      darkOff(marks, i * 4, 4, 20 + i, (age + 30) / 1000, a, env.tall, TEAL);
      signsUp(signs, i * per * 2, per, 30 + i, age / 1000, a, env.tall, TEAL, 'plus');
    });
    marks.flush();
    signs.flush();
  };
});

export const blossomRegen = (env: Vfx3dEnv) => handle(env, (root) => {
  const allies = team(env);
  const PINK: Rgb = [1.2, 0.62, 0.85];
  const blooms = quads(root, allies.length * 7, false, F.petal);
  const petals = quads(root, allies.length * Math.round(14 * env.quality), false, F.petal);
  const pp = Math.round(14 * env.quality);
  const per = 10;
  const signs = quads(root, allies.length * per * 2, true, F.disc);
  const HIT = 400;
  return (ms, sec) => {
    allies.forEach((a, i) => {
      const age = ms - HIT - i * GAP;
      const open = easeOutBack(clamp((age + 250) / 300));
      const live = age > -250 ? 1 - smooth(700, 950, age) : 0;
      flower(blooms, i * 7, 6, new THREE.Vector3(a.x, 0.15, a.z + 0.35), 0.28 + env.tall * 0.1, open, sec * 0.5, PINK, [1.5, 1.3, 0.5], live);
      // Petals swirl up round the ally.
      for (let k = 0; k < pp; k++) {
        const t = (age - h(k, 0, 40 + i) * 500) / 900;
        const idx = i * pp + k;
        if (t <= 0 || t >= 1) {
          petals.hide(idx);
          continue;
        }
        const ang = h(k, 1, 40 + i) * 6.283 + t * 5;
        const r = 0.45 + env.tall * 0.2;
        petals.put(idx, a.x + Math.cos(ang) * r, t * env.tall * 1.2, a.z + Math.sin(ang) * r * 0.45, 0.16, PINK[0], PINK[1], PINK[2], smooth(0, 0.15, t) * (1 - smooth(0.7, 1, t)));
        petals.look(idx, F.petal, ang + t * 4);
      }
      signsUp(signs, i * per * 2, per, 50 + i, age / 1000, a, env.tall, HEAL, 'plus', 0.9);
    });
    blooms.flush();
    petals.flush();
    signs.flush();
  };
});

export const healingRain = (env: Vfx3dEnv) => handle(env, (root) => {
  const allies = team(env);
  const c = rgbOf(env.color, [0.6, 1.2, 1.5]);
  const xs = allies.map((a) => a.x);
  const zs = allies.map((a) => a.z);
  const mid = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, env.tall * 1.9, (Math.min(...zs) + Math.max(...zs)) / 2);
  const span = Math.max(2.5, Math.max(...xs) - Math.min(...xs) + 1.8);
  const cloud = quads(root, Math.round(26 * env.quality), false, F.smoke);
  const dper = Math.round(10 * env.quality);
  const drops = quads(root, allies.length * dper, true, F.drop);
  const per = 8;
  const signs = quads(root, allies.length * per * 2, true, F.disc);
  const rings = allies.map((a) => shock(root, a, 1.8, c));
  const HIT = 250;
  return (ms, sec) => {
    // A pale cloud puffs up over the team, lit from inside.
    const puff = easeOut(clamp(ms / 300)) * (1 - smooth(HIT + 700, HIT + 1000, ms));
    for (let k = 0; k < cloud.n; k++) {
      cloud.put(k, mid.x + (h(k, 1, 60) - 0.5) * span, mid.y + (h(k, 2, 60) - 0.5) * 0.5 + 0.05 * Math.sin(sec * 2 + k), mid.z + (h(k, 3, 60) - 0.5) * 0.6, (0.8 + 0.6 * h(k, 4, 60)) * puff, 0.6, 0.7, 0.9, 0.8 * puff);
      cloud.look(k, F.smoke, h(k, 5, 60) * 6.28);
    }
    cloud.flush();
    allies.forEach((a, i) => {
      const age = ms - HIT - i * GAP;
      // Drops fall from the cloud onto this ally, each landing a little after the last.
      for (let k = 0; k < dper; k++) {
        const t = (age + 300 - h(k, 0, 70 + i) * 450) / 300;
        const idx = i * dper + k;
        if (t <= 0 || t >= 1) {
          drops.hide(idx);
          continue;
        }
        drops.put(idx, a.x + (h(k, 1, 70 + i) - 0.5) * 0.8, mid.y * (1 - t) + env.tall * 0.4 * t, a.z + 0.2, 0.18, c[0] * 1.3, c[1] * 1.3, c[2] * 1.3, 1);
        drops.stretch(idx, 0, -0.5, 0);
        drops.look(idx, F.drop, 0, 0.6);
      }
      rings[i]!(age / 320, age > 0 ? 1 - smooth(160, 320, age) : 0);
      signsUp(signs, i * per * 2, per, 80 + i, age / 1000, a, env.tall, HEAL, 'plus');
    });
    drops.flush();
    signs.flush();
  };
});

export const auraRegen = (env: Vfx3dEnv) => handle(env, (root) => {
  const allies = team(env);
  const c = rgbOf(env.color, HEAL);
  const from = new THREE.Vector3(env.from.x, 0, env.from.z);
  const reach = Math.max(2.5, ...allies.map((a) => a.distanceTo(from) * 2 + 1.5));
  const wave = shock(root, from, reach, c);
  const cols = allies.map((a) => {
    const p = pillar(root, c);
    p.mesh.position.copy(a);
    return p;
  });
  const per = 8;
  const signs = quads(root, allies.length * per * 4, true, F.disc);
  const HIT = 600;
  return (ms, sec) => {
    wave((ms - 250) / 500, ms > 250 ? 0.55 * (1 - smooth(450, 750, ms - 250)) : 0);
    allies.forEach((a, i) => {
      const age = ms - HIT - i * GAP;
      cols[i]!.mesh.scale.set(0.8 + env.tall * 0.35, env.tall * 1.7 * easeOut(clamp((age + 150) / 250)), 1);
      cols[i]!.set(age > -150 ? 0.75 * (1 - smooth(450, 800, age)) : 0, sec);
      signsUp(signs, i * per * 4, per, 90 + i, age / 1000, a, env.tall, HEAL, 'plus', 0.9);
      signsUp(signs, i * per * 4 + per * 2, per, 95 + i, (age - 100) / 1000, a, env.tall, DEF, 'up', 0.5);
    });
    signs.flush();
  };
});

export const purify = (env: Vfx3dEnv) => handle(env, (root) => {
  const allies = team(env);
  const c = rgbOf(env.color, [1.3, 1.4, 1.6]);
  const xs = allies.map((a) => a.x);
  const x0 = Math.max(...xs) + 1.2;
  const x1 = Math.min(...xs) - 1.2;
  const zm = allies.reduce((s, a) => s + a.z, 0) / allies.length;
  const band = pillar(root, c);
  const marks = quads(root, allies.length * 6, false, F.smoke);
  const spark = quads(root, allies.length * 10, true, F.star);
  const rings = allies.map((a) => shock(root, a, 2, c));
  const HIT = 380;
  return (ms, sec) => {
    // The band sweeps across the team (from the caster's side); each ally is cleansed as it passes.
    const k = clamp((ms - 150) / 500);
    const bx = x0 + (x1 - x0) * k;
    band.mesh.position.set(bx, 0, zm);
    band.mesh.scale.set(1.1, env.tall * 2.4, 1);
    band.set(smooth(150, 250, ms) * (1 - smooth(600, 750, ms)) * 0.9, sec);
    allies.forEach((a, i) => {
      const at = 150 + 500 * clamp((x0 - a.x) / (x0 - x1));
      const age = ms - Math.max(HIT - 150, at) - i * 10;
      darkOff(marks, i * 6, 6, 100 + i, age / 1000, a, env.tall, c);
      burst(spark, i * 10, 10, 110 + i, { sec: (age - 150) / 1000, at: new THREE.Vector3(a.x, env.tall * 0.9, a.z + 0.2), life: 0.6, speed: 1.2, up: 1.4, grav: 0, drag: 2, size: 0.13, color: c, frame: F.star, alpha: 0.9 });
      rings[i]!(age / 320, age > 0 ? 1 - smooth(160, 320, age) : 0);
    });
    marks.flush();
    spark.flush();
  };
});

