// The two void Ultimates in 3D (prototype, decision 059). `sky_bell` (Bầu Trời Trong Chuông): a great bell falls over the row and tolls three times, each
// toll a ring, then the sky breaks. `mythic_awakening` (Huyền Thoại Thức Tỉnh): a spirit circle opens behind the caster and four coloured beams strike the
// row, then stars rain on the team. Times are ms from the start of the act.
import * as THREE from 'three';
import { slots } from './earthParts';
import { clamp, cloud, easeOut, park, rng, ripple, smooth } from './effectParts';
import { glare, sigil } from './lightningParts';
import { sparks } from './metalParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { VOID, add } from './voidFx';


export function skyBell(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(285);
  const spread = Math.min(2.4, env.unit);
  const o = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const spots = slots(env);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8c8ff, metalness: 0.7, roughness: 0.3, emissive: 0x6a4aff, emissiveIntensity: 0.5, transparent: true, side: THREE.DoubleSide });
  const bell = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14, 0, 6.2832, 0, 1.9), mat);
  body.scale.set(1, 1.2, 1);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.1, 6, 28), mat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = -0.52;
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat);
  clapper.position.y = -0.6;
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 12), mat);
  top.position.y = 1.35;
  bell.add(body, lip, clapper, top);
  root.add(bell);
  const sg = sigil(root);
  sg.mesh.position.set(o.x, 0.04, o.z);
  const tolls = [1200, 1600, 2000].map((t0, i) => {
    const r = ripple(root, 5 + i * 1.4, 3.6 + i, 0xc8a8ff, 0xffffff);
    r.mesh.position.set(o.x, 0.02, o.z);
    return { r, t0 };
  });
  const notes = cloud(root, 90, 0.3, 0xe8d8ff);
  const ns = seeds(notes.n, rand);
  const glint = glare(root, 0xe0c8ff);
  const shards = cloud(root, 110, 0.2, 0xf0e8ff);
  const hs = seeds(shards.n, rand);
  const marks = spots.map((s) => {
    const r = ripple(root, 2.6, 2, VOID, 0xe8d8ff);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  return {
    update(ms) {
      const fall = clamp((ms - 500) / 700);
      const fade = smooth(500, 640, ms) * (1 - smooth(2400, 2900, ms));
      bell.position.set(o.x, 0.7 + 1.2 + 3.6 * (1 - fall * fall * fall), o.z);
      bell.scale.setScalar(0.85);
      // The bell rocks on each toll.
      let swing = 0;
      for (const { t0 } of tolls) swing = Math.max(swing, Math.exp(-Math.max(0, ms - t0) / 180) * (ms > t0 ? 1 : 0));
      bell.rotation.z = Math.sin(ms * 0.03) * 0.18 * swing;
      bell.visible = fade > 0.01;
      mat.opacity = fade;
      mat.emissiveIntensity = 0.5 + 1.4 * swing;
      sg.set(spread * 3.2 * easeOut(clamp((ms - 700) / 500)) + 0.6, spread * 2.2 * easeOut(clamp((ms - 700) / 500)) + 0.4, ms / 1000, smooth(700, 900, ms) * (1 - smooth(2200, 2700, ms)));
      for (const { r, t0 } of tolls) r.set((ms - t0) / 1000, smooth(0, 0.05, (ms - t0) / 1000) * (1 - smooth(0.3, 0.8, (ms - t0) / 1000)));
      for (let i = 0; i < notes.n; i++) {
        const [b, jx, jy, ph] = ns[i]!;
        const t0 = tolls[i % 3]!.t0;
        const t = (ms - t0) / 900 - b * 0.1;
        if (t <= 0 || t > 1) park(notes, i);
        else notes.pos.setXYZ(i, o.x + Math.cos(ph) * (0.4 + b) * t * 4 * spread * 0.6, 0.8 + jy * 0.6 + t * 1.2, o.z + Math.sin(ph) * (0.3 + b) * t * 2.4 + jx * 0.2);
      }
      notes.pos.needsUpdate = true;
      (notes.pts.material as THREE.PointsMaterial).opacity = 0.9;
      const t = (ms - 2000) / 1000;
      glint(new THREE.Vector3(o.x, 1.2, o.z), t, 7);
      for (let i = 0; i < shards.n; i++) {
        const [b, jx, jy, ph] = hs[i]!;
        const tt = t - b * 0.08;
        if (tt <= 0 || tt > 1) park(shards, i);
        else shards.pos.setXYZ(i, o.x + Math.cos(ph) * (0.4 + b) * tt * 5 * spread * 0.6, 1.2 + (jy + 0.5) * tt * 3.4 - 3 * tt * tt, o.z + Math.sin(ph) * (0.3 + b) * tt * 2.6 + jx * 0.3);
      }
      shards.pos.needsUpdate = true;
      (shards.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(0.6, 1, t));
      spots.forEach((_, i) => marks[i]!.set((ms - 1250 - i * 100) / 1000, smooth(0, 0.06, (ms - 1250 - i * 100) / 1000) * (1 - smooth(0.4, 0.9, (ms - 1250 - i * 100) / 1000))));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function mythicAwakening(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(287);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const spots = slots(env);
  const behind = new THREE.Vector3(env.from.x - dir * 0.7, 0.9, env.from.z);
  const mine = new THREE.Vector3(env.from.x, 0, env.from.z);
  const sg = sigil(root);
  sg.mesh.position.set(mine.x, 0.05, mine.z);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 6, 40), add(0xffe9a0));
  halo.position.copy(behind);
  root.add(halo);
  const colors = [0xff7a2a, 0x6fc4ff, 0x7ccf5a, 0xffd66a];
  const mouth = new THREE.Vector3(env.from.x + dir * 0.5, 1.0, env.from.z);
  const beams = colors.map((c, k) => {
    const targets = spots.map((s) => {
      const goal = new THREE.Vector3(s.x, 0.7, s.z);
      const len = mouth.distanceTo(goal);
      const m = add(c);
      const g = new THREE.CylinderGeometry(0.045, 0.045, 1, 8, 1, true);
      g.translate(0, 0.5, 0);
      const mesh = new THREE.Mesh(g, m);
      const start = mouth.clone().setY(mouth.y + (k - 1.5) * 0.14);
      mesh.position.copy(start);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), goal.clone().sub(start).normalize());
      mesh.visible = false;
      root.add(mesh);
      return { mesh, m, len };
    });
    return { targets, t0: 1500 + k * 50 };
  });
  const glints = spots.map(() => glare(root, 0xfff0c0));
  const rings = spots.map((s) => {
    const r = ripple(root, 3, 2.3, 0xb48aff, 0xffffff);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  const sp = spots.map(() => sparks(root, 60));
  const stars = cloud(root, 150, 0.22, 0xffe9a0);
  const ss = seeds(stars.n, rand);
  const heal = ripple(root, 3.4, 2.6, 0x8ff0b0, 0xffffff);
  heal.mesh.position.set(mine.x, 0.02, mine.z);
  return {
    update(ms) {
      const g = easeOut(clamp((ms - 500) / 600));
      sg.set(3.2 * g + 0.3, 2.4 * g + 0.2, ms / 1000, smooth(500, 700, ms) * (1 - smooth(2300, 2800, ms)));
      halo.scale.setScalar(Math.max(0.001, g));
      halo.rotation.z = ms * 0.004;
      (halo.material as THREE.Material).opacity = g * (1 - smooth(1900, 2300, ms));
      for (const { targets, t0 } of beams) {
        const k = easeOut(clamp((ms - t0) / 160));
        const op = smooth(t0, t0 + 40, ms) * (1 - smooth(t0 + 400, t0 + 700, ms));
        for (const t of targets) {
          t.mesh.visible = op > 0.01;
          t.mesh.scale.set(1, t.len * k, 1);
          t.m.opacity = op * 0.7;
        }
      }
      spots.forEach((s, i) => {
        const t = (ms - (1700 + i * 60)) / 1000;
        glints[i]!(new THREE.Vector3(s.x, 0.7, s.z), t, 3.4);
        rings[i]!.set(t, smooth(0, 0.06, t) * (1 - smooth(0.35, 0.8, t)));
        sp[i]!.set(t, new THREE.Vector3(s.x, 0.4, s.z), 1.2, 0.8);
      });
      for (let i = 0; i < stars.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const born = 2000 + b * 700;
        const age = ms - born;
        if (age < 0 || age > 900) park(stars, i);
        else stars.pos.setXYZ(i, mine.x + Math.cos(ph) * (0.2 + Math.abs(jx)) * 1.6, 3 - (age / 900) * 2.6, mine.z + Math.sin(ph) * 0.5 + jy * 0.3);
      }
      stars.pos.needsUpdate = true;
      (stars.pts.material as THREE.PointsMaterial).opacity = 0.9;
      heal.set((ms - 2500) / 1000, smooth(0, 0.08, (ms - 2500) / 1000) * (1 - smooth(0.4, 0.9, (ms - 2500) / 1000)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
