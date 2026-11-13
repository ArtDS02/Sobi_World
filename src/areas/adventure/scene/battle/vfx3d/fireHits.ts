// Fire skills on one foe, rebuilt on the flame parts (decision 059). `claw_clamp` (Càng Nung): a great pincer of glowing iron opens
// wide round the foe and snaps shut. `jaw_flame` (Cắn Than Hồng): jaws of live coal with fangs bite down in a burst of embers.
// `hammer_slam` (Búa Hỏa Ngục): a hammer rears back over the foe, heats to white and comes down; the ground splits into lava.
// `lava_glob` (Phun Dung Nham of a monster): a wobbling ball of lava is spat in an arc and splashes into a burning pool.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, easeOutBack, smooth } from './effectParts';
import { FIRE, HOT, RED, fireBurst, flame, glow, hotIron, lava, smokeUp } from './flameParts';
import { burst, pulse, rise } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { scorch, shock } from './stormParts';

const HEAT_RING = [1.2, 0.5, 0.1] as const;
const plate = (shape: THREE.Shape, depth: number) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
};
/** One jaw of a pincer, hinged at the origin and reaching up +y, hooked toward +x; `teeth` cuts fangs into its inner edge. */
function jawShape(len: number, teeth = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.22, 0);
  s.quadraticCurveTo(-0.5, len * 0.66, 0.5, len);
  if (teeth === 0) s.quadraticCurveTo(-0.2, len * 0.62, 0.1, 0);
  else {
    for (let i = 0; i < teeth; i++) {
      const y0 = len * (0.92 - (i / teeth) * 0.78);
      const y1 = len * (0.92 - ((i + 0.5) / teeth) * 0.78);
      const x = 0.06 + 0.1 * Math.sin((i / teeth) * Math.PI);
      s.lineTo(x + 0.34, y1 + len * 0.02);
      s.lineTo(x, (y0 + y1) / 2 - len * 0.1);
    }
    s.lineTo(0.16, 0);
  }
  s.closePath();
  return s;
}

/** A hinged pair of jaws closing on the foe from the attacker's side: shared by the pincer and the bite. */
function clampFx(env: Vfx3dEnv, o: { teeth: number; base: number; size: number; heat: number; seed: number; open: number }): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const chest = new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const len = (0.9 + env.tall * 0.75) * o.size;
  const iron = hotIron(o.base);
  const hinge = new THREE.Group();
  hinge.position.set(chest.x - dir * len * 0.62, chest.y, chest.z + 0.1);
  // The jaws reach from the hinge toward the foe.
  hinge.rotation.z = -dir * Math.PI / 2;
  root.add(hinge);
  const jaws = [1, -1].map((s) => {
    const m = new THREE.Mesh(plate(jawShape(len, o.teeth), 0.3 * o.size), iron.mat);
    m.scale.set(-s * dir, 1, 1);
    m.position.x = s * dir * 0.12;
    hinge.add(m);
    return { m, s };
  });
  const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.34 * o.size, 14, 10), iron.mat);
  hinge.add(knuckle);
  const light = quads(root, Math.round(150 * env.quality) + 2, true, F.flame);
  const smoke = quads(root, 14, false, F.smoke);
  const ring = shock(root, feet, 3.2, HEAT_RING);
  const heatGlow = glow(root, 0xff6a1a);
  const HIT = 480;
  return {
    update(ms) {
      const hit = ms - HIT;
      const show = easeOutBack(clamp((ms - 200) / 180));
      // Wide open while it winds up, shut in 60 ms, a bounce on contact, then it lets go.
      const wind = smooth(200, 400, ms);
      const shut = smooth(HIT - 60, HIT, ms);
      const bounce = hit > 0 ? 0.12 * Math.exp(-hit / 70) * Math.cos(hit / 30) : 0;
      const release = smooth(820, 1000, ms);
      const ang = o.open * wind * (1 - shut) + 0.2 + bounce + 0.5 * release;
      for (const j of jaws) j.m.rotation.z = j.s * dir * ang;
      hinge.scale.setScalar(Math.max(0.001, show));
      iron.set(o.heat * (0.4 + 0.25 * wind + 0.6 * pulse(ms, HIT, 20, 260)), smooth(200, 280, ms) * (1 - release));
      fireBurst(light, 2, light.n - 2, o.seed, hit / 1000, chest, 0.85);
      const g = hit >= 0 ? Math.exp(-hit / 90) : 0;
      light.put(0, chest.x, chest.y, chest.z + 0.2, 1.4 + 2.2 * g, 1.7, 1.3, 0.6, g);
      light.look(0, F.star, 0.4);
      light.put(1, chest.x, chest.y, chest.z + 0.2, 1.2 + 1.2 * g, 1.5, 0.8, 0.2, g * 0.8);
      light.look(1, F.soft);
      light.flush();
      smokeUp(smoke, 0, smoke.n, o.seed + 5, (hit - 120) / 1000, chest, 0.4, 0.6);
      smoke.flush();
      ring(hit / 340, hit > 0 ? 1 - smooth(170, 340, hit) : 0);
      heatGlow(chest.x, chest.y, chest.z, 2.6 * show, 0.4 * wind * (1 - release));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
export const clawClamp = (env: Vfx3dEnv) => clampFx(env, { teeth: 0, base: 0x3a3238, size: 1, heat: 0.95, seed: 41, open: 0.85 });
export const jawFlame = (env: Vfx3dEnv) => clampFx(env, { teeth: 4, base: 0x2a1410, size: 0.92, heat: 1.15, seed: 47, open: 0.7 });

export function hammerSlam(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const iron = hotIron();
  const face = hotIron(0x4a3028);
  const ham = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    ham.add(m);
  };
  // Head down: the striking face is at the group's origin, the handle goes up and back.
  add(new THREE.BoxGeometry(1.5, 0.95, 1.0), face.mat, 0, 0.48);
  for (const y of [0.16, 0.8]) add(new THREE.BoxGeometry(1.62, 0.16, 1.1), iron.mat, 0, y);
  add(new THREE.CylinderGeometry(0.12, 0.1, 2.3, 10), iron.mat, 0, 2.05);
  add(new THREE.SphereGeometry(0.17, 10, 8), iron.mat, 0, 3.2);
  root.add(ham);
  const pillar = flame(root, 3);
  pillar.mesh.position.copy(feet);
  const pool = lava(root, 4.2, 2.8);
  pool.mesh.position.set(feet.x, 0.015, feet.z);
  const mark = scorch(root, feet, 1.6);
  const ring = shock(root, feet, 5.2, HEAT_RING);
  const light = quads(root, Math.round(240 * env.quality) + 2, true, F.flame);
  const smoke = quads(root, 22, false, F.smoke);
  const aura = glow(root, 0xff7a20);
  const HIT = 800;
  const top = env.tall * 0.85;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // Appears high and cocked back, lifts a little more (the wind-up), then falls in 110 ms and squashes on the foe.
      const show = easeOutBack(clamp((ms - 250) / 220));
      const wind = smooth(480, 690, ms);
      const fall = clamp((ms - 690) / 110);
      const y = top + (2.4 + 0.45 * wind) * (1 - fall * fall);
      const squash = hit > 0 ? 1 - 0.22 * Math.exp(-hit / 60) * Math.cos(hit / 34) : 1 + 0.25 * fall;
      ham.position.set(feet.x, y - 0.25 * smooth(0, 50, hit), feet.z);
      ham.rotation.z = -0.75 * (1 - fall) * (0.6 + 0.4 * wind) + 0.04 * Math.sin(ms * 0.03) * (1 - fall);
      ham.scale.set(show / Math.sqrt(squash), show * squash, show);
      const fade = smooth(250, 330, ms) * (1 - smooth(1100, 1350, ms));
      iron.set(0.1 + 0.2 * wind, fade);
      face.set(0.2 + 0.4 * wind + 0.45 * pulse(ms, HIT, 20, 300), fade);
      aura(feet.x, y + 0.5, feet.z, 3.4 * show, 0.45 * (0.3 + 0.7 * wind) * fade);
      // Embers drawn up into the head while it heats.
      const pre = Math.floor(light.n * 0.2);
      rise(light, 2, pre, 1, { sec: (ms - 330) / 1000, dur: 0.36, life: 0.3, at: () => p.set(feet.x, y + 0.5, feet.z), rise: 1.2, jitter: 1.3, size: 0.16, color: HOT, to: RED, frame: F.ember, grow: 0.3 });
      fireBurst(light, 2 + pre, light.n - 2 - pre, 2, hit / 1000, p.set(feet.x, 0.3, feet.z), 1.4);
      const g = hit >= 0 ? Math.exp(-hit / 110) : 0;
      light.put(0, feet.x, top * 0.6, feet.z + 0.2, 2 + 3 * g, 1.8, 1.4, 0.7, g);
      light.look(0, F.star, 0.2);
      light.put(1, feet.x, top * 0.6, feet.z + 0.2, 1.6 + 2 * g, 1.5, 0.8, 0.2, g * 0.8);
      light.look(1, F.soft);
      light.flush();
      const k = hit / 620;
      pillar.set(1.9 + 0.8 * easeOut(clamp(k)), 3.8 * Math.sin(Math.PI * clamp(k) ** 0.45), sec, k > 0 && k < 1 ? smooth(0, 0.06, k) * (1 - smooth(0.55, 1, k)) : 0);
      pool.set(easeOut3(clamp(hit / 320)), sec, hit > 0 ? smooth(0, 60, hit) * (1 - smooth(380, 640, hit)) : 0, 1.1 * Math.exp(-Math.max(0, hit) / 500) + 0.3);
      mark(hit > 0 ? smooth(0, 60, hit) * (1 - smooth(380, 640, hit)) : 0, Math.exp(-Math.max(0, hit) / 300));
      ring(hit / 420, hit > 0 ? 1 - smooth(210, 420, hit) : 0);
      smokeUp(smoke, 0, smoke.n, 4, (hit - 150) / 1000, feet, 0.9, 0.9);
      smoke.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function lavaGlob(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const from = new THREE.Vector3(env.from.x + dir * 0.55, env.tall * 0.55, env.from.z);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const chest = new THREE.Vector3(feet.x, env.tall * 0.45, feet.z);
  const melt = hotIron(0x4a1408);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), melt.mat);
  root.add(ball);
  const pool = lava(root, 3.6, 2.4);
  pool.mesh.position.set(feet.x, 0.015, feet.z);
  const lick = [-0.5, 0.15, 0.6].map((dx, i) => {
    const f = flame(root, 5 + i);
    f.mesh.position.set(feet.x + dx, 0, feet.z + (i - 1) * 0.12);
    return f;
  });
  const light = quads(root, Math.round(200 * env.quality), true, F.flame);
  const drops = quads(root, Math.round(70 * env.quality), false, F.drop);
  const smoke = quads(root, 16, false, F.smoke);
  const aura = glow(root, 0xff5a10);
  const HIT = 720;
  const p = new THREE.Vector3();
  const at = (t: number, out: THREE.Vector3) => out.copy(from).lerp(chest, t).setY(from.y + (chest.y - from.y) * t + Math.sin(t * Math.PI) * 1.6);
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      const fly = clamp((ms - 320) / (HIT - 320));
      at(fly, p);
      // Swells in the mouth, wobbles like a drop of thick liquid in flight.
      const r = (0.18 + 0.3 * easeOutBack(clamp((ms - 200) / 200))) * (1 + 0.15 * fly);
      const wob = 0.14 * Math.sin(ms * 0.035);
      ball.position.copy(p);
      ball.scale.set(r * (1 + wob), r * (1 - wob), r);
      ball.rotation.set(ms * 0.006, ms * 0.004, 0);
      melt.set(1.05 + 0.1 * Math.sin(ms * 0.02), ms > 200 && hit < 0 ? 1 : 0);
      aura(p.x, p.y, p.z, 2.2 * r / 0.5, hit < 0 && ms > 200 ? 0.5 : 0);
      const trailN = Math.floor(light.n * 0.3);
      rise(light, 0, trailN, 1, { sec: (ms - 320) / 1000, dur: (HIT - 320) / 1000, life: 0.35, at: (born) => at(clamp((born * 1000) / (HIT - 320)), p), rise: 0.4, jitter: 0.3, size: 0.4, color: FIRE, to: RED, frame: F.flame, grow: 0.4, alpha: 0.6 });
      fireBurst(light, trailN, light.n - trailN, 2, hit / 1000, chest, 0.9);
      light.flush();
      // Gobs of lava thrown out by the splash (paint: they are thick and bright, not light).
      burst(drops, 0, drops.n, 3, { sec: hit / 1000, at: chest, life: 0.8, speed: 3.6, up: 4.2, grav: 12, drag: 1, size: 0.2, color: [1, 0.62, 0.12], to: [0.7, 0.16, 0.04], frame: F.drop, stretch: 0.035 });
      drops.flush();
      pool.set(easeOut3(clamp(hit / 380)), sec, hit > 0 ? smooth(0, 60, hit) * (1 - smooth(420, 660, hit)) : 0, 0.5 + 0.7 * Math.exp(-Math.max(0, hit) / 450));
      lick.forEach((f, i) => {
        const k = (hit - 60 - i * 50) / 520;
        f.set(0.7, (0.9 + 0.5 * env.tall) * Math.sin(Math.PI * clamp(k) ** 0.5), sec + i, k > 0 && k < 1 ? smooth(0, 0.1, k) * (1 - smooth(0.55, 1, k)) : 0, 0.2 * Math.sin(sec * 5 + i));
      });
      smokeUp(smoke, 0, smoke.n, 4, (hit - 100) / 1000, feet, 0.7, 0.7);
      smoke.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
