// Buffs on one unit, rebuilt per kind (decision 059); each lands at its `HIT` with chevrons in the colours of the stats it raises.
// `forge_fire` (Lửa Rèn): flames lick up round the caster and embers fly (attack and magic attack up). `phase_shift` (Lệch Pha):
// a rift outline flickers round the caster and stars slip off it (evasion up, MP back). `aim_focus` (Ngắm Chuẩn): a sighting ring
// closes in on the caster and locks (accuracy and attack up). `wind_dash` (Lướt Gió): streaks of wind blow past the caster and
// leaves whirl (evasion and speed up). `focus_charge` (Tập Trung): motes spiral into the caster's chest and a violet ring pulses
// (magic attack up, MP back). `cheer_burst` (Cổ Vũ): a fan of sparks bursts over the ally like a cheer (attack, magic attack up).
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { ACC, ATK, EVA, MATK, MP, SPD, rgbOf, sigil, signsUp } from './boonParts';
import { clamp, easeOut, smooth } from './effectParts';
import { HOT, flame } from './flameParts';
import { burst, gather, h, rise, type Rgb } from './fxKit';
import { quads } from './quads';
import { VOID_HOT, rift } from './riftParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
type Q = ReturnType<typeof quads>;
function handle(env: Vfx3dEnv, build: (root: THREE.Group, feet: THREE.Vector3) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const step = build(root, new THREE.Vector3(env.origin.x, 0, env.origin.z));
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
/** Two stats' chevrons on one unit: `a` first, `b` 90 ms later (b may be null). Uses 32 particles of `q`. */
function twoUp(q: Q, sec: number, feet: THREE.Vector3, tall: number, a: Rgb, b: Rgb | null, seed: number) {
  signsUp(q, 0, 8, seed, sec, feet, tall, a, 'up');
  if (b) signsUp(q, 16, 8, seed + 1, sec - 0.09, feet, tall, b, 'up');
  else for (let i = 16; i < 32; i++) q.hide(i);
  q.flush();
}

export const forgeFire = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const tongues = [0, 1, 2, 3].map((k) => flame(root, k + 1));
  const embers = quads(root, Math.round(50 * env.quality), true, F.ember);
  const signs = quads(root, 32, true, F.disc);
  const ring = shock(root, feet, 2.4, [1.4, 0.6, 0.2]);
  const HIT = 650;
  return (ms, sec) => {
    const hit = ms - HIT;
    tongues.forEach((f, k) => {
      const a = (k / 4) * 6.283 + sec * 1.5;
      const r = 0.35 + env.tall * 0.15;
      f.mesh.position.set(feet.x + Math.cos(a) * r, 0, feet.z + Math.sin(a) * r * 0.4 + 0.1);
      const tall = env.tall * (0.6 + 0.5 * smooth(HIT - 250, HIT, ms)) * (0.8 + 0.2 * Math.sin(sec * 9 + k));
      f.set(0.45 + env.tall * 0.12, tall, sec, smooth(100, 300, ms) * (1 - smooth(250, 550, hit)) * 0.85, Math.sin(sec * 3 + k) * 0.3);
    });
    rise(embers, 0, embers.n, 1, { sec: (ms - 150) / 1000, dur: 0.9, life: 0.8, at: (_b, k) => new THREE.Vector3(feet.x + (h(k, 8, 1) - 0.5) * 0.9, 0.2, feet.z + 0.2), rise: 2.4, jitter: 0.2, size: 0.1, color: HOT, to: [1.2, 0.35, 0.05], frame: F.ember, grow: 0.3, sway: 0.15 });
    embers.flush();
    ring(hit / 320, hit > 0 ? 0.8 * (1 - smooth(160, 320, hit)) : 0);
    twoUp(signs, hit / 1000, feet, env.tall, ATK, MATK, 2);
  };
});

export const phaseShift = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const outline = [0, 1].map((k) => {
    const r = rift(root, 5 + k);
    r.mesh.rotation.set(TILT, 0, Math.PI / 2 + (k ? 0.25 : -0.25));
    return r;
  });
  const stars = quads(root, Math.round(50 * env.quality), true, F.star);
  const signs = quads(root, 32, true, F.disc);
  const HIT = 450;
  return (ms, sec) => {
    const hit = ms - HIT;
    // Two tears stand on either side of the caster, flickering, and close on the impact.
    outline.forEach((r, k) => {
      r.mesh.position.set(feet.x + (k ? 1 : -1) * (0.35 + env.tall * 0.15), env.tall * 0.55, feet.z + 0.2);
      r.mesh.scale.set(env.tall * 1.3, 0.7, 1);
      const flick = 0.75 + 0.25 * Math.sin(sec * 40 + k * 2);
      r.set(easeOut(clamp((ms - 80) / 250)) * flick * (1 - smooth(-40, 80, hit)), smooth(80, 160, ms) * (1 - smooth(40, 160, hit)), sec);
    });
    burst(stars, 0, stars.n, 3, { sec: hit / 1000, at: new THREE.Vector3(feet.x, env.tall * 0.55, feet.z + 0.2), life: 0.7, speed: 1.8, up: 0.8, grav: 0, drag: 2.5, size: 0.14, color: VOID_HOT, frame: F.star, alpha: 0.9 });
    stars.flush();
    twoUp(signs, hit / 1000, feet, env.tall, EVA, MP, 4);
  };
});

export const aimFocus = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const c = rgbOf(env.color, ACC);
  const reticle = sigil(root, c, 4);
  reticle.mesh.rotation.x = TILT;
  const signs = quads(root, 32, true, F.disc);
  const glint = quads(root, 3, true, F.star);
  const HIT = 350;
  return (ms, sec) => {
    const hit = ms - HIT;
    // The sighting ring closes in on the caster's head, turning, and snaps to a stop on the impact.
    const close = easeOut(clamp(ms / HIT));
    reticle.mesh.position.set(feet.x, env.tall * 0.75, feet.z + 0.25);
    reticle.mesh.scale.setScalar((0.6 + env.tall * 0.3) * (2.2 - 1.2 * close));
    reticle.set(1, smooth(0, 80, ms) * (1 - smooth(200, 400, hit)), hit < 0 ? sec * 3 : HIT / 1000 * 3);
    glint.put(0, feet.x, env.tall * 0.75, feet.z + 0.3, 0.9 * Math.exp(-Math.max(0, hit) / 90) * (hit > 0 ? 1 : 0) + 0.01, c[0] * 1.3, c[1] * 1.3, c[2] * 1.3, hit > 0 ? Math.exp(-hit / 90) : 0);
    glint.look(0, F.star);
    glint.hide(1);
    glint.hide(2);
    glint.flush();
    twoUp(signs, hit / 1000, feet, env.tall, ACC, ATK, 6);
  };
});

export const windDash = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const c = rgbOf(env.color, EVA);
  const gust = quads(root, Math.round(60 * env.quality), true, F.streak);
  const leaves = quads(root, Math.round(12 * env.quality), false, F.leaf);
  const signs = quads(root, 32, true, F.disc);
  const HIT = 400;
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  return (ms) => {
    const hit = ms - HIT;
    const live = smooth(0, 120, ms) * (1 - smooth(250, 500, hit));
    // Streaks of wind blow past the caster from behind it, fast and thin.
    for (let i = 0; i < gust.n; i++) {
      const t = ((ms / 300) + h(i, 0, 7)) % 1;
      const x = feet.x - dir * (1.6 - 3.2 * t);
      gust.put(i, x, env.tall * (0.1 + 0.9 * h(i, 1, 7)), feet.z + (h(i, 2, 7) - 0.5) * 0.8, 0.3, c[0] * 1.2, c[1] * 1.2, c[2] * 1.2, live * smooth(0, 0.2, t) * (1 - smooth(0.7, 1, t)) * 0.8);
      gust.stretch(i, dir * 0.9, 0, 0);
      gust.look(i, F.streak, 0, 0.5);
    }
    gust.flush();
    for (let i = 0; i < leaves.n; i++) {
      const t = ((ms / 700) + h(i, 0, 8)) % 1;
      const a = t * 9 + h(i, 1, 8) * 6;
      leaves.put(i, feet.x - dir * (1 - 2 * t), env.tall * (0.3 + 0.5 * h(i, 2, 8)) + 0.2 * Math.sin(a), feet.z + 0.2, 0.18, 0.5, 0.85, 0.4, live * 0.9);
      leaves.look(i, F.leaf, a);
    }
    leaves.flush();
    twoUp(signs, hit / 1000, feet, env.tall, EVA, SPD, 8);
  };
});

export const focusCharge = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const c = rgbOf(env.color, MATK);
  const motes = quads(root, Math.round(70 * env.quality), true, F.star);
  const ring = sigil(root, c, 0);
  ring.mesh.rotation.x = TILT;
  const signs = quads(root, 32, true, F.disc);
  const HIT = 400;
  return (ms, sec) => {
    const hit = ms - HIT;
    const chest = new THREE.Vector3(feet.x, env.tall * 0.55, feet.z + 0.2);
    gather(motes, 0, motes.n, 9, { k: clamp(ms / HIT), to: chest, radius: 1.4 + env.tall * 0.4, turns: 1.2, size: 0.2, color: [c[0] * 1.5, c[1] * 1.5, c[2] * 1.5], frame: F.star, tall: 1.2 });
    motes.flush();
    ring.mesh.position.copy(chest);
    ring.mesh.scale.setScalar((0.8 + env.tall * 0.4) * (0.6 + 0.8 * easeOut(clamp(hit / 300))));
    ring.set(1, hit > 0 ? 1 - smooth(150, 380, hit) : 0, sec);
    twoUp(signs, hit / 1000, feet, env.tall, MATK, MP, 10);
  };
});

export const cheerBurst = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const sparks = quads(root, Math.round(100 * env.quality), true, F.star);
  const signs = quads(root, 32, true, F.disc);
  const HIT = 300;
  const COLS: Rgb[] = [ATK, [1.5, 1.3, 0.5], MATK, [0.6, 1.3, 1.5]];
  return (ms) => {
    const hit = ms - HIT;
    // A fan of coloured sparks shoots up over the ally and falls round it.
    const per = Math.floor(sparks.n / COLS.length);
    COLS.forEach((c, k) => burst(sparks, k * per, per, 11 + k, { sec: hit / 1000, at: new THREE.Vector3(feet.x, env.tall * 1.1, feet.z + 0.2), life: 1, speed: 2.6, up: 3.4, grav: 5, drag: 1, size: 0.24, color: [c[0] * 1.4, c[1] * 1.4, c[2] * 1.4], frame: F.star, wide: 0.8, alpha: 1 }));
    sparks.flush();
    twoUp(signs, (hit - 60) / 1000, feet, env.tall, ATK, MATK, 12);
  };
});
