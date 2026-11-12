// Parts of the nature effects (prototype, decision 059): a thorn, roots that grow up out of the ground in spirals, and a cloud that
// blows from one point to another (spores, mist). Pure functions of time, like every effect.
import * as THREE from 'three';
import { clamp, easeOut3, rng, park, type Cloud } from './effectParts';

const UP = new THREE.Vector3(0, 1, 0);
/** Turns `o` so its +y axis points along `dir`. */
export function aim(o: THREE.Object3D, dir: THREE.Vector3) {
  o.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
}

let thornMat: THREE.MeshStandardMaterial | null = null;
/** A thorn about half a unit long: a green-brown spike with a purple glow. */
export function thornMesh(size = 1): THREE.Mesh {
  thornMat ??= new THREE.MeshStandardMaterial({ color: 0x9ac048, emissive: 0xa04ae0, emissiveIntensity: 0.8, roughness: 0.6, flatShading: true, transparent: true });
  const g = new THREE.ConeGeometry(0.07 * size, 0.55 * size, 6);
  return new THREE.Mesh(g, thornMat);
}
export const setThornOpacity = (a: number) => {
  if (thornMat) thornMat.opacity = a;
};

export interface Roots {
  /** `grow` 0..1 how far the roots have climbed, `fade` 1..0. */
  set(grow: number, fade: number): void;
}
/** `n` roots spiralling up from `at` (on the ground) to about `height`, in a ring of `radius`. */
export function roots(parent: THREE.Object3D, at: THREE.Vector3, n: number, height: number, radius: number, seed: number): Roots {
  const rand = rng(seed);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, emissive: 0x2a5a18, emissiveIntensity: 0.35, roughness: 0.8, flatShading: true, transparent: true });
  const items = Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * 6.2832 + rand() * 0.6;
    const turns = 0.7 + rand() * 0.8;
    const h = height * (0.7 + rand() * 0.5);
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j <= 9; j++) {
      const t = j / 9;
      const a = a0 + t * turns * 6.2832;
      const r = radius * (1.15 - 0.55 * t) + Math.sin(t * 9 + i) * 0.04;
      pts.push(new THREE.Vector3(at.x + Math.cos(a) * r * 1.2, t * h, at.z + Math.sin(a) * r * 0.85));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.075 + rand() * 0.03, 6);
    const m = new THREE.Mesh(geo, mat);
    parent.add(m);
    return { geo, m, delay: rand() * 0.4, count: geo.index!.count };
  });
  return {
    set(grow, fade) {
      mat.opacity = fade;
      for (const it of items) {
        const k = easeOut3(clamp((grow - it.delay) / (1 - it.delay)));
        it.geo.setDrawRange(0, Math.floor((k * it.count) / 3) * 3);
        it.m.visible = k > 0.01 && fade > 0.01;
      }
    },
  };
}

type Seeds = readonly (readonly [number, number, number, number])[];
export const seeds = (n: number, rand: () => number): Seeds => Array.from({ length: n }, () => [rand(), rand() - 0.5, rand() - 0.5, rand() * 6.2832] as const);

/** Blows a cloud along `from` -> `to`: born between `t0` and `t0 + span`, flying for `speed` ms, the cone widening by `spread`. */
export function blow(c: Cloud, sd: Seeds, ms: number, from: THREE.Vector3, to: THREE.Vector3, t0: number, span: number, speed: number, spread: number) {
  const along = to.clone().sub(from).setY(0).normalize();
  const p = new THREE.Vector3();
  for (let i = 0; i < c.n; i++) {
    const [b, ly, lz, ph] = sd[i]!;
    const t = (ms - (t0 + b * span)) / speed;
    if (t <= 0 || t > 1.5) {
      park(c, i);
      continue;
    }
    const k = Math.min(t, 1.35);
    p.lerpVectors(from, to, Math.min(1, k)).addScaledVector(along, Math.max(0, k - 1) * 1.2);
    p.y += ly * spread * k * 1.6 + Math.sin(ph + ms * 0.01) * 0.05 - Math.max(0, k - 1) * 0.4;
    p.z += lz * spread * k * 1.6;
    c.pos.setXYZ(i, p.x, Math.max(0.03, p.y), p.z);
  }
  c.pos.needsUpdate = true;
}
