// Dark skills over a whole row, rebuilt on the shade parts (decision 059). `night_net` (Lưới Đêm): stars are drawn together over
// the foes' row into a net of night threads, which drops over them and pulls tight. `night_weave` (Lưới Dệt Đêm): threads fly from
// the caster and weave a great web over the row; it settles on every foe in turn, cocoons them in strands, tightens, and at the
// last is wrenched shut in a burst of stars. `curse_eyes` (Lời Nguyền): one great eye opens over the monster, then an eye opens
// over every foe and weeps darkness on it. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { gather, h, pulse, rise } from './fxKit';
import { lines } from './lines';
import { stem } from './plantParts';
import { quads } from './quads';
import { INK, VIOLET, blot, eye, murk, net } from './shadeParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
const STAR = [1.2, 1, 1.7] as const;
const rowOf = (env: Vfx3dEnv) => {
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const foes = env.struck.map((t) => new THREE.Vector3(t.x, 0, t.z));
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
  return { mid, foes, span };
};

export function nightNet(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { mid, foes, span } = rowOf(env);
  const web = net(root);
  const light = quads(root, Math.round(150 * env.quality), true, F.star);
  const paint = quads(root, foes.length * Math.round(14 * env.quality), false, F.smoke);
  const rings = foes.map((p) => shock(root, p, 2.8, [0.7, 0.45, 1.3]));
  const HIT = 860;
  // Low enough that the whole net stays inside the frame while it hangs.
  const top = 1.6 + env.tall * 0.9;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // Stars gather over the row; the net is woven between them, hangs, then falls and drapes over the foes.
      const n0 = Math.floor(light.n * 0.6);
      gather(light, 0, n0, 1, { k: clamp(ms / 560), to: p.set(mid.x, top, mid.z), radius: span * 0.9, turns: 0.6, size: 0.2, color: STAR, frame: F.star, tall: 2 });
      const fall = clamp((ms - 700) / (HIT - 700));
      const y = top - (top - env.tall * 0.75) * fall * fall;
      const tight = smooth(0, 240, hit);
      web.mesh.position.set(mid.x, y - 0.15 * tight, mid.z + 0.1);
      // It starts flat overhead (seen from below as a wide oval) and tips toward the viewer as it comes down.
      web.mesh.rotation.x = -Math.PI / 2 + (Math.PI / 2 + TILT) * (0.25 + 0.75 * fall);
      web.mesh.scale.set(span * 1.4 * (1 - 0.14 * tight), (1.9 + env.tall * 1.05) * (1 - 0.1 * tight), 1);
      web.set(easeOut(clamp((ms - 260) / 420)) * 1.05, smooth(260, 380, ms) * (1 - smooth(380, 660, hit)), sec, fall + 0.6 * tight);
      // Knots glitter along it; where it lands on a foe a puff of murk and a ring.
      rise(light, n0, light.n - n0, 2, { sec: (ms - 500) / 1000, dur: 0.75, life: 0.4, at: (_b, k) => p.set(mid.x + (h(k, 8, 2) - 0.5) * span * 1.3, y + (h(k, 9, 2) - 0.5) * 1.2, mid.z + 0.2), rise: -0.3, jitter: 0.1, size: 0.16, color: STAR, to: VIOLET, frame: F.star, grow: 0.3 });
      light.flush();
      const per = Math.floor(paint.n / foes.length);
      foes.forEach((f, i) => {
        const age = hit - i * 80;
        blot(paint, i * per, per, null, 0, 0, 10 + i, age / 1000, p.set(f.x, env.tall * 0.6, f.z), 0.5);
        rings[i]!(age / 320, age > 0 ? 1 - smooth(160, 320, age) : 0);
      });
      paint.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function nightWeave(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const q = env.quality;
  const { mid, foes, span } = rowOf(env);
  const home = new THREE.Vector3(env.from.x, env.tall * 0.8, env.from.z);
  const top = 2.6 + env.tall * 1.2;
  const sky = murk(root, 8, 2);
  sky.mesh.rotation.x = TILT;
  sky.mesh.position.set(mid.x, top + 0.2, mid.z - 0.6);
  const web = net(root);
  const threads = lines(root, 14 * 12);
  // Every foe is wound in three strands.
  const cocoons = foes.map((p, i) => ({ p, t: 1250 + i * 150, strands: [0, 1, 2].map(() => stem(root, 26, [0.2, 0.12, 0.42], [0.72, 0.58, 1.05], 0.001)), ring: shock(root, p, 3.6, [0.8, 0.5, 1.4]) }));
  const light = quads(root, Math.round(260 * q), true, F.star);
  const paint = quads(root, foes.length * Math.round(40 * q), false, F.smoke);
  const big = shock(root, mid, 9, [0.9, 0.6, 1.5]);
  const WRENCH = 2050;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const end = smooth(WRENCH + 250, WRENCH + 650, ms);
      // Night gathers overhead; shuttles of thread fly from the caster up into it, crossing over and under.
      sky.mesh.scale.set(span * 2.6, 3.4, 1);
      sky.set(sec, smooth(300, 800, ms) * (1 - end) * 0.9, 0.85);
      let n = 0;
      if (ms > 420 && ms < 1350) {
        for (let k = 0; k < 14; k++) {
          const t0 = 450 + k * 50;
          const head = clamp((ms - t0) / 260);
          if (head <= 0) continue;
          const tx = mid.x + ((k / 13) - 0.5) * span * 1.5;
          const fade = 1 - smooth(1150, 1350, ms);
          for (let s = 0; s < 12; s++) {
            const u0 = (s / 12) * head;
            const u1 = ((s + 1) / 12) * head;
            const pt = (u: number, out: THREE.Vector3) => out.set(home.x + (tx - home.x) * u, home.y + (top - home.y) * u + Math.sin(u * Math.PI) * (1.2 + 0.5 * (k % 3)), home.z + (mid.z - home.z) * u + 0.35 * Math.sin(u * 9 + k) * (1 - u));
            threads.put(n++, pt(u0, a), pt(u1, b), 0.03, 0.03, 0.75, 0.55, 1.3, 0.9 * fade);
          }
        }
      }
      threads.show(n, 1);
      threads.flush();
      // The web: woven outward over the row, it sinks onto the foes at 1250, draws in at 1500, and is wrenched shut at 2050.
      const down = smooth(1150, 1300, ms);
      const tight = smooth(1450, 1600, ms);
      const wrench = smooth(WRENCH - 60, WRENCH, ms);
      web.mesh.position.set(mid.x, top - (top - env.tall * 0.8) * down, mid.z + 0.1);
      web.mesh.rotation.x = -Math.PI / 2 + (Math.PI / 2 + TILT) * (0.3 + 0.7 * down);
      web.mesh.scale.set(span * 1.9 * (1 - 0.15 * tight - 0.45 * wrench), (2.8 + env.tall * 1.4) * (1 - 0.12 * tight - 0.45 * wrench), 1);
      web.set(easeOut(clamp((ms - 600) / 600)) * 1.05, smooth(600, 760, ms) * (1 - smooth(WRENCH, WRENCH + 180, ms)), sec, down + 0.5 * tight);
      const per = Math.floor(paint.n / foes.length);
      const lper = Math.floor((light.n * 0.5) / foes.length);
      cocoons.forEach((c, i) => {
        const wind = easeOut(clamp((ms - c.t) / 380));
        const rad = (0.5 + 0.16 * env.tall) * (1 - 0.3 * tight) * (1 + 0.5 * pulse(ms, WRENCH, 30, 90));
        const live = (ms > c.t ? 1 : 0) * (1 - smooth(WRENCH + 60, WRENCH + 260, ms));
        c.strands.forEach((s, k) => s.set((u, out) => {
          const ang = k * 2.094 + u * 9.5 + i;
          return out.set(c.p.x + Math.cos(ang) * rad, 0.1 + env.tall * 1.05 * u, c.p.z + Math.sin(ang) * rad * 0.45);
        }, () => 0.045, wind, live));
        blot(paint, i * per, per, light, i * lper, lper, 20 + i, (ms - WRENCH) / 1000, a.set(c.p.x, env.tall * 0.55, c.p.z), 1.2);
        c.ring((ms - WRENCH) / 380, ms > WRENCH ? 1 - smooth(190, 380, ms - WRENCH) : 0);
      });
      paint.flush();
      // Stars: they gather into the web while it is woven and burst out of it when it is wrenched shut.
      const used = lper * foes.length;
      const half = Math.floor((light.n - used) / 2);
      gather(light, used, half, 3, { k: clamp((ms - 500) / 700), to: a.set(mid.x, top, mid.z), radius: span, turns: 0.5, size: 0.2, color: STAR, frame: F.star, tall: 2.4 });
      rise(light, used + half, light.n - used - half, 4, { sec: (ms - WRENCH) / 1000, dur: 0.3, life: 0.9, at: (_b, k) => a.set(mid.x + (h(k, 8, 4) - 0.5) * span * 1.4, 0.3 + h(k, 9, 4) * env.tall * 1.3, mid.z), rise: 1.3, jitter: 0.3, size: 0.2, color: STAR, to: VIOLET, frame: F.star, grow: 0.3, sway: 0.2 });
      light.flush();
      big((ms - WRENCH) / 500, ms > WRENCH ? 1 - smooth(250, 500, ms - WRENCH) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function curseEyes(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const { foes } = rowOf(env);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const great = eye(root);
  great.mesh.rotation.x = TILT;
  great.mesh.position.set(env.from.x + dir * 0.4, env.tall * 1.75, env.from.z - 0.2);
  const haze = murk(root, 4, 3);
  haze.mesh.rotation.x = TILT;
  haze.mesh.position.copy(great.mesh.position).setZ(env.from.z - 0.4);
  const eyes = foes.map((p, i) => {
    const e = eye(root);
    e.mesh.rotation.x = TILT;
    e.mesh.position.set(p.x, env.tall * 1.45, p.z);
    return { e, p, t: 900 + i * 120, ring: shock(root, p, 2.8, [0.7, 0.4, 1.3]) };
  });
  const per = Math.round(34 * env.quality);
  const paint = quads(root, foes.length * per * 2, false, F.drop);
  const light = quads(root, foes.length * 12, true, F.star);
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      // The great eye: a slit of murk that opens wide, looks along the row, and shuts as the small eyes open.
      const open = easeOutBack(clamp((ms - 150) / 320)) * (1 - smooth(1050, 1300, ms));
      great.mesh.scale.set(2.6 + env.tall * 0.8, 1.3 + env.tall * 0.4, 1);
      great.set(open, smooth(100, 260, ms) * (1 - smooth(1150, 1400, ms)), dir * smooth(400, 800, ms), sec);
      // A ragged cloud round the eye, kept inside the frame (a bigger one reads as a black curtain hanging from the top).
      haze.mesh.scale.set(3 + env.tall * 0.8, 1.9 + env.tall * 0.4, 1);
      haze.set(sec, smooth(0, 300, ms) * (1 - smooth(1100, 1450, ms)) * 0.6, 0.75);
      eyes.forEach((x, i) => {
        const age = ms - x.t;
        // Each small eye snaps open over its foe, stares down, weeps, and closes.
        x.e.mesh.scale.set(1.5 + env.tall * 0.3, 0.75 + env.tall * 0.15, 1);
        x.e.set(easeOutBack(clamp(age / 160)) * (1 - smooth(480, 700, age)), age > 0 ? 1 - smooth(560, 760, age) : 0, 0, sec + i);
        // Tears of dark run from it onto the foe and splash.
        for (let k = 0; k < per; k++) {
          const t = (age - 60 - h(k, 0, 30 + i) * 380) / 300;
          const idx = i * per * 2 + k;
          if (t <= 0 || t >= 1) {
            paint.hide(idx);
            continue;
          }
          paint.put(idx, x.p.x + (h(k, 1, 30 + i) - 0.5) * 0.5, env.tall * 1.4 - env.tall * 0.9 * t * t, x.p.z + 0.1, 0.13, INK[0], INK[1], INK[2] + 0.1, 0.95);
          paint.stretch(idx, 0, -0.12 - 0.25 * t, 0);
          paint.look(idx, F.drop, 0, 0.55);
        }
        blot(paint, i * per * 2 + per, per, light, i * 12, 12, 40 + i, (age - 240) / 1000, p.set(x.p.x, env.tall * 0.55, x.p.z), 0.55);
        x.ring((age - 200) / 320, age > 200 ? 1 - smooth(160, 320, age - 200) : 0);
      });
      paint.flush();
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
