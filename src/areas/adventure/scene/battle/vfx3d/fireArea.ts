// Fire skills over a whole row, rebuilt on the flame parts (decision 059). `lava_flood` (Phun Dung Nham): lava wells up and
// spreads under the foes' row, a fountain of it bursting under each foe in turn. `magma_cone` (Hơi Thở Dung Nham): a roaring cone
// of fire and molten drops from the monster's mouth sweeps the row and leaves it burning. `meteor_rain` (Mưa Thiên Thạch): burning
// rocks fall slantwise out of the sky, one on each foe, then a great one on the middle. `flame_pillars` (Lửa Tượng Thần): a crown
// of fire closes over the row, then a pillar of flame stands up under every foe. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, smooth } from './effectParts';
import { HOT, RED, fireBurst, flame, glow, hotIron, lava, smokeUp } from './flameParts';
import { burst, h, rise } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { scorch, shock } from './stormParts';

const RING = [1.2, 0.5, 0.1] as const;
const LAVA_DROP = [1, 0.62, 0.12] as const;
const LAVA_COLD = [0.7, 0.16, 0.04] as const;
/** The row as an effect needs it: its middle, how far its foes spread, and the foes in the order the skill reaches them. */
function rowOf(env: Vfx3dEnv) {
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const foes = env.struck.map((t) => t.clone().setY(0));
  const span = Math.max(2.6, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 1.8));
  return { mid, foes, span };
}

export function lavaFlood(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { mid, foes, span } = rowOf(env);
  const pool = lava(root, span * 1.9, 3.6);
  pool.mesh.position.set(mid.x, 0.015, mid.z);
  const hits = foes.map((p, i) => ({ p, t: 400 + i * 120, f: flame(root, 11 + i), ring: shock(root, p, 3, RING) }));
  hits.forEach((x) => x.f.mesh.position.copy(x.p));
  const light = quads(root, Math.round(120 * env.quality) * hits.length + 40, true, F.flame);
  const drops = quads(root, Math.round(60 * env.quality) * hits.length, false, F.drop);
  const smoke = quads(root, 12 * hits.length, false, F.smoke);
  const per = Math.floor((light.n - 40) / hits.length);
  const dper = Math.floor(drops.n / hits.length);
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      // The lava wells up first (the ground glows and swells), is hottest as the fountains go, then crusts over.
      pool.set(easeOut3(clamp((ms - 80) / 520)), sec, smooth(80, 240, ms) * (1 - smooth(1200, 1500, ms)), 0.6 + 0.6 * smooth(250, 450, ms) * (1 - smooth(800, 1300, ms)));
      hits.forEach((x, i) => {
        const age = ms - x.t;
        const k = age / 700;
        x.f.set(1.1, (1.5 + env.tall * 0.9) * Math.sin(Math.PI * clamp(k) ** 0.45), sec + i, k > 0 && k < 1 ? smooth(0, 0.06, k) * (1 - smooth(0.55, 1, k)) : 0, 0.15 * Math.sin(sec * 5 + i));
        fireBurst(light, i * per, per, 20 + i, age / 1000, p.set(x.p.x, 0.2, x.p.z), 0.9);
        burst(drops, i * dper, dper, 30 + i, { sec: age / 1000, at: p, life: 0.9, speed: 2.6, up: 6, grav: 12, size: 0.2, color: LAVA_DROP, to: LAVA_COLD, frame: F.drop, stretch: 0.035, wide: 0.7 });
        x.ring(age / 340, age > 0 ? 1 - smooth(170, 340, age) : 0);
        smokeUp(smoke, i * 12, 12, 40 + i, (age - 150) / 1000, x.p, 0.5, 0.7);
      });
      // Bubbles of gas bursting on the lava all along.
      rise(light, hits.length * per, 40, 5, { sec: sec - 0.2, dur: 1, life: 0.35, at: (_b, k) => p.set(mid.x + (h(k, 8, 5) - 0.5) * span * 1.5, 0.08, mid.z + (h(k, 9, 5) - 0.5) * 2), rise: 1.6, jitter: 0.1, size: 0.2, color: HOT, to: RED, frame: F.ember, grow: 0.3 });
      light.flush();
      drops.flush();
      smoke.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function magmaCone(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { mid, foes, span } = rowOf(env);
  const dir = mid.x >= env.from.x ? 1 : -1;
  const from = new THREE.Vector3(env.from.x + dir * 0.6, env.tall * 0.6, env.from.z);
  const far = Math.max(...foes.map((t) => (t.x - from.x) * dir)) + 0.9;
  const breath = quads(root, Math.round(300 * env.quality), true, F.flame);
  const gobs = quads(root, Math.round(90 * env.quality), false, F.drop);
  const smoke = quads(root, 30, false, F.smoke);
  const pool = lava(root, span * 1.8, 3.2);
  pool.mesh.position.set(mid.x, 0.015, mid.z);
  const hits = foes.map((p, i) => ({ p, t: 450 + i * 100, f: flame(root, 21 + i) }));
  hits.forEach((x) => x.f.mesh.position.copy(x.p));
  const aura = glow(root, 0xff6a1a);
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      // The breath: flames leave the mouth for 650 ms, fan out and slow as they cross the row.
      const stream = (q: typeof breath, i: number, seed: number, life: number, droop: number) => {
        const t = (ms - 250 - h(i, 0, seed) * 650) / life;
        if (t <= 0 || t >= 1) {
          q.hide(i);
          return -1;
        }
        const e = easeOut(t);
        const wide = 0.12 + 1.5 * e;
        p.set(from.x + dir * far * e, from.y * (1 - 0.6 * e) + (h(i, 1, seed) - 0.4) * wide * 0.7 - droop * t * t, from.z + (h(i, 2, seed) - 0.5) * wide * 1.1);
        return t;
      };
      for (let i = 0; i < breath.n; i++) {
        const t = stream(breath, i, 1, 480, 0);
        if (t < 0) continue;
        const hot = 1 - t;
        breath.put(i, p.x, Math.max(0.08, p.y), p.z, 0.45 + 1.0 * t, 1 + 0.4 * hot, 0.3 + 0.65 * hot * hot, 0.05 + 0.3 * hot * hot * hot, 0.4 * smooth(0, 0.1, t) * (1 - smooth(0.6, 1, t)));
        breath.look(i, F.flame, -dir * 1.2 + (h(i, 3, 1) - 0.5));
      }
      breath.flush();
      for (let i = 0; i < gobs.n; i++) {
        const t = stream(gobs, i, 2, 560, 0.9);
        if (t < 0) continue;
        gobs.put(i, p.x, Math.max(0.05, p.y), p.z, 0.16 + 0.1 * h(i, 3, 2), LAVA_DROP[0], LAVA_DROP[1] * (1 - 0.6 * t), LAVA_DROP[2], 0.95 * (1 - smooth(0.85, 1, t)));
        gobs.stretch(i, dir * 0.22 * (1 - t), -0.1 * t, 0);
        gobs.look(i, F.drop, 0, 0.5);
      }
      gobs.flush();
      aura(from.x + dir * 0.4, from.y, from.z, 2.6, 0.5 * smooth(200, 320, ms) * (1 - smooth(850, 1000, ms)));
      pool.set(easeOut3(clamp((ms - 420) / 500)), sec, smooth(420, 560, ms) * (1 - smooth(1200, 1500, ms)), 0.5 + 0.6 * (1 - smooth(800, 1300, ms)));
      hits.forEach((x, i) => {
        const k = (ms - x.t) / 800;
        x.f.set(1.0, (1.1 + env.tall * 0.8) * Math.sin(Math.PI * clamp(k) ** 0.5) * (1 + 0.08 * Math.sin(sec * 21 + i)), sec + i, k > 0 && k < 1 ? smooth(0, 0.08, k) * (1 - smooth(0.6, 1, k)) : 0, dir * 0.45 * (1 - clamp(k)));
      });
      smokeUp(smoke, 0, smoke.n, 3, (ms - 700) / 1000, mid, span * 0.6, 0.9);
      smoke.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function meteorRain(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { mid, foes } = rowOf(env);
  const rock = hotIron(0x3a2620);
  // One meteor per foe from 1000 (100 ms apart), then the big one on the middle of the row at 1300.
  const list = [...foes.map((p, i) => ({ p, t: 1000 + i * 100, r: 0.36, power: 1 })), { p: mid, t: 1300, r: 0.72, power: 1.7 }].map((m, i) => {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(m.r, 1), rock.mat);
    root.add(mesh);
    // They come down slantwise, from up and behind the caster's side.
    const start = new THREE.Vector3(m.p.x + 3.4 + h(i, 0, 1), 6.2, m.p.z - 0.4);
    return { ...m, mesh, start, mark: scorch(root, m.p, 1.2 * m.power), ring: shock(root, m.p, 3.4 * m.power, RING), f: flame(root, 31 + i), tail: glow(root, 0xff7a20) };
  });
  list.forEach((m) => m.f.mesh.position.copy(m.p));
  const per = Math.round(110 * env.quality);
  const light = quads(root, list.length * per, true, F.flame);
  const smoke = quads(root, list.length * 10, false, F.smoke);
  const p = new THREE.Vector3();
  const FALL = 420;
  return {
    update(ms) {
      const sec = ms / 1000;
      rock.set(0.56 + 0.08 * Math.sin(ms * 0.02), 1);
      list.forEach((m, i) => {
        const age = ms - m.t;
        const k = clamp((age + FALL) / FALL);
        const at = (kk: number, out: THREE.Vector3) => out.copy(m.start).lerp(m.p, kk * kk * 0.5 + kk * 0.5);
        at(k, p);
        m.mesh.visible = age > -FALL && age < 0;
        m.mesh.position.copy(p);
        m.mesh.rotation.set(ms * 0.012 + i, ms * 0.009, 0);
        m.tail(p.x, p.y, p.z, m.r * 7, m.mesh.visible ? 0.6 : 0);
        const trailN = Math.floor(per * 0.35);
        rise(light, i * per, trailN, 50 + i, { sec: (age + FALL) / 1000, dur: FALL / 1000, life: 0.3, at: (born) => { const kk = clamp((born * 1000) / FALL); return at(kk, p); }, rise: 0.6, jitter: m.r * 1.4, size: m.r * 1.3, color: [1, 0.4, 0.06], to: RED, frame: F.flame, grow: 0.4, alpha: 0.32 });
        fireBurst(light, i * per + trailN, per - trailN, 60 + i, age / 1000, p.set(m.p.x, 0.25, m.p.z), m.power);
        const fk = age / 620;
        m.f.set(1.2 * m.power, (1.6 + env.tall * 0.7) * m.power * Math.sin(Math.PI * clamp(fk) ** 0.45), sec + i, fk > 0 && fk < 1 ? smooth(0, 0.06, fk) * (1 - smooth(0.55, 1, fk)) : 0);
        m.mark(age > 0 ? smooth(0, 50, age) * (1 - smooth(700, 1050, age)) : 0, Math.exp(-Math.max(0, age) / 350));
        m.ring(age / 400, age > 0 ? 1 - smooth(200, 400, age) : 0);
        smokeUp(smoke, i * 10, 10, 70 + i, (age - 120) / 1000, m.p, 0.5 * m.power, 0.8 * m.power);
      });
      light.flush();
      smoke.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function flamePillars(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { mid, foes, span } = rowOf(env);
  const top = 1.3 + env.tall * 1.1;
  const hits = foes.map((p, i) => ({ p, t: 900 + i * 110, f: flame(root, 41 + i), back: flame(root, 51 + i), ring: shock(root, p, 3.2, RING), mark: scorch(root, p, 1.1) }));
  hits.forEach((x) => {
    x.f.mesh.position.copy(x.p);
    x.back.mesh.position.set(x.p.x, 0, x.p.z - 0.25);
  });
  const per = Math.round(90 * env.quality);
  const crownN = Math.round(140 * env.quality);
  const light = quads(root, hits.length * per + crownN, true, F.flame);
  const smoke = quads(root, hits.length * 10, false, F.smoke);
  const halo = glow(root, 0xffa030);
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      // The crown: a ring of flames turning over the row, closing in and sinking as the idol's fire gathers, gone as the pillars rise.
      const gatherK = clamp((ms - 200) / 700);
      const live = smooth(200, 380, ms) * (1 - smooth(900, 1100, ms));
      for (let i = 0; i < crownN; i++) {
        const a = (i / crownN) * 6.2832 * 3 + sec * 3.2 + h(i, 0, 1);
        const r = span * (0.75 - 0.3 * gatherK) * (0.85 + 0.3 * h(i, 1, 1));
        const flick = 0.5 + 0.5 * Math.sin(sec * 14 + i * 1.7);
        light.put(i, mid.x + Math.cos(a) * r, top - 0.7 * gatherK + 0.25 * h(i, 2, 1) + 0.1 * flick, mid.z + Math.sin(a) * r * 0.4, 0.3 + 0.2 * flick, 1.1, 0.42 + 0.2 * flick, 0.08, 0.36 * live);
        light.look(i, F.flame, 0.3 * Math.sin(a));
      }
      halo(mid.x, top - 0.5 * gatherK, mid.z, span * 1.4, 0.2 * live);
      hits.forEach((x, i) => {
        const age = ms - x.t;
        const k = age / 800;
        const env01 = k > 0 && k < 1 ? smooth(0, 0.05, k) * (1 - smooth(0.6, 1, k)) : 0;
        const tallK = Math.sin(Math.PI * clamp(k) ** 0.4) * (1 + 0.06 * Math.sin(sec * 25 + i));
        x.f.set(1.15, (2.6 + env.tall * 1.3) * tallK, sec + i, env01);
        x.back.set(1.7, (1.9 + env.tall) * tallK, sec * 0.8 + i + 4, env01 * 0.7);
        fireBurst(light, crownN + i * per, per, 80 + i, age / 1000, p.set(x.p.x, 0.3, x.p.z), 0.9);
        x.ring(age / 360, age > 0 ? 1 - smooth(180, 360, age) : 0);
        x.mark(age > 0 ? smooth(0, 60, age) * (1 - smooth(500, 850, age)) : 0, Math.exp(-Math.max(0, age) / 300));
        smokeUp(smoke, i * 10, 10, 90 + i, (age - 250) / 1000, x.p, 0.4, 0.7);
      });
      light.flush();
      smoke.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
