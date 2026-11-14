// Guards on the caster itself, rebuilt per kind (decision 059); each locks at its `HIT`. `stone_skin` (Da Đá, earth): stones
// fly in from round the caster and clamp onto it, then a stone-tinted dome closes (defence up, a shield). `bronze_wall` (Tường
// Khiên Đồng, metal) and `iron_shell` (Vỏ Sắt): plates of bronze / steel fly in and lock into a shield before the unit with a clang;
// the bronze wall also throws orange rings at the foes (taunt). `taunt_call` (Khiêu Khích): orange rings pulse out from the caster
// toward the foes and a small dome closes. `hold_fast` (Thủ Vững): the caster plants itself — a ring stamps the ground, a dome
// flashes and pluses rise. `fortress` (Pháo Đài Sống): a great dome closes over the caster with stone spikes rising round its
// foot, and taunting rings go out. `bark_skin` (Vỏ Cây Cứng): bark-brown stems wind up the monster and a green dome closes.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { DEF, HEAL, dome, rgbOf, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { type Rgb } from './fxKit';
import { stem } from './plantParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { BRONZE, STEEL, clang, plates } from './steelParts';
import { STONE, boulder, rock, spikeClump } from './stoneParts';
import { shock } from './stormParts';

const TILT = -0.45;
const TAUNT: Rgb = [1.5, 0.7, 0.25];
type Q = ReturnType<typeof quads>;
function handle(env: Vfx3dEnv, build: (root: THREE.Group, feet: THREE.Vector3) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const step = build(root, new THREE.Vector3(env.origin.x, 0, env.origin.z));
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
/** A dome over a unit: closes from `t0` in 220 ms, flashes on `hit`, fades out by `end`. */
function domeOn(d: ReturnType<typeof dome>, feet: THREE.Vector3, tall: number, ms: number, sec: number, t0: number, hit: number, end: number, size = 1) {
  d.mesh.position.set(feet.x, tall * 0.5, feet.z + 0.3);
  d.mesh.rotation.x = TILT * 0.5;
  d.mesh.scale.set((1 + tall * 0.55) * size, (1 + tall * 0.6) * size, 1);
  const grow = easeOutBack(clamp((ms - t0) / 220));
  d.set(grow * 0.97, smooth(t0, t0 + 60, ms) * (1 - smooth(end - 250, end, ms)), sec, Math.exp(-Math.max(0, ms - hit) / 120) * (ms > hit ? 1 : 0));
}
/** Orange taunt rings rolling out of `feet` toward the foes, one every 160 ms from `t0`. */
function tauntRings(rings: ReturnType<typeof shock>[], ms: number, t0: number) {
  rings.forEach((r, k) => r((ms - t0 - k * 160) / 420, ms > t0 + k * 160 ? 0.85 * (1 - smooth(260, 420, ms - t0 - k * 160)) : 0));
}
function chevrons(q: Q, sec: number, feet: THREE.Vector3, tall: number, c: Rgb, seed: number) {
  signsUp(q, 0, 8, seed, sec, feet, tall, c, 'up');
  q.flush();
}

export const stoneSkin = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const stone = rock(STONE);
  const bits = Array.from({ length: 7 }, (_, k) => {
    const m = new THREE.Mesh(boulder(20 + k, 0), stone.mat);
    root.add(m);
    return { m, a: (k / 7) * 6.283, y: 0.2 + 0.6 * ((k * 37) % 7) / 7 };
  });
  const d = dome(root, [1.2, 1, 0.7]);
  const signs = quads(root, 16, true, F.disc);
  const HIT = 330;
  return (ms, sec) => {
    const hit = ms - HIT;
    // The stones fly in from a wide ring and clamp onto the caster's body on the impact, then crumble away.
    const k = easeOut(clamp(ms / HIT));
    const R = (0.4 + env.tall * 0.2) + (1.8 - 1.8 * k);
    bits.forEach((b) => {
      b.m.position.set(feet.x + Math.cos(b.a + k * 2) * R, env.tall * b.y, feet.z + Math.sin(b.a + k * 2) * R * 0.45 + 0.2);
      b.m.scale.setScalar((0.16 + env.tall * 0.05) * (1 - 0.6 * smooth(300, 600, hit)));
      b.m.rotation.set(sec * 3 + b.a, sec * 2, 0);
    });
    stone.set(smooth(0, 60, ms) * (1 - smooth(400, 650, hit)), hit > 0 ? Math.exp(-hit / 150) : 0);
    domeOn(d, feet, env.tall, ms, sec, HIT - 40, HIT, HIT + 900);
    chevrons(signs, hit / 1000, feet, env.tall, DEF, 1);
  };
});

function plated(env: Vfx3dEnv, tone: Rgb, taunt: boolean) {
  return handle(env, (root, feet) => {
    // The foes stand on the other half of the stage (x = 0 is its middle): the shield faces them.
    const toward = feet.x < 0 ? 1 : -1;
    const shield = plates(tone, 8, taunt ? 7 : 9);
    root.add(shield.g);
    const sparks = quads(root, Math.round(30 * env.quality), true, F.star);
    const rings = taunt ? [0, 1, 2].map(() => shock(root, feet, 4, TAUNT)) : [];
    const signs = quads(root, 16, true, F.disc);
    const HIT = 330;
    const S = 0.35 + env.tall * 0.22;
    return (ms) => {
      const hit = ms - HIT;
      // The plates fly in from apart and lock into a shield just before the unit on the impact.
      shield.g.position.set(feet.x + toward * (0.35 + env.tall * 0.18), env.tall * 0.5, feet.z + 0.45);
      shield.g.scale.setScalar(S);
      shield.set(1 - easeOut(clamp(ms / HIT)), smooth(0, 80, ms) * (1 - smooth(150, 350, hit)), hit > 0 ? Math.exp(-hit / 120) : 0, hit > 0 ? hit / 300 : -9);
      clang(sparks, 0, sparks.n, null, 0, 0, 3, hit / 1000, new THREE.Vector3(feet.x, env.tall * 0.5, feet.z + 0.5), 0.8);
      sparks.flush();
      tauntRings(rings, ms, HIT + 80);
      chevrons(signs, hit / 1000, feet, env.tall, DEF, 2);
    };
  });
}
export const bronzeWall = (env: Vfx3dEnv) => plated(env, BRONZE, true);
export const ironShell = (env: Vfx3dEnv) => plated(env, STEEL, false);

export const tauntCall = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const rings = [0, 1, 2].map(() => shock(root, feet, 4.4, TAUNT));
  const d = dome(root, [1.3, 0.8, 0.45]);
  const HIT = 330;
  return (ms, sec) => {
    tauntRings(rings, ms, 60);
    domeOn(d, feet, env.tall, ms, sec, HIT - 60, HIT, HIT + 800, 0.8);
  };
});

export const holdFast = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const stamp = shock(root, feet, 2.6, DEF);
  const d = dome(root, DEF);
  const signs = quads(root, 32, true, F.disc);
  const HIT = 400;
  return (ms, sec) => {
    const hit = ms - HIT;
    stamp(hit / 300, hit > 0 ? 1 - smooth(150, 300, hit) : 0);
    domeOn(d, feet, env.tall, ms, sec, HIT - 80, HIT, HIT + 600);
    signsUp(signs, 0, 8, 4, hit / 1000, feet, env.tall, DEF, 'up');
    signsUp(signs, 16, 8, 5, (hit - 120) / 1000, feet, env.tall, HEAL, 'plus');
    signs.flush();
  };
});

export const fortress = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const c = rgbOf(env.color, [1.4, 1.15, 0.55]);
  const d = dome(root, c);
  const stone = rock(STONE);
  const ring = [0, 1, 2, 3, 4].map((k) => {
    const a = (k / 5) * 6.283;
    return spikeClump(root, stone.mat, new THREE.Vector3(feet.x + Math.cos(a) * (0.9 + env.tall * 0.3), 0, feet.z + Math.sin(a) * (0.9 + env.tall * 0.3) * 0.5), 2, 0.5 + env.tall * 0.25, 30 + k);
  });
  const rings = [0, 1, 2].map(() => shock(root, feet, 5, TAUNT));
  const signs = quads(root, 16, true, F.disc);
  const HIT = 470;
  return (ms, sec) => {
    const hit = ms - HIT;
    const up = easeOutBack(clamp((ms - HIT + 200) / 220)) * (1 - smooth(500, 800, hit));
    ring.forEach((r) => r(up));
    stone.set(up > 0.01 ? 1 : 0);
    domeOn(d, feet, env.tall, ms, sec, HIT - 100, HIT, HIT + 1000, 1.25);
    tauntRings(rings, ms, HIT + 60);
    chevrons(signs, hit / 1000, feet, env.tall, DEF, 6);
  };
});

export const barkSkin = (env: Vfx3dEnv) => handle(env, (root, feet) => {
  const BARK_D: Rgb = [0.3, 0.18, 0.09];
  const BARK_L: Rgb = [0.62, 0.42, 0.22];
  const vines = [0, 1, 2].map(() => stem(root, 22, BARK_D, BARK_L, 6));
  const d = dome(root, [0.7, 1.3, 0.5]);
  const signs = quads(root, 16, true, F.disc);
  const HIT = 420;
  return (ms, sec) => {
    const hit = ms - HIT;
    const R = 0.4 + env.tall * 0.2;
    vines.forEach((v, k) => v.set((u, out) => {
      const a = k * 2.094 + u * 8;
      return out.set(feet.x + Math.cos(a) * R, 0.05 + env.tall * 1.0 * u, feet.z + Math.sin(a) * R * 0.45 + 0.1);
    }, () => 0.06, easeOut(clamp((ms - 50) / (HIT - 50))), 1 - smooth(400, 650, hit)));
    domeOn(d, feet, env.tall, ms, sec, HIT - 60, HIT, HIT + 800);
    chevrons(signs, hit / 1000, feet, env.tall, DEF, 7);
  };
});
