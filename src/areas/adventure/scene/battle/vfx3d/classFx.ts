// Attack effects in 3D for the class skills (prototype, decision 059). They have no element of their own, so every one takes the act's `color`
// (the look of whoever casts). `class_strike`: a crossing cut and a shock ring. `class_combo`: four quick cuts (over a row they hop between foes).
// `class_orb`: an orb of power flies and bursts. `ground_stomp`: shock rings run from the caster's feet over the row. `class_rain`: many bolts of
// colour fall over the row. `class_meteor`: three big meteors. `size` scales them. Times are ms from the start of the act.
import * as THREE from 'three';
import { chestOf, mouthOf, shards, slots } from './earthParts';
import { clamp, cloud, easeInOut, easeOut, park, rng, ripple, smooth } from './effectParts';
import { glare } from './lightningParts';
import { slashArc, sparks } from './metalParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const rings = (root: THREE.Object3D, ps: THREE.Vector3[], color: number, w = 2.6) =>
  ps.map((p) => {
    const r = ripple(root, w, w * 0.78, color, 0xffffff);
    r.mesh.position.set(p.x, 0.02, p.z);
    return r;
  });
const ringAt = (rs: ReturnType<typeof rings>, i: number, ms: number, t0: number) => {
  const t = (ms - t0) / 1000;
  rs[i]!.set(t, smooth(0, 0.06, t) * (1 - smooth(0.35, 0.85, t)));
};

export function classStrike(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0xe8ecf4;
  const goal = chestOf(env);
  const cuts = [-0.9, 0.7].map((a) => {
    const c = slashArc(root, 2.2, color);
    c.mesh.position.copy(goal);
    c.mesh.rotation.z = a;
    c.mesh.scale.setScalar(2.0);
    return c;
  });
  const sp = sparks(root, 70);
  const rs = rings(root, [goal.clone().setY(0)], color);
  const glint = glare(root, color);
  const chips = shards(root, 10, 0.09, new THREE.MeshStandardMaterial({ color, flatShading: true }), 351);
  return {
    update(ms) {
      cuts.forEach((c, i) => {
        const t0 = 220 + i * 70;
        c.set(easeOut(clamp((ms - t0) / 150)), smooth(t0, t0 + 30, ms) * (1 - smooth(t0 + 220, t0 + 520, ms)));
      });
      const t = (ms - 280) / 1000;
      sp.set(t, goal, 1.1, 0.65);
      glint(goal, t, 2.6);
      ringAt(rs, 0, ms, 280);
      chips.set(t, new THREE.Vector3(goal.x, 0.2, goal.z), 0.9);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function classCombo(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0xe8ecf4;
  const ps = env.row ? slots(env).map((p) => p.clone().setY(0.6)) : [chestOf(env)];
  const hits = [0, 1, 2, 3].map((i) => {
    const goal = ps[i % ps.length]!;
    const c = slashArc(root, 2, color);
    c.mesh.position.copy(goal);
    c.mesh.rotation.z = -1.1 + i * 0.75;
    c.mesh.scale.setScalar(i === 3 ? 2.4 : 1.8);
    return { c, goal, t0: 220 + i * 190, sp: sparks(root, 40), glint: glare(root, color) };
  });
  const rs = rings(root, hits.map((h) => h.goal.clone().setY(0)), color, 2.2);
  const final = rings(root, [ps[3 % ps.length]!.clone().setY(0)], color, 3.4);
  return {
    update(ms) {
      hits.forEach(({ c, goal, t0, sp, glint }, i) => {
        c.set(easeOut(clamp((ms - t0) / 130)), smooth(t0, t0 + 25, ms) * (1 - smooth(t0 + 180, t0 + 420, ms)));
        const t = (ms - t0 - 50) / 1000;
        sp.set(t, goal, i === 3 ? 1.4 : 1, 0.55);
        glint(goal, t, i === 3 ? 3.2 : 2.2);
        if (i < ps.length) ringAt(rs, i, ms, t0 + 50);
      });
      ringAt(final, 0, ms, 820);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function classOrb(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(361);
  const color = env.color ?? 0xcfe0ff;
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(orb, aura);
  const tr = cloud(root, 60, 0.3, color);
  const ts = seeds(tr.n, rand);
  const sp = sparks(root, 80);
  const rs = rings(root, [goal.clone().setY(0)], color, 3);
  const glint = glare(root, color);
  const at = (t: number) => {
    const e = easeInOut(clamp((t - 380) / 340));
    return new THREE.Vector3().lerpVectors(mouth, goal, e).setY(mouth.y + (goal.y - mouth.y) * e + Math.sin(Math.PI * e) * 0.5);
  };
  return {
    update(ms) {
      const p = ms < 380 ? mouth : at(ms);
      orb.visible = aura.visible = ms > 150 && ms < 720;
      orb.position.copy(p);
      aura.position.copy(p);
      orb.scale.setScalar(0.2 * smooth(150, 380, ms) * (1 + 0.1 * Math.sin(ms * 0.05)));
      aura.scale.setScalar(0.42 * smooth(150, 380, ms));
      for (let i = 0; i < tr.n; i++) {
        const [b, jx, jy] = ts[i]!;
        const born = 380 + b * 340;
        const age = ms - born;
        if (age < 0 || age > 300) park(tr, i);
        else tr.pos.setXYZ(i, at(born).x + jx * 0.2, at(born).y + jy * 0.2, at(born).z);
      }
      tr.pos.needsUpdate = true;
      const t = (ms - 720) / 1000;
      sp.set(t, goal, 1.2, 0.7);
      glint(goal, t, 3);
      ringAt(rs, 0, ms, 720);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function groundStomp(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(371);
  const color = env.color ?? 0xc0a070;
  const mine = new THREE.Vector3(env.from.x, 0, env.from.z);
  const ps = slots(env);
  const near = rings(root, [mine], color, 3);
  const far = rings(root, ps, color, 2.8);
  const dust = cloud(root, 100, 0.8, color, false, 0.45);
  const ds = seeds(dust.n, rand);
  const chips = ps.map((_, i) => shards(root, 8, 0.1, new THREE.MeshStandardMaterial({ color, flatShading: true }), 371 + i));
  const sp = sparks(root, 50);
  return {
    update(ms) {
      ringAt(near, 0, ms, 380);
      ps.forEach((p, i) => {
        const t0 = 550 + i * 80;
        ringAt(far, i, ms, t0);
        chips[i]!.set((ms - t0) / 1000, new THREE.Vector3(p.x, 0.2, p.z), 0.9);
      });
      sp.set((ms - 380) / 1000, new THREE.Vector3(mine.x, 0.2, mine.z), 1, 0.6);
      for (let i = 0; i < dust.n; i++) {
        const [b, jx, jy, ph] = ds[i]!;
        const p = i % 4 === 0 ? mine : ps[i % 3]!;
        const t = (ms - (i % 4 === 0 ? 380 : 550)) / 900 - b * 0.1;
        if (t <= 0 || t > 1) park(dust, i);
        else dust.pos.setXYZ(i, p.x + Math.cos(ph) * (0.2 + b) * t * 1.6, 0.15 + t * 0.7 + jy * 0.3, p.z + Math.sin(ph) * (0.2 + b) * t + jx * 0.2);
      }
      dust.pos.needsUpdate = true;
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.45 * (1 - smooth(900, 1400, ms));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function classRain(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(381);
  const color = env.color ?? 0xcfe0ff;
  const spread = Math.min(2.4, env.unit);
  const ps = slots(env);
  const streak = cloud(root, 150, 0.22, color);
  const sd = seeds(streak.n, rand);
  const rs = rings(root, ps, color, 2.2);
  const sps = ps.map(() => sparks(root, 40));
  const glints = ps.map(() => glare(root, color));
  return {
    update(ms) {
      for (let i = 0; i < streak.n; i++) {
        const [b, jx, jy, ph] = sd[i]!;
        const born = 300 + b * 800;
        const age = ms - born;
        if (age < 0 || age > 260) {
          park(streak, i);
          continue;
        }
        const k = age / 260;
        const x = ps[0]!.x + (b - 0.5) * (2 * spread + 1.2);
        streak.pos.setXYZ(i, x - (1 - k) * 0.8, 3.4 * (1 - k * k) + 0.1, ps[0]!.z + jx * 1.4 + (ph - 3) * 0.1 + jy * 0.2);
      }
      streak.pos.needsUpdate = true;
      ps.forEach((p, i) => {
        const t0 = 560 + i * 200;
        ringAt(rs, i, ms, t0);
        const t = (ms - t0) / 1000;
        sps[i]!.set(t, new THREE.Vector3(p.x, 0.3, p.z), 1, 0.6);
        glints[i]!(new THREE.Vector3(p.x, 0.5, p.z), t, 2.4);
      });
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function classMeteor(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(391);
  const color = env.color ?? 0xff8a3a;
  const ps = slots(env);
  const rock = new THREE.MeshStandardMaterial({ color: 0x3a2a28, emissive: color, emissiveIntensity: 0.9, roughness: 0.8, flatShading: true, transparent: true });
  const items = ps.map((p, i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), rock);
    root.add(m);
    const t0 = 450 + i * 230;
    return { m, p, t0, t1: t0 + 420, trail: cloud(root, 50, 0.4, color), ts: seeds(50, rand), sp: sparks(root, 50), glint: glare(root, color), ring: rings(root, [p], color, 3) };
  });
  return {
    update(ms) {
      for (const it of items) {
        const k = clamp((ms - it.t0) / (it.t1 - it.t0));
        const at = (t: number) => {
          const u = clamp((t - it.t0) / (it.t1 - it.t0));
          return new THREE.Vector3(it.p.x - (1 - u) * 2.6, 0.4 + 4.4 * (1 - u * u), it.p.z);
        };
        it.m.visible = ms >= it.t0 && ms < it.t1;
        it.m.position.copy(at(ms));
        it.m.rotation.set(ms * 0.01, ms * 0.007, 0);
        it.m.scale.setScalar(0.7 + 0.5 * k);
        for (let i = 0; i < it.trail.n; i++) {
          const [b, jx, jy] = it.ts[i]!;
          const born = it.t0 + b * (it.t1 - it.t0);
          const age = ms - born;
          if (age < 0 || age > 350) park(it.trail, i);
          else it.trail.pos.setXYZ(i, at(born).x + jx * 0.3, at(born).y + jy * 0.3, at(born).z);
        }
        it.trail.pos.needsUpdate = true;
        const t = (ms - it.t1) / 1000;
        it.sp.set(t, new THREE.Vector3(it.p.x, 0.3, it.p.z), 1.3, 0.7);
        it.glint(new THREE.Vector3(it.p.x, 0.6, it.p.z), t, 3.4);
        ringAt(it.ring, 0, ms, it.t1);
      }
      rock.opacity = 1;
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

