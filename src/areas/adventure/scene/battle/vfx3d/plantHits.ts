// Nature skills on one foe, rebuilt on the plant parts (decision 059). `thorn_volley` (Gai Độc): a bud swells in front of the
// caster and shoots five thorns one after the other, the last the biggest; each sticks in the foe with a spurt of sap.
// `vine_whip` (Quất Dây Leo): a thorny vine rears back over the attacker and cracks down across the foe. `spore_cone` (Bào Tử Độc):
// the monster puffs a cone of spores that rolls over the target and hangs there as a cloud. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h } from './fxKit';
import { lines } from './lines';
import { LEAF, LEAF_PALE, POISON, SAP, flower, hangCloud, leafBurst, stem } from './plantParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const DARK_GREEN = [0.12, 0.34, 0.14] as const;
const THORN = [0.3, 0.16, 0.1] as const;

export function thornVolley(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const bud = new THREE.Vector3(env.from.x + dir * 0.75, env.tall * 0.6, env.from.z);
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const stalk = stem(root, 10, DARK_GREEN, LEAF, 5);
  const paint = quads(root, 8 + 5 + Math.round(90 * env.quality), false, F.petal);
  const drops = quads(root, Math.round(70 * env.quality), false, F.drop);
  const light = quads(root, 6, true, F.star);
  const N = 5;
  // Thorns leave 45 ms apart and take 240 ms to cross; the last lands at 600 + 4·45 − … so the first lands on the skill's impact.
  const shots = Array.from({ length: N }, (_, i) => ({ t0: 360 + i * 45, big: i === N - 1 ? 1.6 : 1, dy: (h(i, 0, 1) - 0.5) * 0.7 * env.tall }));
  const FLY = 240;
  const p = new THREE.Vector3();
  const v = new THREE.Vector3();
  return {
    update(ms) {
      // The bud: a short stalk pushes up from the ground, a flower head swells, recoils at each shot, then wilts.
      const grow = easeOutBack(clamp(ms / 300));
      const kick = Math.max(...shots.map((s) => (ms >= s.t0 ? Math.exp(-(ms - s.t0) / 50) : 0)));
      const live = 1 - smooth(800, 1000, ms);
      stalk.set((u, out) => out.set(bud.x - dir * 0.35 * (1 - u) + dir * 0.12 * Math.sin(u * 3), bud.y * u, bud.z), (u) => 0.09 - 0.04 * u, grow, live);
      p.set(bud.x - dir * 0.12 * kick, bud.y, bud.z);
      flower(paint, 0, 7, p, 0.75 * grow, 0.35 + 0.4 * smooth(250, 360, ms) + 0.2 * kick, -dir * 0.6, [0.85, 0.3, 0.55], SAP, live);
      const hitSpot = (s: (typeof shots)[number]) => p.set(chest.x - dir * 0.1, chest.y + s.dy, chest.z);
      shots.forEach((s, i) => {
        const t = (ms - s.t0) / FLY;
        const idx = 8 + i;
        const stuck = (ms - s.t0 - FLY) / 420;
        if (t <= 0 || stuck >= 1) {
          paint.hide(idx);
        } else {
          // Flying: a dart along a shallow arc; stuck: it quivers in the foe and fades.
          const k = clamp(t);
          hitSpot(s);
          v.copy(p);
          p.set(bud.x + (v.x - bud.x) * k, bud.y + (v.y - bud.y) * k + Math.sin(k * Math.PI) * 0.35, bud.z);
          const quiver = stuck > 0 ? 0.25 * Math.exp(-stuck * 6) * Math.sin(stuck * 60) : 0;
          paint.put(idx, p.x, p.y, p.z, 0.5 * s.big, THORN[0], THORN[1], THORN[2], stuck > 0 ? 1 - smooth(0.5, 1, stuck) : 1);
          paint.stretch(idx, dir * 0.9 * s.big, (t < 1 ? Math.cos(k * Math.PI) * 0.12 : 0) + quiver, 0);
          // A glint rides each thorn so it reads against the grass.
          if (t < 1) {
            light.put(i, p.x + dir * 0.45 * s.big, p.y, p.z + 0.05, 0.9 * s.big, 1.1, 1.6, 0.5, 0.9);
            light.look(i, F.star, ms * 0.02 + i);
          }
          paint.look(idx, F.leaf, 0, 0.3);
        }
        const hitSec = (ms - s.t0 - FLY) / 1000;
        const per = Math.floor(drops.n / N);
        burst(drops, i * per, per, 10 + i, { sec: hitSec, at: hitSpot(s), life: 0.6, speed: 2.4 * s.big, up: 2.6, grav: 10, size: 0.12, color: SAP, to: POISON, frame: F.drop, stretch: 0.03 });
        if (hitSec >= 0 || t <= 0) {
          const g = hitSec >= 0 ? Math.exp(-hitSec / 0.07) : 0;
          light.put(i, p.x, p.y, p.z + 0.1, (0.8 + 1.2 * g) * s.big, 1.2, 1.6, 0.7, g);
          light.look(i, F.star, i);
        }
      });
      const lastHit = (ms - shots[N - 1]!.t0 - FLY) / 1000;
      leafBurst(paint, 13, paint.n - 13, 3, lastHit, chest, 0.9);
      paint.flush();
      drops.flush();
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function vineWhip(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const base = new THREE.Vector3(env.from.x + dir * 0.3, 0.1, env.from.z);
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const reach = Math.abs(chest.x - base.x) + 0.7;
  const vine = stem(root, 26, DARK_GREEN, LEAF, 16);
  const paint = quads(root, 14 + Math.round(80 * env.quality), false, F.leaf);
  const cut = lines(root, 24);
  const light = quads(root, 2, true, F.star);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3, [0.5, 1.1, 0.3]);
  const HIT = 560;
  const tip = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      // The lash as an angle: it grows out behind the attacker, rears up and back (the wind-up), then whips over and down.
      const grow = easeOut(clamp(ms / 280));
      const wind = smooth(180, 430, ms);
      const snap = clamp((ms - 450) / (HIT - 450));
      const rest = smooth(60, 460, hit);
      const ang = 2.3 * wind - 2.3 * snap * snap + 0.5 * rest + (hit > 0 ? 0.2 * Math.exp(-hit / 90) * Math.cos(hit / 26) : 0);
      const curl = 1.2 * (1 - snap) * wind + 0.35 * rest;
      const path = (u: number, out: THREE.Vector3) => {
        // Bend grows toward the tip: the base leads, the tip lags and cracks through last.
        const th = ang * (0.35 + 0.65 * u) + curl * u * u;
        const r = reach * u * (1 - 0.25 * rest);
        return out.set(base.x + dir * Math.cos(th) * r, base.y + chest.y * u * (1 - snap * 0.2) + Math.sin(th) * r * 0.75 + 0.5 * u * (1 - u), base.z);
      };
      const live = 1 - smooth(820, 1020, ms);
      vine.set(path, (u) => 0.12 - 0.085 * u + 0.012 * Math.sin(u * 40), grow, live);
      // Leaves ride the vine in pairs.
      for (let k = 0; k < 14; k++) {
        const u = 0.12 + (k / 14) * 0.82;
        path(u, tip);
        const side = k % 2 ? 1 : -1;
        paint.put(k, tip.x, tip.y + side * 0.13, tip.z, u < grow ? 0.26 - 0.1 * u : 0, LEAF_PALE[0], LEAF_PALE[1], LEAF_PALE[2], live);
        paint.look(k, F.leaf, side * 1.1 + ang * 0.5, 0.6);
      }
      path(1, tip);
      // The crack: a bright cut where the tip passes through the foe.
      let n = 0;
      if (hit > -40 && hit < 180) {
        for (let k = 0; k < 10; k++) {
          const u0 = k / 10;
          const u1 = (k + 1) / 10;
          const arc = (u: number, out: THREE.Vector3) => out.set(chest.x + dir * (-0.9 + 1.5 * u), chest.y + 1.0 - 1.9 * u * u, chest.z + 0.1);
          cut.put(n++, arc(u0, a), arc(u1, b), 0.02 + 0.1 * Math.sin(u0 * Math.PI), 0.02 + 0.1 * Math.sin(u1 * Math.PI), 0.6, 1.2, 0.35, 1);
        }
      }
      cut.show(n, 1.3 * (1 - smooth(40, 180, hit)));
      cut.flush();
      const g = hit >= 0 ? Math.exp(-hit / 80) : 0;
      light.put(0, chest.x, chest.y, chest.z + 0.2, 1.2 + 2 * g, 1.3, 1.7, 0.8, g);
      light.look(0, F.star, 0.5);
      light.put(1, chest.x, chest.y, chest.z + 0.2, 1 + g, 0.5, 1.1, 0.3, g * 0.7);
      light.look(1, F.soft);
      light.flush();
      leafBurst(paint, 14, paint.n - 14, 5, hit / 1000, chest, 1.1);
      paint.flush();
      ring(hit / 320, hit > 0 ? 1 - smooth(160, 320, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function sporeCone(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const from = new THREE.Vector3(env.from.x + dir * 0.55, env.tall * 0.55, env.from.z);
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const v = new THREE.Vector3().subVectors(chest, from);
  const puffs = quads(root, Math.round(170 * env.quality), false, F.smoke);
  const spores = quads(root, Math.round(120 * env.quality), false, F.disc);
  const light = quads(root, Math.round(60 * env.quality), true, F.soft);
  const p = new THREE.Vector3();
  const streamN = Math.floor(puffs.n * 0.55);
  return {
    update(ms) {
      // The puff: spores leave the mouth for 450 ms, fan out and slow down over the target.
      const stream = (i: number, seed: number, life: number) => {
        const t = (ms - 340 - h(i, 0, seed) * 450) / life;
        if (t <= 0 || t >= 1) return -1;
        const e = easeOut(t);
        const wide = 0.1 + 1.0 * e;
        p.copy(from).addScaledVector(v, e * 1.05);
        p.y += (h(i, 1, seed) - 0.5) * wide + 0.1 * Math.sin(t * 8 + i);
        p.z += (h(i, 2, seed) - 0.5) * wide * 0.5;
        return t;
      };
      for (let i = 0; i < streamN; i++) {
        const t = stream(i, 1, 560);
        if (t < 0) {
          puffs.hide(i);
          continue;
        }
        const c = 0.8 + 0.3 * h(i, 3, 1);
        puffs.put(i, p.x, p.y, p.z, 0.3 + 0.9 * t, POISON[0] * c, POISON[1] * c + 0.25 * (1 - t), POISON[2] * c, 0.42 * smooth(0, 0.12, t) * (1 - smooth(0.6, 1, t)));
        puffs.look(i, F.smoke, i + t);
      }
      for (let i = 0; i < spores.n; i++) {
        const t = stream(i, 2, 480);
        if (t < 0) {
          spores.hide(i);
          continue;
        }
        spores.put(i, p.x, p.y, p.z, 0.07 + 0.07 * h(i, 3, 2), SAP[0], SAP[1], SAP[2], 0.95 * (1 - smooth(0.8, 1, t)));
      }
      spores.flush();
      // It settles on the target as a cloud that rolls for a while.
      hangCloud(puffs, streamN, puffs.n - streamN, light, 0, light.n, 4, (ms - 680) / 1000, 0.95, chest, 0.75 + env.tall * 0.35, POISON);
      puffs.flush();
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
