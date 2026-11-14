// Class spells on one foe, rebuilt per kind (decision 059), in the caster's element colour; each lands at its `HIT`. `spell_lance`
// (Xuyên Phép): a ring of runes opens before the caster and a lance of light shoots through the foe and out the back, a ring
// flaring where it enters. `seal_stamp` (Phong Ấn): a sigil is drawn over the foe, turns, shrinks and stamps down onto it in a flash
// (the lock is the status's own mark). `energy_orb` (Cầu Năng Lượng): motes swirl into an orb at the caster's hands, it swells,
// flies to the foe trailing light and bursts in a ring. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { rgbOf, sigil } from './boonParts';
import { clamp, easeOut, smooth } from './effectParts';
import { burst, gather, type Rgb } from './fxKit';
import { lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
const colorOf = (env: Vfx3dEnv): Rgb => {
  const c = rgbOf(env.color, [0.8, 0.95, 1.3]);
  return [c[0] * 1.3, c[1] * 1.3, c[2] * 1.3];
};
function handle(env: Vfx3dEnv, build: (root: THREE.Group, c: Rgb, src: THREE.Vector3, chest: THREE.Vector3, dir: number) => (ms: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const src = new THREE.Vector3(env.from.x + dir * 0.7, env.tall * 0.6, env.from.z);
  const step = build(root, colorOf(env), src, new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z), dir);
  return {
    update: (ms) => step(ms),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export const spellLance = (env: Vfx3dEnv) => handle(env, (root, c, src, chest, dir) => {
  const runes = sigil(root, c, 12);
  runes.mesh.position.copy(src);
  runes.mesh.rotation.set(0, dir * 1.2, 0);
  const entry = sigil(root, c, 8);
  entry.mesh.position.set(chest.x - dir * 0.2, chest.y, chest.z + 0.1);
  entry.mesh.rotation.set(0, dir * 1.2, 0);
  const lance = lines(root, 2);
  const sparks = quads(root, Math.round(30 * env.quality), true, F.star);
  const FIRE = 200;
  const HIT = 280;
  const beyond = new THREE.Vector3(chest.x + dir * 3, chest.y, chest.z);
  return (ms) => {
    runes.mesh.scale.setScalar((0.8 + env.tall * 0.3) * easeOut(clamp(ms / 160)));
    runes.set(easeOut(clamp(ms / 180)), smooth(0, 60, ms) * (1 - smooth(HIT, HIT + 180, ms)), ms / 200);
    const run = clamp((ms - FIRE) / (HIT - FIRE + 60));
    const head = new THREE.Vector3().copy(src).lerp(beyond, run);
    const g = ms > FIRE ? 1 - smooth(HIT + 80, HIT + 240, ms) : 0;
    lance.put(0, src, head, 0.12, 0.06, c[0], c[1], c[2], g);
    lance.put(1, src, head, 0.035, 0.02, 2, 2, 2, g);
    lance.show(2, 1);
    lance.flush();
    entry.mesh.scale.setScalar((0.6 + env.tall * 0.3) * (0.6 + 0.6 * easeOut(clamp((ms - HIT) / 200))));
    entry.set(ms > HIT ? 1 : 0, ms > HIT ? 1 - smooth(HIT + 150, HIT + 350, ms) : 0, ms / 150);
    burst(sparks, 0, sparks.n, 1, { sec: (ms - HIT) / 1000, at: chest, life: 0.5, speed: 2.4, up: 1, grav: 0, drag: 3, size: 0.13, color: c, frame: F.star, alpha: 0.9 });
    sparks.flush();
  };
});

export const sealStamp = (env: Vfx3dEnv) => handle(env, (root, c, _src, chest) => {
  const mark = sigil(root, c, 6);
  mark.mesh.rotation.x = TILT;
  const flash = quads(root, 1 + Math.round(30 * env.quality), true, F.star);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 2.4, c);
  const HIT = 280;
  return (ms) => {
    // Drawn high over the foe, turning; it shrinks and stamps down onto the chest on the impact.
    const down = smooth(HIT - 90, HIT, ms);
    mark.mesh.position.set(chest.x, chest.y + env.tall * (1.1 - 1.1 * down), chest.z + 0.3);
    mark.mesh.scale.setScalar((0.9 + env.tall * 0.4) * (1 - 0.35 * down));
    mark.set(easeOut(clamp(ms / 200)), smooth(0, 60, ms) * (1 - smooth(HIT + 40, HIT + 200, ms)), ms / (ms < HIT ? 250 : 900));
    const g = ms > HIT ? Math.exp(-(ms - HIT) / 90) : 0;
    flash.put(0, chest.x, chest.y, chest.z + 0.35, 1.2 + 1.5 * g, c[0], c[1], c[2], g);
    flash.look(0, F.star, 0.4);
    burst(flash, 1, flash.n - 1, 2, { sec: (ms - HIT) / 1000, at: chest, life: 0.6, speed: 2, up: 0.8, grav: 0, drag: 3, size: 0.13, color: c, frame: F.star, alpha: 0.9 });
    flash.flush();
    ring((ms - HIT) / 300, ms > HIT ? 1 - smooth(150, 300, ms - HIT) : 0);
  };
});

export const energyOrb = (env: Vfx3dEnv) => handle(env, (root, c, src, chest) => {
  const orb = quads(root, 3 + 12, true, F.soft);
  const motes = quads(root, Math.round(50 * env.quality), true, F.star);
  const blast = quads(root, Math.round(40 * env.quality), true, F.star);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3, c);
  const FIRE = 420;
  const HIT = 720;
  const p = new THREE.Vector3();
  return (ms) => {
    // Charge at the hands: motes swirl in, the orb swells; then it flies on a shallow arc and bursts.
    const grow = easeOut(clamp(ms / FIRE));
    const fly = clamp((ms - FIRE) / (HIT - FIRE));
    p.copy(src).lerp(chest, fly * fly);
    p.y += Math.sin(fly * Math.PI) * 0.5;
    const on = ms < HIT ? 1 : 0;
    const R = (0.3 + env.tall * 0.12) * (0.4 + 0.6 * grow) * (1 + 0.08 * Math.sin(ms * 0.03));
    orb.put(0, p.x, p.y, p.z + 0.2, R * 2.2, c[0], c[1], c[2], on * 0.8);
    orb.put(1, p.x, p.y, p.z + 0.21, R * 1.1, 2, 2, 2, on);
    orb.look(0, F.soft);
    orb.look(1, F.soft);
    orb.hide(2);
    // Its trail: a few fading copies behind it while it flies.
    for (let k = 0; k < 12; k++) {
      const f2 = clamp(fly - (k + 1) * 0.035);
      const q = new THREE.Vector3().copy(src).lerp(chest, f2 * f2);
      q.y += Math.sin(f2 * Math.PI) * 0.5;
      orb.put(3 + k, q.x, q.y, q.z + 0.2, R * (1.4 - k * 0.08), c[0], c[1], c[2], fly > 0 && on ? 0.5 * (1 - k / 12) : 0);
      orb.look(3 + k, F.soft);
    }
    orb.flush();
    gather(motes, 0, motes.n, 3, { k: clamp(ms / FIRE), to: src, radius: 1.3 + env.tall * 0.3, turns: 1.2, size: 0.12, color: c, frame: F.star, tall: 1 });
    motes.flush();
    burst(blast, 0, blast.n, 4, { sec: (ms - HIT) / 1000, at: chest, life: 0.7, speed: 3.4, up: 1.5, grav: 0, drag: 2.5, size: 0.16, color: c, frame: F.star, alpha: 1 });
    blast.flush();
    ring((ms - HIT) / 340, ms > HIT ? 1 - smooth(170, 340, ms - HIT) : 0);
  };
});
