// The void Ultimates rebuilt on the rift parts (decision 059). `sky_bell` (Bầu Trời Trong Chuông): a tear opens high over the foes'
// row and a bell of starry sky comes down out of it over them (the tear then seals); it tolls three times (1200 / 1600 / 2000), each toll swinging it, a
// wider ring torn over the ground and more cracks lighting in it; on the third it breaks into fragments, and from every foe the
// pale shards of what protected it fly off (its good states are wiped). `mythic_awakening` (Huyền Thoại Thức Tỉnh): a great gate of
// night opens over the caster and spins up; tears of space lance from it to every foe in turn (1700 + 100 ms each), cracking space
// round them; then the gate turns to the team and pours motes on each of them (a fifth of their health and attack up) and closes.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h, pulse, rise } from './fxKit';
import { quads } from './quads';
import { VOID_HOT, pull, rift, shatter, skyBell, voidCore } from './riftParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
const TOLLS = [1200, 1600, 2000] as const;
const rowOf = (env: Vfx3dEnv) => {
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const foes = env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z));
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
  return { mid, foes, span };
};

export function skyBellUlt(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { mid, foes, span } = rowOf(env);
  // Low enough to stay below the letterbox bars of the Ultimate.
  const top = 1.7 + env.tall * 1.0;
  const tear = rift(root, 2);
  tear.mesh.rotation.x = TILT;
  tear.mesh.position.set(mid.x, top, mid.z - 0.4);
  const bell = skyBell(root);
  bell.mesh.rotation.x = TILT * 0.6;
  const W = span * 1.05;
  const rings = TOLLS.map((_, i) => shock(root, mid, span * (1.3 + 0.35 * i), [0.7, 0.6, 1.7]));
  const light = quads(root, Math.round(220 * env.quality), true, F.star);
  const paint = quads(root, Math.round(90 * env.quality), false, F.shard);
  const per = Math.round(18 * env.quality);
  const strip = quads(root, foes.length * per, true, F.shard);
  const BREAK = 2000;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const brk = ms - BREAK;
      // The tear in the sky: it opens first, lets the bell out, and seals once the bell has landed.
      tear.mesh.scale.set(span * 1.1, 1.2, 1);
      tear.set(easeOut(clamp((ms - 250) / 400)) * (1 - smooth(1050, 1300, ms)), smooth(250, 350, ms) * (1 - smooth(1150, 1350, ms)), sec);
      const n0 = Math.floor(light.n * 0.35);
      pull(light, 0, n0, 1, clamp((ms - 250) / 600), p.set(mid.x, top, mid.z - 0.4), span * 0.6);
      // The bell comes down out of the tear (700–1150), lands with a small bounce, and swings with every toll.
      const drop = clamp((ms - 700) / 450);
      const land = easeOutBack(drop);
      const hB = W * 1.15;
      const swing = TOLLS.reduce((s, t) => s + 0.06 * pulse(ms, t, 30, 160) * Math.sin((ms - t) / 60), 0);
      bell.mesh.position.set(mid.x, top - (top - hB * 0.5 + 0.1) * land, mid.z + 0.2);
      bell.mesh.rotation.z = swing;
      bell.mesh.scale.set(W * (0.6 + 0.4 * land) * (1 + 0.04 * TOLLS.reduce((s, t) => s + pulse(ms, t, 20, 120), 0)), W * (0.6 + 0.4 * land), 1);
      const glow = TOLLS.reduce((s, t) => s + pulse(ms, t, 20, 200), 0);
      const crack = 0.25 * smooth(1200, 1300, ms) + 0.35 * smooth(1600, 1700, ms) + 0.4 * smooth(1900, BREAK, ms);
      bell.set(sec, smooth(700, 800, ms) * (1 - smooth(BREAK, BREAK + 110, ms)), crack, Math.min(1.2, glow));
      // Each toll: a wider ring torn over the ground.
      TOLLS.forEach((t, i) => rings[i]!((ms - t) / 480, ms > t ? 1 - smooth(240, 480, ms - t) : 0));
      // The break: fragments of sky all over the bell, hanging, then gone; glints.
      for (let k = 0; k < 5; k++) {
        const at = p.set(mid.x + (k / 4 - 0.5) * W * 0.8, hB * (0.2 + 0.5 * h(k, 1, 3)), mid.z + 0.2);
        const c = Math.floor(paint.n / 5);
        shatter(paint, k * c, c, null, 0, 0, 10 + k, brk / 1000, at, 1.4);
      }
      paint.flush();
      burst(light, n0, light.n - n0, 7, { sec: brk / 1000, at: p.set(mid.x, hB * 0.45, mid.z + 0.2), life: 0.9, speed: span * 1.3, up: 1.5, grav: 0, drag: 2.5, size: 0.2, color: VOID_HOT, to: [0.5, 0.45, 1], frame: F.star, alpha: 0.9 });
      light.flush();
      // What protected each foe is stripped off it: pale shards fly up and away from it, one foe after another.
      foes.forEach((f, i) => burst(strip, i * per, per, 30 + i, { sec: (brk - 60 - i * 100) / 1000, at: f, life: 0.8, speed: 1.6, up: 3.2, grav: 2, drag: 1, size: 0.2, color: [1.2, 1.1, 1.6], to: [0.5, 0.45, 1], frame: F.shard, wide: 0.6, alpha: 0.85 }));
      strip.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function mythicAwakening(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { foes } = rowOf(env);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const gateAt = new THREE.Vector3(env.from.x - dir * 0.2, env.tall * 1.6, env.from.z - 0.6);
  const gate = voidCore(root);
  gate.mesh.rotation.x = TILT;
  gate.mesh.position.copy(gateAt);
  const lances = foes.map((_, i) => rift(root, 50 + i));
  const cracks = foes.map((_, i) => [0, 1, 2].map((k) => {
    const r = rift(root, 70 + i * 3 + k);
    r.mesh.rotation.set(TILT, 0, (k / 3) * Math.PI + 0.3);
    return r;
  }));
  const rings = foes.map((f) => shock(root, new THREE.Vector3(f.x, 0, f.z), 3.2, [0.7, 0.6, 1.7]));
  const light = quads(root, Math.round(200 * env.quality) + foes.length, true, F.star);
  const per = Math.round(26 * env.quality);
  const paint = quads(root, foes.length * per, false, F.shard);
  const friends = env.friends.map((f) => new THREE.Vector3(f.x, 0, f.z));
  const fper = Math.round(26 * env.quality);
  const boon = quads(root, friends.length * fper * 2, true, F.star);
  const HIT = 1700;
  const POUR = 2400;
  const S = 1.4 + env.tall * 0.55;
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      // The gate: it opens slow and wide, its heart widens, it spins up while it charges, flares as it fires, closes last.
      const open = easeOut(clamp((ms - 150) / 600));
      gate.mesh.scale.setScalar(S * open * (1 + 0.1 * pulse(ms, HIT - 300, 40, 260)));
      gate.set(sec, smooth(150, 300, ms) * (1 - smooth(3050, 3400, ms)), 0.25 + 0.3 * smooth(150, 1100, ms), 1 + 4 * smooth(800, HIT - 300, ms) - 3 * smooth(HIT, 2400, ms));
      const n0 = Math.floor((light.n - foes.length) * 0.4);
      pull(light, foes.length, n0, 1, clamp((ms - 200) / 1100), gateAt, S * 0.9);
      // The lances: a tear runs from the gate to each foe, reaching it on its blow; the foe is cracked, ringed, showered with shards.
      foes.forEach((f, i) => {
        const t = HIT + i * 100;
        const run = clamp((ms - (t - 300)) / 300);
        const age = ms - t;
        const ln = lances[i]!;
        ln.mesh.position.copy(gateAt).lerp(f, run * 0.5);
        ln.mesh.rotation.set(TILT, 0, Math.atan2(f.y - gateAt.y, f.x - gateAt.x));
        ln.mesh.scale.set(Math.max(0.01, gateAt.distanceTo(f) * run), 1.1, 1);
        ln.set(run > 0 ? 0.7 * (1 - smooth(60, 300, age)) : 0, run > 0 ? 1 - smooth(200, 360, age) : 0, sec);
        p.copy(gateAt).lerp(f, run);
        const head = run > 0 && age < 0 ? 1 : 0;
        light.put(i, p.x, p.y, p.z + 0.2, 0.5 + 1.6 * pulse(ms, t, 20, 100), VOID_HOT[0], VOID_HOT[1], VOID_HOT[2], Math.max(head, pulse(ms, t, 20, 100)));
        light.look(i, F.soft);
        cracks[i]!.forEach((r, k) => {
          r.mesh.position.copy(f);
          r.mesh.scale.set((1 + env.tall * 0.6) * (0.8 + 0.3 * k), 0.6, 1);
          r.set(age > 0 ? clamp(age / 60) * (1 - smooth(200, 420, age)) : 0, age > 0 ? 1 - smooth(300, 420, age) : 0, sec);
        });
        shatter(paint, i * per, per, null, 0, 0, 20 + i, age / 1000, f, 1.1);
        rings[i]!(age / 360, age > 0 ? 1 - smooth(180, 360, age) : 0);
      });
      paint.flush();
      burst(light, foes.length + n0, light.n - foes.length - n0, 5, { sec: (ms - HIT) / 1000, at: p.set(foes[0]!.x, env.tall * 0.6, foes[0]!.z), life: 0.8, speed: 4, up: 1.5, grav: 0, drag: 3, size: 0.18, color: VOID_HOT, frame: F.star, alpha: 0.8 });
      light.flush();
      // The boon: motes pour from the gate down onto each team member, then green motes of healing and orange streaks rise off them.
      friends.forEach((f, i) => {
        const base = i * fper * 2;
        for (let k = 0; k < fper; k++) {
          const u = (ms - POUR - i * 80 - h(k, 0, 60 + i) * 300) / 380;
          if (u <= 0 || u >= 1) {
            boon.hide(base + k);
            continue;
          }
          q.set(f.x + (h(k, 1, 60 + i) - 0.5) * 0.8, env.tall * 0.6, f.z);
          p.copy(gateAt).lerp(q, u * u);
          boon.put(base + k, p.x, p.y, p.z, 0.14, VOID_HOT[0], VOID_HOT[1], VOID_HOT[2], 0.9 * (1 - smooth(0.85, 1, u)));
          boon.look(base + k, F.star);
        }
        const heal = (k: number) => p.set(f.x + (h(k, 8, 80 + i) - 0.5) * 0.9, 0.15 + h(k, 9, 80 + i) * env.tall * 0.6, f.z);
        const half = Math.floor(fper / 2);
        rise(boon, base + fper, half, 80 + i, { sec: (ms - POUR - 380 - i * 80) / 1000, dur: 0.4, life: 0.9, at: (_b, k) => heal(k), rise: 1.6, jitter: 0.2, size: 0.18, color: [0.7, 1.4, 0.6], to: [0.4, 0.9, 0.35], frame: F.star, sway: 0.1 });
        rise(boon, base + fper + half, fper - half, 90 + i, { sec: (ms - POUR - 450 - i * 80) / 1000, dur: 0.4, life: 0.7, at: (_b, k) => heal(k + 50), rise: 2.6, jitter: 0.2, size: 0.2, color: [1.6, 0.75, 0.35], to: [1, 0.48, 0.23], frame: F.streak, grow: 0.8 });
      });
      boon.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
