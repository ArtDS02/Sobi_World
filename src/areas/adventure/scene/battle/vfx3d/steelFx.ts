// Metal skills on one foe, rebuilt on the steel parts (decision 059; the Ultimate is in steelUlt.ts). `steel_slash` (Chém Thép):
// one great crescent cut, a held beat, then the line of the cut flashes and sparks burst out of it. `armor_break` (Phá Giáp): the
// foe's armour shows as a shield of plates, a heavy cut cracks it, and the plates fly apart. `steel_charge` (Húc Thép): a toothed
// wheel of steel spins up and rams the foe. `metal_claw` (Vuốt Thép): three raking cuts, the third the widest. (`bronze_fist` is
// in steelFist.ts.) Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, easeOutBack, smooth } from './effectParts';
import { h, pulse, rise } from './fxKit';
import { lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { SPARK, STEEL, clang, cut, metal, plates } from './steelParts';
import { cracks } from './stoneParts';
import { shock } from './stormParts';

const RING = [0.8, 0.95, 1.3] as const;
const chestOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
const feetOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, 0, env.origin.z);

export function steelSlash(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const chest = chestOf(env);
  const size = 2.2 + env.tall * 0.75;
  const main = cut(root);
  const echo = cut(root, [0.5, 0.7, 1.2]);
  for (const c of [main, echo]) {
    c.mesh.position.set(chest.x, chest.y + 0.1, chest.z + 0.2);
    c.mesh.scale.set(size * dir, size, 1);
  }
  main.mesh.rotation.z = dir * 0.5;
  echo.mesh.rotation.z = dir * 0.62;
  echo.mesh.scale.multiplyScalar(1.12);
  const seam = lines(root, 14);
  const light = quads(root, Math.round(150 * env.quality) + 2, true, F.streak);
  const chips = quads(root, 30, false, F.shard);
  const ring = shock(root, feetOf(env), 3.6, RING);
  const HIT = 400;
  const BURST = 600;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      // The cut is drawn in 70 ms, hangs through the hit stop, then thins away.
      main.set(clamp((ms - HIT + 50) / 70) + 0.7 * smooth(160, 420, hit), ms > HIT - 50 ? 1 - smooth(260, 460, hit) : 0);
      echo.set(clamp((ms - HIT + 20) / 90) + 0.8 * smooth(120, 380, hit), ms > HIT - 20 ? 0.5 * (1 - smooth(200, 400, hit)) : 0);
      // The delayed line: a thin seam of light straight through the foe, which then bursts.
      let n = 0;
      if (hit > 60 && ms < BURST + 140) {
        const len = size * 0.62;
        for (let k = 0; k < 12; k++) {
          const u0 = k / 12 - 0.5;
          const u1 = (k + 1) / 12 - 0.5;
          const w = (u: number) => 0.012 + 0.05 * (1 - 4 * u * u);
          seam.put(n++, a.set(chest.x + dir * u0 * len * 0.9, chest.y - u0 * len * 0.95, chest.z + 0.25), b.set(chest.x + dir * u1 * len * 0.9, chest.y - u1 * len * 0.95, chest.z + 0.25), w(u0), w(u1), 0.9, 1.1, 1.5, 1);
        }
      }
      seam.show(n, (0.7 + 1.3 * pulse(ms, BURST - 30, 30, 70)) * (1 - smooth(BURST, BURST + 140, ms)));
      seam.flush();
      clang(light, 0, light.n, chips, 0, chips.n, 3, (ms - BURST) / 1000, chest, 1.3);
      light.flush();
      chips.flush();
      ring((ms - BURST) / 320, ms > BURST ? 1 - smooth(160, 320, ms - BURST) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function armorBreak(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const chest = chestOf(env);
  const shield = plates(STEEL, 8, 5);
  const S = 0.3 + env.tall * 0.22;
  shield.g.position.set(chest.x - dir * 0.25, chest.y + 0.05, chest.z + 0.3);
  shield.g.rotation.y = -dir * 0.35;
  root.add(shield.g);
  const blow = cut(root, [1.1, 0.95, 0.6]);
  blow.mesh.position.set(chest.x, chest.y + 0.2, chest.z + 0.45);
  blow.mesh.scale.set(-dir * (2.4 + env.tall * 0.8), 2.4 + env.tall * 0.8, 1);
  blow.mesh.rotation.z = dir * 1.35;
  const veins = lines(root, 40);
  const light = quads(root, Math.round(140 * env.quality) + 2, true, F.streak);
  const chips = quads(root, 40, false, F.shard);
  const ring = shock(root, feetOf(env), 3.6, RING);
  const HIT = 560;
  const BREAK = 660;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      // The armour shows itself (a glint runs over it), takes the blow, cracks for 100 ms, then bursts.
      const show = easeOutBack(clamp((ms - 120) / 260));
      const jolt = ms > HIT ? 0.1 * Math.exp(-(ms - HIT) / 60) * Math.cos((ms - HIT) / 20) : 0;
      const apart = (ms - BREAK) / 700;
      shield.g.scale.setScalar(S * show * (1 - jolt));
      shield.set(Math.max(0, apart), smooth(120, 220, ms) * (1 - smooth(0.6, 1, apart)), 0.6 * pulse(ms, HIT, 20, 120), -2.5 + ((ms - 150) / 300) * 5);
      blow.set(clamp((ms - HIT + 70) / 80) + 0.8 * smooth(60, 300, ms - HIT), ms > HIT - 70 ? 1 - smooth(140, 320, ms - HIT) : 0);
      // Cracks of light spreading over the plates between the blow and the break.
      let n = 0;
      if (ms > HIT && ms < BREAK + 60) {
        const reach = clamp((ms - HIT) / 90);
        for (let k = 0; k < 7; k++) {
          const ang = (k / 7) * 6.2832 + 0.3;
          for (let s = 0; s < 4; s++) {
            const r0 = (s / 4) * reach * S * 1.05;
            const r1 = ((s + 1) / 4) * reach * S * 1.05;
            const wob = (r: number) => ang + 0.35 * Math.sin(r * 5 + k * 2);
            veins.put(n++, a.set(shield.g.position.x + Math.cos(wob(r0)) * r0, shield.g.position.y + Math.sin(wob(r0)) * r0, shield.g.position.z + 0.15), b.set(shield.g.position.x + Math.cos(wob(r1)) * r1, shield.g.position.y + Math.sin(wob(r1)) * r1, shield.g.position.z + 0.15), 0.035, 0.02, 1.2, 1, 0.6, 1);
          }
        }
      }
      veins.show(n, 1.4);
      veins.flush();
      const half = Math.floor(light.n / 2);
      clang(light, 0, half, null, 0, 0, 4, (ms - HIT) / 1000, chest, 0.9);
      clang(light, half, light.n - half, chips, 0, chips.n, 5, (ms - BREAK) / 1000, chest, 1.3);
      light.flush();
      chips.flush();
      ring((ms - BREAK) / 340, ms > BREAK ? 1 - smooth(170, 340, ms - BREAK) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function steelCharge(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const feet = feetOf(env);
  const steel = metal();
  // A wheel with twelve teeth and a hub.
  const shape = new THREE.Shape();
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * 6.2832;
    const r = k % 2 ? 0.78 : 1;
    if (k === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.42, 0, 6.2832, true);
  shape.holes.push(hole);
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }), steel.mat);
  rim.position.z = -0.15;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.46, 10), steel.mat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(rim, hub);
  for (let k = 0; k < 4; k++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.11, 0.14), steel.mat);
    spoke.rotation.z = (k / 4) * Math.PI;
    wheel.add(spoke);
  }
  root.add(wheel);
  const R = 0.55 + env.tall * 0.3;
  const wind = lines(root, 30);
  const light = quads(root, Math.round(190 * env.quality) + 2, true, F.streak);
  const chips = quads(root, 36, false, F.shard);
  const dust = quads(root, 30, false, F.smoke);
  const scar = cracks(root, feet, 3, 6);
  const ring = shock(root, feet, 4.8, RING);
  const HIT = 660;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      // Spins up on the spot (the wind-up), shoots across, stops dead on the foe and rings.
      const spin = smooth(250, 420, ms);
      const run = clamp((ms - 420) / (HIT - 420));
      const x = env.from.x + dir * 0.6 + (feet.x - dir * R * 0.9 - env.from.x - dir * 0.6) * run * run;
      const squash = hit > 0 ? 1 - 0.18 * Math.exp(-hit / 55) * Math.cos(hit / 28) : 1;
      wheel.position.set(x - (hit > 0 ? dir * 0.5 * easeOut(clamp(hit / 300)) : 0), R + (hit > 0 ? 0.6 * Math.sin(Math.PI * clamp(hit / 320)) : 0), feet.z + 0.15);
      wheel.rotation.z = -dir * (ms * 0.012 * spin + run * 14) * (hit > 0 ? 0.3 : 1);
      wheel.scale.set(R * squash * easeOutBack(clamp((ms - 220) / 200)), R / squash * easeOutBack(clamp((ms - 220) / 200)), R);
      steel.set(smooth(220, 300, ms) * (1 - smooth(280, 480, hit)), 0.5 * pulse(ms, HIT, 20, 150), -1.5 + ((ms % 400) / 400) * 3);
      // Lines of speed behind it and sparks off the ground while it runs.
      let n = 0;
      if (run > 0.05 && hit < 60) {
        for (let k = 0; k < 9; k++) {
          const y = R * (0.2 + 1.6 * h(k, 0, 2));
          const len = (0.8 + 1.6 * h(k, 1, 2)) * run;
          wind.put(n++, a.set(x - dir * R, y, feet.z + 0.2), b.set(x - dir * (R + len), y, feet.z + 0.2), 0.05, 0.01, 0.8, 0.95, 1.3, 0.7 * (1 - smooth(0, 60, hit)));
        }
      }
      wind.show(n, 1);
      wind.flush();
      const trailN = Math.floor(light.n * 0.3);
      rise(light, 2, trailN, 1, { sec: (ms - 420) / 1000, dur: (HIT - 420) / 1000, life: 0.25, at: (born) => a.set(env.from.x + dir * 0.6 + (feet.x - env.from.x) * (born / ((HIT - 420) / 1000)) ** 2, 0.08, feet.z + 0.2), rise: 1.6, jitter: 0.2, size: 0.14, color: SPARK, to: [1.2, 0.6, 0.1], frame: F.ember, grow: 0.3 });
      clang(light, 2 + trailN, light.n - 2 - trailN, chips, 0, chips.n, 3, hit / 1000, a.set(feet.x - dir * 0.3, env.tall * 0.5, feet.z), 1.5);
      light.hide(0);
      light.hide(1);
      light.flush();
      chips.flush();
      rise(dust, 0, dust.n, 4, { sec: hit / 1000, dur: 0.15, life: 0.8, at: () => a.set(feet.x, 0.2, feet.z), rise: 0.7, jitter: 1.2, size: 0.8, color: [0.72, 0.7, 0.68], to: [0.5, 0.5, 0.5], frame: F.smoke, grow: 1.9, alpha: 0.35 });
      dust.flush();
      scar(easeOut3(clamp(hit / 200)), hit > 0 ? 1 - smooth(350, 560, hit) : 0);
      ring(hit / 380, hit > 0 ? 1 - smooth(190, 380, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function metalClaw(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const chest = chestOf(env);
  const RAKES = [400, 480, 560] as const;
  const size = 1.5 + env.tall * 0.55;
  // Each rake is three parallel cuts (three claws); the rakes cross each other, the last is the widest.
  const rakes = RAKES.map((t, i) => ({ t, big: i === 2 ? 1.3 : 1, claws: [-1, 0, 1].map((k) => {
    const c = cut(root, [0.8, 0.9, 1.3], true);
    const tilt = dir * (i === 1 ? -0.9 : 0.75) + i * 0.2;
    c.mesh.position.set(chest.x + Math.cos(tilt + Math.PI / 2) * k * size * 0.13 * (i === 2 ? 1.3 : 1), chest.y + Math.sin(tilt + Math.PI / 2) * k * size * 0.13 * (i === 2 ? 1.3 : 1), chest.z + 0.2 + i * 0.02);
    c.mesh.scale.set(size * dir * (i === 1 ? -1 : 1) * (i === 2 ? 1.3 : 1) * (1 - 0.12 * Math.abs(k)), size * (i === 2 ? 1.3 : 1) * 0.8, 1);
    c.mesh.rotation.z = tilt;
    return c;
  }) }));
  const per = Math.round(55 * env.quality) + 2;
  const light = quads(root, per * 3, true, F.streak);
  const chips = quads(root, 30, false, F.shard);
  return {
    update(ms) {
      rakes.forEach((r, i) => {
        const age = ms - r.t;
        for (const c of r.claws) c.set(clamp((age + 40) / 60) + 0.8 * smooth(40, 240, age), age > -40 ? 1 - smooth(120, 280, age) : 0);
        clang(light, i * per, per, i === 2 ? chips : null, 0, chips.n, 10 + i, age / 1000, chest, 0.7 * r.big);
      });
      light.flush();
      chips.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
