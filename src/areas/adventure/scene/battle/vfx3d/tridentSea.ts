// "Đinh Ba Hải Vương" in 3D (decision 059). Water is drawn up into a whirl in the sky, where it sets into a trident of living water;
// the trident hangs, then falls on the middle of the foes' row. Where it lands a crown of water leaps up, a geyser shoots through
// it, and three walls of water ("a million waves") roll outward, each higher and further; as the first wall reaches a foe that foe
// gets its own burst of water. A sheet of foam is left on the ground and rain falls back. Times are ms from the start of the act; the
// skill's impact is at 1100.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, easeOutBack, ripple, smooth, sprite } from './effectParts';
import { burst, gather, h, pulse, rise } from './fxKit';
import { lines } from './lines';
import { lightBlend, quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { liquid, pool, waveRing, whirl } from './waterParts';

const IMPACT = 1100;
const SKY = 4.3;
const WATER = [0.3, 0.7, 1] as const;
const FOAM = [0.9, 0.98, 1] as const;
const DEEP = [0.2, 0.62, 1.1] as const;
/** The waves' ring is flattened: wide across the stage, shallow into it. */
const RX = 1.3;
const RZ = 0.78;

/** The trident, point down, about 3.4 world units tall, with its tip at the group's origin. */
function trident(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, x = 0, y = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    m.rotation.z = rz;
    g.add(m);
  };
  // Built point up, then turned over.
  add(new THREE.CylinderGeometry(0.085, 0.11, 2.2, 14), 0, 1.1);
  add(new THREE.SphereGeometry(0.17, 14, 10), 0, 0.02);
  add(new THREE.TorusGeometry(0.2, 0.065, 10, 20), 0, 2.2, 0);
  add(new THREE.ConeGeometry(0.17, 1.15, 14), 0, 2.85);
  for (const s of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.15, 0), new THREE.Vector3(s * 0.34, 2.2, 0), new THREE.Vector3(s * 0.62, 2.42, 0), new THREE.Vector3(s * 0.66, 2.8, 0)]);
    add(new THREE.TubeGeometry(curve, 22, 0.085, 10));
    add(new THREE.ConeGeometry(0.14, 0.75, 12), s * 0.66, 3.12);
    // A barb on the outside of each side prong.
    add(new THREE.ConeGeometry(0.07, 0.34, 8), s * 0.8, 2.72, -s * 2.3);
  }
  g.children.forEach((c) => c.position.y -= 3.42);
  g.rotation.z = Math.PI;
  const holder = new THREE.Group();
  holder.add(g);
  return holder;
}

export function tridentSea(env: Vfx3dEnv): Vfx3dHandle {
  const q = env.quality;
  const root = new THREE.Group();
  root.position.copy(env.origin);
  env.scene.add(root);
  const targets = env.targets.map((t) => t.clone().sub(env.origin));
  const dist = (p: THREE.Vector3) => Math.hypot(p.x / RX, p.z / RZ);
  const reach = Math.max(1.6, ...targets.map(dist)) + 0.9;

  const water = liquid();
  const tri = trident(water.mat);
  root.add(tri);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: 0x4cc8ff, transparent: true, depthWrite: false, depthTest: false }));
  lightBlend(halo.material);
  root.add(halo);
  const sky = whirl(root);
  sky.mesh.rotation.x = -Math.PI / 2;
  sky.mesh.position.y = SKY + 0.5;
  const ropes = lines(root, 3 * 26 + 24);
  const drops = quads(root, Math.round(520 * q), false, F.drop);
  const glints = quads(root, Math.round(260 * q), true, F.soft);
  const ND = drops.n;
  const NG = glints.n;

  const sheet = pool(root, reach * 2 * RX * 1.05, reach * 2 * RZ * 1.05);
  const rings = ripple(root, reach * 2 * RX, reach * 2 * RZ, 0x2a9bff, 0xe8fbff);
  const walls = [0, 1, 2].map((i) => {
    const w = waveRing(root, 0.42 + i * 0.06);
    w.mesh.scale.set(RX, 1, RZ);
    return { w, start: IMPACT + 60 + i * 190, len: 1150 + i * 130, reach: reach * (0.62 + i * 0.19), peak: 0.55 + i * 0.2 };
  });
  const crown = waveRing(root, 0.32, 1);
  crown.mesh.scale.set(RX, 1, RZ);
  const geyser = waveRing(root, -0.12, 0.7);
  // Each foe is struck when the first wall reaches it, never two at the same moment.
  const first = walls[0]!;
  const hits = targets
    .map((p) => ({ p, t: first.start + first.len * (1 - Math.cbrt(1 - clamp((dist(p) - 0.2) / first.reach, 0, 0.98))) }))
    .sort((a, b) => a.t - b.t);
  hits.forEach((x, i) => (x.t = i === 0 ? x.t : Math.max(x.t, hits[i - 1]!.t + 110)));
  const spouts = hits.map(() => waveRing(root, 0.5, 1));
  const tmp = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - IMPACT;
      // -- the whirl in the sky and the water drawn up into it --
      const whirlK = smooth(0, 420, ms) * (1 - smooth(560, 900, ms));
      sky.mesh.scale.setScalar(3.6 * (0.5 + 0.5 * easeOut(clamp(ms / 420))) * (1 - 0.55 * smooth(450, 900, ms)));
      sky.set(sec, whirlK, smooth(200, 700, ms));
      let n = 0;
      const pullK = clamp(ms / 640);
      for (let r = 0; r < 3; r++) {
        const segs = 26;
        const head = pullK * 1.5 - r * 0.12;
        for (let s = 0; s < segs; s++) {
          const u0 = s / segs;
          const u1 = (s + 1) / segs;
          if (u1 > head || u0 < head - 0.55) continue;
          const pt = (u: number, out: THREE.Vector3) => {
            const ang = r * 2.094 + u * 7.5 + 0.6;
            const rad = 2.3 * (1 - u) ** 1.2 + 0.08;
            return out.set(Math.cos(ang) * rad * RX, 0.1 + SKY * u ** 0.8, Math.sin(ang) * rad * RZ);
          };
          const tail = clamp((u0 - (head - 0.55)) / 0.55);
          ropes.put(n++, pt(u0, a), pt(u1, b), 0.03 + 0.07 * tail, 0.03 + 0.07 * clamp((u1 - (head - 0.55)) / 0.55), DEEP[0], DEEP[1], DEEP[2], tail);
        }
      }
      // -- the trident: sets in the whirl (overshoot), hangs and winds up, falls ever faster, bites into the ground --
      const born = clamp((ms - 280) / 300);
      const wind = smooth(560, 720, ms) * (1 - smooth(720, 800, ms));
      const fall = clamp((ms - 760) / (IMPACT - 760));
      const sink = 0.42 * smooth(0, 60, hit) + 1.3 * smooth(900, 1500, hit);
      const y = ms < IMPACT ? SKY * (1 - fall * fall * fall) + 0.3 * wind : -sink;
      const live = born * (1 - smooth(1000, 1500, hit));
      const squash = hit > 0 ? 1 - 0.16 * Math.exp(-hit / 70) * Math.cos(hit / 38) : 1 + 0.2 * fall * fall;
      tri.position.set(0, y, 0);
      tri.scale.set((0.4 + 0.6 * easeOutBack(born)) / Math.sqrt(squash), (0.4 + 0.6 * easeOutBack(born)) * squash, 0.4 + 0.6 * easeOutBack(born));
      tri.rotation.y = 9 * (1 - easeOut3(clamp((ms - 280) / 760)));
      tri.rotation.z = 0.05 * Math.exp(-Math.max(0, hit) / 120) * Math.sin(hit / 24) * (hit > 0 ? 1 : 0);
      tri.visible = live > 0.01;
      const flash = pulse(ms, 300, 60, 160) + pulse(ms, IMPACT, 30, 200) * 1.4;
      water.set(sec, live, flash);
      // The streak it leaves while falling: a few lines trailing up behind the prongs.
      if (fall > 0.05 && hit < 60) {
        for (let s = 0; s < 8; s++) {
          const x = (h(s, 0, 5) - 0.5) * 1.3;
          const lenS = (0.8 + 2.2 * h(s, 1, 5)) * fall;
          ropes.put(n++, a.set(x, y + 0.2 + 3 * h(s, 2, 5), 0.02 * s), b.set(x, y + 0.2 + 3 * h(s, 2, 5) + lenS, 0.02 * s), 0.05, 0.01, WATER[0], WATER[1], WATER[2], 0.55 * fall * (1 - smooth(0, 60, hit)));
        }
      }
      ropes.show(n, 1 - smooth(900, 1150, ms) * (hit > 60 ? 1 : 0));
      ropes.flush();
      const hs = (1.2 + 2.2 * flash) * (0.5 + 0.5 * born) * (1 - smooth(600, 1300, hit));
      halo.position.set(0, Math.max(0.3, y + 1.6), 0.1);
      halo.scale.set(hs * 2.2, hs * 2.2, 1);
      halo.material.opacity = 0.5 * live + 0.5 * Math.min(1, flash);
      halo.visible = hs > 0.05;

      // -- drops (paint): drawn up, the impact's crown, each foe's burst, the rain falling back --
      let d = 0;
      const take = (share: number) => {
        const from = d;
        d += Math.floor(ND * share);
        return [from, d - from] as const;
      };
      const [g0, gn] = take(0.14);
      gather(drops, g0, gn, 1, { k: clamp(ms / 700), to: tmp.set(0, SKY, 0), radius: 3.2, turns: 1.2, size: 0.16, color: WATER, frame: F.drop, tall: 5, alpha: 0.9 });
      const [c0, cn] = take(0.36);
      burst(drops, c0, cn, 2, { sec: hit / 1000, at: tmp.set(0, 0.1, 0), life: 1.25, speed: 4.6, up: 8.5, grav: 13, drag: 1.1, size: 0.2, color: FOAM, to: WATER, frame: F.drop, stretch: 0.045, flat: 0.55, alpha: 0.95 });
      const each = Math.floor((ND * 0.3) / Math.max(1, hits.length));
      hits.forEach((x, i) => {
        burst(drops, d, each, 10 + i, { sec: (ms - x.t) / 1000, at: tmp.set(x.p.x, 0.15, x.p.z), life: 0.9, speed: 2.2, up: 6.5, grav: 13, size: 0.17, color: FOAM, to: WATER, frame: F.drop, stretch: 0.04, wide: 0.7, alpha: 0.95 });
        d += each;
        const k = (ms - x.t) / 620;
        spouts[i]!.mesh.position.set(x.p.x, 0, x.p.z);
        spouts[i]!.set(0.22 + 0.5 * easeOut(clamp(k)), (0.9 + 0.7 * env.tall) * Math.sin(Math.PI * clamp(k) ** 0.6), sec + i, k > 0 && k < 1 ? smooth(0, 0.1, k) * (1 - smooth(0.6, 1, k)) : 0);
      });
      // Rain falling back over the whole row once the waves have passed.
      for (let i = d; i < ND; i++) {
        const k = i - d;
        const t = (ms - 1750 - h(k, 0, 9) * 800) / 520;
        if (t <= 0 || t >= 1) {
          drops.hide(i);
          continue;
        }
        const rx = (h(k, 1, 9) - 0.5) * 2 * reach * RX;
        drops.put(i, rx, 4.2 * (1 - t * t), (h(k, 2, 9) - 0.5) * 2 * reach * RZ, 0.1, WATER[0], WATER[1], WATER[2], 0.8 * smooth(0, 0.15, t));
        drops.stretch(i, 0, -0.5 * t - 0.12, 0);
        drops.look(i, F.drop, 0, 0.4);
      }
      drops.flush();

      // -- light: the flash of foam at the impact, spray riding the walls, mist lifting at the end --
      const [f0, fn] = [0, Math.floor(NG * 0.3)];
      burst(glints, f0, fn, 3, { sec: hit / 1000, at: tmp.set(0, 0.2, 0), life: 0.7, speed: 5.5, up: 5, grav: 6, drag: 2.4, size: 0.5, color: [0.5, 0.75, 0.95], to: [0.1, 0.3, 0.6], frame: F.foam, alpha: 0.55 });
      const sprayN = Math.floor(NG * 0.45);
      for (let k = 0; k < sprayN; k++) {
        const i = fn + k;
        const w = walls[k % 3]!;
        const u = (ms - w.start) / w.len;
        if (u <= 0 || u >= 1) {
          glints.hide(i);
          continue;
        }
        const ang = h(k, 0, 4) * 6.2832;
        const rr = (0.2 + w.reach * easeOut3(u)) * 1.03;
        const hh = w.peak * Math.sin(Math.PI * Math.min(1, u * 0.9)) ** 0.7 * (0.75 + 0.5 * h(k, 1, 4)) + 0.12 * Math.sin(ms * 0.012 + k);
        glints.put(i, Math.cos(ang) * rr * RX, hh, Math.sin(ang) * rr * RZ, 0.16 + 0.14 * h(k, 2, 4), 0.75, 0.95, 1.1, 0.7 * smooth(0, 0.1, u) * (1 - smooth(0.7, 1, u)));
        glints.look(i, k % 4 === 0 ? F.star : F.soft, k);
      }
      rise(glints, fn + sprayN, NG - fn - sprayN, 6, { sec: (ms - 1500) / 1000, dur: 0.9, life: 0.9, at: (_b, k) => tmp.set((h(k, 8, 6) - 0.5) * 2 * reach * RX * 0.8, 0.15, (h(k, 9, 6) - 0.5) * 2 * reach * RZ * 0.8), rise: 0.9, jitter: 0.3, size: 0.7, color: [0.25, 0.4, 0.5], to: [0.05, 0.1, 0.15], frame: F.smoke, grow: 1.8, alpha: 0.5 });
      glints.flush();

      // -- the ground: a sheet of foaming water spreading, rings running over it --
      sheet.set(easeOut3(clamp(hit / 900)), sec, hit > 0 ? smooth(0, 120, hit) * (1 - smooth(1300, 1850, hit)) : 0);
      rings.set(hit / 1000, hit > 0 ? smooth(0, 100, hit) * (1 - smooth(1100, 1700, hit)) * 0.8 : 0);

      // -- the crown and the geyser at the point of impact, then the three walls --
      const ck = hit / 700;
      crown.set(0.3 + 0.9 * easeOut3(clamp(ck)), 1.5 * Math.sin(Math.PI * clamp(ck) ** 0.55), sec, ck > 0 && ck < 1 ? smooth(0, 0.06, ck) * (1 - smooth(0.55, 1, ck)) : 0);
      const gk = hit / 950;
      geyser.set(0.24 * (1 + 0.6 * gk), 4.4 * Math.sin(Math.PI * clamp(gk) ** 0.5), sec * 1.6, gk > 0 && gk < 1 ? smooth(0, 0.05, gk) * (1 - smooth(0.5, 1, gk)) : 0);
      for (const w of walls) {
        const u = (ms - w.start) / w.len;
        w.w.set(0.2 + w.reach * easeOut3(clamp(u)), w.peak * Math.sin(Math.PI * Math.min(1, clamp(u) * 0.9)) ** 0.7, sec, u > 0 && u < 1 ? smooth(0, 0.1, u) * (1 - smooth(0.5, 0.95, u)) : 0);
      }
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
