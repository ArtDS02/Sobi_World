// Light effects in 3D (prototype, decision 059). `light_ray` (Tia Sáng): a golden ray from the caster with a star burst where it lands.
// `lumina_ray` (Tia Lumina): a halo opens behind the caster, a spear of light flies, a pillar of light falls on the target.
// `rune_beam` (Tia Rune): a rune circle over the caster, a violet beam and runes bursting at the target. Times are ms from the start of the act.
import * as THREE from 'three';
import { chestOf, mouthOf } from './earthParts';
import { clamp, cloud, easeOut, park, rng, ripple, smooth, sprite, starSprite } from './effectParts';
import { glare, sigil } from './lightningParts';
import { sparks } from './metalParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const additive = (color: number) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });

/** A beam of light between two points: a white core inside a wider coloured glow; `set(len01, op)` grows it from `a` towards `b`. */
function beamOf(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, color: number, radius: number) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const group = new THREE.Group();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const core = additive(0xffffff);
  const glow = additive(color);
  const mk = (r: number, m: THREE.Material) => {
    const g = new THREE.CylinderGeometry(r, r, 1, 12, 1, true);
    g.translate(0, 0.5, 0);
    return new THREE.Mesh(g, m);
  };
  const c = mk(radius * 0.4, core);
  const w = mk(radius * 1.6, glow);
  group.add(c, w);
  group.quaternion.copy(q);
  group.position.copy(a);
  group.visible = false;
  parent.add(group);
  return {
    set(len01: number, op: number, pulse = 0) {
      group.visible = op > 0.01 && len01 > 0.001;
      c.scale.set(1, len * len01, 1);
      w.scale.set(1 + pulse, len * len01, 1 + pulse);
      core.opacity = op;
      glow.opacity = 0.5 * op;
    },
  };
}

/** A pillar of light standing on `at`. */
function pillarOf(parent: THREE.Object3D, at: THREE.Vector3, color: number, radius: number, height: number) {
  const b = beamOf(parent, at.clone().setY(0), at.clone().setY(height), color, radius);
  return b;
}

/** Stars thrown up and falling back from `at` (`sec` since the burst). */
function starBurst(parent: THREE.Object3D, n: number, size: number, color: number, seed: number) {
  const rand = rng(seed);
  const c = cloud(parent, n, size, color);
  const sd = Array.from({ length: n }, () => [rand() * 6.2832, 0.6 + rand() * 2, 1.6 + rand() * 2.8, rand() * 0.12] as const);
  return (sec: number, at: THREE.Vector3, power = 1) => {
    for (let i = 0; i < n; i++) {
      const [a, vh, vy, d] = sd[i]!;
      const t = sec - d;
      if (t <= 0 || t > 1) {
        park(c, i);
        continue;
      }
      c.pos.setXYZ(i, at.x + Math.cos(a) * vh * t * power * 0.7, at.y + Math.max(-0.2, (vy * t - 3.2 * t * t) * power * 0.7), at.z + Math.sin(a) * vh * t * power * 0.5);
    }
    c.pos.needsUpdate = true;
    (c.pts.material as THREE.PointsMaterial).opacity = 0.95 * (1 - smooth(0.6, 1, sec));
  };
}

export function lightRay(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const beam = beamOf(root, mouth, goal, 0xffd66a, 0.17);
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: starSprite(), color: 0xffe9a0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(star);
  const gather = cloud(root, 40, 0.14, 0xfff0b0);
  const gs = seeds(gather.n, rng(251));
  const burst = starBurst(root, 50, 0.16, 0xffe9a0, 251);
  const glint = glare(root, 0xfff0b0);
  const ring = ripple(root, 2.4, 1.8, 0xffd66a, 0xffffff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  return {
    update(ms) {
      const g = smooth(0, 260, ms) * (1 - smooth(260, 340, ms));
      for (let i = 0; i < gather.n; i++) {
        const [b, jx, jy, ph] = gs[i]!;
        const k = clamp(ms / 260 - b * 0.4);
        gather.pos.setXYZ(i, mouth.x + Math.cos(ph) * (1 - k) * 0.9 + jx * 0.1, mouth.y + Math.sin(ph) * (1 - k) * 0.9 + jy * 0.1, mouth.z + Math.sin(ph * 2) * 0.1);
      }
      gather.pos.needsUpdate = true;
      (gather.pts.material as THREE.PointsMaterial).opacity = g;
      beam.set(easeOut(clamp((ms - 260) / 180)), smooth(260, 300, ms) * (1 - smooth(560, 700, ms)), 0.12 * Math.sin(ms * 0.05));
      const t = (ms - 440) / 1000;
      star.position.copy(goal);
      star.scale.setScalar(Math.max(0.001, 2.6 * Math.exp(-t / 0.2)) * (t > 0 ? 1 : 0.001));
      (star.material as THREE.SpriteMaterial).rotation = t * 2;
      burst(t, goal, 1);
      glint(goal, t, 3);
      ring.set(t, smooth(0, 0.06, t) * (1 - smooth(0.3, 0.8, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function luminaRay(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const behind = new THREE.Vector3(env.from.x - dir * 0.7, 0.9, env.from.z);
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 6, 40), additive(0xfff0b0));
  halo.position.copy(behind);
  root.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 40), additive(0xffd66a));
  halo2.position.copy(behind);
  root.add(halo2);
  const spear = new THREE.Group();
  const shaftMat = additive(0xffffff);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), shaftMat);
  shaft.rotation.z = Math.PI / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), shaftMat);
  tip.rotation.z = -Math.PI / 2 * dir;
  tip.position.x = dir * 1.0;
  spear.add(shaft, tip);
  root.add(spear);
  const trail = beamOf(root, mouth, goal, 0xffe9a0, 0.07);
  const pillar = pillarOf(root, goal, 0xffe9a0, 0.5, 5);
  const burst = starBurst(root, 90, 0.17, 0xffe9a0, 253);
  const sp = sparks(root, 60);
  const glint = glare(root, 0xffffff);
  const ring = ripple(root, 3.2, 2.5, 0xffd66a, 0xffffff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const rays = Array.from({ length: 8 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.4), additive(0xfff0b0));
    m.position.copy(behind);
    m.rotation.z = (i / 8) * 6.2832;
    root.add(m);
    return m;
  });
  return {
    update(ms) {
      const grow = easeOut(clamp(ms / 480)) * (1 - smooth(560, 760, ms));
      halo.scale.setScalar(Math.max(0.001, grow));
      halo2.scale.setScalar(Math.max(0.001, grow));
      halo.rotation.z = ms * 0.004;
      halo2.rotation.z = -ms * 0.006;
      (halo.material as THREE.Material).opacity = grow;
      (halo2.material as THREE.Material).opacity = 0.8 * grow;
      rays.forEach((r, i) => {
        r.scale.set(1, Math.max(0.001, grow), 1);
        r.rotation.z = (i / 8) * 6.2832 + ms * 0.002;
        (r.material as THREE.Material).opacity = 0.45 * grow;
        r.position.copy(behind);
        r.translateY(0.7 * grow);
      });
      const k = clamp((ms - 460) / 200);
      spear.visible = ms > 440 && ms < 700;
      spear.position.lerpVectors(behind, goal, easeOut(k));
      shaftMat.opacity = smooth(440, 480, ms) * (1 - smooth(640, 700, ms));
      trail.set(easeOut(k), smooth(460, 500, ms) * (1 - smooth(720, 900, ms)) * 0.7);
      const t = (ms - 660) / 1000;
      const pe = easeOut(clamp(t / 0.12));
      pillar.set(pe, smooth(0, 0.04, t) * (1 - smooth(0.25, 0.6, t)), 0.15 * Math.sin(ms * 0.06));
      burst(t, goal, 1.1);
      sp.set(t, goal, 1, 0.7);
      glint(goal, t, 4);
      ring.set(t, smooth(0, 0.05, t) * (1 - smooth(0.35, 0.85, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function runeBeam(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(255);
  const above = new THREE.Vector3(env.from.x, 2.3, env.from.z);
  const mouth = new THREE.Vector3(env.from.x + (env.origin.x >= env.from.x ? 0.4 : -0.4), 1.9, env.from.z);
  const goal = chestOf(env);
  const sg = sigil(root);
  sg.mesh.position.copy(above);
  const beam = beamOf(root, mouth, goal, 0x8a8aff, 0.11);
  const runes = cloud(root, 36, 0.28, 0xb8b8ff);
  const rs = seeds(runes.n, rand);
  const burst = starBurst(root, 50, 0.15, 0xb8b8ff, 255);
  const glint = glare(root, 0xc8c8ff);
  const ring = ripple(root, 2.6, 2, 0x8a8aff, 0xe8e8ff);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: 0xa8a8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(star);
  return {
    update(ms) {
      sg.mesh.rotation.x = -Math.PI / 2;
      sg.set(2.7 * easeOut(clamp(ms / 300)), 2.7 * easeOut(clamp(ms / 300)), ms / 1000, smooth(0, 150, ms) * (1 - smooth(560, 800, ms)));
      beam.set(easeOut(clamp((ms - 380) / 160)), smooth(380, 430, ms) * (1 - smooth(780, 950, ms)), 0.1 * Math.sin(ms * 0.05));
      const t = (ms - 560) / 1000;
      for (let i = 0; i < runes.n; i++) {
        const [b, jx, jy, ph] = rs[i]!;
        const tt = t - b * 0.1;
        if (tt <= 0 || tt > 0.9) {
          park(runes, i);
          continue;
        }
        runes.pos.setXYZ(i, goal.x + Math.cos(ph) * (0.3 + jx) * tt * 3, goal.y + (0.8 + jy * 1.2) * tt * 2.2, goal.z + Math.sin(ph) * 0.4 * tt * 2);
      }
      runes.pos.needsUpdate = true;
      (runes.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(0.5, 0.9, t));
      star.position.copy(goal);
      star.scale.setScalar(Math.max(0.001, 2.4 * Math.exp(-t / 0.18)) * (t > 0 ? 1 : 0.001));
      burst(t, goal, 1);
      glint(goal, t, 3);
      ring.set(t, smooth(0, 0.06, t) * (1 - smooth(0.3, 0.8, t)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
