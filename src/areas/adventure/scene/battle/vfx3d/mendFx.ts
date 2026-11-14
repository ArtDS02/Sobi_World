// Single-target healing, rebuilt per kind (decision 059); each heal lands at its `HIT`. `wave_mend` (Sóng Vỗ Về, water): a ring of
// clear water rises round the ally and falls back into a pool, drops and teal pluses float up. `dawn_mend` (Ánh Sáng Đầu Tiên,
// light): a small sun halo comes down over the ally on a column of light and burns the dark marks off it (every bad state, doom
// too). `sprout_mend` (Chồi Non, nature): a sprout pushes up at the ally's feet and opens two leaves, green pluses rise and keep
// rising (regeneration). `mend_cross` (Hồi Phục, Nước Mát: class / monster): a ring is drawn on the ground in the act's colour,
// a soft column stands up and pluses float. `second_wind` (Hồi Sức): a gust spirals up round the caster, pluses, and one dark
// mote is flung out of it. `ward_mend` (Bùa Hộ Thân): a charm of light shines over the ally and breaks into motes that fall on it,
// and a dark mote is burnt away. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { HEAL, pillar, rgbOf, sigil, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, gather, h, mix3, rise, type Rgb } from './fxKit';
import { GOLD, SUN, halo } from './glowParts';
import { LEAF, LEAF_PALE, stem } from './plantParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { pool } from './waterParts';

const TILT = -0.45;
const TEAL: Rgb = [0.5, 1.35, 1.3];
const INKY: Rgb = [0.1, 0.06, 0.18];
const feetOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, 0, env.origin.z);
type Step = (ms: number, sec: number) => void;
/** Runs `step` in a fresh group under the scene; disposes it all. */
function handle(env: Vfx3dEnv, build: (root: THREE.Group) => Step): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const step = build(root);
  return {
    update(ms) {
      step(ms, ms / 1000);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
/** Bad marks lifted off a unit and burnt away into light: dark motes rise, turn to `to`, and go. */
function burnOff(q: ReturnType<typeof quads>, from: number, count: number, seed: number, sec: number, feet: THREE.Vector3, tall: number, to: Rgb) {
  rise(q, from, count, seed, { sec, dur: 0.25, life: 0.7, at: (_b, k) => new THREE.Vector3(feet.x + (h(k, 8, seed) - 0.5) * 0.7, tall * (0.3 + 0.4 * h(k, 9, seed)), feet.z + 0.2), rise: 1.4, jitter: 0.2, size: 0.28, color: INKY, to, frame: F.smoke, grow: 0.3, alpha: 0.9 });
}

/** Water spiralling up round a unit at `feet` (painted drops), alive while `live` > 0; `ms` drives it. Uses all of `q`. */
export function spiralUp(q: ReturnType<typeof quads>, feet: THREE.Vector3, tall: number, ms: number, live: number, seed: number) {
  for (let i = 0; i < q.n; i++) {
    const t = ((ms / 650) + h(i, 0, seed)) % 1;
    const a = h(i, 1, seed) * 6.283 + t * 6;
    const r = (0.35 + tall * 0.15) * (1 - 0.3 * t);
    const a2 = live * smooth(0, 0.15, t) * (1 - smooth(0.75, 1, t));
    q.put(i, feet.x + Math.cos(a) * r, 0.1 + t * tall * 1.1, feet.z + Math.sin(a) * r * 0.45, 0.15, 0.45, 0.8, 1.25, a2 * 0.95);
    q.stretch(i, -Math.sin(a) * 0.12, 0.08, Math.cos(a) * 0.06);
    q.look(i, F.drop, 0, 0.6);
  }
  q.flush();
}
export const waveMend = (env: Vfx3dEnv) => handle(env, (root) => {
  const feet = feetOf(env);
  const swirl = quads(root, Math.round(46 * env.quality), false, F.drop);
  const sheet = pool(root, 1.6 + env.tall * 0.6, 0.9 + env.tall * 0.3);
  sheet.mesh.position.set(feet.x, 0.015, feet.z);
  const drops = quads(root, Math.round(40 * env.quality), true, F.drop);
  const signs = quads(root, 16, true, F.disc);
  const HIT = 350;
  return (ms, sec) => {
    const hit = ms - HIT;
    spiralUp(swirl, feet, env.tall, ms, smooth(0, 120, ms) * (1 - smooth(150, 420, hit)), 17);
    sheet.set(easeOut(clamp((ms - 100) / 500)), sec, smooth(80, 200, ms) * (1 - smooth(500, 800, hit)));
    rise(drops, 0, drops.n, 1, { sec: hit / 1000, dur: 0.4, life: 0.8, at: (_b, k) => new THREE.Vector3(feet.x + (h(k, 8, 1) - 0.5) * 0.9, 0.2, feet.z + 0.2), rise: 1.8, jitter: 0.2, size: 0.13, color: [0.8, 1.3, 1.6], to: TEAL, frame: F.drop, grow: 0.5 });
    drops.flush();
    signsUp(signs, 0, 8, 2, hit / 1000, feet, env.tall, TEAL, 'plus');
    signs.flush();
  };
});

export const dawnMend = (env: Vfx3dEnv) => handle(env, (root) => {
  const feet = feetOf(env);
  const sun = halo(root, GOLD, 1);
  sun.mesh.rotation.x = TILT;
  const col = pillar(root, [1.3, 1.1, 0.55]);
  col.mesh.position.copy(feet);
  const light = quads(root, Math.round(60 * env.quality), true, F.star);
  const marks = quads(root, 10, false, F.smoke);
  const signs = quads(root, 16, true, F.disc);
  const HIT = 470;
  return (ms, sec) => {
    const hit = ms - HIT;
    // The sun comes down from above the ally and sits over its head while the column stands.
    const down = easeOut(clamp((ms - 60) / 400));
    sun.mesh.position.set(feet.x, env.tall * (2.2 - 0.9 * down), feet.z);
    sun.mesh.scale.setScalar((1 + env.tall * 0.5) * (0.6 + 0.4 * down));
    sun.set(sec, smooth(60, 200, ms) * (1 - smooth(350, 650, hit)));
    col.mesh.scale.set(0.6 + env.tall * 0.25, env.tall * 2.2, 1);
    col.set(smooth(200, HIT, ms) * (1 - smooth(200, 450, hit)) * 0.45, sec);
    burnOff(marks, 0, marks.n, 3, (hit - 40) / 1000, feet, env.tall, [1.3, 1.1, 0.5]);
    marks.flush();
    rise(light, 0, light.n, 4, { sec: (ms - 200) / 1000, dur: 0.6, life: 0.8, at: (_b, k) => new THREE.Vector3(feet.x + (h(k, 8, 4) - 0.5) * 0.8, 0.1, feet.z + 0.15), rise: 2, jitter: 0.15, size: 0.14, color: SUN, to: GOLD, frame: F.star, grow: 0.3 });
    light.flush();
    signsUp(signs, 0, 8, 5, hit / 1000, feet, env.tall, mix3(GOLD, HEAL, 0.5), 'plus');
    signs.flush();
  };
});

export const sproutMend = (env: Vfx3dEnv) => handle(env, (root) => {
  const feet = feetOf(env);
  const shoot = stem(root, 12, LEAF, LEAF_PALE, 0);
  const leaves = quads(root, 2, false, F.leaf);
  const motes = quads(root, Math.round(30 * env.quality), true, F.star);
  const signs = quads(root, 24, true, F.disc);
  const HIT = 300;
  const H = 0.7 + env.tall * 0.45;
  return (ms, _sec) => {
    const hit = ms - HIT;
    const grow = easeOutBack(clamp((ms - 40) / 300));
    const live = 1 - smooth(700, 950, hit);
    shoot.set((u, out) => out.set(feet.x + 0.08 * Math.sin(u * 3 + ms * 0.004), H * u, feet.z + 0.35), (u) => 0.07 - 0.03 * u, grow, live);
    // Two leaves unfold from the top of the shoot.
    const open = easeOutBack(clamp((ms - 220) / 260));
    [-1, 1].forEach((s, k) => {
      leaves.put(k, feet.x + s * 0.2 * open, H * grow, feet.z + 0.36, 0.55 * open, LEAF[0] * 1.1, LEAF[1] * 1.1, LEAF[2], live);
      leaves.look(k, F.leaf, s * (0.9 + 0.2 * Math.sin(ms * 0.005)), 0.6);
    });
    leaves.flush();
    rise(motes, 0, motes.n, 6, { sec: hit / 1000, dur: 0.9, life: 0.9, at: (_b, k) => new THREE.Vector3(feet.x + (h(k, 8, 6) - 0.5) * 0.9, 0.2, feet.z + 0.2), rise: 1.2, jitter: 0.2, size: 0.12, color: [0.9, 1.5, 0.6], to: LEAF, frame: F.star, grow: 0.4, sway: 0.1 });
    motes.flush();
    // Regeneration: the pluses keep coming for a while.
    signsUp(signs, 0, 12, 7, hit / 1000, feet, env.tall, HEAL, 'plus', 0.9);
    signs.flush();
  };
});

export const mendCross = (env: Vfx3dEnv) => handle(env, (root) => {
  const feet = feetOf(env);
  const c = rgbOf(env.color, HEAL);
  const ring = sigil(root, c, 16);
  ring.mesh.rotation.x = -Math.PI / 2;
  ring.mesh.position.set(feet.x, 0.04, feet.z);
  const col = pillar(root, c);
  col.mesh.position.copy(feet);
  const motes = quads(root, Math.round(36 * env.quality), true, F.star);
  const signs = quads(root, 20, true, F.disc);
  const HIT = 300;
  return (ms, sec) => {
    const hit = ms - HIT;
    ring.mesh.scale.set((0.8 + env.tall * 0.35) * 1.3, 0.8 + env.tall * 0.35, 1);
    ring.set(easeOut(clamp(ms / 260)), smooth(0, 80, ms) * (1 - smooth(450, 700, hit)), sec);
    col.mesh.scale.set(0.55 + env.tall * 0.25, env.tall * 1.8 * easeOut(clamp((ms - 150) / 250)), 1);
    col.set(smooth(150, HIT, ms) * (1 - smooth(200, 450, hit)) * 0.45, sec);
    gather(motes, 0, Math.floor(motes.n / 2), 8, { k: clamp(ms / HIT), to: new THREE.Vector3(feet.x, env.tall * 0.5, feet.z + 0.2), radius: 1.2 + env.tall * 0.3, turns: 0.7, size: 0.12, color: c, frame: F.star, tall: 1 });
    burst(motes, Math.floor(motes.n / 2), motes.n - Math.floor(motes.n / 2), 9, { sec: hit / 1000, at: new THREE.Vector3(feet.x, env.tall * 0.5, feet.z + 0.2), life: 0.7, speed: 1.4, up: 1.6, grav: 0, drag: 2, size: 0.12, color: c, frame: F.star, alpha: 0.8 });
    motes.flush();
    signsUp(signs, 0, 10, 10, hit / 1000, feet, env.tall, c, 'plus');
    signs.flush();
  };
});

export const secondWind = (env: Vfx3dEnv) => handle(env, (root) => {
  const feet = feetOf(env);
  const c = rgbOf(env.color, HEAL);
  const gust = quads(root, Math.round(70 * env.quality), true, F.streak);
  const marks = quads(root, 6, false, F.smoke);
  const signs = quads(root, 16, true, F.disc);
  const HIT = 350;
  const R = 0.6 + env.tall * 0.3;
  return (ms, _sec) => {
    const hit = ms - HIT;
    // The gust: streaks orbit the caster and climb, tightening, then thin out.
    const live = smooth(0, 120, ms) * (1 - smooth(250, 550, hit));
    for (let i = 0; i < gust.n; i++) {
      const k = ((ms / 600) + h(i, 0, 11)) % 1;
      const a = h(i, 1, 11) * 6.283 + k * 7;
      const r = R * (1 - 0.4 * k);
      gust.put(i, feet.x + Math.cos(a) * r, k * env.tall * 1.3, feet.z + Math.sin(a) * r * 0.45, 0.3, c[0] * 1.3, c[1] * 1.3, c[2] * 1.3, live * smooth(0, 0.2, k) * (1 - smooth(0.8, 1, k)));
      gust.stretch(i, -Math.sin(a) * r * 0.3, 0.2, Math.cos(a) * r * 0.15);
      gust.look(i, F.streak, 0, 0.5);
    }
    gust.flush();
    // The one bad state it shakes off: dark motes flung out to the side, burnt to light.
    burst(marks, 0, marks.n, 12, { sec: (hit + 40) / 1000, at: new THREE.Vector3(feet.x, env.tall * 0.6, feet.z + 0.2), life: 0.6, speed: 2.4, up: 1.4, grav: 1, drag: 1.5, size: 0.3, color: INKY, to: c, frame: F.smoke, alpha: 0.9 });
    marks.flush();
    signsUp(signs, 0, 8, 13, hit / 1000, feet, env.tall, c, 'plus');
    signs.flush();
  };
});

export const wardMend = (env: Vfx3dEnv) => handle(env, (root) => {
  const feet = feetOf(env);
  const c = rgbOf(env.color, [1.4, 1.3, 0.7]);
  const charm = sigil(root, c, 8);
  charm.mesh.rotation.x = TILT;
  const fall = quads(root, Math.round(40 * env.quality), true, F.star);
  const marks = quads(root, 8, false, F.smoke);
  const signs = quads(root, 16, true, F.disc);
  const HIT = 300;
  return (ms, sec) => {
    const hit = ms - HIT;
    // The charm is drawn above the ally, glows, and breaks into motes that fall on it.
    charm.mesh.position.set(feet.x, env.tall * 1.0, feet.z + 0.1);
    charm.mesh.scale.setScalar((0.5 + env.tall * 0.25) * (1 + 0.25 * smooth(0, 120, hit)));
    charm.set(easeOut(clamp(ms / 240)), smooth(0, 60, ms) * (1 - smooth(20, 160, hit)), sec);
    burst(fall, 0, fall.n, 14, { sec: hit / 1000, at: new THREE.Vector3(feet.x, env.tall * 1.0, feet.z + 0.1), life: 0.8, speed: 0.9, up: -0.6, grav: 2.5, drag: 1, size: 0.13, color: c, frame: F.star, alpha: 0.9 });
    fall.flush();
    burnOff(marks, 0, marks.n, 15, (hit + 80) / 1000, feet, env.tall, c);
    marks.flush();
    signsUp(signs, 0, 8, 16, (hit - 60) / 1000, feet, env.tall, HEAL, 'plus');
    signs.flush();
  };
});
