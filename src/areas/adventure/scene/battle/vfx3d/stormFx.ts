// Lightning effects on one foe or a few, built on the storm parts (decision 059; the row-wide ones are in stormArea.ts). `chain_lightning` (Chuỗi Sét): a storm cloud rolls in over the foes'
// row and fires exactly three bolts, one after the other, each on a foe the skill really strikes; a thin arc leaps from the foe struck
// before to the next (the chain), and the third bolt is the heaviest. Times are ms from the start of the act; the first bolt lands
// at 320 and the next two follow 220 ms apart (the skill's stagger), so each falls with its damage number.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, smooth } from './effectParts';
import { gather, h, pulse, rise } from './fxKit';
import { forked, lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { BOLT, landing, scorch, shock, stormCloud, stormRig, strike, strikeGain } from './stormParts';

const CHAIN_AT = [320, 540, 760] as const;
const CHAIN_DUR = 300;

export function chainLightning(env: Vfx3dEnv): Vfx3dHandle {
  const q = env.quality;
  const root = new THREE.Group();
  env.scene.add(root);
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const span = Math.max(2.6, ...env.targets.map((t) => Math.abs(t.x - mid.x) * 2 + 1.6));
  const top = Math.min(4.1, 2.6 + env.tall * 1.3);
  const cloud = stormCloud(root, span * 1.7, 2.3);
  cloud.mesh.position.set(mid.x, top + 0.75, mid.z - 0.4);
  // The three bolts fall on the foes really struck, in order (fewer foes than bolts: the list wraps round).
  const hits = CHAIN_AT.map((t, i) => {
    const p = env.struck[i % env.struck.length]!.clone().setY(0);
    return { t, p, from: new THREE.Vector3(p.x + (h(i, 0, 3) - 0.5) * 1.4, top + 0.2, p.z - 0.3), power: i === 2 ? 1.35 : 1, mark: scorch(root, p, 1.15), ring: shock(root, p, i === 2 ? 4.6 : 3.4) };
  });
  const bolts = lines(root, 900);
  const light = quads(root, Math.round(96 * q) * 3 + 60, true, F.soft);
  const smoke = quads(root, 36, false, F.smoke);
  const per = Math.floor((light.n - 60) / 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  return {
    update(ms) {
      const sec = ms / 1000;
      // The cloud rolls in before the first bolt, glows from inside whenever it fires, thins out afterwards.
      const fire = Math.max(...hits.map((x) => strikeGain(ms - x.t, CHAIN_DUR)), 0.35 * pulse(ms, 140, 60, 90));
      cloud.set(sec, smooth(0, 240, ms) * (1 - smooth(1050, 1400, ms)), fire, 0.55 + 0.45 * easeOut(clamp(ms / 300)));
      let n = 0;
      // Before the first strike: thin feelers flicker under the cloud (the charge building).
      if (ms > 120 && ms < CHAIN_AT[0]) {
        const step = Math.floor(ms / 50);
        for (let k = 0; k < 3; k++) {
          const x = mid.x + (h(k + step * 3, 0, 7) - 0.5) * span;
          n = forked(bolts, n, a.set(x, top + 0.3, mid.z - 0.3), b.set(x + (h(k, 1, step) - 0.5) * 0.8, top - 0.5 - 0.7 * h(k, 2, step), mid.z - 0.2), step * 5 + k, { width: 0.04, color: BOLT, forks: 1, jag: 0.28, gain: 0.8 }, 1);
        }
      }
      hits.forEach((x, i) => {
        const age = ms - x.t;
        n = strike(bolts, n, x.from, a.set(x.p.x, 0.05, x.p.z), ms, x.t, CHAIN_DUR, 100 + i * 37, 0.13 * x.power, i === 2 ? 6 : 4);
        // The chain: an arc leaping from the foe struck before to this one, a touch ahead of the bolt.
        if (i > 0 && age > -40 && age < 200) {
          const prev = hits[i - 1]!.p;
          if (prev.distanceTo(x.p) > 0.2) n = forked(bolts, n, a.set(prev.x, env.tall * 0.55, prev.z), b.set(x.p.x, env.tall * 0.55, x.p.z), 300 + i * 11 + Math.floor((age + 40) / 45), { width: 0.07, color: BOLT, forks: 2, jag: 0.22, gain: 1.2 * (1 - smooth(60, 200, age)) });
        }
        n = landing(light, i * per, per, smoke, i * 12, 12, bolts, n, x.p, age, 20 + i, x.power);
        x.mark(age > 0 ? smooth(0, 40, age) * (1 - smooth(450, 800, age)) : 0, Math.exp(-Math.max(0, age) / 260));
        x.ring(age / 380, age > 0 ? 1 - smooth(200, 380, age) : 0);
      });
      bolts.show(n, 1);
      bolts.flush();
      // Motes of charge drifting down from the cloud all along.
      rise(light, 3 * per, 60, 9, { sec: sec - 0.1, dur: 1.1, life: 0.5, at: (_born, k) => a.set(mid.x + (h(k, 8, 9) - 0.5) * span * 1.2, top + 0.2 - 0.9 * h(k, 9, 9), mid.z - 0.2), rise: -1.6, jitter: 0.2, size: 0.12, color: [1.3, 1.1, 0.5], to: [0.8, 0.5, 0.1], frame: F.star, alpha: 0.8 });
      light.flush();
      smoke.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

const foot = (p: THREE.Vector3) => new THREE.Vector3(p.x, 0.05, p.z);

/** `thunder_strike` (Lôi Kích): a small black cloud knots over one foe, charge crawls down, then one heavy bolt (and its re-strike) at 470. */
export function thunderStrike(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rig = stormRig(root, 1, env.quality, 40);
  const p = rig.spot(0, env.origin, 4.4);
  const top = Math.min(4.2, 2.7 + env.tall * 1.3);
  const cloud = stormCloud(root, 4.2, 2.0);
  cloud.mesh.position.set(p.x, top + 0.7, p.z - 0.4);
  const from = new THREE.Vector3(p.x + 0.5, top + 0.2, p.z - 0.3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const age = ms - 470;
      cloud.set(ms / 1000, smooth(0, 220, ms) * (1 - smooth(800, 1080, ms)), Math.max(strikeGain(age, 340), 0.4 * pulse(ms, 250, 50, 80)), 0.5 + 0.5 * easeOut(clamp(ms / 300)));
      rig.begin();
      // The charge: feelers reaching down from the cloud, longer each time, before the bolt lets go.
      if (ms > 140 && ms < 470) {
        const step = Math.floor(ms / 50);
        for (let k = 0; k < 3; k++) rig.n = forked(rig.bolts, rig.n, a.set(p.x + (h(k + step * 3, 0, 5) - 0.5) * 2.4, top + 0.3, p.z - 0.3), b.set(p.x + (h(k, 1, step) - 0.5) * 1.6, top - (0.4 + 1.4 * clamp(ms / 470)) * h(k, 2, step + 1), p.z - 0.2), step * 5 + k, { width: 0.045, color: BOLT, forks: 1, jag: 0.3, gain: 0.9 }, 1);
      }
      rig.n = strike(rig.bolts, rig.n, from, foot(p), ms, 470, 340, 51, 0.2, 6);
      rig.hit(0, age, 1.45);
      gather(rig.light, rig.spare, 40, 4, { k: clamp(ms / 470), to: a.set(p.x, env.tall * 0.6, p.z), radius: 1.6, turns: 1, size: 0.14, color: [1.4, 1.2, 0.5], frame: F.star, tall: 2 });
      rig.end();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

/** `spark_peck` (Mổ Tia Điện): two snaps of electricity from the attacker's beak into the foe, at 380 and 470, the second sharper. */
export function sparkPeck(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rig = stormRig(root, 2, env.quality * 0.6);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const beak = new THREE.Vector3(env.from.x + dir * 0.5, env.tall * 0.55, env.from.z);
  rig.spot(0, env.origin, 2.2);
  rig.spot(1, env.origin, 2.8);
  const glint = quads(root, 2, true, F.star);
  const a = new THREE.Vector3();
  return {
    update(ms) {
      rig.begin();
      [380, 470].forEach((t, i) => {
        // The attacker is on the foe by now: the arc is short, from just in front of it.
        a.copy(chest).lerp(beak, 0.35 - i * 0.1).setY(chest.y + 0.5 - i * 0.2);
        rig.n = strike(rig.bolts, rig.n, a, chest, ms, t, 150, 61 + i * 9, 0.09 + i * 0.03, 3);
        rig.hit(i, ms - t, 0.55 + i * 0.25);
        const g = ms >= t ? Math.exp(-(ms - t) / 70) : 0;
        glint.put(i, chest.x, chest.y, chest.z + 0.1, 1.6 + i * 0.8 + 2 * g, 1.7, 1.5, 0.8, g);
        glint.look(i, F.star, 0.3 + i * 0.6);
      });
      glint.flush();
      rig.end();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

/** `lightning_dive` (Bổ Nhào): a point of light falls out of the sky dragging lines of lightning, and lands on the foe at 700 as one crashing bolt. */
export function lightningDive(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rig = stormRig(root, 1, env.quality, 70);
  const p = rig.spot(0, env.origin, 4.8);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const sky = new THREE.Vector3(p.x - dir * 2.2, 5.2, p.z);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const age = ms - 700;
      const k = clamp((ms - 380) / 320);
      const fall = k * k;
      rig.begin();
      a.copy(sky).lerp(foot(p), fall);
      // The diver: a white-hot head with a tail of crackling lines back up its path.
      if (k > 0 && age < 40) {
        for (let s = 0; s < 3; s++) rig.n = forked(rig.bolts, rig.n, b.copy(sky).lerp(foot(p), Math.max(0, fall - 0.35 - s * 0.08)), a, Math.floor(ms / 40) * 3 + s, { width: 0.07 + 0.05 * k, color: BOLT, forks: 1, jag: 0.1, gain: 0.9 }, 1);
        rig.light.put(rig.spare, a.x, a.y, a.z, 0.8 + 0.5 * k, 1.7, 1.5, 0.9, 0.9);
        rig.light.look(rig.spare, F.soft);
        rig.light.put(rig.spare + 1, a.x, a.y, a.z, 1.3 + 0.9 * k, 1.8, 1.7, 1.2, 0.9);
        rig.light.look(rig.spare + 1, F.star, ms * 0.01);
      } else {
        rig.light.hide(rig.spare);
        rig.light.hide(rig.spare + 1);
      }
      rise(rig.light, rig.spare + 2, 68, 3, { sec: (ms - 380) / 1000, dur: 0.32, life: 0.3, at: (born) => b.copy(sky).lerp(foot(p), (born / 0.32) ** 2), rise: 0.3, jitter: 0.35, size: 0.2, color: [1.5, 1.3, 0.6], to: [0.9, 0.5, 0.05], frame: F.ember, grow: 0.3 });
      rig.n = strike(rig.bolts, rig.n, sky, foot(p), ms, 700, 300, 71, 0.19, 5);
      rig.hit(0, age, 1.5);
      rig.end();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
