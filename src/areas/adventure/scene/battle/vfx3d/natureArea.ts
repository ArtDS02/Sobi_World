// Nature effects over a whole row of foes in 3D (prototype, decision 059). `root_bind` (Rễ Trói): roots burst up and spiral round each foe.
// `root_quake` (Rễ Rung Chuyển): stone spikes and roots heave up under the row in a cloud of dust. `corrupt_bloom` (Hoa Nhiễm Độc): a dark flower
// opens over the caster and spits poison over the row. `thorn_storm` (Bão Gai): thorns whirl round the caster, then are flung over the row.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, cloud, easeOut, easeOutBack, park, rng, ripple, smooth, sprite } from './effectParts';
import { aim, roots, seeds, setThornOpacity, thornMesh } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

/** Three standing spots across the row, spread by the row's width. */
const slots = (env: Vfx3dEnv) => [-0.5, 0, 0.5].map((k, i) => new THREE.Vector3(env.origin.x + k * Math.min(2.4, env.unit), 0, env.origin.z + (i === 1 ? 0.35 : -0.25 + i * 0.1)));

/** Puffs of dust or mist that swell and rise round `at` between `t0` and `t0 + 900`. */
function puffs(c: ReturnType<typeof cloud>, sd: ReturnType<typeof seeds>, ms: number, at: THREE.Vector3, t0: number, reach: number) {
  const t = (ms - t0) / 900;
  for (let i = 0; i < c.n; i++) {
    const [b, jx, jy, ph] = sd[i]!;
    if (t <= 0 || t > 1) {
      park(c, i);
      continue;
    }
    const r = (0.15 + b * 0.85) * reach * easeOut(clamp(t * 1.5));
    c.pos.setXYZ(i, at.x + Math.cos(ph) * r * 1.2, 0.2 + t * 0.8 + jy * 0.4, at.z + Math.sin(ph) * r * 0.85 + jx * 0.2);
  }
  c.pos.needsUpdate = true;
}

export function rootBind(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(111);
  const spots = slots(env);
  const grown = spots.map((s, i) => roots(root, s, 5, 1.5, 0.45, 111 + i));
  const rings = spots.map((s) => {
    const r = ripple(root, 2.2, 1.7, 0x5a8a3a, 0xd0ffa0);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  const leaves = cloud(root, 80, 0.16, 0x7ccf5a, false, 0.95);
  const sd = seeds(80, rand);
  return {
    update(ms) {
      spots.forEach((_, i) => {
        const t0 = 360 + i * 110;
        grown[i]!.set(clamp((ms - t0) / 560), 1 - smooth(1100, 1450, ms));
        rings[i]!.set((ms - t0) / 1000, smooth(0, 0.1, (ms - t0) / 1000) * (1 - smooth(0.4, 0.9, (ms - t0) / 1000)));
      });
      const t = (ms - 900) / 1000;
      for (let i = 0; i < leaves.n; i++) {
        const [b, jx, jy, ph] = sd[i]!;
        const s = spots[i % 3]!;
        if (t <= 0 || t > 0.9) {
          park(leaves, i);
          continue;
        }
        leaves.pos.setXYZ(i, s.x + Math.cos(ph) * (0.3 + b) * t * 1.6, 0.4 + (1 + jy * 2) * t - 2.2 * t * t, s.z + Math.sin(ph) * (0.3 + b) * t * 1.1 + jx * 0.3);
      }
      leaves.pos.needsUpdate = true;
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function rootQuake(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(113);
  const spots = slots(env);
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a7860, roughness: 0.9, flatShading: true, transparent: true });
  const spikes = spots.map((s, i) =>
    Array.from({ length: 4 }, (_, k) => {
      const h = 0.9 + rand() * 0.7;
      const g = new THREE.ConeGeometry(0.2 + rand() * 0.08, h, 5);
      g.translate(0, h / 2, 0);
      const m = new THREE.Mesh(g, stone);
      const a = (k / 4) * 6.2832 + i;
      m.position.set(s.x + Math.cos(a) * 0.5, 0, s.z + Math.sin(a) * 0.35);
      m.rotation.set(Math.sin(a) * 0.25, rand() * 3, -Math.cos(a) * 0.25);
      root.add(m);
      return m;
    }),
  );
  const grown = spots.map((s, i) => roots(root, s, 4, 1.1, 0.4, 113 + i));
  const dust = cloud(root, 90, 0.9, 0xb89a70, false, 0.5);
  const sd = seeds(90, rand);
  const rings = spots.map((s) => {
    const r = ripple(root, 2.2, 1.7, 0x8a6a3a, 0xe8d0a0);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  return {
    update(ms) {
      stone.opacity = 1 - smooth(1250, 1550, ms);
      spots.forEach((_, i) => {
        const t0 = 420 + i * 130;
        spikes[i]!.forEach((m, k) => {
          const u = easeOutBack(clamp((ms - t0 - k * 25) / 160));
          m.scale.set(1, Math.max(0.001, u), 1);
          m.visible = ms > t0 && stone.opacity > 0.01;
        });
        grown[i]!.set(clamp((ms - t0 - 140) / 420), 1 - smooth(1250, 1550, ms));
        rings[i]!.set((ms - t0) / 1000, smooth(0, 0.08, (ms - t0) / 1000) * (1 - smooth(0.4, 0.9, (ms - t0) / 1000)));
      });
      // Dust, one third of it round each spot.
      const t = (ms - 500) / 1000;
      for (let i = 0; i < dust.n; i++) {
        const [b, jx, jy, ph] = sd[i]!;
        const s = spots[i % 3]!;
        const tt = t - (i % 3) * 0.13;
        if (tt <= 0 || tt > 0.95) {
          park(dust, i);
          continue;
        }
        const r = (0.15 + b * 0.9) * easeOut(clamp(tt * 1.6));
        dust.pos.setXYZ(i, s.x + Math.cos(ph) * r * 1.2, 0.15 + tt * 0.9 + jy * 0.4, s.z + Math.sin(ph) * r * 0.85 + jx * 0.2);
      }
      dust.pos.needsUpdate = true;
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.5 * (1 - smooth(900, 1500, ms));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function corruptBloom(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(117);
  const spots = slots(env);
  const head = new THREE.Vector3(env.from.x, 2.2, env.from.z);
  const flower = new THREE.Group();
  const petalMat = new THREE.MeshStandardMaterial({ color: 0x5a2a7a, emissive: 0xc02a9a, emissiveIntensity: 0.35, roughness: 0.6, flatShading: true, transparent: true });
  for (let k = 0; k < 8; k++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6), petalMat);
    p.scale.set(1, 0.18, 0.42);
    p.position.set(Math.cos((k / 8) * 6.2832) * 0.5, 0, Math.sin((k / 8) * 6.2832) * 0.5);
    p.rotation.y = -(k / 8) * 6.2832;
    flower.add(p);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshBasicMaterial({ color: 0xe060c0, transparent: true }));
  flower.add(core);
  flower.rotation.x = 0.7;
  flower.position.copy(head);
  root.add(flower);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x3a6a2a, transparent: true }));
  stem.position.set(head.x, 1.1, head.z);
  root.add(stem);
  const spit = cloud(root, 160, 0.3, 0xa04ad0, false, 0.85);
  const ss = seeds(spit.n, rand);
  const haze = spots.map(() => cloud(root, 50, 0.9, 0x6a3a8a, false, 0.5));
  const hs = seeds(50, rand);
  const rain = cloud(root, 90, 0.1, 0xe090e0);
  const rs = seeds(90, rand);
  const rings = spots.map((s) => {
    const r = ripple(root, 2.2, 1.7, 0x8a3ab8, 0xf0c0ff);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  const row = new THREE.Vector3(env.origin.x, 0.6, env.origin.z);
  return {
    update(ms) {
      const grow = easeOutBack(clamp(ms / 450));
      const fade = 1 - smooth(1250, 1550, ms);
      flower.scale.setScalar(Math.max(0.001, grow * 1.5 * (1 + 0.08 * Math.sin(ms * 0.012))));
      flower.rotation.y = ms * 0.0015;
      stem.scale.y = Math.max(0.001, easeOut(clamp(ms / 350)));
      stem.position.y = 1.1 * stem.scale.y;
      petalMat.opacity = fade;
      (core.material as THREE.Material).opacity = fade;
      (stem.material as THREE.Material).opacity = fade;
      flower.visible = stem.visible = fade > 0.01;
      for (let i = 0; i < spit.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const t = (ms - (420 + b * 450)) / 520;
        if (t <= 0 || t > 1) {
          park(spit, i);
          continue;
        }
        const e = t;
        spit.pos.setXYZ(i, head.x + (row.x - head.x) * e + jx * 0.6 * e, head.y + (row.y - head.y) * e + Math.sin(Math.PI * e) * 0.8 + jy * 0.4, head.z + (row.z - head.z) * e + Math.sin(ph) * 0.4 * e);
      }
      spit.pos.needsUpdate = true;
      (spit.pts.material as THREE.PointsMaterial).opacity = 0.85 * (1 - smooth(900, 1000, ms));
      spots.forEach((s, i) => {
        const t0 = 900 + i * 90;
        puffs(haze[i]!, hs, ms, s, t0, 0.9);
        (haze[i]!.pts.material as THREE.PointsMaterial).opacity = 0.5 * smooth(0, 0.08, (ms - t0) / 900) * (1 - smooth(0.5, 1, (ms - t0) / 900));
        rings[i]!.set((ms - t0) / 1000, smooth(0, 0.08, (ms - t0) / 1000) * (1 - smooth(0.4, 0.9, (ms - t0) / 1000)));
      });
      for (let i = 0; i < rain.n; i++) {
        const [b, jx, , ph] = rs[i]!;
        const t = (ms - (500 + b * 600)) / 700;
        if (t <= 0 || t > 1) {
          park(rain, i);
          continue;
        }
        rain.pos.setXYZ(i, row.x + jx * 3 + Math.sin(ph + t * 4) * 0.1, 2.6 - t * 2.4, row.z + (ph - 3) * 0.3);
      }
      rain.pos.needsUpdate = true;
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function thornStorm(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(119);
  const spots = slots(env);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const centre = new THREE.Vector3(env.from.x + dir * 0.3, 1.5, env.from.z);
  const thorns = Array.from({ length: 14 }, (_, i) => {
    const m = thornMesh(2.5);
    root.add(m);
    const s = spots[i % 3]!;
    return { m, ph: (i / 14) * 6.2832, launch: 1100 + Math.floor(i / 3) * 70 + (i % 3) * 40, goal: new THREE.Vector3(s.x + (rand() - 0.5) * 0.6, 0.5 + rand() * 0.5, s.z + (rand() - 0.5) * 0.4) };
  });
  const leaves = cloud(root, 140, 0.15, 0x7ccf5a, false, 0.9);
  const sd = seeds(leaves.n, rand);
  const flashes = [1100, 1250, 1400].map((t0, i) => {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: 0xd8ffa0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    f.position.set(spots[i]!.x, 0.6, spots[i]!.z);
    root.add(f);
    return { f, t0 };
  });
  const tmp = new THREE.Vector3();
  return {
    update(ms) {
      const gather = smooth(500, 900, ms);
      for (const th of thorns) {
        const k = clamp((ms - th.launch) / 300);
        th.m.visible = ms > 520 && ms < 1750;
        if (ms < th.launch) {
          const a = th.ph + ms * 0.012;
          tmp.set(centre.x + Math.cos(a) * 0.8 * gather, centre.y + Math.sin(a * 2) * 0.25, centre.z + Math.sin(a) * 0.6 * gather);
          th.m.position.copy(tmp);
          th.m.scale.setScalar(Math.max(0.01, gather));
          aim(th.m, new THREE.Vector3(-Math.sin(a), 0.2, Math.cos(a)));
        } else {
          const e = easeOut(k);
          th.m.position.lerpVectors(tmp.set(centre.x + Math.cos(th.ph) * 0.8, centre.y, centre.z + Math.sin(th.ph) * 0.6), th.goal, e);
          aim(th.m, th.goal.clone().sub(centre));
        }
      }
      setThornOpacity(1 - smooth(1550, 1750, ms));
      for (let i = 0; i < leaves.n; i++) {
        const [b, jx, jy, ph] = sd[i]!;
        const t = (ms - 300) / 1000;
        if (ms < 300 || ms > 1500) {
          park(leaves, i);
          continue;
        }
        const a = ph + ms * 0.01 * (1 + b);
        const r = (0.5 + b * 1.4) * (ms < 1100 ? smooth(300, 900, ms) : 1 + (ms - 1100) / 300);
        leaves.pos.setXYZ(i, centre.x + Math.cos(a) * r, centre.y - 0.6 + jy * 1.4 + t * 0.2, centre.z + Math.sin(a) * r * 0.7 + jx * 0.2);
      }
      leaves.pos.needsUpdate = true;
      (leaves.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(1300, 1500, ms));
      for (const { f, t0 } of flashes) {
        const b = Math.exp(-Math.max(0, ms - t0) / 120) * (ms > t0 ? 1 : 0);
        f.scale.setScalar(0.6 + 1.8 * b);
        (f.material as THREE.SpriteMaterial).opacity = b;
      }
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
