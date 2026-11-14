// The new light skills (decision 060), on the glow parts. `glare_flash` (Chói Lòa): light gathers at the monster, then a warm white
// flash bursts right at the target's eyes, rays flaring out of it. `halo_burst` (Vầng Sáng Nổ): a halo opens in the middle of the
// foes' row and its ring runs out over each of them in turn, thin rays fanning off it. `prism_lance` (Giáo Lăng Kính): a long spear
// of light with a rainbow fringe flies straight through the target and leaves a prism streak. `prism_split` (Lăng Kính Tán Sắc): a
// white ray strikes a prism hanging over the row and splits into seven coloured rays that sweep down onto every foe. `dawn_spears`
// (Giáo Rạng Đông): exactly three spears of light, 220 ms apart, the last the biggest. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { gather, type Rgb } from './fxKit';
import { GOLD, SUN, dazzle, halo } from './glowParts';
import { lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
// Kept under 1: lines blend by MAX and the bloom catches anything brighter, both of which wash a rainbow to white.
export const RAINBOW: Rgb[] = [[0.95, 0.2, 0.18], [0.95, 0.55, 0.15], [0.92, 0.88, 0.2], [0.3, 0.9, 0.3], [0.2, 0.7, 0.95], [0.3, 0.35, 0.98], [0.7, 0.3, 0.95]];
type Ctx = { root: THREE.Group; dir: number; src: THREE.Vector3; chest: THREE.Vector3; foes: THREE.Vector3[] };
function handle(env: Vfx3dEnv, build: (x: Ctx) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const step = build({ root, dir, src: new THREE.Vector3(env.from.x + dir * 0.7, env.tall * 0.65, env.from.z), chest: new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z), foes: env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z)) });
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
/** A spear of light from `a` toward `b` (`run` 0..1 its head), core + glow + an optional rainbow fringe. Uses 3 segments from `i`. */
function spear(l: ReturnType<typeof lines>, i: number, a: THREE.Vector3, b: THREE.Vector3, run: number, w: number, g: number, fringe = false) {
  const head = new THREE.Vector3().copy(a).lerp(b, run);
  const tail = new THREE.Vector3().copy(a).lerp(b, Math.max(0, run - 0.35));
  l.put(i, tail, head, w * 0.3, w, SUN[0], SUN[1], SUN[2], g);
  l.put(i + 1, tail, head, w * 0.1, w * 0.35, 2, 2, 2, g);
  if (fringe) l.put(i + 2, tail.clone().setY(tail.y - w * 0.8), head.clone().setY(head.y - w * 0.8), w * 0.15, w * 0.5, 0.6, 0.9, 1.7, g * 0.8);
  else l.put(i + 2, tail, tail, 0, 0, 0, 0, 0, 0);
}

export const glareFlash = (env: Vfx3dEnv) => handle(env, ({ root, src, chest }) => {
  const motes = quads(root, Math.round(40 * env.quality), true, F.star);
  const flash = quads(root, 2 + Math.round(30 * env.quality), true, F.star);
  const HIT = 420;
  const eyes = new THREE.Vector3(chest.x, env.tall * 0.72, chest.z + 0.35);
  return (ms) => {
    gather(motes, 0, motes.n, 1, { k: clamp(ms / (HIT - 80)), to: src, radius: 1.2, turns: 0.8, size: 0.13, color: SUN, frame: F.star, tall: 1 });
    motes.flush();
    const g = ms > HIT ? Math.exp(-(ms - HIT) / 110) : 0;
    flash.put(0, eyes.x, eyes.y, eyes.z, (0.9 + env.tall * 0.4) * (0.6 + 1.2 * g), 1.9, 1.8, 1.4, g);
    flash.look(0, F.star, 0.3);
    flash.put(1, eyes.x, eyes.y, eyes.z, (0.6 + env.tall * 0.3) * (0.6 + g), 1.4, 1.2, 0.7, g * 0.7);
    flash.look(1, F.soft);
    dazzle(flash, 2, flash.n - 2, 2, (ms - HIT) / 1000, eyes, 0.6);
    flash.flush();
  };
});

export const haloBurst = (env: Vfx3dEnv) => handle(env, ({ root, foes }) => {
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
  const core = halo(root, GOLD, 1);
  core.mesh.rotation.x = TILT;
  core.mesh.position.set(mid.x, env.tall * 0.9, mid.z);
  const ring = shock(root, mid, span * 1.3, [1.5, 1.25, 0.55]);
  const per = Math.round(14 * env.quality);
  const rays = quads(root, foes.length * per + 3, true, F.star);
  const HIT = 500;
  return (ms, sec) => {
    core.mesh.scale.setScalar((1 + env.tall * 0.5) * easeOutBack(clamp((ms - 150) / 350)));
    core.set(sec, smooth(150, 250, ms) * (1 - smooth(HIT + 150, HIT + 400, ms)));
    ring((ms - HIT + 60) / 450, ms > HIT - 60 ? 1 - smooth(300, 450, ms - HIT + 60) : 0);
    foes.forEach((f, i) => dazzle(rays, i * per, per, 3 + i, (ms - HIT - i * 90) / 1000, f, 0.7));
    rays.flush();
  };
});

export const prismLance = (env: Vfx3dEnv) => handle(env, ({ root, dir, src, chest }) => {
  const l = lines(root, 3 + 7);
  const glint = quads(root, Math.round(24 * env.quality), true, F.star);
  const FIRE = 420;
  const HIT = 560;
  const beyond = new THREE.Vector3(chest.x + dir * 3, chest.y, chest.z);
  return (ms) => {
    const run = clamp((ms - FIRE) / (HIT - FIRE + 120));
    const g = ms > FIRE ? 1 - smooth(HIT + 100, HIT + 260, ms) : 0;
    spear(l, 0, src, beyond, run, 0.16, g, true);
    // The prism streak it leaves: seven thin coloured lines, fading from the back.
    for (let k = 0; k < 7; k++) {
      const c = [...RAINBOW[k]!] as Rgb;
      const off = (k - 3) * 0.035;
      const head = new THREE.Vector3().copy(src).lerp(beyond, run);
      l.put(3 + k, src.clone().setY(src.y + off), head.setY(head.y + off), 0.02, 0.03, c[0], c[1], c[2], ms > HIT ? 0.8 * (1 - smooth(HIT + 50, HIT + 350, ms)) : 0);
    }
    l.show(10, 1);
    l.flush();
    dazzle(glint, 0, glint.n, 4, (ms - HIT) / 1000, chest, 0.7);
    glint.flush();
  };
});

export const prismSplit = (env: Vfx3dEnv) => handle(env, ({ root, src, foes }) => {
  const mid = new THREE.Vector3(env.origin.x, env.tall * 1.55, env.origin.z);
  const gem = quads(root, 3, true, F.shard);
  const l = lines(root, 2);
  // The coloured rays are painted beads (a line's white heart would wash the rainbow out): 7 rays × 12 beads per foe.
  const beads = quads(root, foes.length * 7 * 12, false, F.soft);
  const glints = quads(root, foes.length * 12, true, F.star);
  const STRIKE = 350;
  const HIT = 550;
  return (ms) => {
    // The prism hangs over the row and turns; the white ray from the caster strikes it.
    const on = smooth(100, 200, ms) * (1 - smooth(HIT + 300, HIT + 500, ms));
    gem.put(0, mid.x, mid.y, mid.z, 0.55 + env.tall * 0.15, 0.75, 0.85, 0.98, on);
    gem.look(0, F.shard, ms * 0.004, 1.4);
    gem.put(1, mid.x, mid.y, mid.z + 0.01, 0.9 + env.tall * 0.2, 0.5, 0.55, 0.8, on * 0.3 * (1 + Math.sin(ms * 0.02)));
    gem.look(1, F.soft);
    gem.hide(2);
    gem.flush();
    const gw = ms > STRIKE - 150 ? 1 - smooth(HIT, HIT + 200, ms) : 0;
    const run = clamp((ms - STRIKE + 150) / 150);
    l.put(0, src, new THREE.Vector3().copy(src).lerp(mid, run), 0.06, 0.08, 1.8, 1.8, 1.8, gw);
    l.put(1, src, new THREE.Vector3().copy(src).lerp(mid, run), 0.02, 0.03, 2, 2, 2, gw);
    l.show(2, 1);
    l.flush();
    // Seven coloured rays fan out of it and sweep down onto every foe.
    const reach = clamp((ms - STRIKE) / (HIT - STRIKE));
    const g = ms > STRIKE ? 1 - smooth(HIT + 150, HIT + 350, ms) : 0;
    foes.forEach((f, i) => {
      for (let k = 0; k < 7; k++) {
        const c = RAINBOW[k]!;
        const to = new THREE.Vector3(f.x + (k - 3) * 0.13, f.y, f.z);
        for (let j = 0; j < 12; j++) {
          const u = (j / 11) * reach;
          const p = new THREE.Vector3().copy(mid).lerp(to, u);
          const idx = (i * 7 + k) * 12 + j;
          beads.put(idx, p.x, p.y, p.z + 0.05, 0.13 + 0.05 * u, c[0], c[1], c[2], g * (0.55 + 0.45 * u));
          beads.look(idx, F.soft);
        }
      }
    });
    beads.flush();
    foes.forEach((f, i) => dazzle(glints, i * 12, 12, 6 + i, (ms - HIT - i * 60) / 1000, f, 0.6));
    glints.flush();
  };
});

export const dawnSpears = (env: Vfx3dEnv) => handle(env, ({ root, src, chest, dir }) => {
  const HITS = [320, 540, 760] as const;
  const l = lines(root, HITS.length * 3);
  const glints = HITS.map(() => quads(root, Math.round(18 * env.quality), true, F.star));
  const ring = shock(root, new THREE.Vector3(chest.x, 0, chest.z), 3, [1.5, 1.25, 0.55]);
  const sun = halo(root, GOLD, 0.8);
  sun.mesh.rotation.x = TILT;
  sun.mesh.position.set(src.x - dir * 0.4, src.y + 0.3, src.z - 0.2);
  return (ms, sec) => {
    sun.mesh.scale.setScalar((0.9 + env.tall * 0.4) * easeOut(clamp(ms / 250)));
    sun.set(sec, smooth(0, 100, ms) * (1 - smooth(900, 1150, ms)));
    HITS.forEach((t, k) => {
      const last = k === 2;
      const from = src.clone().setY(src.y + (k - 1) * 0.25);
      const run = clamp((ms - t + 110) / 110);
      const g = ms > t - 110 ? 1 - smooth(t + 40, t + 200, ms) : 0;
      spear(l, k * 3, from, new THREE.Vector3(chest.x + dir * 0.4, chest.y + (k - 1) * 0.1, chest.z), run, last ? 0.2 : 0.12, g);
      dazzle(glints[k]!, 0, glints[k]!.n, 10 + k, (ms - t) / 1000, chest, last ? 1 : 0.6);
      glints[k]!.flush();
    });
    l.show(HITS.length * 3, 1);
    l.flush();
    ring((ms - 760) / 360, ms > 760 ? 1 - smooth(180, 360, ms - 760) : 0);
  };
});
