// Guards on allies, rebuilt per kind (decision 059); each ally is reached in turn from `HIT`, 110 ms apart. `mountain_shell` (Mai
// Núi, earth): a ring of stone spikes heaves up round each ally like a shell and sinks again (defence and magic defence up).
// `shield_wall` (Tường Khiên): a dome of hexagon cells closes over each ally, flashing as it locks (a shield). `stone_guard` (Thủ
// Đá): a slab of stone shoulders up out of the ground before each monster and settles back (defence up). `undying_spark`
// (Tinh Thần Bất Khuất): a golden spark spirals down into the ally and bursts in a ring of light (Undying; its wings are the
// status's own mark). Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { DEF, dome, rgbOf, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h, type Rgb } from './fxKit';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { STONE, boulder, rock, rubble, spikeClump } from './stoneParts';
import { shock } from './stormParts';

const TILT = -0.45;
const GAP = 110;
const MDEF: Rgb = [0.6, 0.75, 1.6];
function handle(env: Vfx3dEnv, build: (root: THREE.Group, allies: THREE.Vector3[]) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const step = build(root, env.targets.map((t) => new THREE.Vector3(t.x, 0, t.z)));
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export const mountainShell = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const stone = rock(STONE);
  const shells = allies.map((a, i) => spikeClump(root, stone.mat, a, 6, 0.45 + env.tall * 0.3, 40 + i * 7));
  const chips = quads(root, allies.length * 10, false, F.shard);
  const dust = quads(root, allies.length * 6, false, F.smoke);
  const signs = quads(root, allies.length * 32, true, F.disc);
  const HIT = 570;
  return (ms) => {
    allies.forEach((a, i) => {
      const age = ms - HIT - i * GAP;
      shells[i]!(easeOutBack(clamp((age + 180) / 200)) * (1 - smooth(350, 650, age)));
      rubble(chips, i * 10, 10, dust, i * 6, 6, 50 + i, (age + 60) / 1000, new THREE.Vector3(a.x, 0.1, a.z), 0.6);
      signsUp(signs, i * 32, 8, 60 + i, age / 1000, a, env.tall, DEF, 'up');
      signsUp(signs, i * 32 + 16, 8, 70 + i, (age - 90) / 1000, a, env.tall, MDEF, 'up');
    });
    stone.set(1);
    chips.flush();
    dust.flush();
    signs.flush();
  };
});

export const shieldWall = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const c = rgbOf(env.color, [0.85, 1.05, 1.5]);
  const domes = allies.map(() => dome(root, c));
  const HIT = 520;
  return (ms, sec) => {
    allies.forEach((a, i) => {
      const t0 = HIT - 120 + i * GAP;
      const d = domes[i]!;
      d.mesh.position.set(a.x, env.tall * 0.5, a.z + 0.3);
      d.mesh.rotation.x = TILT * 0.5;
      d.mesh.scale.set(1 + env.tall * 0.55, 1 + env.tall * 0.6, 1);
      d.set(easeOutBack(clamp((ms - t0) / 220)) * 0.97, smooth(t0, t0 + 60, ms) * (1 - smooth(t0 + 750, t0 + 1000, ms)), sec, ms > t0 + 120 ? Math.exp(-(ms - t0 - 120) / 120) : 0);
    });
  };
});

export const stoneGuard = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const stone = rock([0.56, 0.47, 0.37]);
  const toward = (allies[0]?.x ?? 0) < 0 ? 1 : -1;
  const slabs = allies.map((_, i) => {
    const m = new THREE.Mesh(boulder(80 + i, 1), stone.mat);
    root.add(m);
    return m;
  });
  const chips = quads(root, allies.length * 10, false, F.shard);
  const dust = quads(root, allies.length * 6, false, F.smoke);
  const signs = quads(root, allies.length * 16, true, F.disc);
  const HIT = 470;
  return (ms) => {
    allies.forEach((a, i) => {
      const age = ms - HIT - i * GAP;
      const up = easeOutBack(clamp((age + 160) / 180)) * (1 - smooth(400, 700, age));
      const m = slabs[i]!;
      m.visible = up > 0.01;
      m.position.set(a.x + toward * (0.45 + env.tall * 0.15), (0.3 + env.tall * 0.2) * (up - 0.5), a.z + 0.35);
      m.scale.set(0.25 + env.tall * 0.06, (0.45 + env.tall * 0.25) * Math.max(0.01, up), 0.45 + env.tall * 0.12);
      rubble(chips, i * 10, 10, dust, i * 6, 6, 90 + i, (age + 40) / 1000, new THREE.Vector3(m.position.x, 0.1, a.z + 0.35), 0.5);
      signsUp(signs, i * 16, 8, 100 + i, age / 1000, a, env.tall, DEF, 'up');
    });
    stone.set(1);
    chips.flush();
    dust.flush();
    signs.flush();
  };
});

export const undyingSpark = (env: Vfx3dEnv) => handle(env, (root, allies) => {
  const GOLDEN: Rgb = [1.6, 1.35, 0.6];
  const feet = allies[0] ?? new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const spark = quads(root, 1 + Math.round(30 * env.quality), true, F.star);
  const glow = quads(root, Math.round(40 * env.quality), true, F.feather);
  const ring = shock(root, feet, 2.6, GOLDEN);
  const HIT = 330;
  const p = new THREE.Vector3();
  return (ms) => {
    const hit = ms - HIT;
    // The spark spirals down into the ally from above, trailing light; on the impact it bursts in feathers of light and a ring.
    const k = easeOut(clamp(ms / HIT));
    const a = k * 9;
    const r = (1 - k) * (0.9 + env.tall * 0.3);
    p.set(feet.x + Math.cos(a) * r, env.tall * (2 - 1.45 * k), feet.z + Math.sin(a) * r * 0.45 + 0.2);
    spark.put(0, p.x, p.y, p.z, 0.45, GOLDEN[0], GOLDEN[1], GOLDEN[2], hit < 0 ? smooth(0, 60, ms) : 0);
    spark.look(0, F.star);
    for (let i = 1; i < spark.n; i++) {
      const lag = h(i, 0, 3) * 0.25;
      const kk = easeOut(clamp(ms / HIT - lag));
      const aa = kk * 9;
      const rr = (1 - kk) * (0.9 + env.tall * 0.3);
      spark.put(i, feet.x + Math.cos(aa) * rr, env.tall * (2 - 1.45 * kk), feet.z + Math.sin(aa) * rr * 0.45 + 0.2, 0.14, GOLDEN[0], GOLDEN[1], GOLDEN[2], hit < 0 && ms > lag * HIT ? 0.7 * (1 - lag * 3) : 0);
      spark.look(i, F.star);
    }
    spark.flush();
    burst(glow, 0, glow.n, 4, { sec: hit / 1000, at: new THREE.Vector3(feet.x, env.tall * 0.55, feet.z + 0.2), life: 0.8, speed: 1.6, up: 1.8, grav: 0.5, drag: 1.5, size: 0.22, color: GOLDEN, to: [1.3, 1, 0.5], frame: F.feather, alpha: 0.9 });
    glow.flush();
    ring(hit / 320, hit > 0 ? 1 - smooth(160, 320, hit) : 0);
  };
});
