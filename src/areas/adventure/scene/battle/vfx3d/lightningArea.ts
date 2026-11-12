// Lightning effects over a whole row of foes in 3D (prototype, decision 059). `call_thunder` (Gọi Sấm): a storm cloud gathers over the row and
// bolts fall. `thunder_command` (Hiệu Lệnh Sấm): a great sigil opens in the sky, three waves of bolts, the team crackles with speed.
// `thunder_rush` (Lao Sấm): the caster tears through the row on a line of lightning. Times are ms from the start of the act.
import * as THREE from 'three';
import { slots } from './earthParts';
import { clamp, cloud, easeOut, park, rng, ripple, smooth } from './effectParts';
import { bolt, flick, glare, sigil } from './lightningParts';
import { slashArc, sparks } from './metalParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const ground = (p: THREE.Vector3) => p.clone().setY(0);

export function callThunder(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(201);
  const spots = slots(env);
  const base = new THREE.Vector3(env.origin.x, 3.7, env.origin.z);
  const storm = cloud(root, 170, 1.5, 0x7a7ea8, false, 0.8);
  const ss = seeds(storm.n, rand);
  const lit = cloud(root, 24, 1.1, 0xffe25a, true, 0.5);
  const ls = seeds(lit.n, rand);
  const strikes = spots.map((s, i) => bolt(root, new THREE.Vector3(s.x + 0.4, 3.6, s.z), ground(s), 201 + i, 0xcfe0ff, 0.08));
  const mega = bolt(root, new THREE.Vector3(base.x, 3.7, base.z), new THREE.Vector3(base.x, 0, base.z), 210, 0xcfe0ff, 0.15, 0.4);
  const glints = spots.map(() => glare(root));
  const bigGlint = glare(root);
  const rings = spots.map((s) => {
    const r = ripple(root, 2.2, 1.7, 0xffe25a, 0xffffff);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  const crack = ripple(root, 4, 3, 0xffe25a, 0xffffff);
  crack.mesh.position.set(base.x, 0.02, base.z);
  const drops = cloud(root, 80, 0.12, 0xbfe8ff);
  const ds = seeds(drops.n, rand);
  const spread = Math.min(2.4, env.unit);
  return {
    update(ms) {
      const grow = smooth(0, 420, ms) * (1 - smooth(1450, 1650, ms));
      for (let i = 0; i < storm.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const a = ph + ms * 0.0005 * (1 + b);
        storm.pos.setXYZ(i, base.x + Math.cos(a) * (0.4 + b * 1.4) * spread * 0.9 * grow, base.y + jy * 0.7, base.z + Math.sin(a) * (0.3 + b) * 0.9 * grow + jx * 0.4);
      }
      storm.pos.needsUpdate = true;
      (storm.pts.material as THREE.PointsMaterial).opacity = 0.8 * grow;
      let glow = 0;
      spots.forEach((s, i) => {
        const t0 = 420 + i * 160;
        strikes[i]!.set(flick(ms, t0, 280));
        const t = (ms - t0) / 1000;
        glints[i]!(new THREE.Vector3(s.x, 0.6, s.z), t, 2.4);
        rings[i]!.set(t, smooth(0, 0.06, t) * (1 - smooth(0.3, 0.7, t)));
        glow = Math.max(glow, flick(ms, t0, 280));
      });
      glow = Math.max(glow, flick(ms, 1150, 320));
      for (let i = 0; i < lit.n; i++) {
        const [b, jx, jy, ph] = ls[i]!;
        if (glow < 0.05) park(lit, i);
        else lit.pos.setXYZ(i, base.x + Math.cos(ph) * (0.2 + b * 1.5) * spread, base.y + jy * 0.6, base.z + Math.sin(ph) * 0.6 + jx * 0.3);
      }
      lit.pos.needsUpdate = true;
      (lit.pts.material as THREE.PointsMaterial).opacity = 0.5 * glow;
      mega.set(flick(ms, 1150, 320));
      const t = (ms - 1150) / 1000;
      bigGlint(new THREE.Vector3(base.x, 0.7, base.z), t, 4);
      crack.set(t, smooth(0, 0.06, t) * (1 - smooth(0.4, 0.9, t)));
      for (let i = 0; i < drops.n; i++) {
        const [b, jx, , ph] = ds[i]!;
        const dt = (ms - (1250 + b * 250)) / 600;
        if (dt <= 0 || dt > 1) park(drops, i);
        else drops.pos.setXYZ(i, base.x + jx * 4 * spread * 0.5, 3.2 - dt * 3.1, base.z + (ph - 3) * 0.3);
      }
      drops.pos.needsUpdate = true;
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function thunderCommand(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(211);
  const spots = slots(env);
  const spread = Math.min(2.4, env.unit);
  const sg = sigil(root);
  sg.mesh.position.set(env.origin.x, 4.2, env.origin.z);
  const waves = [1200, 1700].map((t0, w) => spots.map((s, i) => ({ t0: t0 + i * 120, b: bolt(root, new THREE.Vector3(s.x + (w ? -0.5 : 0.5), 4.2, s.z), ground(s), 211 + w * 5 + i, 0xcfe0ff, 0.1) })));
  const top = new THREE.Vector3(env.origin.x, 4.4, env.origin.z);
  const megaBolts = [0, 1].map((k) => bolt(root, top, new THREE.Vector3(env.origin.x, 0, env.origin.z), 230 + k, 0xcfe0ff, 0.2, 0.5));
  const glints = spots.map(() => glare(root));
  const bigGlint = glare(root);
  const rings = spots.map((s) => {
    const r = ripple(root, 3, 2.3, 0xffe25a, 0xffffff);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  const shock = ripple(root, 7, 5, 0xffe25a, 0xffffff);
  shock.mesh.position.set(env.origin.x, 0.02, env.origin.z);
  const spark = spots.map(() => sparks(root, 50));
  const buff = cloud(root, 80, 0.16, 0xffe25a);
  const bs = seeds(buff.n, rand);
  const mine = new THREE.Vector3(env.from.x, 0, env.from.z);
  const halo = ripple(root, 2.8, 2.2, 0xffe25a, 0xffffff);
  halo.mesh.position.set(mine.x, 0.02, mine.z);
  return {
    update(ms) {
      const g = easeOut(clamp((ms - 500) / 700));
      sg.set(spread * 2.6 * g + 0.4, spread * 1.8 * g + 0.3, ms / 1000, smooth(500, 700, ms) * (1 - smooth(2400, 2800, ms)));
      for (const w of waves) for (const x of w) x.b.set(flick(ms, x.t0, 300));
      megaBolts[0]!.set(flick(ms, 2200, 380));
      megaBolts[1]!.set(flick(ms, 2380, 220) * 0.8);
      spots.forEach((s, i) => {
        for (const t0 of [1200 + i * 120, 1700 + i * 120, 2200]) {
          glints[i]!(new THREE.Vector3(s.x, 0.6, s.z), (ms - t0) / 1000 > 0 && (ms - t0) / 1000 < 0.5 ? (ms - t0) / 1000 : -1, 2.8);
        }
        const t = (ms - (2200 + i * 40)) / 1000;
        spark[i]!.set(t, new THREE.Vector3(s.x, 0.3, s.z), 1.2, 0.8);
        rings[i]!.set((ms - (1200 + i * 120)) / 1000, smooth(0, 0.06, (ms - (1200 + i * 120)) / 1000) * (1 - smooth(0.3, 0.7, (ms - (1200 + i * 120)) / 1000)));
      });
      const t = (ms - 2200) / 1000;
      bigGlint(new THREE.Vector3(env.origin.x, 0.8, env.origin.z), t, 6);
      shock.set(t, smooth(0, 0.05, t) * (1 - smooth(0.4, 0.9, t)));
      // The team's speed-up: current crackling up round the caster's side.
      for (let i = 0; i < buff.n; i++) {
        const [b, jx, jy, ph] = bs[i]!;
        const born = 2400 + b * 450;
        const age = ms - born;
        if (age < 0 || age > 600) park(buff, i);
        else buff.pos.setXYZ(i, mine.x + Math.cos(ph + age * 0.01) * (0.5 + jx), 0.2 + (age / 600) * 1.8 + jy * 0.3, mine.z + Math.sin(ph + age * 0.01) * 0.4);
      }
      buff.pos.needsUpdate = true;
      halo.set((ms - 2450) / 1000, smooth(0, 0.07, (ms - 2450) / 1000) * (1 - smooth(0.4, 0.9, (ms - 2450) / 1000)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function thunderRush(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const spots = slots(env);
  const a = new THREE.Vector3(env.from.x + dir * 0.4, 0.4, env.from.z);
  const b = new THREE.Vector3(env.origin.x + dir * 3, 0.4, env.origin.z);
  const lines = [0, 1, 2].map((k) => bolt(root, a, b, 241 + k, 0xffe25a, 0.08, 0.7));
  const cuts = spots.map((s, i) => {
    const arc = slashArc(root, 2, 0xffe25a);
    arc.mesh.position.set(s.x, 0.7, s.z);
    arc.mesh.rotation.z = -0.6 + i * 0.5;
    arc.mesh.scale.setScalar(1.7);
    return arc;
  });
  const glints = spots.map(() => glare(root));
  const spark = spots.map(() => sparks(root, 50));
  const rings = spots.map((s) => {
    const r = ripple(root, 2.2, 1.7, 0xffe25a, 0xffffff);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  return {
    update(ms) {
      lines.forEach((l, k) => l.set(flick(ms, 400 + k * 190, 320) * 0.9));
      spots.forEach((s, i) => {
        const t0 = 520 + i * 150;
        const t = (ms - t0) / 1000;
        cuts[i]!.set(easeOut(clamp((ms - t0) / 180)), smooth(0, 0.03, t) * (1 - smooth(0.2, 0.5, t)));
        glints[i]!(new THREE.Vector3(s.x, 0.6, s.z), t, 2.4);
        spark[i]!.set(t, new THREE.Vector3(s.x, 0.4, s.z), 1, 0.6);
        rings[i]!.set(t, smooth(0, 0.06, t) * (1 - smooth(0.3, 0.7, t)));
      });
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
