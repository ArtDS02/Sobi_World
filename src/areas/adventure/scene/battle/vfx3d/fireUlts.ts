// "Lò Rèn Nguyên Thủy" in 3D (decision 059; the other fire Ultimate, the phoenix, is in phoenixFx.ts). An anvil of black iron
// drops on the middle of the foes' row; a giant hammer, hotter with every blow, strikes it three times (1200, 1650, 2100). Each blow
// throws a fountain of sparks, rolls a ring of fire further over the ground and sets a flame under every foe, the third the
// greatest; the ground runs with lava. Then the forge's sparks stream to every friend and a flame stands on each (the attack-up).
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, smooth } from './effectParts';
import { FIRE, HOT, fireBurst, flame, glow, hotIron, lava, smokeUp } from './flameParts';
import { burst, h, pulse } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const BLOWS = [1200, 1650, 2100] as const;
const RING = [1.2, 0.5, 0.1] as const;

export function forgeUlt(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const q = env.quality;
  const row = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const foes = env.targets.map((t) => t.clone().setY(0));
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - row.x) * 2 + 2));
  const iron = hotIron();
  const face = hotIron(0x4a3028);
  const mesh = (g: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    m.rotation.z = rz;
    g.add(m);
  };
  // The anvil: a foot, a waist, a broad face with a horn; its face takes the heat.
  const anvil = new THREE.Group();
  mesh(anvil, new THREE.BoxGeometry(1.7, 0.32, 1.0), iron.mat, 0, 0.16);
  mesh(anvil, new THREE.BoxGeometry(0.9, 0.5, 0.75), iron.mat, 0, 0.56);
  mesh(anvil, new THREE.BoxGeometry(1.9, 0.36, 0.95), face.mat, 0, 0.98);
  mesh(anvil, new THREE.ConeGeometry(0.2, 0.9, 10), iron.mat, 1.38, 0.98, -Math.PI / 2);
  anvil.position.copy(row);
  const ANVIL_TOP = 1.16;
  // The hammer: head down, its face at the group's origin.
  const ham = new THREE.Group();
  mesh(ham, new THREE.BoxGeometry(1.7, 1.05, 1.1), face.mat, 0, 0.53);
  for (const y of [0.18, 0.88]) mesh(ham, new THREE.BoxGeometry(1.84, 0.18, 1.2), iron.mat, 0, y);
  mesh(ham, new THREE.CylinderGeometry(0.13, 0.11, 2.6, 10), iron.mat, 0, 2.35);
  root.add(anvil, ham);
  const pool = lava(root, span * 2, 4);
  pool.mesh.position.set(row.x, 0.015, row.z);
  const rings = BLOWS.map((_, i) => shock(root, row, 5 + i * 2.6, RING));
  const fires = foes.map((p, i) => {
    const f = flame(root, 61 + i);
    f.mesh.position.set(p.x, 0, p.z + 0.05);
    return f;
  });
  const bless = env.friends.map((p, i) => {
    const f = flame(root, 71 + i);
    f.mesh.position.set(p.x, 0, p.z + 0.05);
    return { f, p, t: 2520 + i * 100, ring: shock(root, p, 2.6, [1.3, 0.8, 0.2]) };
  });
  const per = Math.round(170 * q);
  const each = Math.round(60 * q);
  const light = quads(root, 2 + BLOWS.length * per + each * bless.length, true, F.flame);
  const smoke = quads(root, 30, false, F.smoke);
  const aura = glow(root, 0xff7a20);
  const p = new THREE.Vector3();
  const top = new THREE.Vector3(row.x, ANVIL_TOP, row.z);

  return {
    update(ms) {
      const sec = ms / 1000;
      // The anvil drops in and lands with a thud.
      const drop = clamp((ms - 480) / 320);
      anvil.position.y = 4.5 * (1 - drop * drop) + (drop >= 1 ? 0.06 * Math.exp(-(ms - 800) / 60) * Math.cos((ms - 800) / 25) : 0);
      const live = smooth(480, 560, ms) * (1 - smooth(2850, 3150, ms));
      // Every blow leaves the metal hotter.
      const done = BLOWS.filter((t) => ms >= t).length;
      const flashHeat = Math.max(...BLOWS.map((t) => pulse(ms, t, 20, 320)));
      iron.set(0.1 + 0.12 * done, live);
      face.set(0.25 + 0.17 * done + 0.4 * flashHeat, live);
      // The hammer: before each blow it rears up and back, then comes down in 110 ms; it bounces off the anvil.
      let lift = 1;
      let tilt = 1;
      let bounce = 0;
      for (const t of BLOWS) {
        const a = ms - t;
        if (a < 0 && a > -330) {
          lift = 1 + 0.25 * smooth(-330, -120, a) - 1.25 * smooth(-110, 0, a) ** 2;
          tilt = 1 - smooth(-110, 0, a);
        } else if (a >= 0 && a < 330) {
          lift = easeOut(clamp((a - 60) / 270));
          tilt = lift;
          bounce = 0.2 * Math.exp(-a / 60) * Math.cos(a / 30);
        }
      }
      const hv = smooth(820, 980, ms) * (1 - smooth(2600, 2850, ms));
      ham.position.set(row.x + 0.15 * tilt, ANVIL_TOP + 2.3 * lift, row.z);
      ham.rotation.z = -0.7 * tilt;
      ham.scale.set(hv * (1 + bounce * 0.4), hv * (1 - bounce), hv);
      ham.visible = hv > 0.01;
      aura(row.x, ANVIL_TOP + 0.4, row.z, 4 + 3 * flashHeat, live * (0.25 + 0.12 * done + 0.3 * flashHeat));

      BLOWS.forEach((t, i) => {
        const age = ms - t;
        const power = 1 + i * 0.45;
        // The fountain of sparks off the anvil's face, wider with each blow.
        const half = Math.floor(per * 0.5);
        burst(light, 2 + i * per, half, 10 + i, { sec: age / 1000, at: top, life: 0.9, speed: 6 * power, up: 9 * power, grav: 15, drag: 1.3, size: 0.14, color: HOT, to: FIRE, frame: F.streak, stretch: 0.05 });
        fireBurst(light, 2 + i * per + half, per - half, 20 + i, age / 1000, top, 0.9 * power);
        rings[i]!(age / (420 + i * 80), age > 0 ? 1 - smooth(210, 420 + i * 80, age) : 0);
      });
      // The foes' fires: a low flame after the first blow, higher after the second, a roaring one after the third.
      fires.forEach((f, i) => {
        let hgt = 0;
        let fade = 0;
        BLOWS.forEach((t, b) => {
          const k = (ms - t - 60 - i * 60) / (b === 2 ? 900 : 420);
          if (k > 0 && k < 1) {
            hgt = (0.9 + b * 0.75 + env.tall * (0.5 + b * 0.3)) * Math.sin(Math.PI * clamp(k) ** 0.45);
            fade = smooth(0, 0.08, k) * (1 - smooth(0.6, 1, k));
          }
        });
        f.set(1.05, hgt * (1 + 0.07 * Math.sin(sec * 24 + i)), sec + i, fade, 0.15 * Math.sin(sec * 5 + i));
      });
      const le = ms - BLOWS[1];
      pool.set(easeOut3(clamp(le / 600)), sec, le > 0 ? smooth(0, 150, le) * (1 - smooth(1150, 1550, le)) : 0, 0.6 + 0.6 * pulse(ms, BLOWS[2], 40, 600));
      const g = Math.max(...BLOWS.map((t, i) => (ms >= t ? Math.exp(-(ms - t) / 100) * (0.7 + i * 0.25) : 0)));
      light.put(0, top.x, top.y, top.z + 0.3, 2 + 4 * g, 1.8, 1.4, 0.7, Math.min(1, g));
      light.look(0, F.star, 0.3);
      light.put(1, top.x, top.y, top.z + 0.3, 1.6 + 2.4 * g, 1.5, 0.8, 0.2, Math.min(1, g) * 0.8);
      light.look(1, F.soft);
      smokeUp(smoke, 0, smoke.n, 3, (ms - BLOWS[2] - 200) / 1000, row, span * 0.5, 1);
      smoke.flush();

      // The attack-up: sparks of the forge fly to each friend, a flame stands up on them, a ring opens.
      bless.forEach((x, i) => {
        const age = ms - x.t;
        const base = 2 + BLOWS.length * per + i * each;
        for (let k = 0; k < each; k++) {
          const t = (age + 380 - h(k, 0, 40 + i) * 300) / 380;
          if (t <= 0 || t >= 1) {
            light.hide(base + k);
            continue;
          }
          p.copy(top).lerp(x.p, t).setY(top.y + (0.6 - top.y) * t + Math.sin(t * Math.PI) * (1.2 + h(k, 1, 40 + i)));
          light.put(base + k, p.x, p.y, p.z + (h(k, 2, 40 + i) - 0.5) * 0.5, 0.16, HOT[0], HOT[1], HOT[2], 0.9 * (1 - smooth(0.8, 1, t)));
          light.look(base + k, F.ember, k);
        }
        const fk = age / 700;
        x.f.set(0.85, (0.9 + env.tall * 0.7) * Math.sin(Math.PI * clamp(fk) ** 0.5), sec + i * 3, fk > 0 && fk < 1 ? 0.85 * smooth(0, 0.1, fk) * (1 - smooth(0.55, 1, fk)) : 0);
        x.ring(age / 460, age > 0 ? 1 - smooth(230, 460, age) : 0);
      });
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
