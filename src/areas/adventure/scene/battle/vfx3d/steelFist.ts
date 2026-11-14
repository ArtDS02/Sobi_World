// "Nghiền Đồng" in 3D (decision 059): a bronze gauntlet (a plated hand, four fingers of two plates each, a thumb, a flared cuff
// with a band) drops over the foe, cocks back, slams down and then twists on it, grinding, sparks spitting out sideways.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut3, easeOutBack, smooth } from './effectParts';
import { h, pulse, rise } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { BRONZE, SPARK, clang, metal } from './steelParts';
import { cracks } from './stoneParts';
import { shock } from './stormParts';

const feetOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, 0, env.origin.z);

export function bronzeFist(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const feet = feetOf(env);
  const bronze = metal(BRONZE);
  const trim = metal([0.95, 0.8, 0.45]);
  // A gauntlet, knuckles down: a plated back of the hand, four fingers of two plates each, a thumb, a flared cuff with a band.
  const fist = new THREE.Group();
  const box = (mat: THREE.Material, w: number, hgt: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), mat);
    m.position.set(x, y, z);
    fist.add(m);
  };
  box(bronze.mat, 1.5, 0.8, 1.0, 0, 0.95, 0);
  for (let k = 0; k < 4; k++) {
    box(bronze.mat, 0.33, 0.46, 0.5, -0.56 + k * 0.375, 0.36, 0.3);
    box(trim.mat, 0.36, 0.12, 0.56, -0.56 + k * 0.375, 0.62, 0.3);
    box(bronze.mat, 0.33, 0.3, 0.42, -0.56 + k * 0.375, 0.15, -0.05);
  }
  box(bronze.mat, 0.34, 0.5, 0.36, 0.86, 0.7, 0.32);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.6, 0.9, 8), bronze.mat);
  cuff.position.y = 1.75;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.16, 8), trim.mat);
  band.position.y = 2.15;
  fist.add(cuff, band);
  root.add(fist);
  const S = 0.5 + env.tall * 0.2;
  const scar = cracks(root, feet, 4, 8);
  const ring = shock(root, feet, 5.2, [1.3, 0.9, 0.4]);
  const light = quads(root, Math.round(220 * env.quality) + 2, true, F.streak);
  const chips = quads(root, 40, false, F.shard);
  const HIT = 750;
  const top = env.tall * 0.8;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      // Drops in from above, cocks back, falls in 100 ms; then it twists on the foe, grinding, sparks spraying sideways.
      const form = easeOutBack(clamp((ms - 200) / 240));
      const wind = smooth(450, 640, ms);
      const fall = clamp((ms - 650) / 100);
      const squash = hit > 0 ? 1 - 0.16 * Math.exp(-hit / 60) * Math.cos(hit / 30) : 1 + 0.2 * fall;
      const grind = hit > 60 ? Math.sin((hit - 60) / 45) * 0.35 * (1 - smooth(60, 520, hit)) : 0;
      fist.position.set(feet.x, top + (2.2 + 0.45 * wind) * (1 - fall * fall) - 0.25 * smooth(0, 60, hit), feet.z);
      fist.rotation.set(0, grind, 0.3 * (1 - fall) * wind);
      fist.scale.set(S * form / Math.sqrt(squash), S * form * squash, S * form);
      const fade = smooth(200, 290, ms) * (1 - smooth(1150, 1420, ms));
      bronze.set(fade, 0.5 * pulse(ms, HIT, 20, 160), -2 + ((ms - 250) / 350) * 4);
      trim.set(fade, 0.6 * pulse(ms, HIT, 20, 160));
      const half = Math.floor(light.n * 0.55);
      clang(light, 0, half, chips, 0, chips.n, 3, hit / 1000, p.set(feet.x, top * 0.5, feet.z), 1.5);
      // The grind: sparks keep spitting out low and sideways for half a second.
      rise(light, half, light.n - half, 4, { sec: (hit - 60) / 1000, dur: 0.46, life: 0.3, at: (_b, k) => p.set(feet.x + (k % 2 ? 1 : -1) * (0.5 + 1.6 * h(k, 8, 4)), top * 0.4 + 0.5 * h(k, 9, 4), feet.z + 0.2), rise: 1.2, jitter: 0.3, size: 0.16, color: SPARK, to: [1.2, 0.6, 0.1], frame: F.ember, grow: 0.3 });
      light.flush();
      chips.flush();
      scar(easeOut3(clamp(hit / 180)), hit > 0 ? 1 - smooth(520, 800, hit) : 0);
      ring(hit / 400, hit > 0 ? 1 - smooth(200, 400, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
