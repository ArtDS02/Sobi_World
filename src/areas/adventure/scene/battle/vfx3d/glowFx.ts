// Light skills rebuilt on the glow parts (decision 059). `light_ray` (Tia Sáng): motes gather before the caster into a small
// halo, a slim ray shoots to the foe and blooms there. `lumina_ray` (Tia Lumina): a great sun halo opens behind the caster, a wide
// ray drives through the foe and a column of light stands up where it lands. `rune_beam` (Tia Rune): a wheel of rune marks turns
// before the monster, lights up, and fires a ray strung with rings of runes; a rune ring is stamped under the target.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { gather, h, pulse, rise } from './fxKit';
import { GOLD, SUN, dazzle, halo, ray } from './glowParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

/** Faces a flat halo toward the stage's raised camera. */
const TILT = -0.5;
const RUNE = [0.75, 1.2, 1.6] as const;

export function lightRay(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const src = new THREE.Vector3(env.from.x + dir * 0.8, env.tall * 0.75, env.from.z);
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const beam = ray(root);
  const ring = halo(root, GOLD, 0.6);
  ring.mesh.position.copy(src);
  ring.mesh.rotation.x = TILT;
  const light = quads(root, Math.round(150 * env.quality) + 3, true, F.star);
  const floor = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3, [1.3, 1.1, 0.5]);
  const FIRE = 260;
  const HIT = 440;
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      const half = Math.floor((light.n - 3) * 0.4);
      gather(light, 3, half, 1, { k: clamp(ms / FIRE), to: src, radius: 1.5, turns: 0.8, size: 0.16, color: SUN, frame: F.star, tall: 1.6 });
      ring.mesh.scale.setScalar(1.5 * easeOutBack(clamp(ms / 240)) * (1 + 0.15 * pulse(ms, FIRE, 30, 120)));
      ring.set(sec, smooth(0, 120, ms) * (1 - smooth(520, 760, ms)));
      // The ray: its head reaches the foe on the impact; afterwards it thins and its start lets go first.
      const head = clamp((ms - FIRE) / (HIT - FIRE));
      const width = 0.16 * (0.5 + 0.5 * head) * (1 + 0.5 * pulse(ms, HIT, 20, 110)) * (1 - 0.7 * smooth(120, 360, hit));
      beam.set(src, chest, width, head, smooth(100, 360, hit), sec, ms > FIRE ? 1 - smooth(200, 380, hit) : 0);
      dazzle(light, 0, 3, 2, hit / 1000, chest, 0.8);
      dazzle(light, 3 + half, light.n - 3 - half, 3, hit / 1000, chest, 0.8);
      light.flush();
      floor(hit / 380, hit > 0 ? 0.7 * (1 - smooth(190, 380, hit)) : 0);
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
  const src = new THREE.Vector3(env.from.x + dir * 0.9, env.tall * 0.75, env.from.z);
  const back = new THREE.Vector3(env.from.x - dir * 0.2, env.tall * 0.9, env.from.z - 0.3);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const chest = new THREE.Vector3(feet.x, env.tall * 0.5, feet.z);
  const beyond = chest.clone().add(new THREE.Vector3(dir * 4.5, -0.2, 0));
  const sun = halo(root, GOLD, 1);
  sun.mesh.position.copy(back);
  sun.mesh.rotation.x = TILT;
  const lens = halo(root, SUN, 0.3);
  lens.mesh.position.copy(src);
  lens.mesh.rotation.x = TILT;
  const beam = ray(root);
  const column = ray(root, SUN);
  const crown = halo(root, GOLD, 1);
  crown.mesh.position.set(feet.x, 0.05, feet.z);
  crown.mesh.rotation.x = -Math.PI / 2;
  const light = quads(root, Math.round(260 * env.quality) + 6, true, F.star);
  const floor = shock(root, feet, 5.4, [1.4, 1.2, 0.55]);
  const FIRE = 460;
  const HIT = 660;
  const sky = new THREE.Vector3(feet.x, 6.5, feet.z);
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // The sun behind the caster: it opens wide and slow, flares as the ray is loosed, and closes last.
      sun.mesh.scale.setScalar((2.6 + env.tall * 1.1) * easeOut(clamp(ms / 420)) * (1 + 0.12 * pulse(ms, FIRE, 40, 200)));
      sun.set(sec * 0.6, smooth(0, 200, ms) * (1 - smooth(900, 1250, ms)));
      lens.mesh.scale.setScalar(1.6 * easeOutBack(clamp((ms - 150) / 260)));
      lens.set(-sec, smooth(150, 300, ms) * (1 - smooth(820, 1050, ms)));
      const n0 = Math.floor((light.n - 6) * 0.25);
      gather(light, 6, n0, 1, { k: clamp(ms / FIRE), to: src, radius: 2.4, turns: 1, size: 0.2, color: SUN, frame: F.star, tall: 2.4 });
      // The ray: wide, it passes through the foe and on; it holds for a moment, then narrows to a thread and goes.
      const head = clamp((ms - FIRE) / (HIT - FIRE + 80));
      const width = 0.42 * (0.4 + 0.6 * smooth(FIRE, FIRE + 90, ms)) * (1 + 0.3 * pulse(ms, HIT, 30, 160) + 0.06 * Math.sin(ms * 0.06)) * (1 - 0.85 * smooth(240, 520, hit));
      beam.set(src, beyond, width, head, smooth(260, 540, hit), sec, ms > FIRE ? 1 - smooth(380, 560, hit) : 0);
      // Where it lands a column of light stands up to the sky and a crown opens on the ground.
      const rise01 = easeOut(clamp(hit / 160));
      column.set(feet, p.copy(feet).lerp(sky, rise01), 0.5 * (1 + 0.2 * Math.sin(ms * 0.05)) * (1 - 0.8 * smooth(260, 600, hit)), 1, 0, sec, hit > 0 ? 0.9 * (1 - smooth(420, 640, hit)) : 0);
      crown.mesh.scale.set((2.2 + env.tall) * 1.4 * easeOut(clamp(hit / 240)), (2.2 + env.tall) * 0.9 * easeOut(clamp(hit / 240)), 1);
      crown.set(sec, hit > 0 ? 1 - smooth(380, 660, hit) : 0);
      dazzle(light, 0, 3, 2, hit / 1000, chest, 1.1);
      light.hide(3);
      light.hide(4);
      light.hide(5);
      const n1 = Math.floor((light.n - 6 - n0) * 0.5);
      dazzle(light, 6 + n0, n1, 3, hit / 1000, chest, 1.3);
      // Motes carried up the column.
      rise(light, 6 + n0 + n1, light.n - 6 - n0 - n1, 4, { sec: hit / 1000, dur: 0.45, life: 0.8, at: (_b, k) => p.set(feet.x + (h(k, 8, 4) - 0.5) * 0.9, 0.2 + h(k, 9, 4) * 1.2, feet.z), rise: 3.2, jitter: 0.1, size: 0.16, color: SUN, to: GOLD, frame: F.star, grow: 0.3, sway: 0.1 });
      light.flush();
      floor(hit / 440, hit > 0 ? 1 - smooth(220, 440, hit) : 0);
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
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const src = new THREE.Vector3(env.from.x + dir * 1.0, env.tall * 0.65, env.from.z);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const chest = new THREE.Vector3(feet.x, env.tall * 0.5, feet.z);
  const wheel = halo(root, RUNE, 0, 1);
  wheel.mesh.position.copy(src);
  wheel.mesh.rotation.x = TILT;
  const inner = halo(root, [1.4, 1.5, 1.6], 0.4, 0);
  inner.mesh.position.copy(src);
  inner.mesh.rotation.x = TILT;
  const beam = ray(root, RUNE, [0.7, 0.9, 1]);
  const stamp = halo(root, RUNE, 0, 1);
  stamp.mesh.position.set(feet.x, 0.05, feet.z);
  stamp.mesh.rotation.x = -Math.PI / 2;
  const RINGS = 5;
  const light = quads(root, RINGS + Math.round(130 * env.quality) + 3, true, F.ring);
  const FIRE = 380;
  const HIT = 560;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // The wheel: opens, spins up, its heart brightens as the marks charge.
      const open = easeOutBack(clamp((ms - 60) / 260));
      wheel.mesh.scale.setScalar((1.9 + env.tall * 0.5) * open * (1 + 0.1 * pulse(ms, FIRE, 30, 140)));
      wheel.set(sec * (1 + 2 * smooth(150, FIRE, ms)), smooth(60, 180, ms) * (1 - smooth(700, 950, ms)));
      inner.mesh.scale.setScalar(1.1 * open * (0.6 + 0.6 * smooth(150, FIRE, ms)));
      inner.set(-sec * 2, smooth(150, FIRE, ms) * (1 - smooth(640, 860, ms)));
      const head = clamp((ms - FIRE) / (HIT - FIRE));
      const width = 0.24 * (0.5 + 0.5 * head) * (1 + 0.4 * pulse(ms, HIT, 20, 120)) * (1 - 0.75 * smooth(140, 400, hit));
      beam.set(src, chest, width, head, smooth(140, 400, hit), sec, ms > FIRE ? 1 - smooth(240, 420, hit) : 0);
      // Rings strung along the ray, sliding toward the foe and widening.
      for (let k = 0; k < RINGS; k++) {
        const u = ((ms - FIRE) / 260 + k / RINGS) % 1;
        const on = ms > FIRE && hit < 240 && u < head + 0.02;
        p.copy(src).lerp(chest, u);
        light.put(k, p.x, p.y, p.z, on ? 0.5 + 0.7 * u : 0, RUNE[0], RUNE[1], RUNE[2], on ? 0.9 * (1 - smooth(120, 240, hit)) : 0);
        light.look(k, F.ring, 0, 1.7);
      }
      dazzle(light, RINGS, light.n - RINGS, 2, hit / 1000, chest, 1, RUNE);
      light.flush();
      stamp.mesh.scale.set((1.8 + env.tall * 0.8) * 1.4 * easeOutBack(clamp(hit / 200)), (1.8 + env.tall * 0.8) * 0.85 * easeOutBack(clamp(hit / 200)), 1);
      stamp.set(sec * 2, hit > 0 ? 1 - smooth(300, 560, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
