// Nature skills over a whole row, rebuilt on the plant parts (decision 059). `root_bind` (Rễ Trói): roots break out of the ground
// under every foe, wind up round it and pull tight. `root_quake` (Rễ Rung Chuyển): the ground heaves and thick roots whip up
// under each foe in turn, throwing soil. `corrupt_bloom` (Hoa Nhiễm Độc): a sick flower grows before the monster, opens and
// spits a gob of poison at each foe. `thorn_storm` (Bão Gai): a whirl of thorns and leaves winds up round the caster and tears
// across the row in three gusts. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h, rise } from './fxKit';
import { lines } from './lines';
import { BARK, LEAF, LEAF_PALE, POISON, SAP, flower, hangCloud, leafBurst, stem } from './plantParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const BARK_DARK = [0.2, 0.12, 0.07] as const;
const SOIL = [0.45, 0.32, 0.2] as const;
const DARK_GREEN = [0.12, 0.34, 0.14] as const;
const foesOf = (env: Vfx3dEnv) => env.struck.map((t) => t.clone().setY(0));

export function rootBind(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = foesOf(env);
  const coils = foes.map((p, i) => ({ p, t: 360 + i * 110, roots: [0, 1].map(() => stem(root, 30, BARK_DARK, BARK, 14)), ring: shock(root, p, 2.6, [0.6, 0.9, 0.3]) }));
  const per = Math.round(40 * env.quality);
  const paint = quads(root, foes.length * per * 2, false, F.leaf);
  const TIGHT = 900;
  const at = new THREE.Vector3();
  return {
    update(ms) {
      const squeeze = smooth(TIGHT - 80, TIGHT, ms);
      const jolt = ms > TIGHT ? 0.12 * Math.exp(-(ms - TIGHT) / 80) * Math.cos((ms - TIGHT) / 22) : 0;
      const live = 1 - smooth(1220, 1430, ms);
      coils.forEach((c, i) => {
        const grow = easeOut(clamp((ms - c.t) / 420));
        // Two roots wind up round the foe from opposite sides; they pull in when they tighten.
        const rad = (0.42 + 0.14 * env.tall) * (1 - 0.3 * squeeze + jolt);
        c.roots.forEach((r, k) => {
          r.set((u, out) => {
            const a = k * Math.PI + u * 6.6 * (k ? -1 : 1);
            const rr = rad * (1.25 - 0.45 * u);
            return out.set(c.p.x + Math.cos(a) * rr, env.tall * 1.05 * u ** 0.85, c.p.z + Math.sin(a) * rr * 0.45);
          }, (u) => 0.1 - 0.065 * u, grow * (1 - 0.6 * smooth(1220, 1430, ms)), live);
        });
        // Soil thrown as they break out, leaves shaken loose when they tighten.
        burst(paint, i * per * 2, per, 10 + i, { sec: (ms - c.t) / 1000, at: at.set(c.p.x, 0.1, c.p.z), life: 0.7, speed: 2.4, up: 3.6, grav: 11, size: 0.16, color: SOIL, to: BARK_DARK, frame: F.shard });
        leafBurst(paint, i * per * 2 + per, per, 20 + i, (ms - TIGHT) / 1000, at.set(c.p.x, env.tall * 0.6, c.p.z), 0.8);
        c.ring((ms - TIGHT) / 300, ms > TIGHT ? 1 - smooth(150, 300, ms - TIGHT) : 0);
      });
      paint.flush();
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
  const foes = foesOf(env);
  const hits = foes.map((p, i) => ({ p, t: 560 + i * 130, roots: [0, 1, 2].map(() => stem(root, 16, BARK_DARK, BARK, 7)), ring: shock(root, p, 3.4, [0.7, 0.6, 0.3]) }));
  const per = Math.round(60 * env.quality);
  const paint = quads(root, foes.length * per, false, F.shard);
  const dust = quads(root, foes.length * 12 + 30, false, F.smoke);
  const crack = lines(root, 60);
  const at = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      // The warning: cracks of green light run over the ground from the caster toward the row while it rumbles.
      let n = 0;
      const run = clamp(ms / 520);
      if (ms < 900) {
        foes.forEach((p, i) => {
          for (let k = 0; k < 8; k++) {
            const u0 = (k / 8) * run;
            const u1 = ((k + 1) / 8) * run;
            const pt = (u: number, out: THREE.Vector3) => out.set(env.from.x + (p.x - env.from.x) * u, 0.04, env.from.z + (p.z - env.from.z) * u + 0.25 * Math.sin(u * 9 + i * 2) * (1 - u));
            crack.put(n++, pt(u0, a), pt(u1, b), 0.05, 0.05, 0.5, 1, 0.25, 0.8);
          }
        });
      }
      crack.show(n, 1 - smooth(650, 900, ms));
      crack.flush();
      hits.forEach((x, i) => {
        const age = ms - x.t;
        const up = easeOutBack(clamp(age / 200));
        const live = 1 - smooth(560, 820, age);
        // Three roots whip up out of the ground, lean over the foe and sink back.
        x.roots.forEach((r, k) => {
          const side = k - 1;
          const lean = 0.35 * Math.sin(clamp(age / 420) * Math.PI) * (side || 0.4);
          r.set((u, out) => out.set(x.p.x + side * 0.42 + lean * u * u * 2 + 0.07 * Math.sin(u * 7 + ms * 0.02 + k), (0.9 + env.tall * (0.9 - 0.25 * Math.abs(side))) * u * up * (1 - 0.5 * smooth(400, 820, age)), x.p.z + (k === 1 ? 0.2 : -0.1)), (u) => 0.17 - 0.13 * u, age > 0 ? 1 : 0, live);
        });
        burst(paint, i * per, per, 30 + i, { sec: age / 1000, at: at.set(x.p.x, 0.1, x.p.z), life: 0.9, speed: 3.4, up: 5.5, grav: 12, size: 0.2, color: SOIL, to: BARK_DARK, frame: F.shard });
        rise(dust, i * 12, 12, 40 + i, { sec: age / 1000, dur: 0.2, life: 0.9, at: () => at.set(x.p.x, 0.25, x.p.z), rise: 0.8, jitter: 1, size: 0.8, color: [0.62, 0.52, 0.4], to: [0.45, 0.4, 0.33], frame: F.smoke, grow: 1.9, alpha: 0.4 });
        x.ring(age / 380, age > 0 ? 1 - smooth(190, 380, age) : 0);
      });
      // Dust shaken up along the way while the ground rumbles.
      rise(dust, foes.length * 12, 30, 5, { sec: ms / 1000, dur: 0.6, life: 0.6, at: (_b, k) => at.set(env.from.x + (env.origin.x - env.from.x) * h(k, 8, 5), 0.1, env.origin.z + (h(k, 9, 5) - 0.5) * 1.6), rise: 0.6, jitter: 0.2, size: 0.45, color: [0.62, 0.52, 0.4], to: [0.45, 0.4, 0.33], frame: F.smoke, grow: 1.6, alpha: 0.3 });
      paint.flush();
      dust.flush();
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
  const foes = foesOf(env);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const head = new THREE.Vector3(env.from.x + dir * 1.0, 1.2 + env.tall * 0.9, env.from.z - 0.1);
  const stalk = stem(root, 18, [0.18, 0.22, 0.12], [0.45, 0.55, 0.25], 8);
  const paint = quads(root, 22 + foes.length * (1 + Math.round(36 * env.quality)), false, F.petal);
  const clouds = quads(root, foes.length * Math.round(22 * env.quality), false, F.smoke);
  const light = quads(root, foes.length * 14, true, F.soft);
  const per = Math.floor((paint.n - 22) / foes.length);
  const cper = Math.floor(clouds.n / foes.length);
  const p = new THREE.Vector3();
  return {
    update(ms) {
      // The plant: a crooked stalk climbs, a bud nods on top, the petals open, and it jerks back with every spit.
      const grow = easeOut(clamp(ms / 480));
      const open = easeOutBack(clamp((ms - 480) / 260));
      const spitAt = foes.map((_, i) => 620 + i * 90);
      const kick = Math.max(0, ...spitAt.map((t) => (ms >= t ? Math.exp(-(ms - t) / 60) : 0)));
      const live = 1 - smooth(1250, 1500, ms);
      const hx = head.x - dir * 0.2 * kick;
      stalk.set((u, out) => out.set(env.from.x + dir * 0.45 + (hx - env.from.x - dir * 0.45) * u + 0.2 * Math.sin(u * 5) * (1 - u), head.y * u, head.z), (u) => 0.13 - 0.06 * u, grow, live);
      p.set(hx, head.y + 0.05 * Math.sin(ms * 0.008), head.z);
      // Two rings of petals: wide sickly ones behind, short dark ones in front round a festering heart.
      const big = (0.62 + 0.32 * env.tall) * smooth(0.75, 1, grow);
      flower(paint, 0, 9, p, big, 0.12 + 0.88 * open, -dir * 0.5 + 0.1 * Math.sin(ms * 0.005), [0.62, 0.3, 0.78], [0.3, 0.12, 0.4], live);
      flower(paint, 10, 7, p, big * 0.6, 0.1 + 0.9 * easeOutBack(clamp((ms - 560) / 240)), dir * 0.4 - 0.15 * Math.sin(ms * 0.006), [0.36, 0.1, 0.5], SAP, live);
      for (const i of [18, 19, 20, 21]) paint.hide(i);
      foes.forEach((f, i) => {
        // A gob of poison lobbed from the flower's heart onto the foe: it lands 280 ms after it is spat (on the skill's impact).
        const t = (ms - spitAt[i]!) / 280;
        const land = (ms - spitAt[i]! - 280) / 1000;
        const idx = 22 + i * per;
        const chest = p.set(f.x, env.tall * 0.5, f.z).clone();
        if (t > 0 && t < 1) {
          paint.put(idx, hx + (chest.x - hx) * t, head.y + (chest.y - head.y) * t + Math.sin(t * Math.PI) * 1.1, head.z, 0.34, POISON[0] * 1.2, POISON[1] * 1.2, POISON[2] * 1.2, 1);
          paint.stretch(idx, (chest.x - hx) * 0.08, Math.cos(t * Math.PI) * 0.2, 0);
          paint.look(idx, F.drop, 0, 0.7);
        } else paint.hide(idx);
        burst(paint, idx + 1, per - 1, 50 + i, { sec: land, at: chest, life: 0.7, speed: 2.8, up: 3, grav: 10, size: 0.15, color: [0.75, 0.42, 0.95], to: SAP, frame: F.drop, stretch: 0.03 });
        hangCloud(clouds, i * cper, cper, light, i * 14, 14, 60 + i, land, 0.75, chest, 0.6 + env.tall * 0.3, POISON);
      });
      paint.flush();
      clouds.flush();
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

const GUSTS = [1100, 1250, 1400] as const;

export function thornStorm(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = foesOf(env);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const home = new THREE.Vector3(env.from.x, 0, env.from.z);
  const far = Math.max(...foes.map((t) => (t.x - home.x) * dir)) + 2;
  const thorns = quads(root, Math.round(320 * env.quality), false, F.streak);
  const leaves = quads(root, Math.round(220 * env.quality), false, F.leaf);
  const haze = quads(root, Math.round(40 * env.quality), false, F.smoke);
  const wind = lines(root, 90 + foes.length * GUSTS.length * 8);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      // Wind-up: thorns and leaves spiral round the caster, faster and tighter; then the whole whirl is flung down the row.
      const spin = smooth(0, 600, ms);
      const go = clamp((ms - 600) / 900);
      const cx = home.x + dir * far * go * go * (3 - 2 * go) * 0.5 + dir * far * 0.5 * go;
      const live = smooth(0, 200, ms) * (1 - smooth(1650, 1950, ms));
      const pose = (q: typeof thorns, i: number, seed: number, frame: number, size: number, col: readonly [number, number, number]) => {
        const lane = h(i, 0, seed);
        const ang = h(i, 1, seed) * 6.2832 + ms * 0.012 * (0.7 + 0.6 * h(i, 2, seed)) * (1 + spin);
        const r = (0.5 + 1.3 * lane) * (1.2 - 0.35 * spin + 0.5 * go);
        const y = 0.2 + (0.2 + env.tall * 1.5) * h(i, 3, seed) + 0.15 * Math.sin(ang * 2);
        // Once it is flung, each piece streams ahead along its own lane.
        const lead = go > 0 ? (h(i, 4, seed) - 0.3) * 2.2 * go : 0;
        q.put(i, cx + dir * lead + Math.cos(ang) * r, y, home.z + Math.sin(ang) * r * 0.45, size * (0.7 + 0.6 * lane), col[0], col[1], col[2], live * (frame === F.smoke ? 0.22 : 1));
        if (frame === F.streak) {
          q.stretch(i, -Math.sin(ang) * r * 0.25 + dir * 0.5 * go, 0.03 * Math.cos(ang * 2), 0);
          q.look(i, F.leaf, 0, 0.28);
        } else q.look(i, F.leaf, ang * 1.7 + i, 0.6);
      };
      for (let i = 0; i < haze.n; i++) {
        pose(haze, i, 3, F.smoke, 1.3, [0.62, 0.78, 0.5]);
        haze.look(i, F.smoke, i);
      }
      for (let i = 0; i < thorns.n; i++) pose(thorns, i, 1, F.streak, 0.42, i % 3 ? [0.5, 0.36, 0.2] : DARK_GREEN);
      for (let i = 0; i < leaves.n; i++) pose(leaves, i, 2, F.leaf, 0.32, i % 2 ? LEAF : LEAF_PALE);
      haze.flush();
      thorns.flush();
      leaves.flush();
      // Lines of wind wrap the whirl; at each gust every foe is slashed by a few bright cuts.
      let n = 0;
      for (let k = 0; k < 6; k++) {
        const y = 0.3 + k * 0.32 * env.tall;
        for (let s = 0; s < 14; s++) {
          const a0 = (s / 14) * 6.2832 + ms * 0.014 + k;
          const a1 = ((s + 1) / 14) * 6.2832 + ms * 0.014 + k;
          if ((s + k * 3) % 5 > 2) continue;
          const r = 1.5 - 0.3 * spin + 0.6 * go;
          wind.put(n++, a.set(cx + Math.cos(a0) * r, y, home.z + Math.sin(a0) * r * 0.45), b.set(cx + Math.cos(a1) * r, y, home.z + Math.sin(a1) * r * 0.45), 0.06, 0.06, 0.6, 1.05, 0.45, 0.8 * live);
        }
      }
      foes.forEach((f, i) => GUSTS.forEach((t, g) => {
        const age = ms - t - i * 40;
        if (age < 0 || age > 160) return;
        for (let c = 0; c < 2; c++) {
          const tilt = (h(i * 7 + g, c, 9) - 0.5) * 1.2;
          const y = env.tall * (0.3 + 0.5 * h(i + g, c + 2, 9));
          wind.put(n++, a.set(f.x - dir * 0.8, y - tilt * 0.4, f.z + 0.1), b.set(f.x + dir * 0.8, y + tilt * 0.4, f.z + 0.1), 0.02, 0.09, 0.75, 1.3, 0.5, 1.4 * (1 - age / 160));
        }
      }));
      wind.show(n, 1);
      wind.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
