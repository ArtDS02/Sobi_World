// Cold effects in 3D (prototype, decision 059). `ice_bloom` (Đóng Băng): a snowflake flies from the caster, ice crystals shoot up in a
// ring round the target, a frost ring spreads on the ground, then they shatter. `frost_breath` (Hơi Thở Băng): a cone of snow, ice dust
// and mist blown from the caster over the target, and a few crystals at its feet. The ice that wraps a unit is the Freeze status's own
// effect (it only shows when the unit is really frozen); these show the cold magic itself. Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, cloud, crystals, easeInOut, easeOut, park, rng, ripple, smooth, starSprite, type Cloud } from './effectParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

type Seeds = readonly (readonly [number, number, number, number])[];

export function iceBloom(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(31);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const hand = new THREE.Vector3(env.from.x + dir * 0.45, 0.65, env.from.z);
  const goal = new THREE.Vector3(env.origin.x, 0.55, env.origin.z);
  const flake = new THREE.Sprite(new THREE.SpriteMaterial({ map: starSprite(), color: 0xdff6ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(flake);
  const ring = new THREE.Group();
  ring.position.set(goal.x, 0, goal.z);
  root.add(ring);
  const ice = crystals(ring, 9, 0.6, 0.55, 1.5, 5);
  const frost = ripple(root, 2.8, 2.2, 0x6ad0ff, 0xf2fdff);
  frost.mesh.position.set(goal.x, 0.02, goal.z);
  const snow = cloud(root, 150, 0.2, 0xffffff, false, 0.9);
  const sseed: Seeds = Array.from({ length: snow.n }, () => [rand() - 0.5, rand() - 0.5, rand(), rand()] as const);
  const shards = cloud(root, 70, 0.2, 0xcdf1ff);
  const hseed = Array.from({ length: shards.n }, () => [rand() * 6.2832, 0.8 + rand() * 2, 1.5 + rand() * 3] as const);

  return {
    update(ms: number) {
      const fl = clamp((ms - 350) / 350);
      flake.visible = ms > 230 && ms < 705;
      flake.position.lerpVectors(hand, goal, easeInOut(fl));
      flake.position.y += Math.sin(Math.PI * fl) * 0.35;
      const fs = 0.45 + 0.35 * Math.sin(ms * 0.02) ** 2 + 0.5 * smooth(230, 350, ms);
      flake.scale.set(fs, fs, 1);
      (flake.material as THREE.SpriteMaterial).rotation = ms * 0.012;
      ice.set(clamp((ms - 700) / 320), 1 - smooth(1250, 1500, ms), ms);
      frost.set((ms - 700) / 1000, smooth(0, 100, ms - 700) * (1 - smooth(600, 1200, ms - 700)));
      const gt = Math.max(0, ms - 780) / 1000;
      for (let i = 0; i < snow.n; i++) {
        const [dx, dz, k, ph] = sseed[i]!;
        const t = gt - k * 0.4;
        if (t <= 0 || t > 1.1) {
          park(snow, i);
          continue;
        }
        snow.pos.setXYZ(i, goal.x + dx * 2 + Math.sin(t * 5 + ph * 6) * 0.1, 2.2 - t * 2 + k * 0.3, goal.z + dz * 1.4);
      }
      snow.pos.needsUpdate = true;
      (snow.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(0.7, 1.1, gt));
      const st = Math.max(0, ms - 1250) / 1000;
      for (let i = 0; i < shards.n; i++) {
        const [a, vh, vy] = hseed[i]!;
        if (st <= 0 || st > 0.8) {
          park(shards, i);
          continue;
        }
        shards.pos.setXYZ(i, goal.x + Math.cos(a) * vh * st * 0.8, 0.4 + vy * st - 4.9 * st * st, goal.z + Math.sin(a) * vh * st * 0.6);
      }
      shards.pos.needsUpdate = true;
      (shards.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(0.4, 0.8, st));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function frostBreath(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(37);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const mouth = new THREE.Vector3(env.from.x + dir * 0.45, 0.7, env.from.z);
  const goal = new THREE.Vector3(env.origin.x, 0.5, env.origin.z);
  const along = goal.clone().sub(mouth).setY(0).normalize();
  const dust = cloud(root, 420, 0.24, 0xbfe9ff);
  const mist = cloud(root, 110, 1.1, 0xe8f8ff, false, 0.5);
  const dseed: Seeds = Array.from({ length: dust.n }, () => [rand(), rand() - 0.5, rand() - 0.5, rand() * 6.2832] as const);
  const mseed: Seeds = Array.from({ length: mist.n }, () => [rand(), rand() - 0.5, rand() - 0.5, rand() * 6.2832] as const);
  const ring = new THREE.Group();
  ring.position.set(goal.x, 0, goal.z);
  root.add(ring);
  const ice = crystals(ring, 6, 0.45, 0.35, 0.95, 9);
  const frost = ripple(root, 2.2, 1.7, 0x6ad0ff, 0xf2fdff);
  frost.mesh.position.set(goal.x, 0.02, goal.z);

  const p = new THREE.Vector3();
  /** Blows a cloud along mouth -> target: the cone widens with the way gone, then it spills past and sinks. */
  const blow = (c: Cloud, seeds: Seeds, spread: number, speed: number, ms: number) => {
    for (let i = 0; i < c.n; i++) {
      const [b, ly, lz, ph] = seeds[i]!;
      const t = (ms - (350 + b * 480)) / speed;
      if (t <= 0 || t > 1.5) {
        park(c, i);
        continue;
      }
      const k = Math.min(t, 1.35);
      p.lerpVectors(mouth, goal, Math.min(1, k)).addScaledVector(along, Math.max(0, k - 1) * 1.2);
      p.y += ly * spread * k * 1.6 + Math.sin(ph + ms * 0.01) * 0.04 - Math.max(0, k - 1) * 0.5;
      p.z += lz * spread * k * 1.6;
      c.pos.setXYZ(i, p.x, Math.max(0.03, p.y), p.z);
    }
    c.pos.needsUpdate = true;
  };

  return {
    update(ms: number) {
      blow(dust, dseed, 1, 380, ms);
      blow(mist, mseed, 1.4, 520, ms);
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(1000, 1500, ms));
      (mist.pts.material as THREE.PointsMaterial).opacity = 0.5 * easeOut(clamp((ms - 350) / 200)) * (1 - smooth(1000, 1500, ms));
      ice.set(clamp((ms - 850) / 260), 1 - smooth(1150, 1450, ms), ms);
      frost.set((ms - 850) / 1000, smooth(0, 100, ms - 850) * (1 - smooth(500, 1000, ms - 850)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
