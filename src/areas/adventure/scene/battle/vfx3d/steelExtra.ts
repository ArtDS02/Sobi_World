// The new metal skills (decision 060), on the steel parts. `shield_bash` (Húc Khiên): a shield of steel plates locks in front of the
// monster, drives forward and slams into the target with a clang (the stun is the status's own mark). `spike_rain` (Mưa Chông): steel
// spikes fall out of the sky onto every foe and stick in the ground round it, sparks flying. `spike_barrage` (Mưa Chông Thép): exactly
// four steel spikes shoot from the caster at the beat's targets, 200 ms apart, each sticking with a clang. `iron_oath` (Lời Thề Sắt):
// plates of armour fly to every ally and lock into a shield over it, blue chevrons rising (defence up and a shield).
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { DEF, dome, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { h } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { STEEL, clang, metal, plates } from './steelParts';
import { spike } from './stoneParts';
import { shock } from './stormParts';

type Ctx = { root: THREE.Group; dir: number; src: THREE.Vector3; chest: THREE.Vector3; foes: THREE.Vector3[] };
function handle(env: Vfx3dEnv, build: (x: Ctx) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const step = build({ root, dir, src: new THREE.Vector3(env.from.x + dir * 0.6, env.tall * 0.6, env.from.z), chest: new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z), foes: env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z)) });
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
/** A steel spike mesh (a slim cone) laid along `dirV`, its tip at `tip`. */
function spikeMesh(root: THREE.Object3D, mat: THREE.Material, seed: number) {
  const m = new THREE.Mesh(spike(seed, 4), mat);
  m.visible = false;
  root.add(m);
  return m;
}
const UP = new THREE.Vector3(0, 1, 0);
function aim(m: THREE.Mesh, tip: THREE.Vector3, along: THREE.Vector3, len: number, w: number) {
  m.visible = true;
  m.quaternion.setFromUnitVectors(UP, along.clone().normalize());
  m.position.copy(tip).addScaledVector(along.clone().normalize(), -len);
  m.scale.set(w, len, w);
}

export const shieldBash = (env: Vfx3dEnv) => handle(env, ({ root, dir, chest }) => {
  const shield = plates(STEEL, 8, 4);
  root.add(shield.g);
  const sparks = quads(root, Math.round(36 * env.quality) + 2, true, F.streak);
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 2.8, [1.3, 1.3, 1.4]);
  const HIT = 300;
  const S = 0.35 + env.tall * 0.2;
  const start = new THREE.Vector3(env.from.x + dir * 0.6, env.tall * 0.5, env.from.z + 0.4);
  const end = new THREE.Vector3(chest.x - dir * 0.45, chest.y, chest.z + 0.4);
  return (ms) => {
    const drive = clamp((ms - 120) / (HIT - 120));
    shield.g.position.copy(start).lerp(end, drive * drive);
    shield.g.rotation.y = -dir * 0.5;
    const squash = ms > HIT ? 1 - 0.25 * Math.exp(-(ms - HIT) / 60) : 1;
    shield.g.scale.set(S * squash, S, S);
    shield.set(1 - easeOut(clamp(ms / 120)), smooth(0, 60, ms) * (1 - smooth(HIT + 150, HIT + 320, ms)), ms > HIT ? Math.exp(-(ms - HIT) / 100) : 0, ms > HIT ? (ms - HIT) / 300 : -9);
    clang(sparks, 0, sparks.n, null, 0, 0, 1, (ms - HIT) / 1000, end, 0.8);
    sparks.flush();
    ring((ms - HIT) / 300, ms > HIT ? 1 - smooth(150, 300, ms - HIT) : 0);
  };
});

export const spikeRain = (env: Vfx3dEnv) => handle(env, ({ root, foes }) => {
  const steel = metal(STEEL);
  const per = 4;
  const spikes = foes.map((_, i) => Array.from({ length: per }, (__, k) => spikeMesh(root, steel.mat, 10 + i * per + k)));
  const sparks = foes.map(() => quads(root, Math.round(20 * env.quality) + 2, true, F.streak));
  const HIT = 550;
  return (ms) => {
    foes.forEach((f, i) => {
      spikes[i]!.forEach((m, k) => {
        const t = HIT - 40 + i * 90 + k * 40;
        const u = clamp((ms - t + 220) / 220);
        const ground = new THREE.Vector3(f.x + (h(k, 1, i) - 0.5) * 1.1, 0, f.z + (h(k, 2, i) - 0.5) * 0.6 + 0.2);
        const tip = ground.clone().setY(env.tall * 3 * (1 - u * u));
        const show = ms > t - 220 && ms < t + 700;
        if (!show) {
          m.visible = false;
          return;
        }
        aim(m, tip.setY(Math.max(-0.1, tip.y)), new THREE.Vector3(0.15, -1, 0), 0.5 + env.tall * 0.2, 0.25);
      });
      clang(sparks[i]!, 0, sparks[i]!.n, null, 0, 0, 20 + i, (ms - HIT - i * 90) / 1000, new THREE.Vector3(f.x, 0.3, f.z + 0.2), 0.5);
      sparks[i]!.flush();
    });
    steel.set(smooth(HIT - 300, HIT - 220, ms) * (1 - smooth(HIT + 500, HIT + 700, ms)));
  };
});

export const spikeBarrage = (env: Vfx3dEnv) => handle(env, ({ root, src, foes }) => {
  const HITS = [320, 520, 720, 920] as const;
  const steel = metal(STEEL);
  const spikes = HITS.map((_, k) => spikeMesh(root, steel.mat, 40 + k));
  const sparks = HITS.map(() => quads(root, Math.round(20 * env.quality) + 2, true, F.streak));
  return (ms) => {
    HITS.forEach((t, k) => {
      const f = foes[k % foes.length]!;
      const u = clamp((ms - t + 160) / 160);
      const along = new THREE.Vector3().subVectors(f, src);
      const tip = new THREE.Vector3().copy(src).lerp(f, u);
      if (ms < t - 160 || ms > t + 450) spikes[k]!.visible = false;
      else aim(spikes[k]!, tip, along, 0.8 + env.tall * 0.3, 0.42);
      clang(sparks[k]!, 0, sparks[k]!.n, null, 0, 0, 50 + k, (ms - t) / 1000, f, 0.55);
      sparks[k]!.flush();
    });
    steel.set(smooth(100, 160, ms) * (1 - smooth(1250, 1400, ms)));
  };
});

export const ironOath = (env: Vfx3dEnv) => handle(env, ({ root }) => {
  const allies = env.targets.map((t) => new THREE.Vector3(t.x, 0, t.z));
  const shields = allies.map((_, i) => {
    const p = plates(STEEL, 6, 20 + i);
    root.add(p.g);
    return p;
  });
  const domes = allies.map(() => dome(root, [0.85, 0.95, 1.4]));
  const sparks = allies.map(() => quads(root, Math.round(16 * env.quality) + 2, true, F.streak));
  const signs = quads(root, allies.length * 16, true, F.disc);
  const HIT = 470;
  return (ms, sec) => {
    allies.forEach((a, i) => {
      const t = HIT + i * 110;
      const toward = a.x < 0 ? 1 : -1;
      const sh = shields[i]!;
      sh.g.position.set(a.x + toward * (0.35 + env.tall * 0.18), env.tall * 0.5, a.z + 0.45);
      sh.g.scale.setScalar(0.3 + env.tall * 0.18);
      sh.set(1 - easeOut(clamp((ms - t + 300) / 300)), smooth(t - 300, t - 220, ms) * (1 - smooth(t + 150, t + 350, ms)), ms > t ? Math.exp(-(ms - t) / 100) : 0, ms > t ? (ms - t) / 300 : -9);
      const d = domes[i]!;
      d.mesh.position.set(a.x, env.tall * 0.5, a.z + 0.3);
      d.mesh.rotation.x = -0.22;
      d.mesh.scale.set(1 + env.tall * 0.55, 1 + env.tall * 0.6, 1);
      d.set(easeOutBack(clamp((ms - t - 80) / 220)) * 0.97, smooth(t + 80, t + 140, ms) * (1 - smooth(t + 700, t + 950, ms)), sec, ms > t + 200 ? Math.exp(-(ms - t - 200) / 120) : 0);
      clang(sparks[i]!, 0, sparks[i]!.n, null, 0, 0, 60 + i, (ms - t) / 1000, sh.g.position, 0.45);
      sparks[i]!.flush();
      signsUp(signs, i * 16, 8, 70 + i, (ms - t) / 1000, a, env.tall, DEF, 'up');
    });
    signs.flush();
  };
});
