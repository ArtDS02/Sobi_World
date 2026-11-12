// Fire effects over a whole row of foes in 3D (prototype, decision 059). `lava_flood` (Phun Dung Nham): lava floods the ground under the
// row and geysers burst. `magma_cone` (Hơi Thở Dung Nham): a stream of magma blown from the caster over the row. `meteor_rain` (Mưa Thiên Thạch):
// meteors fall in two waves. `flame_pillars` (Lửa Tượng Thần): a crown of flame over each foe, then a pillar. Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, easeOut, easeOut3, rng, ripple, smooth } from './effectParts';
import { fireCloud, flameColumn, lavaPool, seeds4, trail, type FireCloud } from './fireParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

/** Three standing spots across the row, spread by the row's width. */
const slots = (env: Vfx3dEnv) => [-0.5, 0, 0.5].map((k, i) => new THREE.Vector3(env.origin.x + k * Math.min(2.4, env.unit), 0, env.origin.z + (i === 1 ? 0.35 : -0.25 + i * 0.1)));

/** Ballistic embers thrown up from `from` between `t0` and `t1`; `hold` is how long they live. */
function eruption(fc: FireCloud, seeds: readonly (readonly [number, number, number, number])[], ms: number, t0: number, from: THREE.Vector3, power: number, hold = 1000) {
  for (let i = 0; i < fc.n; i++) {
    const [a, vh, vy, d] = seeds[i % seeds.length]!;
    const t = (ms - t0) / 1000 - d * 0.25;
    if (t <= 0 || t > hold / 1000) {
      fc.hide(i);
      continue;
    }
    const ang = a * 6.2832;
    fc.put(i, from.x + Math.cos(ang) * (vh + 0.6) * t * power * 0.6, from.y + Math.max(0.05, (vy + 1.5) * t * power - 4.9 * t * t), from.z + Math.sin(ang) * (vh + 0.6) * t * power * 0.4, t / (hold / 1000));
  }
  fc.flush();
}

export function lavaFlood(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(61);
  const spots = slots(env);
  const W = 2.4 * Math.min(2.4, env.unit) + 1.2;
  const pool = lavaPool(root);
  pool.mesh.position.set(env.origin.x, 0.03, env.origin.z);
  const geysers = spots.map((s) => {
    const c = flameColumn(root);
    c.mesh.position.copy(s);
    return c;
  });
  const sparks = spots.map(() => fireCloud(root, 60, 0.2));
  const seeds = seeds4(60, rand);
  return {
    update(ms) {
      const grow = easeOut3(clamp((ms - 380) / 600));
      pool.set(W * grow, W * 0.7 * grow, ms / 1000, smooth(380, 520, ms) * (1 - smooth(1100, 1550, ms)));
      spots.forEach((s, i) => {
        const t0 = 450 + i * 120;
        const u = (ms - t0) / 700;
        geysers[i]!.set(0.34 + 0.12 * easeOut(clamp(u * 2)), 1.7 * easeOut(clamp(u * 3)), ms / 1000, u > 0 ? smooth(0, 0.1, u) * (1 - smooth(0.55, 1, u)) : 0);
        eruption(sparks[i]!, seeds, ms, t0, s, 0.8, 900);
      });
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
  const rand = rng(67);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const mouth = new THREE.Vector3(env.from.x + dir * 0.5, 0.75, env.from.z);
  const goal = new THREE.Vector3(env.origin.x, 0.5, env.origin.z);
  const stream = fireCloud(root, 520, 0.3);
  const seeds = seeds4(stream.n, rand);
  const pool = lavaPool(root);
  pool.mesh.position.set(env.origin.x, 0.03, env.origin.z);
  const W = 2 * Math.min(2.4, env.unit) + 1.2;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      for (let i = 0; i < stream.n; i++) {
        const [b, jx, jy, jz] = seeds[i]!;
        const born = 450 + b * 600;
        const t = (ms - born) / 520;
        if (t <= 0 || t > 1.25) {
          stream.hide(i);
          continue;
        }
        const k = Math.min(t, 1);
        p.lerpVectors(mouth, goal, k);
        p.y += jy * k * 1.5 + Math.sin(Math.PI * k) * 0.25 - Math.max(0, t - 1) * 1.4;
        p.z += jz * k * 3.4;
        p.x += jx * k * 1.2 + dir * Math.max(0, t - 1) * 0.9;
        stream.put(i, p.x, Math.max(0.05, p.y), p.z, t / 1.25);
      }
      stream.flush();
      const g = easeOut(clamp((ms - 800) / 400));
      pool.set(W * g, W * 0.7 * g, ms / 1000, smooth(800, 950, ms) * (1 - smooth(1150, 1550, ms)));
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
  const rand = rng(71);
  const spots = slots(env);
  const rock = new THREE.MeshStandardMaterial({ color: 0x3a2018, emissive: 0xff4a10, emissiveIntensity: 0.9, roughness: 0.8, flatShading: true });
  // Two waves: (fall start, impact) per meteor; the middle ones land together, the second wave 300 ms later.
  const plan = [[600, 1000, 0], [640, 1040, 2], [900, 1300, 1], [940, 1340, 0], [980, 1380, 2]] as const;
  const items = plan.map(([t0, t1, si], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), rock);
    root.add(m);
    const fire = fireCloud(root, 70, 0.3);
    const burst = fireCloud(root, 60, 0.2);
    const col = flameColumn(root);
    const spot = spots[si]!.clone().add(new THREE.Vector3((i % 2 ? 0.25 : -0.2) * Math.min(2, env.unit), 0, 0));
    col.mesh.position.copy(spot);
    const crater = lavaPool(root);
    crater.mesh.position.set(spot.x, 0.03, spot.z);
    const shock = ripple(root, 2.6, 2.0, 0xff5a1a, 0xffe0a0);
    shock.mesh.position.set(spot.x, 0.02, spot.z);
    return { t0, t1, m, fire, burst, col, crater, shock, spot, seeds: seeds4(70, rand), bs: seeds4(60, rand) };
  });
  return {
    update(ms) {
      for (const it of items) {
        const k = clamp((ms - it.t0) / (it.t1 - it.t0));
        const at = (t: number) => {
          const u = clamp((t - it.t0) / (it.t1 - it.t0));
          return new THREE.Vector3(it.spot.x - (1 - u) * 2.4, 0.4 + 4.2 * (1 - u * u), it.spot.z);
        };
        it.m.visible = ms >= it.t0 && ms < it.t1;
        it.m.position.copy(at(ms));
        it.m.rotation.set(ms * 0.01, ms * 0.007, 0);
        it.m.scale.setScalar(0.7 + 0.5 * k);
        trail(it.fire, it.seeds, ms, it.t0, it.t1, 380, at, 0.3, 0.3);
        eruption(it.burst, it.bs, ms, it.t1, it.spot, 0.9, 800);
        const s = ms - it.t1;
        it.col.set(0.4, 1.4 * easeOut(clamp(s / 200)), ms / 1000, s > 0 ? smooth(0, 50, s) * (1 - smooth(250, 600, s)) : 0);
        it.crater.set(1.3 * easeOut(clamp(s / 220)), 1 * easeOut(clamp(s / 220)), ms / 1000, s > 0 ? smooth(0, 60, s) * (1 - smooth(500, 1000, s)) : 0);
        it.shock.set(s / 1000, s > 0 ? smooth(0, 60, s) * (1 - smooth(400, 900, s)) : 0);
      }
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
  const rand = rng(73);
  const spots = slots(env);
  const items = spots.map((s, i) => {
    const crown = fireCloud(root, 46, 0.2);
    const col = flameColumn(root);
    col.mesh.position.copy(s);
    const sparks = fireCloud(root, 50, 0.18);
    const scorch = ripple(root, 1.9, 1.5, 0xff5a1a, 0xffc060);
    scorch.mesh.position.set(s.x, 0.02, s.z);
    return { s, crown, col, sparks, scorch, start: 400 + i * 110, bs: seeds4(50, rand) };
  });
  return {
    update(ms) {
      for (const it of items) {
        const pop = smooth(it.start, it.start + 250, ms);
        const gone = 1 - smooth(it.start + 480, it.start + 560, ms);
        for (let i = 0; i < it.crown.n; i++) {
          const a = (i / it.crown.n) * 6.2832 + ms * 0.004;
          const r = 0.55 * pop;
          const life = 0.15 + 0.5 * ((i * 0.37 + ms * 0.0015) % 1);
          if (pop * gone < 0.02) it.crown.hide(i);
          else it.crown.put(i, it.s.x + Math.cos(a) * r, 1.45 + 0.12 * Math.sin(a * 3 + ms * 0.01) + life * 0.25, it.s.z + Math.sin(a) * r * 0.7, life);
        }
        it.crown.flush();
        const e = ms - (it.start + 500);
        it.col.set(0.45, 2.1 * easeOut(clamp(e / 250)), ms / 1000, e > 0 ? smooth(0, 60, e) * (1 - smooth(300, 650, e)) : 0);
        eruption(it.sparks, it.bs, ms, it.start + 500, it.s, 0.7, 800);
        it.scorch.set(e / 1000, e > 0 ? smooth(0, 80, e) * (1 - smooth(300, 800, e)) : 0);
      }
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
