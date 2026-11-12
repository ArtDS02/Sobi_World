// Lightning effects over a whole row of foes, built on the storm parts (decision 059). `call_thunder` (Gọi Sấm): a storm front
// rolls over the row and drops one bolt on every foe, one after the other. `thunder_command` (Hiệu Lệnh Sấm): the caster throws a
// bolt up into a sky-wide storm (the command), which answers with two volleys over the foes and one colossal bolt; then lightning
// runs through the caster's own side (the speed-up). `thunder_rush` (Lao Sấm): the caster tears through the row along a line of
// lightning that lashes out at each foe it passes. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, smooth } from './effectParts';
import { h, pulse, rise } from './fxKit';
import { forked } from './lines';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { BOLT, stormCloud, stormRig, strike, strikeGain } from './stormParts';

const foot = (p: THREE.Vector3) => new THREE.Vector3(p.x, 0.05, p.z);
const skyOver = (p: THREE.Vector3, top: number, i: number) => new THREE.Vector3(p.x + (h(i, 0, 3) - 0.5) * 1.5, top + 0.2, p.z - 0.3);

export function callThunder(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = env.struck;
  const rig = stormRig(root, foes.length, env.quality, 50);
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 1.8));
  const top = Math.min(4.1, 2.6 + env.tall * 1.3);
  const cloud = stormCloud(root, span * 1.8, 2.5);
  cloud.mesh.position.set(mid.x, top + 0.8, mid.z - 0.4);
  const hits = foes.map((t, i) => ({ t: 420 + i * 160, p: rig.spot(i, t, 3.8), from: skyOver(t, top, i) }));
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const fire = Math.max(...hits.map((x) => strikeGain(ms - x.t, 320)), 0.4 * pulse(ms, 200, 60, 90));
      cloud.set(ms / 1000, smooth(0, 260, ms) * (1 - smooth(1250, 1600, ms)), fire, 0.5 + 0.5 * easeOut(clamp(ms / 360)));
      rig.begin();
      if (ms > 140 && ms < 420) {
        const step = Math.floor(ms / 50);
        for (let k = 0; k < 4; k++) rig.n = forked(rig.bolts, rig.n, a.set(mid.x + (h(k + step * 4, 0, 7) - 0.5) * span * 1.2, top + 0.3, mid.z - 0.3), b.set(a.x + (h(k, 1, step) - 0.5), top - 0.4 - 0.9 * h(k, 2, step), mid.z - 0.2), step * 5 + k, { width: 0.04, color: BOLT, forks: 1, jag: 0.28, gain: 0.8 }, 1);
      }
      hits.forEach((x, i) => {
        rig.n = strike(rig.bolts, rig.n, x.from, foot(x.p), ms, x.t, 320, 100 + i * 37, 0.16, 5);
        rig.hit(i, ms - x.t, 1.15);
      });
      // Rain of charge under the cloud while it fires.
      rise(rig.light, rig.spare, 50, 9, { sec: ms / 1000 - 0.15, dur: 1.1, life: 0.45, at: (_bn, k) => a.set(mid.x + (h(k, 8, 9) - 0.5) * span * 1.3, top + 0.2 - 0.8 * h(k, 9, 9), mid.z - 0.2), rise: -1.8, jitter: 0.2, size: 0.12, color: [1.3, 1.1, 0.5], to: [0.8, 0.5, 0.1], frame: F.star, alpha: 0.8 });
      rig.end();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

const VOLLEY = [1200, 1700] as const;
const FINAL = 2200;

export function thunderCommand(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = env.struck;
  const N = foes.length;
  const rig = stormRig(root, N * 2 + 1, env.quality, 60 + env.friends.length * 30);
  const row = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const home = new THREE.Vector3(env.from.x, 0, env.from.z);
  const top = 4.3;
  // One storm from edge to edge of the sky.
  const cloud = stormCloud(root, 15, 3.2);
  cloud.mesh.position.set((row.x + home.x) / 2, top + 1.0, row.z - 0.5);
  const hits = VOLLEY.flatMap((t0, v) => foes.map((t, i) => ({ t: t0 + i * 120, p: rig.spot(v * N + i, t, 3.6 + v * 0.8), from: skyOver(t, top, i + v * 5), power: 1 + v * 0.25 })));
  const last = rig.spot(N * 2, row, 9);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const fire = Math.max(...hits.map((x) => strikeGain(ms - x.t, 300)), strikeGain(ms - FINAL, 420) * 1.3, strikeGain(ms - 520, 420) * 0.8);
      cloud.set(ms / 1000, smooth(200, 600, ms) * (1 - smooth(2700, 3050, ms)), Math.min(1, fire) * 0.55, 0.45 + 0.55 * easeOut(clamp((ms - 200) / 500)));
      rig.begin();
      // The command: lightning leaps from the caster up into the sky and holds there, crackling.
      rig.n = strike(rig.bolts, rig.n, a.set(home.x, env.tall, home.z), b.set(home.x + (row.x - home.x) * 0.25, top + 0.5, home.z - 0.3), ms, 520, 420, 11, 0.15, 4);
      // Between volleys the cloud's belly keeps flickering.
      if (ms > 700 && ms < FINAL) {
        const step = Math.floor(ms / 60);
        for (let k = 0; k < 3; k++) rig.n = forked(rig.bolts, rig.n, a.set(cloud.mesh.position.x + (h(k + step * 3, 0, 2) - 0.5) * 12, top + 0.4, row.z - 0.4), b.set(a.x + (h(k, 1, step) - 0.5) * 1.6, top - 0.3 - 0.8 * h(k, 2, step), row.z - 0.3), step * 3 + k, { width: 0.04, color: BOLT, forks: 1, jag: 0.3, gain: 0.7 }, 1);
      }
      hits.forEach((x, i) => {
        rig.n = strike(rig.bolts, rig.n, x.from, foot(x.p), ms, x.t, 300, 200 + i * 31, 0.14 * x.power, 4);
        rig.hit(i, ms - x.t, x.power);
      });
      // The last word: one colossal bolt on the middle of the row, arcs jumping from it to every foe.
      rig.n = strike(rig.bolts, rig.n, a.set(row.x - 0.6, top + 0.8, row.z - 0.3), foot(last), ms, FINAL, 420, 401, 0.32, 8);
      const fa = ms - FINAL;
      if (fa > 0 && fa < 300) foes.forEach((t, i) => (rig.n = forked(rig.bolts, rig.n, a.set(last.x, 0.5, last.z), b.set(t.x, env.tall * 0.5, t.z), 500 + i * 7 + Math.floor(fa / 45), { width: 0.08, color: BOLT, forks: 2, jag: 0.22, gain: 1.2 * (1 - smooth(120, 300, fa)) })));
      rig.hit(N * 2, fa, 2);
      // The speed-up: lightning runs up through each friend and streaks of light shoot past them.
      env.friends.forEach((f, i) => {
        const t = ms - 2420 - i * 90;
        if (t > 0 && t < 420) rig.n = forked(rig.bolts, rig.n, a.set(f.x, 0.05, f.z), b.set(f.x + (h(i, 0, Math.floor(t / 50)) - 0.5) * 0.6, env.tall * 1.5, f.z), 700 + i * 13 + Math.floor(t / 50), { width: 0.06, color: BOLT, forks: 2, jag: 0.2, gain: 1 - smooth(200, 420, t) });
        rise(rig.light, rig.spare + 60 + i * 30, 30, 30 + i, { sec: t / 1000, dur: 0.45, life: 0.4, at: () => a.set(f.x, 0.1, f.z), rise: 4.2, jitter: 0.9, size: 0.16, color: [1.5, 1.3, 0.5], to: [1, 0.7, 0.1], frame: F.streak, grow: 0.5 });
      });
      rise(rig.light, rig.spare, 60, 9, { sec: ms / 1000 - 0.6, dur: 2, life: 0.45, at: (_bn, k) => a.set(cloud.mesh.position.x + (h(k, 8, 9) - 0.5) * 13, top + 0.3 - 0.8 * h(k, 9, 9), row.z - 0.2), rise: -1.8, jitter: 0.2, size: 0.13, color: [1.3, 1.1, 0.5], to: [0.8, 0.5, 0.1], frame: F.star, alpha: 0.8 });
      rig.end();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function thunderRush(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = env.struck;
  const rig = stormRig(root, foes.length, env.quality, 60);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const y = env.tall * 0.55;
  const start = new THREE.Vector3(env.from.x, y, env.from.z);
  const far = Math.max(...foes.map((t) => (t.x - env.from.x) * dir)) + 1.8;
  const end = new THREE.Vector3(env.from.x + dir * far, y, env.origin.z);
  const hits = foes.map((t, i) => ({ t: 520 + i * 150, p: rig.spot(i, t, 3.2) }));
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      rig.begin();
      // The line of the charge: it shoots out with the dash and keeps re-striking while the caster is in it.
      const run = clamp((ms - 400) / 260);
      const live = ms > 400 && ms < 1150;
      if (live) {
        const step = Math.floor(ms / 45);
        const gain = (0.7 + 0.3 * h(step, 0, 1)) * (1 - smooth(850, 1150, ms));
        b.copy(start).lerp(end, easeOut(run));
        for (let k = 0; k < 2; k++) rig.n = forked(rig.bolts, rig.n, a.copy(start).setZ(start.z + (k - 0.5) * 0.3), b, step * 7 + k, { width: 0.13 - k * 0.04, color: BOLT, forks: 3, jag: 0.07, gain });
      }
      hits.forEach((x, i) => {
        // As the line passes a foe it lashes down into it.
        a.set(x.p.x - dir * 0.5, y + 0.9, x.p.z);
        rig.n = strike(rig.bolts, rig.n, a, foot(x.p), ms, x.t, 220, 300 + i * 17, 0.11, 3);
        rig.hit(i, ms - x.t, 0.95);
      });
      rise(rig.light, rig.spare, 60, 5, { sec: (ms - 400) / 1000, dur: 0.5, life: 0.4, at: (born) => a.copy(start).lerp(end, easeOut(clamp(born / 0.26))), rise: 0.8, jitter: 0.5, size: 0.16, color: [1.5, 1.3, 0.6], to: [0.9, 0.5, 0.05], frame: F.ember, grow: 0.3 });
      rig.end();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
