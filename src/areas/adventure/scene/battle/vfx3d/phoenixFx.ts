// "Phượng Hoàng Tái Sinh" in 3D (decision 059). Embers gather over the caster into a bud of fire; it bursts and a phoenix unfurls,
// climbs, then dives head first into the foes' row. Where it strikes the row goes up in flame, one fire per foe, each a beat after
// the other. Out of that fire the phoenix is reborn: a great bird rising over the field, its wings snapping open in a ring of light,
// shedding golden feathers; as it burns away into light a feather and a small flame come to rest on every friend (the Bất khuất).
// Times are ms from the start of the act; the skill's impact is at 1300.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, easeOutBack, smooth } from './effectParts';
import { flame, glow } from './flameParts';
import { burst, gather, h, pulse, rise, type Rgb } from './fxKit';
import { lines } from './lines';
import { phoenix } from './phoenixParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { scorch, shock } from './stormParts';

const IMPACT = 1300;
const REBIRTH = 1750;
const SPREAD = 2050;
const HOT: Rgb = [1.7, 1.35, 0.6];
const FIRE: Rgb = [1.3, 0.55, 0.1];
const RED: Rgb = [0.75, 0.12, 0.03];
const GOLD: Rgb = [1.5, 1.15, 0.45];
/** The bird faces the stage's raised camera. */
const TILT = -0.5;

export function phoenixRebirth(env: Vfx3dEnv): Vfx3dHandle {
  const q = env.quality;
  const root = new THREE.Group();
  env.scene.add(root);
  const row = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const home = new THREE.Vector3(env.from.x, 0, env.from.z);
  const dir = row.x >= home.x ? 1 : -1;
  const bud = new THREE.Vector3(home.x + dir * 0.4, 2.2, home.z);
  const p1 = new THREE.Vector3((home.x + row.x) / 2 - dir * 0.6, 5.0, row.z);
  const p2 = new THREE.Vector3(row.x, 0.8, row.z);
  const hero = new THREE.Vector3(row.x * 0.3, 2.7, row.z - 0.3);
  const path = (t: number, out: THREE.Vector3) => out.set(0, 0, 0).addScaledVector(bud, (1 - t) * (1 - t)).addScaledVector(p1, 2 * t * (1 - t)).addScaledVector(p2, t * t);

  const aura = glow(root, 0xff6a1a);
  const aura2 = glow(root, 0xffc050);
  const mark = scorch(root, row, 2.4);
  const ring = shock(root, row, 7, [1.2, 0.5, 0.1]);
  const cry = shock(root, new THREE.Vector3(hero.x, 0, hero.z), 11, [1.3, 0.9, 0.3]);
  const smoke = quads(root, Math.round(50 * q), false, F.smoke);
  smoke.mesh.renderOrder = 1;
  const big = flame(root, 1);
  big.mesh.position.copy(row);
  const fires = env.targets.map((t, i) => {
    const f = flame(root, 2 + i);
    f.mesh.position.set(t.x, 0, t.z + 0.05);
    return { f, at: IMPACT + 40 + i * 90, p: t };
  });
  const diver = phoenix();
  const reborn = phoenix();
  root.add(diver.g, reborn.g);
  const wake = lines(root, 80);
  const light = quads(root, Math.round(760 * q), true, F.flame);
  const feathers = quads(root, Math.round(90 * q), false, F.feather);
  const bless = env.friends.map((f, i) => ({ f: flame(root, 9 + i), p: f, at: 2450 + i * 110, ring: shock(root, f, 2.6, [1.3, 1, 0.4]) }));
  bless.forEach((b) => b.f.mesh.position.set(b.p.x, 0, b.p.z + 0.05));
  const N = light.n;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - IMPACT;
      let n = 0;
      const take = (share: number) => {
        const from = n;
        n += Math.floor(N * share);
        return [from, n - from] as const;
      };
      // -- the bud: embers spiral in over the caster, a glow swells and bursts --
      const [g0, gn] = take(0.1);
      gather(light, g0, gn, 1, { k: clamp(ms / 520), to: bud, radius: 2.4, turns: 1.6, size: 0.2, color: HOT, frame: F.ember, tall: 2.6 });
      const [u0, un] = take(0.08);
      burst(light, u0, un, 2, { sec: (ms - 430) / 1000, at: bud, life: 0.6, speed: 5, up: 2.5, grav: 2, drag: 2.5, size: 0.3, color: HOT, to: RED, frame: F.flame, alpha: 0.9 });

      // -- the first phoenix: unfurls from the bud, hangs a beat with wings raised, dives head first --
      const born = clamp((ms - 420) / 330);
      const dive = clamp((ms - 860) / (IMPACT - 860));
      const dk = dive * dive * (0.6 + 0.4 * dive);
      path(dk, a);
      path(Math.min(1, dk + 0.02), b);
      a.y += 0.5 * easeOut(born) * (1 - dive) + 0.25 * smooth(700, 860, ms) * (1 - dive);
      const head = dive > 0.02 ? Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2 : 0;
      diver.g.position.copy(a);
      diver.g.rotation.set(TILT * (1 - dive), 0, head * smooth(0, 0.25, dive));
      const ds = 0.52 * easeOutBack(born);
      diver.g.scale.set(ds * (1 - 0.18 * dive), ds * (1 + 0.3 * dive), ds);
      // Wings: thrown open at birth, raised for the wind-up, swept back in the dive.
      const open = dive > 0 ? 0.9 - 1.7 * smooth(0, 0.3, dive) : -1 + 1.9 * easeOutBack(born) + 0.25 * Math.sin(ms * 0.02);
      diver.pose(sec, smooth(420, 520, ms) * (1 - smooth(-30, 50, hit)), open, dive > 0 ? -0.35 : 0.2 * Math.sin(ms * 0.02 - 1), 1 + 0.3 * dive, 0.2 + 0.5 * dive);
      // Its wake: flames torn off along the dive, two lines of light from the wingtips.
      const [t0, tn] = take(0.16);
      rise(light, t0, tn, 3, { sec: (ms - 860) / 1000, dur: (IMPACT - 860) / 1000, life: 0.34, at: (bn) => path(((bn * 1000) / (IMPACT - 860)) ** 2 * (0.6 + 0.4 * ((bn * 1000) / (IMPACT - 860))), c), rise: 0.7, jitter: 0.5, size: 0.42, color: FIRE, to: RED, frame: F.flame, grow: 0.4, alpha: 0.7 });
      let seg = 0;
      if (dive > 0.05 && hit < 120) {
        for (const s of [-1, 1]) for (let k = 0; k < 14; k++) {
          const ta = Math.max(0, dk - (k / 14) * 0.55);
          const tb = Math.max(0, dk - ((k + 1) / 14) * 0.55);
          path(ta, b);
          path(tb, c);
          b.z += s * 0.45;
          c.z += s * 0.45;
          b.y += s * 0.25;
          c.y += s * 0.25;
          wake.put(seg++, b, c, 0.1 * (1 - k / 14), 0.1 * (1 - (k + 1) / 14), FIRE[0], FIRE[1], FIRE[2], (1 - k / 14) * (1 - smooth(0, 120, hit)));
        }
      }
      wake.show(seg, 1);
      wake.flush();

      // -- impact: the row goes up, one fire per foe a beat apart, a blast of flame and sparks, a ring of fire over the ground --
      const [b0, bn] = take(0.2);
      burst(light, b0, bn, 4, { sec: hit / 1000, at: a.set(row.x, 0.4, row.z), life: 0.9, speed: 6.5, up: 6, grav: 5, drag: 2, size: 0.42, color: FIRE, to: RED, frame: F.flame, alpha: 0.4 });
      const [s0, sn] = take(0.12);
      burst(light, s0, sn, 5, { sec: hit / 1000, at: a, life: 0.8, speed: 9, up: 8, grav: 14, drag: 1.6, size: 0.14, color: HOT, to: FIRE, frame: F.streak, stretch: 0.05 });
      const bk = hit / 900;
      big.set(2.6 + 1.2 * easeOut(clamp(bk)), 4.4 * Math.sin(Math.PI * clamp(bk) ** 0.45), sec, bk > 0 && bk < 1 ? smooth(0, 0.05, bk) * (1 - smooth(0.55, 1, bk)) : 0);
      fires.forEach((x, i) => {
        const k = (ms - x.at) / 1250;
        x.f.set((1.1 + 0.3 * Math.sin(sec * 9 + i)) * (0.8 + env.tall * 0.3), (1.6 + env.tall * 1.1) * Math.sin(Math.PI * clamp(k) ** 0.4) * (1 + 0.08 * Math.sin(sec * 23 + i * 2)), sec + i, k > 0 && k < 1 ? smooth(0, 0.05, k) * (1 - smooth(0.6, 1, k)) : 0, 0.15 * Math.sin(sec * 4 + i));
      });
      ring(hit / 520, hit > 0 ? 1 - smooth(260, 520, hit) : 0);
      mark(hit > 0 ? smooth(0, 60, hit) * (1 - smooth(1500, 2000, hit)) : 0, Math.exp(-Math.max(0, hit) / 500));
      rise(smoke, 0, smoke.n, 6, { sec: (hit - 150) / 1000, dur: 0.9, life: 1.2, at: (_bn, k) => a.set(row.x + (h(k, 8, 6) - 0.5) * 3.4, 0.6 + h(k, 9, 6) * 1.2, row.z), rise: 1.5, jitter: 0.5, size: 0.9, color: [0.42, 0.24, 0.2], to: [0.22, 0.16, 0.18], frame: F.smoke, grow: 2, alpha: 0.3 });
      smoke.flush();

      // -- rebirth: the great phoenix climbs out of the fire, wings wrapped, then throws them open --
      const rise01 = clamp((ms - REBIRTH) / 380);
      const spread = clamp((ms - SPREAD) / 150);
      const leave = smooth(2650, 3050, ms);
      const rs = (0.4 + 0.58 * easeOutBack(rise01)) * (1 + 0.08 * pulse(ms, SPREAD, 50, 160));
      reborn.g.position.set(row.x + (hero.x - row.x) * easeOut3(rise01), 0.9 + (hero.y - 0.9) * easeOut3(rise01) + 0.9 * leave, hero.z);
      reborn.g.rotation.set(TILT, 0, 0);
      reborn.g.scale.setScalar(rs);
      const flap = Math.sin((ms - SPREAD) * 0.0075) * 0.3 * smooth(SPREAD + 150, SPREAD + 500, ms);
      reborn.pose(sec, smooth(REBIRTH, REBIRTH + 140, ms) * (1 - leave), -1 + 1.5 * easeOutBack(spread) - flap, 0.25 * spread - flap * 0.6, 1 + 0.25 * pulse(ms, SPREAD, 40, 300) + 0.35 * leave, 0.3);
      cry((ms - SPREAD) / 600, ms > SPREAD ? 1 - smooth(300, 600, ms - SPREAD) : 0);
      const [w0, wn] = take(0.18);
      rise(light, w0, wn, 7, { sec: (ms - REBIRTH) / 1000, dur: 1.2, life: 0.55, at: (_bn, k) => a.set(reborn.g.position.x + (h(k, 8, 7) - 0.5) * 5.6 * rs * spread, reborn.g.position.y + (h(k, 9, 7) - 0.3) * 1.6 * rs, hero.z), rise: 1.2, jitter: 0.3, size: 0.5, color: HOT, to: RED, frame: F.flame, grow: 0.4, alpha: 0.75 });
      const ag = smooth(420, 520, ms) * (1 - smooth(0, 80, hit));
      aura(diver.g.position.x, diver.g.position.y, diver.g.position.z, 3.4 * ag + 1.6 * clamp(ms / 430) * (1 - ag) * (1 - smooth(0, 80, hit)), 0.55);
      aura2(reborn.g.position.x, reborn.g.position.y + 0.3, hero.z, (5 + 4 * pulse(ms, SPREAD, 40, 260)) * rs, 0.5 * smooth(REBIRTH, REBIRTH + 200, ms) * (1 - smooth(2800, 3200, ms)));

      // -- feathers: thrown out as the wings open, drifting down over the whole field --
      for (let i = 0; i < feathers.n; i++) {
        const t = (ms - SPREAD - h(i, 0, 8) * 250) / 1000;
        if (t <= 0 || t > 1.25) {
          feathers.hide(i);
          continue;
        }
        const ang = h(i, 1, 8) * 6.2832;
        const out = (1 - Math.exp(-2.4 * t)) * (2 + 3.6 * h(i, 2, 8));
        const sway = Math.sin(t * 5 + i) * 0.25;
        feathers.put(i, hero.x + Math.cos(ang) * out * 1.25 + sway, Math.max(0.1, hero.y + Math.sin(ang) * out * 0.5 + 0.8 * t - 1.5 * t * t), hero.z + 0.3, 0.3, 1, 0.5 + 0.3 * h(i, 3, 8), 0.12, smooth(0, 0.08, t) * (1 - smooth(0.95, 1.25, t)));
        feathers.look(i, F.feather, ang + t * 2.2 * (h(i, 4, 8) - 0.5) + sway, 0.36);
      }
      feathers.flush();
      // -- the gift: on every friend a golden flame stands up, a ring of light opens, sparks climb --
      const each = Math.floor((N - n) / Math.max(1, bless.length));
      bless.forEach((x, i) => {
        const k = (ms - x.at) / 800;
        x.f.set(0.9, (1.0 + env.tall * 0.8) * Math.sin(Math.PI * clamp(k) ** 0.5), sec + i * 3, k > 0 && k < 1 ? 0.8 * smooth(0, 0.1, k) * (1 - smooth(0.55, 1, k)) : 0);
        x.ring((ms - x.at) / 500, ms > x.at ? 1 - smooth(250, 500, ms - x.at) : 0);
        rise(light, n + i * each, each, 20 + i, { sec: (ms - x.at) / 1000, dur: 0.6, life: 0.7, at: () => a.set(x.p.x, 0.2, x.p.z), rise: 2.6, jitter: 0.9, size: 0.2, color: GOLD, to: FIRE, frame: F.star, grow: 0.3, sway: 0.15 });
      });
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
