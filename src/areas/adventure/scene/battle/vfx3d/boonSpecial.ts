// Special supports, rebuilt per kind (decision 059). `mp_stream` (Truyền Năng): blue orbs leave the caster one after another and
// arc over to the ally, which drinks them in (a blue ring, rising motes). `doom_sigil` (Dấu Diệt Vong): a dark ring sigil is drawn
// in the air over the target while three motes of night circle it; it comes down onto the target and brands it in a burst of dark
// (the countdown itself is the status's own mark). `void_veil` (Màn Hư Vô): a curtain of starry night sweeps across the whole field;
// every unit it passes sheds the glints of its states, friend and foe. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { MP, rgbOf, sigil } from './boonParts';
import { clamp, easeOut, smooth } from './effectParts';
import { burst, gather, h, rise, type Rgb } from './fxKit';
import { quads } from './quads';
import { VOID, VOID_HOT } from './riftParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
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

export const mpStream = (env: Vfx3dEnv) => handle(env, (root) => {
  const c = rgbOf(env.color, MP);
  const src = new THREE.Vector3(env.from.x, env.tall * 0.7, env.from.z);
  const dst = new THREE.Vector3(env.origin.x, env.tall * 0.55, env.origin.z);
  const orbs = quads(root, 7 * 3, true, F.soft);
  const motes = quads(root, Math.round(30 * env.quality), true, F.star);
  const ring = shock(root, new THREE.Vector3(dst.x, 0, dst.z), 2, c);
  const HIT = 650;
  const p = new THREE.Vector3();
  return (ms) => {
    const hit = ms - HIT;
    // Seven orbs, 60 ms apart, each flying 380 ms on an arc; the last one lands on the impact. Each has a short tail.
    for (let k = 0; k < 7; k++) {
      const t0 = HIT - 380 - (6 - k) * 60;
      for (let j = 0; j < 3; j++) {
        const u = clamp((ms - t0 - j * 25) / 380);
        const i = k * 3 + j;
        const on = ms > t0 + j * 25 && u < 1;
        p.copy(src).lerp(dst, u);
        p.y += Math.sin(u * Math.PI) * (1 + env.tall * 0.4);
        orbs.put(i, p.x, p.y, p.z + 0.2, on ? 0.75 - j * 0.18 : 0, c[0] * 1.5, c[1] * 1.5, c[2] * 1.5, on ? 1 - j * 0.25 : 0);
        orbs.look(i, F.soft);
      }
    }
    orbs.flush();
    // The ally drinks them in: motes gather to it, then rise off it.
    gather(motes, 0, Math.floor(motes.n / 2), 2, { k: clamp((ms - 300) / 400), to: dst, radius: 1.1, turns: 0.6, size: 0.12, color: c, frame: F.star, tall: 0.8 });
    rise(motes, Math.floor(motes.n / 2), motes.n - Math.floor(motes.n / 2), 3, { sec: hit / 1000, dur: 0.4, life: 0.8, at: (_b, k) => new THREE.Vector3(dst.x + (h(k, 8, 3) - 0.5) * 0.7, 0.2, dst.z + 0.2), rise: 1.6, jitter: 0.2, size: 0.13, color: c, frame: F.star, grow: 0.4 });
    motes.flush();
    ring(hit / 320, hit > 0 ? 1 - smooth(160, 320, hit) : 0);
  };
});

export const doomSigil = (env: Vfx3dEnv) => handle(env, (root) => {
  const c: Rgb = rgbOf(env.color, [0.75, 0.35, 1.1]);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const mark = sigil(root, c, 12);
  mark.mesh.rotation.x = TILT;
  const floor = sigil(root, c, 12);
  floor.mesh.rotation.x = -Math.PI / 2;
  floor.mesh.position.set(feet.x, 0.04, feet.z);
  const orbit = quads(root, 3, false, F.soft);
  const dark = quads(root, Math.round(40 * env.quality), false, F.smoke);
  const HIT = 700;
  return (ms, sec) => {
    const hit = ms - HIT;
    // Drawn in the air above the target, turning; three motes of night circle it; it drops onto the target on the impact.
    const drop = smooth(HIT - 120, HIT, ms);
    const S = 1 + env.tall * 0.5;
    mark.mesh.position.set(feet.x, env.tall * (1.7 - 1.15 * drop), feet.z + 0.1);
    mark.mesh.scale.setScalar(S * (1 - 0.3 * drop));
    mark.set(easeOut(clamp((ms - 80) / 420)), smooth(80, 160, ms) * (1 - smooth(0, 120, hit)), sec * 2);
    for (let k = 0; k < 3; k++) {
      const a = sec * 4 + (k / 3) * 6.283;
      const y = env.tall * (1.7 - 1.15 * drop);
      orbit.put(k, feet.x + Math.cos(a) * S * 0.6, y + Math.sin(a) * S * 0.2, feet.z + 0.2, 0.3, 0.12, 0.05, 0.2, smooth(150, 300, ms) * (1 - smooth(0, 80, hit)));
      orbit.look(k, F.soft);
    }
    orbit.flush();
    // The brand: the ring burns into the ground under the target and dark bursts off it.
    floor.mesh.scale.set(S * 1.4, S, 1);
    floor.set(hit > 0 ? 1 : 0, hit > 0 ? 1 - smooth(350, 650, hit) : 0, sec * -2);
    burst(dark, 0, dark.n, 4, { sec: hit / 1000, at: new THREE.Vector3(feet.x, env.tall * 0.5, feet.z + 0.2), life: 0.8, speed: 1.6, up: 1.2, grav: 0, drag: 2, size: 0.32, color: [0.12, 0.05, 0.22], to: [0.3, 0.15, 0.5], frame: F.smoke, alpha: 0.7 });
    dark.flush();
  };
});

export const voidVeil = (env: Vfx3dEnv) => handle(env, (root) => {
  const units = [...env.targets, ...env.friends].map((t) => new THREE.Vector3(t.x, 0, t.z));
  const xs = units.map((u) => u.x);
  const x0 = Math.min(...xs) - 2;
  const x1 = Math.max(...xs) + 2;
  const zm = units.reduce((s, u) => s + u.z, 0) / Math.max(1, units.length);
  const wall = quads(root, Math.round(260 * env.quality), true, F.star);
  const mist = quads(root, Math.round(40 * env.quality), false, F.smoke);
  const per = 8;
  const shed = quads(root, units.length * per, true, F.shard);
  return (ms, sec) => {
    // The curtain: a wall of stars and thin night travelling across the field.
    const k = clamp((ms - 100) / 600);
    const bx = x0 + (x1 - x0) * k;
    const live = smooth(100, 200, ms) * (1 - smooth(650, 800, ms));
    for (let i = 0; i < wall.n; i++) {
      wall.put(i, bx + (h(i, 1, 1) - 0.5) * 0.9, h(i, 2, 1) * env.tall * 2.4, zm + (h(i, 3, 1) - 0.5) * 3, 0.13 * (0.6 + h(i, 4, 1)), VOID_HOT[0], VOID_HOT[1], VOID_HOT[2], live * (0.5 + 0.5 * Math.sin(sec * 9 + i)));
      wall.look(i, F.star);
    }
    wall.flush();
    for (let i = 0; i < mist.n; i++) {
      mist.put(i, bx + (h(i, 1, 2) - 0.5) * 1.2, h(i, 2, 2) * env.tall * 2, zm + (h(i, 3, 2) - 0.5) * 3, 0.6, 0.35, 0.28, 0.7, live * 0.2);
      mist.look(i, F.smoke, h(i, 4, 2) * 6.28);
    }
    mist.flush();
    // Each unit, as the curtain passes it, sheds the glints of its states (they fly up and go out).
    units.forEach((u, i) => {
      const at = 100 + 600 * clamp((u.x - x0) / (x1 - x0));
      burst(shed, i * per, per, 10 + i, { sec: (ms - at) / 1000, at: new THREE.Vector3(u.x, env.tall * 0.7, u.z + 0.2), life: 0.7, speed: 1.2, up: 2.6, grav: 1.5, drag: 1, size: 0.16, color: [1.2, 1.1, 1.5], to: VOID, frame: F.shard, wide: 0.6, alpha: 0.85 });
    });
    shed.flush();
  };
});
