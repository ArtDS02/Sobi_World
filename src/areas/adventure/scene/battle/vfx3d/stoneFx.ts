// Earth skills rebuilt on the stone parts (decision 059). `boulder_smash` (Đập Đá): a boulder is torn out of the ground before the
// caster, hurled in an arc and bursts on the foe. `quake_spikes` (Địa Chấn Cổ): the stomp sends cracks racing to the row and a
// clump of stone spikes thrusts up under every foe in turn. `tusk_charge` (Húc Nanh): the beast's rush kicks up a wall of dust and
// two great tusks gore upward through the foe. `rock_fist` (Nện Đá): a fist of rock rears over the foe and hammers it into a
// crater. (`seal_quake` is in stoneSeal.ts.) Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, easeOutBack, smooth } from './effectParts';
import { h, rise } from './fxKit';
import { stem } from './plantParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { DUST, boulder, cracks, rock, rubble, spikeClump } from './stoneParts';
import { shock } from './stormParts';

const RING = [0.9, 0.7, 0.4] as const;
const ground = (p: THREE.Vector3) => new THREE.Vector3(p.x, 0, p.z);

export function boulderSmash(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const pit = new THREE.Vector3(env.from.x + dir * 1.1, 0, env.from.z);
  const feet = ground(env.origin);
  const chest = new THREE.Vector3(feet.x, env.tall * 0.5, feet.z);
  const stone = rock();
  const R = 0.5 + env.tall * 0.22;
  const ball = new THREE.Mesh(boulder(3, 1), stone.mat);
  root.add(ball);
  // The pieces it breaks into.
  const bits = Array.from({ length: 6 }, (_, i) => {
    const m = new THREE.Mesh(boulder(10 + i, 0), stone.mat);
    root.add(m);
    return m;
  });
  const hole = cracks(root, pit, 2.2, 1);
  const scar = cracks(root, feet, 3.4, 2);
  const ring = shock(root, feet, 4.6, RING);
  const chips = quads(root, Math.round(120 * env.quality), false, F.shard);
  const dust = quads(root, 40, false, F.smoke);
  const HIT = 760;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      // Torn up: the ground cracks, the rock shoulders out with a wobble, hangs a moment, then flies.
      const up = easeOutBack(clamp((ms - 60) / 290));
      const fly = clamp((ms - 380) / (HIT - 380));
      if (fly <= 0) p.set(pit.x, R * 0.9 * up + 0.5 * smooth(250, 380, ms), pit.z);
      else p.set(pit.x + (chest.x - pit.x) * fly, R * 0.9 + 0.5 + (chest.y - R * 0.9 - 0.5) * fly + Math.sin(fly * Math.PI) * 1.5, pit.z);
      ball.position.copy(p);
      ball.scale.setScalar(R * (0.4 + 0.6 * up));
      ball.rotation.set(ms * 0.004, 0.3, -dir * fly * 5.5 + 0.1 * Math.sin(ms * 0.03) * (1 - fly));
      ball.visible = ms > 60 && hit < 0;
      stone.set(1);
      hole(easeOut(clamp(ms / 300)), smooth(0, 80, ms) * (1 - smooth(900, 1300, ms)));
      rubble(chips, 0, Math.floor(chips.n * 0.3), dust, 0, 12, 1, (ms - 120) / 1000, pit, 0.7);
      // Bursts on the foe: big pieces tumble away, chips and dust, cracks under it.
      bits.forEach((m, i) => {
        const t = hit / 1000;
        m.visible = t > 0 && t < 0.9;
        if (!m.visible) return;
        const a = (i / bits.length) * 6.2832 + 0.4;
        m.position.set(chest.x + Math.cos(a) * 2.6 * t * (0.6 + 0.6 * h(i, 0, 4)), Math.max(0.15, chest.y + (3.2 + 2 * h(i, 1, 4)) * t - 7 * t * t), chest.z + Math.sin(a) * 1.1 * t);
        m.rotation.set(t * 9 * (h(i, 2, 4) - 0.5), t * 7, t * 8 * (h(i, 3, 4) - 0.5));
        m.scale.setScalar(R * (0.3 + 0.2 * h(i, 4, 4)) * (1 - smooth(0.6, 0.9, t)));
      });
      rubble(chips, Math.floor(chips.n * 0.3), chips.n - Math.floor(chips.n * 0.3), dust, 12, 28, 2, hit / 1000, chest, 1.3);
      chips.flush();
      dust.flush();
      scar(easeOut3(clamp(hit / 220)), hit > 0 ? 1 - smooth(450, 720, hit) : 0);
      ring(hit / 380, hit > 0 ? 1 - smooth(190, 380, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function quakeSpikes(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = env.struck.map(ground);
  const home = ground(env.from);
  const stone = rock();
  const hits = foes.map((p, i) => ({ p, t: 600 + i * 130, clump: spikeClump(root, stone.mat, p, 6, 0.9 + env.tall * 0.75, 20 + i * 9), scar: cracks(root, p, 3, 5 + i), ring: shock(root, p, 3.6, RING) }));
  const stomp = cracks(root, home, 3.4, 9);
  const per = Math.round(60 * env.quality);
  const chips = quads(root, hits.length * per, false, F.shard);
  const dust = quads(root, hits.length * 12 + 36, false, F.smoke);
  const a = new THREE.Vector3();
  return {
    update(ms) {
      stone.set(1);
      // The stomp at 420 cracks the ground under the caster; a bank of dust runs along the ground to the row.
      stomp(easeOut(clamp((ms - 420) / 200)), ms > 420 ? 1 - smooth(1000, 1400, ms) : 0);
      rise(dust, hits.length * 12, 36, 1, { sec: (ms - 420) / 1000, dur: 0.3, life: 0.6, at: (born, k) => a.copy(home).lerp(foes[k % foes.length]!, clamp(born / 0.3)).setY(0.15), rise: 0.7, jitter: 0.5, size: 0.6, color: DUST, to: [0.5, 0.44, 0.36], frame: F.smoke, grow: 1.8, alpha: 0.4 });
      hits.forEach((x, i) => {
        const age = ms - x.t;
        // Thrust up with an overshoot, stand, sink back.
        x.clump(age > 0 ? easeOutBack(clamp(age / 170)) * (1 - smooth(480, 760, age)) : 0);
        x.scar(easeOut(clamp((age + 60) / 200)), age > -60 ? 1 - smooth(600, 880, age) : 0);
        x.ring(age / 360, age > 0 ? 1 - smooth(180, 360, age) : 0);
        rubble(chips, i * per, per, dust, i * 12, 12, 30 + i, age / 1000, x.p, 1);
      });
      chips.flush();
      dust.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function tuskCharge(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const home = ground(env.from);
  const feet = ground(env.origin);
  const tusks = [0, 1].map(() => stem(root, 18, [0.5, 0.42, 0.28], [1, 0.96, 0.82], 0.001));
  const scar = cracks(root, feet, 3, 3);
  const ring = shock(root, feet, 4.4, RING);
  const chips = quads(root, Math.round(90 * env.quality), false, F.shard);
  const dust = quads(root, 70, false, F.smoke);
  const glint = quads(root, 2, true, F.star);
  const HIT = 700;
  const a = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      // The run-up: dust kicked up behind the beast all along its rush.
      rise(dust, 0, 46, 1, { sec: (ms - 420) / 1000, dur: 0.28, life: 0.7, at: (born) => a.copy(home).lerp(feet, clamp(born / 0.28)).setY(0.2), rise: 0.8, jitter: 0.6, size: 0.75, color: DUST, to: [0.5, 0.44, 0.36], frame: F.smoke, grow: 1.9, alpha: 0.42 });
      // Two tusks sweep up out of the ground under the foe and hook over it.
      const up = easeOutBack(clamp((ms - HIT + 70) / 150));
      const live = (ms > HIT - 70 ? 1 : 0) * (1 - smooth(260, 480, hit));
      tusks.forEach((t, k) => {
        const z = feet.z + (k ? 0.22 : -0.12);
        t.set((u, out) => {
          const th = -0.3 + u * 1.75;
          const len = (1.1 + env.tall * 0.85) * up;
          return out.set(feet.x - dir * 0.7 + dir * Math.sin(th) * len * 0.55 + dir * k * 0.2, Math.max(0.02, (1 - Math.cos(th)) * len * 0.95), z);
        }, (u) => 0.28 - 0.24 * u, 1, live);
      });
      const g = hit >= 0 ? Math.exp(-hit / 90) : 0;
      glint.put(0, feet.x, env.tall * 0.6, feet.z + 0.2, 1 + 1.4 * g, 1.6, 1.4, 1, g * 0.8);
      glint.look(0, F.star, 0.5);
      glint.put(1, feet.x, env.tall * 0.6, feet.z + 0.2, 0.8 + 0.8 * g, 1.1, 0.9, 0.6, g * 0.5);
      glint.look(1, F.soft);
      glint.flush();
      rubble(chips, 0, chips.n, dust, 46, 24, 2, hit / 1000, feet, 1.2);
      chips.flush();
      dust.flush();
      scar(easeOut3(clamp(hit / 200)), hit > 0 ? 1 - smooth(420, 700, hit) : 0);
      ring(hit / 360, hit > 0 ? 1 - smooth(180, 360, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function rockFist(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const feet = ground(env.origin);
  const stone = rock([0.56, 0.47, 0.37]);
  // A fist, knuckles down: a block of a hand, four knuckles along its striking edge, a thumb across the front, a stub of wrist.
  const fist = new THREE.Group();
  const lumpAt = (seed: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const m = new THREE.Mesh(boulder(seed, 1), stone.mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    fist.add(m);
  };
  lumpAt(1, 0, 0.72, 0, 1.02, 0.6, 0.72);
  for (let k = 0; k < 4; k++) lumpAt(2 + k, -0.72 + k * 0.48, 0.2, 0.14, 0.31, 0.36, 0.46);
  lumpAt(7, 0.3, 0.5, 0.7, 0.56, 0.26, 0.24);
  // The wrist: a narrower six-sided stump above the hand.
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.52, 1.2, 6), stone.mat);
  wrist.position.set(0, 1.7, -0.05);
  fist.add(wrist);
  root.add(fist);
  const S = 0.55 + env.tall * 0.17;
  const scar = cracks(root, feet, 4.2, 4);
  const ring = shock(root, feet, 5.4, RING);
  const chips = quads(root, Math.round(130 * env.quality), false, F.shard);
  const dust = quads(root, 44, false, F.smoke);
  const HIT = 750;
  const top = env.tall * 0.8;
  const high = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      // Gathers out of rubble above the foe, draws back (cocked to one side), falls in 100 ms, squashes, cracks apart.
      const form = easeOutBack(clamp((ms - 200) / 260));
      const wind = smooth(450, 640, ms);
      const fall = clamp((ms - 650) / 100);
      const y = top + (2.3 + 0.5 * wind) * (1 - fall * fall);
      const squash = hit > 0 ? 1 - 0.2 * Math.exp(-hit / 60) * Math.cos(hit / 32) : 1 + 0.2 * fall;
      fist.position.set(feet.x, y - 0.3 * smooth(0, 60, hit), feet.z);
      fist.rotation.z = 0.35 * (1 - fall) * wind;
      fist.scale.set(S * form / Math.sqrt(squash), S * form * squash, S * form);
      stone.set(smooth(200, 300, ms) * (1 - smooth(1150, 1450, ms)));
      rubble(chips, 0, Math.floor(chips.n * 0.2), dust, 0, 8, 1, (ms - 220) / 1000, high.set(feet.x, y, feet.z), 0.5);
      rubble(chips, Math.floor(chips.n * 0.2), chips.n - Math.floor(chips.n * 0.2), dust, 8, 36, 2, hit / 1000, feet, 1.5);
      chips.flush();
      dust.flush();
      scar(easeOut3(clamp(hit / 180)), hit > 0 ? 1 - smooth(550, 850, hit) : 0);
      ring(hit / 400, hit > 0 ? 1 - smooth(200, 400, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
