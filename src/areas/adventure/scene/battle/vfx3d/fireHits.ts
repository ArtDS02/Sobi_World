// Single-target fire effects in 3D (prototype, decision 059). `claw_clamp` (Càng Nung): two red-hot pincers snap shut on the target.
// `jaw_flame` (Cắn Than Hồng): flaming jaws bite. `hammer_slam` (Búa Hỏa Ngục): a hammer of fire falls and bursts into a column of flame.
// `lava_glob` (Phun Dung Nham, enemy): a glob of lava arcs over and splashes into a pool. Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, easeInOut, easeOut, easeOutBack, rng, ripple, smooth, sprite } from './effectParts';
import { fireCloud, flameColumn, forgeHammer, hotMetal, lavaPool, seeds4, trail } from './fireParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const chestOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, 0.55, env.origin.z);
const mouthOf = (env: Vfx3dEnv) => new THREE.Vector3(env.from.x + (env.origin.x >= env.from.x ? 0.45 : -0.45), 0.6, env.from.z);
const glow = (m: THREE.MeshStandardMaterial, heat: number, op = 1) => {
  m.emissiveIntensity = 0.55 * heat;
  m.color.setRGB(0.22 + 0.3 * heat, 0.17 + 0.1 * heat, 0.15);
  m.opacity = op;
};

/** One pincer: a curved arm with a pointed tip, hinged at the origin and swung by `angle`. */
function pincer(mat: THREE.Material, side: 1 | -1): THREE.Group {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * 0.28, 0.35, 0), new THREE.Vector3(side * 0.34, 0.75, 0), new THREE.Vector3(side * 0.12, 1.08, 0)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.13, 10), mat));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 10), mat);
  tip.position.set(side * 0.06, 1.25, 0);
  tip.rotation.z = side * 0.55;
  g.add(tip);
  return g;
}

export function clawClamp(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  root.position.copy(chestOf(env));
  root.position.y = 0.05;
  env.scene.add(root);
  const metal = hotMetal();
  const rand = rng(41);
  const left = pincer(metal, -1);
  const right = pincer(metal, 1);
  const hinge = new THREE.Group();
  hinge.add(left, right);
  hinge.position.y = -0.1;
  hinge.scale.setScalar(2.0);
  root.add(hinge);
  const fire = fireCloud(root, 90, 0.2);
  const seeds = seeds4(fire.n, rand);
  const heat = ripple(root, 2.2, 1.7, 0xff5a1a, 0xffe0a0);
  heat.mesh.position.y = 0;
  return {
    update(ms) {
      const open = 1 - easeInOut(clamp((ms - 440) / 130));
      const appear = smooth(300, 460, ms);
      const hot = ms < 480 ? 0.35 + 0.3 * appear : 1 - 0.55 * smooth(560, 1000, ms);
      left.rotation.z = -(0.12 + open * 0.95);
      right.rotation.z = 0.12 + open * 0.95;
      hinge.visible = appear > 0.01 && ms < 1000;
      hinge.position.y = -0.1 + (1 - easeOutBack(clamp((ms - 300) / 180))) * 0.6;
      glow(metal, hot, appear * (1 - smooth(850, 1000, ms)));
      trail(fire, seeds, ms, 480, 640, 520, () => new THREE.Vector3(0, 0.5, 0), 0.9, 0.5);
      heat.mesh.position.set(0, 0, 0);
      heat.set((ms - 480) / 1000, smooth(0, 90, ms - 480) * (1 - smooth(300, 800, ms - 480)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function jawFlame(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  root.position.copy(chestOf(env));
  env.scene.add(root);
  const rand = rng(43);
  const metal = new THREE.MeshStandardMaterial({ color: 0xff9a40, emissive: 0xff5a10, emissiveIntensity: 1.6, roughness: 0.4, transparent: true });
  const fangs = new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  // Two jaws, each a bar with five fangs; the pieces are direct children of the root and moved every frame by `gap`.
  const pieces: { m: THREE.Mesh; x: number; y: number }[] = [];
  const put = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, rotZ: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.rotation.z = rotZ;
    root.add(m);
    pieces.push({ m, x, y });
  };
  for (const dir of [1, -1] as const) {
    put(new THREE.BoxGeometry(1.5, 0.16, 0.45), metal, 0, dir * 1, 0);
    for (let i = 0; i < 5; i++) put(new THREE.ConeGeometry(0.16, 0.95 - Math.abs(i - 2) * 0.14, 8), fangs, -0.6 + i * 0.3, dir * 1 - dir * 0.46, dir > 0 ? Math.PI : 0);
  }
  root.scale.setScalar(1.25);
  const flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: 0xffd080, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(flashSprite);
  const bite = ripple(root, 2.4, 1.8, 0xff7a20, 0xfff0c0);
  bite.mesh.position.set(0, -0.5, 0);
  const fire = fireCloud(root, 110, 0.2);
  const seeds = seeds4(fire.n, rand);
  return {
    update(ms) {
      const close = easeInOut(clamp((ms - 380) / 100));
      const appear = smooth(250, 380, ms);
      const gap = 0.12 + (1 - close) * 0.85;
      for (const p of pieces) {
        // `y` is +-1 for the jaw (sign) plus the fang's own offset: replace the unit part by the real gap.
        const sign = p.y > 0 ? 1 : -1;
        p.m.position.set(p.x, p.y - sign + sign * gap, 0);
        p.m.visible = appear > 0.01 && ms < 900;
      }
      metal.opacity = appear * (1 - smooth(700, 900, ms));
      const burst = Math.exp(-Math.max(0, ms - 480) / 140) * (ms > 480 ? 1 : 0);
      flashSprite.scale.setScalar(1.2 + 1.8 * burst);
      (flashSprite.material as THREE.SpriteMaterial).opacity = 0.9 * burst;
      fangs.opacity = appear * (1 - smooth(700, 900, ms));
      bite.set((ms - 480) / 1000, smooth(0, 60, ms - 480) * (1 - smooth(300, 700, ms - 480)));
      trail(fire, seeds, ms, 300, 700, 480, () => new THREE.Vector3(0, 0.1, 0), 0.8, 0.55);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function hammerSlam(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  root.position.set(env.origin.x, 0, env.origin.z);
  env.scene.add(root);
  const rand = rng(47);
  const piece = forgeHammer();
  const hammer = piece.g;
  root.add(hammer);
  const fire = fireCloud(root, 200, 0.26);
  const seeds = seeds4(fire.n, rand);
  const burst = fireCloud(root, 160, 0.22);
  const bseed = Array.from({ length: burst.n }, () => [rand() * 6.2832, 1 + rand() * 3, 2 + rand() * 4.5, rand() * 0.15] as const);
  const col = flameColumn(root);
  const crater = lavaPool(root);
  const shock = ripple(root, 4.2, 3.2, 0xff5a1a, 0xffe0a0);
  const IMPACT = 800;
  const at = (t: number) => {
    const k = clamp((t - 500) / 300);
    return new THREE.Vector3(0, 3.6 * (1 - k * k * k) + 0.2, 0);
  };
  return {
    update(ms) {
      const k = clamp((ms - 500) / (IMPACT - 500));
      const y = 3.6 * (1 - k * k * k);
      hammer.position.y = y - 0.15;
      hammer.rotation.z = (1 - k) * 0.5;
      hammer.visible = ms > 480 && ms < 1350;
      const appear = smooth(480, 560, ms);
      piece.iron.opacity = appear * (1 - smooth(1100, 1350, ms));
      piece.glow.opacity = piece.iron.opacity * (0.7 + 0.3 * (1 - smooth(IMPACT, 1200, ms)));
      trail(fire, seeds, ms, 500, IMPACT, 360, (t) => at(t).setY(at(t).y + 1.8), 0.5, 0.45);
      const bt = Math.max(0, ms - IMPACT) / 1000;
      for (let i = 0; i < burst.n; i++) {
        const [a, vh, vy, d] = bseed[i]!;
        const t = bt - d;
        if (t <= 0 || t > 1.1) {
          burst.hide(i);
          continue;
        }
        burst.put(i, Math.cos(a) * vh * t * 0.5, Math.max(0.05, vy * t - 4.9 * t * t) * 0.6, Math.sin(a) * vh * t * 0.4, t / 1.1);
      }
      burst.flush();
      col.mesh.position.set(0, 0, 0);
      col.set(0.5 + 0.35 * easeOut(clamp((ms - IMPACT) / 300)), 1.9 * easeOut(clamp((ms - IMPACT) / 220)), ms / 1000, smooth(0, 60, ms - IMPACT) * (1 - smooth(350, 700, ms - IMPACT)));
      crater.set(1.8 * easeOut(clamp((ms - IMPACT) / 250)), 1.3 * easeOut(clamp((ms - IMPACT) / 250)), ms / 1000, smooth(0, 80, ms - IMPACT) * (1 - smooth(500, 1000, ms - IMPACT)));
      shock.set((ms - IMPACT) / 1000, smooth(0, 80, ms - IMPACT) * (1 - smooth(500, 1100, ms - IMPACT)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function lavaGlob(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(53);
  const mouth = mouthOf(env);
  const goal = new THREE.Vector3(env.origin.x, 0.1, env.origin.z);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true }));
  root.add(ball);
  const trailFire = fireCloud(root, 120, 0.22);
  const seeds = seeds4(trailFire.n, rand);
  const at = (t: number) => {
    const k = clamp((t - 320) / 400);
    const e = easeInOut(k);
    return new THREE.Vector3().lerpVectors(mouth, goal.clone().setY(0.45), e).setY(mouth.y + (0.45 - mouth.y) * e + Math.sin(Math.PI * e) * 1.1);
  };
  const splash = fireCloud(root, 90, 0.2);
  const sseed = Array.from({ length: splash.n }, () => [rand() * 6.2832, 0.8 + rand() * 2, 1.5 + rand() * 3] as const);
  const pool = lavaPool(root);
  return {
    update(ms) {
      const fly = ms >= 320 && ms < 720;
      ball.visible = (ms >= 200 && ms < 720) || false;
      const grow = ms < 320 ? smooth(150, 320, ms) : 1;
      const p = ms < 320 ? mouth : at(Math.min(ms, 720));
      ball.position.copy(p);
      ball.scale.setScalar(0.26 * grow * (fly ? 1 + 0.08 * Math.sin(ms * 0.05) : 1));
      trail(trailFire, seeds, ms, 220, 720, 420, at, 0.4, 0.2);
      const st = Math.max(0, ms - 720) / 1000;
      for (let i = 0; i < splash.n; i++) {
        const [a, vh, vy] = sseed[i]!;
        if (st <= 0 || st > 0.8) {
          splash.hide(i);
          continue;
        }
        splash.put(i, goal.x - env.origin.x + Math.cos(a) * vh * st * 0.6, Math.max(0.05, vy * st - 4.9 * st * st), Math.sin(a) * vh * st * 0.45, st / 0.8);
      }
      splash.flush();
      splash.pts.position.set(env.origin.x, 0.1, env.origin.z);
      pool.mesh.position.set(goal.x, 0.03, goal.z);
      pool.set(1.5 * easeOut(clamp((ms - 720) / 160)), 1.1 * easeOut(clamp((ms - 720) / 160)), ms / 1000, smooth(0, 60, ms - 720) * (1 - smooth(250, 650, ms - 720)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
