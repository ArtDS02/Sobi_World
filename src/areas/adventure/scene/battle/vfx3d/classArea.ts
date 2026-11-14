// Class blows over the foes' row, rebuilt per kind (decision 059), in the caster's element colour. `shadow_dance` (Bóng Ảnh): four
// dashes of shadow cut across foes picked at random (300 / 520 / 740 / 1150, the last the widest), then the caster flickers back
// with evasion chevrons. `stomp_quake` (Dậm Đất): the caster's stomp rings the ground and cracks run out over it to every foe, dust
// jumping where they arrive (slow). `tremor_heave` (Chấn Động): the ground heaves under each foe in turn, slabs of stone jolting up
// through a ring of dust. `element_rain` (Mưa Nguyên Tố): a ring of the caster's colour opens over the row and streaks rain down on
// it, splashing on each foe. `spell_storm` (Bão Phép): a wheel of runes turns over the row with motes whirling round it and fires
// a forked bolt down onto each foe. `star_fall` (Thiên Thạch): a meteor of the caster's colour falls slanting onto the middle of the
// row and bursts, a wide ring and a flash on every foe. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { EVA, rgbOf, sigil, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { forked, lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { cut } from './steelParts';
import { boulder, rock, rubble } from './stoneParts';
import { shock } from './stormParts';

const TILT = -0.45;
const GAP = 80;
const colorOf = (env: Vfx3dEnv): Rgb => {
  const c = rgbOf(env.color, [0.8, 0.95, 1.3]);
  return [c[0] * 1.3, c[1] * 1.3, c[2] * 1.3];
};
type Ctx = { root: THREE.Group; c: Rgb; foes: THREE.Vector3[]; mid: THREE.Vector3; span: number };
function handle(env: Vfx3dEnv, build: (x: Ctx) => (ms: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = env.struck.map((t) => new THREE.Vector3(t.x, env.tall * 0.5, t.z));
  const mid = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const span = Math.max(3, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.2));
  const step = build({ root, c: colorOf(env), foes, mid, span });
  return {
    update: (ms) => step(ms),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export const shadowDance = (env: Vfx3dEnv) => handle(env, ({ root, c, foes }) => {
  const HITS = [300, 520, 740, 1150] as const;
  const cuts = HITS.map(() => cut(root, c, true));
  const dash = lines(root, HITS.length);
  const smoke = quads(root, HITS.length * 8, false, F.smoke);
  const signs = quads(root, 16, true, F.disc);
  const caster = new THREE.Vector3(env.from.x, 0, env.from.z);
  return (ms) => {
    HITS.forEach((t, k) => {
      const f = foes[k % foes.length]!;
      const last = k === HITS.length - 1;
      const S = (1 + env.tall * 0.5) * (last ? 1.4 : 1);
      const cu = cuts[k]!;
      cu.mesh.position.set(f.x, f.y, f.z + 0.3);
      cu.mesh.rotation.set(TILT, 0, k % 2 ? 0.7 : -0.7);
      cu.mesh.scale.setScalar(S);
      cu.set(clamp((ms - t + 50) / 50) + 0.6 * smooth(t + 80, t + 220, ms), ms > t - 50 ? 1 - smooth(t + 120, t + 220, ms) : 0);
      // The dash itself: a streak of shadow running through the foe.
      const g = ms > t - 60 ? 1 - smooth(t + 20, t + 140, ms) : 0;
      dash.put(k, new THREE.Vector3(f.x - 1.4, f.y + 0.2, f.z + 0.3), new THREE.Vector3(f.x + 1.4, f.y - 0.2, f.z + 0.3), 0.05, 0.02, c[0] * 0.5, c[1] * 0.4, c[2] * 0.8, g);
      burst(smoke, k * 8, 8, 20 + k, { sec: (ms - t) / 1000, at: f, life: 0.6, speed: 1.2, up: 0.5, grav: 0, drag: 2, size: 0.4, color: [0.12, 0.08, 0.2], to: [0.25, 0.2, 0.35], frame: F.smoke, alpha: 0.5 });
    });
    dash.show(HITS.length, 1);
    dash.flush();
    smoke.flush();
    signsUp(signs, 0, 8, 30, (ms - 1250) / 1000, caster, env.tall, EVA, 'up');
    signs.flush();
  };
});

export const stompQuake = (env: Vfx3dEnv) => handle(env, ({ root, c, foes }) => {
  const caster = new THREE.Vector3(env.from.x, 0, env.from.z);
  const stomp = shock(root, caster, 3, c);
  const cracks = lines(root, foes.length * 10);
  const chips = quads(root, foes.length * 8, false, F.shard);
  const dust = quads(root, foes.length * 8, false, F.smoke);
  const HIT = 450;
  const STOMP = 300;
  return (ms) => {
    stomp((ms - STOMP) / 300, ms > STOMP ? 1 - smooth(150, 300, ms - STOMP) : 0);
    let n = 0;
    foes.forEach((f, i) => {
      // A jagged crack runs over the ground from the caster to this foe, arriving on its beat.
      const arrive = HIT + i * GAP;
      const run = clamp((ms - STOMP) / (arrive - STOMP));
      const g = ms > STOMP ? 1 - smooth(arrive + 150, arrive + 400, ms) : 0;
      let prev = caster.clone().setY(0.03);
      for (let k = 1; k <= 10; k++) {
        const u = k / 10;
        if (u > run) break;
        const p = caster.clone().lerp(new THREE.Vector3(f.x, 0.03, f.z), u);
        p.z += (h(k, 1, 40 + i) - 0.5) * 0.35;
        p.x += (h(k, 2, 40 + i) - 0.5) * 0.25;
        cracks.put(n++, prev, p, 0.05, 0.05, c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, g);
        prev = p;
      }
      rubble(chips, i * 8, 8, dust, i * 8, 8, 50 + i, (ms - arrive) / 1000, new THREE.Vector3(f.x, 0.1, f.z), 0.6);
    });
    cracks.show(n, 1);
    cracks.flush();
    chips.flush();
    dust.flush();
  };
});

export const tremorHeave = (env: Vfx3dEnv) => handle(env, ({ root, c, foes }) => {
  const stone = rock([0.58, 0.48, 0.36], [c[0], c[1], c[2]]);
  const slabs = foes.map((_, i) => [0, 1, 2].map((k) => {
    const m = new THREE.Mesh(boulder(60 + i * 3 + k, 0), stone.mat);
    root.add(m);
    return m;
  }));
  const rings = foes.map((f) => shock(root, new THREE.Vector3(f.x, 0, f.z), 3, [1.2, 1, 0.8]));
  const chips = quads(root, foes.length * 10, false, F.shard);
  const dust = quads(root, foes.length * 8, false, F.smoke);
  const HIT = 450;
  return (ms) => {
    foes.forEach((f, i) => {
      const age = ms - HIT - i * GAP;
      const up = easeOutBack(clamp((age + 60) / 140)) * (1 - smooth(300, 600, age));
      slabs[i]!.forEach((m, k) => {
        const a = (k / 3) * 6.283 + i;
        m.visible = up > 0.01;
        m.position.set(f.x + Math.cos(a) * 0.45, (0.25 + env.tall * 0.15) * (up - 0.4), f.z + Math.sin(a) * 0.25);
        m.rotation.set(0.4 * Math.cos(a), a, 0.4 * Math.sin(a));
        m.scale.set(0.22 + env.tall * 0.05, (0.35 + env.tall * 0.2) * Math.max(0.01, up), 0.22 + env.tall * 0.05);
      });
      rings[i]!(age / 320, age > 0 ? 1 - smooth(160, 320, age) : 0);
      rubble(chips, i * 10, 10, dust, i * 8, 8, 70 + i, age / 1000, new THREE.Vector3(f.x, 0.1, f.z), 0.8);
    });
    stone.set(1, 0.4);
    chips.flush();
    dust.flush();
  };
});

export const elementRain = (env: Vfx3dEnv) => handle(env, ({ root, c, foes, mid, span }) => {
  const sky = sigil(root, c, 20);
  sky.mesh.rotation.x = -Math.PI / 2 + 0.25;
  sky.mesh.position.set(mid.x, env.tall * 1.55, mid.z);
  const rain = quads(root, Math.round(90 * env.quality), true, F.streak);
  const splash = quads(root, foes.length * 10, true, F.star);
  const HIT = 500;
  return (ms) => {
    sky.mesh.scale.set(span * 0.85, span * 0.45, 1);
    sky.set(easeOut(clamp(ms / 300)), smooth(0, 80, ms) * (1 - smooth(HIT + 400, HIT + 650, ms)), ms / 400);
    // Streaks fall from the ring onto the row for half a second round the impact.
    for (let i = 0; i < rain.n; i++) {
      const t = (ms - 250 - h(i, 0, 1) * 600) / 260;
      if (t <= 0 || t >= 1) {
        rain.hide(i);
        continue;
      }
      const x = mid.x + (h(i, 1, 1) - 0.5) * span;
      rain.put(i, x - 0.3 * t, env.tall * 1.55 * (1 - t), mid.z + (h(i, 2, 1) - 0.5) * 1.4, 0.3, c[0], c[1], c[2], 0.9);
      rain.stretch(i, -0.15, -0.9, 0);
      rain.look(i, F.streak, 0, 0.5);
    }
    rain.flush();
    foes.forEach((f, i) => burst(splash, i * 10, 10, 10 + i, { sec: (ms - HIT - i * GAP) / 1000, at: new THREE.Vector3(f.x, env.tall * 0.3, f.z + 0.2), life: 0.5, speed: 2, up: 1.6, grav: 4, drag: 2, size: 0.14, color: c, frame: F.star, alpha: 0.9 }));
    splash.flush();
  };
});

export const spellStorm = (env: Vfx3dEnv) => handle(env, ({ root, c, foes, mid, span }) => {
  const wheel = sigil(root, c, 16);
  wheel.mesh.rotation.x = -Math.PI / 2 + 0.3;
  const top = new THREE.Vector3(mid.x, env.tall * 1.5, mid.z);
  wheel.mesh.position.copy(top);
  const motes = quads(root, Math.round(80 * env.quality), true, F.star);
  const bolts = lines(root, foes.length * 30);
  const HIT = 560;
  return (ms) => {
    wheel.mesh.scale.set(span * 0.7, span * 0.4, 1);
    wheel.set(easeOut(clamp(ms / 300)), smooth(0, 80, ms) * (1 - smooth(HIT + 350, HIT + 600, ms)), ms / 150);
    rise(motes, 0, motes.n, 2, { sec: ms / 1000, dur: 1, life: 0.9, at: (_b, k) => new THREE.Vector3(top.x + Math.cos(k + ms / 200) * span * 0.4, top.y - 0.3 + h(k, 3, 2) * 0.6, top.z + Math.sin(k + ms / 200) * 0.6), rise: 0.2, jitter: 0.3, size: 0.13, color: c, frame: F.star, grow: 0.4 });
    motes.flush();
    let n = 0;
    foes.forEach((f, i) => {
      const t = HIT + i * GAP;
      const g = ms > t - 40 ? 1 - smooth(t + 60, t + 200, ms) : 0;
      if (g > 0.01) n = forked(bolts, n, top.clone().add(new THREE.Vector3((f.x - top.x) * 0.3, 0, 0)), f, Math.floor(ms / 45) * 5 + i, { width: 0.06, jag: 0.2, forks: 2, color: [c[0] / 1.3, c[1] / 1.3, c[2] / 1.3], gain: g * 1.6 });
    });
    bolts.show(n, 1);
    bolts.flush();
  };
});

export const starFall = (env: Vfx3dEnv) => handle(env, ({ root, c, foes, mid, span }) => {
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const rock3 = quads(root, 2 + 20, true, F.soft);
  const blast = quads(root, Math.round(70 * env.quality), true, F.star);
  const glint = quads(root, foes.length * 2 + 1, true, F.star);
  const rings = [0, 1].map((k) => shock(root, mid, span * (1.1 + 0.35 * k), c));
  const HIT = 870;
  const sky = new THREE.Vector3(mid.x - dir * 4, env.tall * 4, mid.z - 0.5);
  const land = new THREE.Vector3(mid.x, env.tall * 0.3, mid.z);
  return (ms) => {
    // The meteor: it appears high on the caster's side, falls slanting and quickening, a long trail of light behind it.
    const t = clamp((ms - 250) / (HIT - 250));
    const p = new THREE.Vector3().copy(sky).lerp(land, t * t);
    const on = ms > 250 && ms < HIT ? 1 : 0;
    const R = 0.32 + env.tall * 0.16;
    rock3.put(0, p.x, p.y, p.z, R * 2.4, c[0], c[1], c[2], on * 0.9);
    rock3.put(1, p.x, p.y, p.z + 0.01, R, 1.6, 1.5, 1.4, on);
    rock3.look(0, F.soft);
    rock3.look(1, F.soft);
    for (let k = 0; k < 20; k++) {
      const tt = clamp(t - (k + 1) * 0.02);
      const q = new THREE.Vector3().copy(sky).lerp(land, tt * tt);
      rock3.put(2 + k, q.x, q.y, q.z, R * (1.6 - k * 0.06), c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, on * 0.35 * (1 - k / 20));
      rock3.look(2 + k, F.soft);
    }
    rock3.flush();
    burst(blast, 0, blast.n, 3, { sec: (ms - HIT) / 1000, at: land, life: 0.9, speed: span * 1.4, up: 2.5, grav: 3, drag: 2, size: 0.2, color: c, frame: F.star, alpha: 1 });
    blast.flush();
    rings.forEach((r, k) => r((ms - HIT - k * 100) / 480, ms > HIT + k * 100 ? 1 - smooth(240, 480, ms - HIT - k * 100) : 0));
    foes.forEach((f, i) => {
      const g = ms > HIT + i * GAP ? Math.exp(-(ms - HIT - i * GAP) / 110) : 0;
      glint.put(i * 2, f.x, f.y, f.z + 0.3, 1 + 1.5 * g, c[0], c[1], c[2], g);
      glint.look(i * 2, F.star, 0.3 + i);
      glint.hide(i * 2 + 1);
    });
    glint.hide(foes.length * 2);
    glint.flush();
  };
});
