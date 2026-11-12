// Parts of the earth effects (prototype, decision 059): where things stand, stone chips, dust and thrusting spikes.
import * as THREE from 'three';
import { clamp, cloud, easeOut, easeOutBack, park, rng, smooth } from './effectParts';
import { seeds } from './natureParts';
import type { Vfx3dEnv } from './stage3d';

export const mouthOf = (env: Vfx3dEnv) => new THREE.Vector3(env.from.x + (env.origin.x >= env.from.x ? 0.5 : -0.5), 0.5, env.from.z);
export const chestOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, 0.5, env.origin.z);
export const slots = (env: Vfx3dEnv) => [-0.5, 0, 0.5].map((k, i) => new THREE.Vector3(env.origin.x + k * Math.min(2.4, env.unit), 0, env.origin.z + (i === 1 ? 0.35 : -0.25 + i * 0.1)));
export const stone = () => new THREE.MeshStandardMaterial({ color: 0x8a7a66, roughness: 0.9, flatShading: true, transparent: true });

/** Stone chips thrown from a point: `set` poses them `ms` after their start. */
export function shards(parent: THREE.Object3D, n: number, size: number, mat: THREE.Material, seed: number) {
  const rand = rng(seed);
  const items = Array.from({ length: n }, () => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(size * (0.5 + rand()), 0), mat);
    parent.add(m);
    return { m, a: rand() * 6.2832, vh: 0.8 + rand() * 2.4, vy: 2 + rand() * 4, spin: (rand() - 0.5) * 14 };
  });
  return {
    set(sec: number, at: THREE.Vector3, power = 1) {
      for (const it of items) {
        it.m.visible = sec > 0 && sec < 1.1;
        if (!it.m.visible) continue;
        it.m.position.set(at.x + Math.cos(it.a) * it.vh * sec * power * 0.7, Math.max(0.05, at.y + (it.vy * sec - 4.9 * sec * sec) * power * 0.7), at.z + Math.sin(it.a) * it.vh * sec * power * 0.5);
        it.m.rotation.set(sec * it.spin, sec * it.spin * 0.7, 0);
        it.m.scale.setScalar(1 - smooth(0.7, 1.1, sec));
      }
    },
  };
}

/** Dust that swells and rises round `at` for 900 ms from `t0`. */
export function dustAt(c: ReturnType<typeof cloud>, sd: ReturnType<typeof seeds>, ms: number, at: THREE.Vector3, t0: number, reach: number) {
  const t = (ms - t0) / 900;
  for (let i = 0; i < c.n; i++) {
    const [b, jx, jy, ph] = sd[i]!;
    if (t <= 0 || t > 1) {
      park(c, i);
      continue;
    }
    const r = (0.15 + b * 0.85) * reach * easeOut(clamp(t * 1.5));
    c.pos.setXYZ(i, at.x + Math.cos(ph) * r * 1.2, 0.15 + t * 0.7 + jy * 0.4, at.z + Math.sin(ph) * r * 0.85 + jx * 0.2);
  }
  c.pos.needsUpdate = true;
}

/** `n` stone spikes round `at`, thrusting up to about `h` at `t0`. */
export function spikes(parent: THREE.Object3D, mat: THREE.Material, at: THREE.Vector3, n: number, h: number, seed: number) {
  const rand = rng(seed);
  const list = Array.from({ length: n }, (_, k) => {
    const hh = h * (0.7 + rand() * 0.6);
    const g = new THREE.ConeGeometry(0.2 + rand() * 0.1, hh, 5);
    g.translate(0, hh / 2, 0);
    const m = new THREE.Mesh(g, mat);
    const a = (k / n) * 6.2832 + rand();
    m.position.set(at.x + Math.cos(a) * 0.55, 0, at.z + Math.sin(a) * 0.4);
    m.rotation.set(Math.sin(a) * 0.3, rand() * 3, -Math.cos(a) * 0.3);
    parent.add(m);
    return { m, d: k * 25 };
  });
  return (ms: number, t0: number, alive: boolean) => {
    for (const s of list) {
      const u = easeOutBack(clamp((ms - t0 - s.d) / 170));
      s.m.scale.set(1, Math.max(0.001, u), 1);
      s.m.visible = alive && ms > t0;
    }
  };
}

