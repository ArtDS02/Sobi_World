// Lightning effects rebuilt on the storm parts (decision 059). `chain_lightning` (Chuỗi Sét): a storm cloud rolls in over the foes'
// row and fires exactly three bolts, one after the other, each on a foe the skill really strikes; a thin arc leaps from the foe struck
// before to the next (the chain), and the third bolt is the heaviest. Times are ms from the start of the act; the first bolt lands
// at 320 and the next two follow 220 ms apart (the skill's stagger), so each falls with its damage number.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, smooth } from './effectParts';
import { h, pulse, rise } from './fxKit';
import { forked, lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { BOLT, landing, scorch, shock, stormCloud, strike, strikeGain } from './stormParts';

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
