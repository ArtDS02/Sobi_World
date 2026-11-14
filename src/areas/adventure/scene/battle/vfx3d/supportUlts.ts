// The four support Ultimates, one look each (decision 059); they used to share one colour-swapped `ult_party`. Times are ms from
// the start of the act (Núi Thiêng's act starts 150 ms into its step). The act stands on the caster's side and knows nothing of
// the foes, so the parts "on every foe" use the mirror of the allies' places: the stage is laid out symmetric about x = 0.
// `ocean_song` (Tiếng Hát Đại Dương): water rises round every ally in a spiral, the dark is washed off them, healing rain falls with
// teal pluses (1350); then a wave rolls over to the foes and bursts on each (Wet, 2200). `holy_mountain` (Núi Thiêng Trỗi Dậy): a
// mountain of stone spikes heaves up behind the team, dust rolling; on 1700 a stone-gold dome closes on every ally (a shield), on
// 2150 taunting rings roll from the caster. `moon_lanterns` (Lồng Đèn Trung Thu): glowing paper lanterns float up round the team,
// on 1750 each sinks onto an ally and bursts in feathers of light and pluses (Undying, healing), on 2650 the rest rise and fade.
// `mother_forest` (Rừng Mẹ Ôm Ấp): great vines grow up round the team and arch over it, flowers open on them, petals and pluses
// fall (healing, regeneration, 1500); then a cloud of violet spores drifts over to the foes (Poison, 2100).
import * as THREE from 'three';
import { F } from './atlas';
import { DEF, HEAL, dome, signsUp } from './boonParts';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { spiralUp } from './mendFx';
import { LEAF, LEAF_PALE, POISON, flower, stem } from './plantParts';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { STONE, rock, rubble, spikeClump } from './stoneParts';
import { shock } from './stormParts';
import { waveRing } from './waterParts';

const GAP = 110;
type Ctx = { root: THREE.Group; allies: THREE.Vector3[]; foes: THREE.Vector3[]; mid: THREE.Vector3; span: number };
function handle(env: Vfx3dEnv, build: (x: Ctx) => (ms: number, sec: number) => void): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const allies = env.targets.map((t) => new THREE.Vector3(t.x, 0, t.z));
  const foes = allies.map((a) => new THREE.Vector3(-a.x, 0, a.z));
  const xs = allies.map((a) => a.x);
  const mid = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, 0, allies.reduce((s, a) => s + a.z, 0) / allies.length);
  const span = Math.max(3, Math.max(...xs) - Math.min(...xs) + 2.2);
  const step = build({ root, allies, foes, mid, span });
  return {
    update: (ms) => step(ms, ms / 1000),
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
const TEAL: Rgb = [0.5, 1.35, 1.3];

export const oceanSong = (env: Vfx3dEnv) => handle(env, ({ root, allies, foes }) => {
  const swirls = allies.map(() => quads(root, Math.round(40 * env.quality), false, F.drop));
  const rain = quads(root, Math.round(80 * env.quality), true, F.drop);
  const signs = quads(root, allies.length * 20, true, F.disc);
  const dark = quads(root, allies.length * 6, false, F.smoke);
  const waves = foes.map(() => waveRing(root, 0.35, 1));
  const splash = quads(root, foes.length * 14, false, F.drop);
  const HEAL_AT = 1350;
  const WET = 2200;
  return (ms, sec) => {
    allies.forEach((a, i) => {
      spiralUp(swirls[i]!, a, env.tall * 1.3, ms, smooth(400, 600, ms) * (1 - smooth(HEAL_AT, HEAL_AT + 300, ms)), 3 + i);
      rise(dark, i * 6, 6, 10 + i, { sec: (ms - 900 - i * GAP) / 1000, dur: 0.25, life: 0.7, at: (_b, k) => new THREE.Vector3(a.x + (h(k, 8, i) - 0.5) * 0.7, env.tall * 0.5, a.z + 0.2), rise: 1.4, jitter: 0.2, size: 0.26, color: [0.1, 0.06, 0.18], to: TEAL, frame: F.smoke, grow: 0.3, alpha: 0.85 });
      signsUp(signs, i * 20, 10, 20 + i, (ms - HEAL_AT - i * GAP) / 1000, a, env.tall, TEAL, 'plus', 0.7);
    });
    dark.flush();
    signs.flush();
    // Healing rain over the team round the heal.
    for (let i = 0; i < rain.n; i++) {
      const a = allies[i % allies.length]!;
      const t = (ms - HEAL_AT + 300 - h(i, 0, 5) * 700) / 300;
      if (t <= 0 || t >= 1) {
        rain.hide(i);
        continue;
      }
      rain.put(i, a.x + (h(i, 1, 5) - 0.5) * 1.4, env.tall * 2 * (1 - t) + 0.1, a.z + (h(i, 2, 5) - 0.5) * 0.6, 0.16, 0.7, 1.3, 1.6, 0.9);
      rain.stretch(i, 0, -0.5, 0);
      rain.look(i, F.drop, 0, 0.6);
    }
    rain.flush();
    // The wave on each foe: a crown of water bursts up, drops thrown off.
    foes.forEach((f, i) => {
      const age = ms - WET - i * GAP;
      const w = waves[i]!;
      w.mesh.position.copy(f);
      w.mesh.scale.set(1, 1, 0.5);
      w.set((0.3 + env.tall * 0.15) * (1 + 0.6 * clamp(age / 400)), env.tall * 0.8 * easeOut(clamp((age + 100) / 200)) * (1 - smooth(200, 450, age)), sec, age > -100 ? 1 - smooth(300, 500, age) : 0);
      burst(splash, i * 14, 14, 30 + i, { sec: age / 1000, at: new THREE.Vector3(f.x, env.tall * 0.5, f.z), life: 0.8, speed: 2.2, up: 3.5, grav: 9, drag: 1, size: 0.15, color: [0.45, 0.8, 1.2], frame: F.drop, stretch: 0.03 });
    });
    splash.flush();
  };
});

export const holyMountain = (env: Vfx3dEnv) => handle(env, ({ root, allies, mid, span }) => {
  const stone = rock(STONE, [1.4, 1.1, 0.4]);
  // Behind the team and toward the middle of the stage, so the whole mountain stays in frame.
  const back = new THREE.Vector3(mid.x + (mid.x < 0 ? 1 : -1) * 1.6, 0, mid.z - 3.2);
  const peak = spikeClump(root, stone.mat, back, 9, 1.2 + env.tall * 0.9, 7);
  const chips = quads(root, 30, false, F.shard);
  const dust = quads(root, 24, false, F.smoke);
  const domes = allies.map(() => dome(root, [1.4, 1.15, 0.6]));
  const rings = [0, 1, 2].map(() => shock(root, new THREE.Vector3(env.from.x, 0, env.from.z), 5, [1.5, 0.7, 0.25]));
  const signs = quads(root, allies.length * 16, true, F.disc);
  const SHIELD = 1700;
  const TAUNT = 2150;
  return (ms, sec) => {
    const up = easeOutBack(clamp((ms - 350) / 900)) * (1 - smooth(2600, 3000, ms));
    peak(up);
    stone.set(up > 0.01 ? 1 : 0, 0.3 * smooth(SHIELD - 200, SHIELD, ms) * (1 - smooth(SHIELD + 200, SHIELD + 600, ms)));
    rubble(chips, 0, 30, dust, 0, 24, 3, (ms - 450) / 1000, back.clone().setY(0.2), span * 0.4);
    chips.flush();
    dust.flush();
    allies.forEach((a, i) => {
      const t0 = SHIELD - 120 + i * GAP;
      const d = domes[i]!;
      d.mesh.position.set(a.x, env.tall * 0.5, a.z + 0.3);
      d.mesh.rotation.x = -0.22;
      d.mesh.scale.set(1 + env.tall * 0.55, 1 + env.tall * 0.6, 1);
      d.set(easeOutBack(clamp((ms - t0) / 220)) * 0.97, smooth(t0, t0 + 60, ms) * (1 - smooth(t0 + 900, t0 + 1200, ms)), sec, ms > t0 + 120 ? Math.exp(-(ms - t0 - 120) / 120) : 0);
      signsUp(signs, i * 16, 8, 40 + i, (ms - SHIELD - i * GAP) / 1000, a, env.tall, DEF, 'up');
    });
    signs.flush();
    rings.forEach((r, k) => r((ms - TAUNT - k * 160) / 420, ms > TAUNT + k * 160 ? 0.85 * (1 - smooth(260, 420, ms - TAUNT - k * 160)) : 0));
  };
});

export const moonLanterns = (env: Vfx3dEnv) => handle(env, ({ root, allies, mid, span }) => {
  const N = Math.max(6, allies.length * 2);
  const glow = quads(root, N * 3, true, F.soft);
  const caps = quads(root, N * 2, false, F.disc);
  const feathers = quads(root, allies.length * 16, true, F.feather);
  const signs = quads(root, allies.length * 20, true, F.disc);
  const LAND = 1750;
  const RISE = 2650;
  const WARM: Rgb = [1.6, 0.85, 0.35];
  return (ms) => {
    for (let k = 0; k < N; k++) {
      // Lanterns float up from the ground round the team; the first of them sink onto the allies on LAND, the rest drift away.
      const home = new THREE.Vector3(mid.x + (h(k, 1, 7) - 0.5) * span * 1.2, 0, mid.z + (h(k, 2, 7) - 0.5) * 1.6);
      const born = 150 + h(k, 0, 7) * 600;
      const up = easeOut(clamp((ms - born) / 900));
      const y = env.tall * (0.4 + 1.3 * up + 0.12 * Math.sin(ms * 0.004 + k));
      const p = home.clone().setY(y);
      const ally = k < allies.length ? allies[k]! : null;
      let a = smooth(born, born + 200, ms);
      if (ally) {
        const sink = smooth(LAND - 400, LAND, ms);
        p.lerp(new THREE.Vector3(ally.x, env.tall * 0.6, ally.z + 0.2), sink);
        a *= 1 - smooth(LAND, LAND + 80, ms);
      } else {
        p.y += env.tall * 2 * smooth(RISE - 200, RISE + 500, ms);
        a *= 1 - smooth(RISE, RISE + 400, ms);
      }
      const s = 0.32 + env.tall * 0.1;
      glow.put(k * 3, p.x, p.y, p.z, s * 2.6, WARM[0] * 0.5, WARM[1] * 0.5, WARM[2] * 0.5, a * 0.6);
      glow.look(k * 3, F.soft);
      glow.put(k * 3 + 1, p.x, p.y, p.z + 0.01, s, WARM[0], WARM[1], WARM[2], a);
      glow.look(k * 3 + 1, F.soft, 0, 1.3);
      glow.put(k * 3 + 2, p.x, p.y, p.z + 0.02, s * 0.45, 1.8, 1.5, 0.9, a);
      glow.look(k * 3 + 2, F.soft, 0, 1.3);
      // A dark cap above and below the paper body.
      caps.put(k * 2, p.x, p.y + s * 0.62, p.z + 0.03, s * 0.55, 0.35, 0.12, 0.08, a);
      caps.look(k * 2, F.disc, 0, 0.3);
      caps.put(k * 2 + 1, p.x, p.y - s * 0.62, p.z + 0.03, s * 0.45, 0.35, 0.12, 0.08, a);
      caps.look(k * 2 + 1, F.disc, 0, 0.3);
    }
    glow.flush();
    caps.flush();
    allies.forEach((al, i) => {
      burst(feathers, i * 16, 16, 50 + i, { sec: (ms - LAND) / 1000, at: new THREE.Vector3(al.x, env.tall * 0.6, al.z + 0.2), life: 0.9, speed: 1.6, up: 2, grav: 0.6, drag: 1.4, size: 0.22, color: [1.6, 1.35, 0.6], to: WARM, frame: F.feather, alpha: 0.9 });
      signsUp(signs, i * 20, 10, 60 + i, (ms - LAND - 60) / 1000, al, env.tall, HEAL, 'plus', 0.6);
    });
    feathers.flush();
    signs.flush();
  };
});

export const motherForest = (env: Vfx3dEnv) => handle(env, ({ root, allies, foes, mid, span }) => {
  const vines = [0, 1, 2, 3].map(() => stem(root, 30, LEAF, LEAF_PALE, 3));
  const blooms = quads(root, 4 * 7, false, F.petal);
  const petals = quads(root, Math.round(60 * env.quality), false, F.petal);
  const signs = quads(root, allies.length * 20, true, F.disc);
  const spores = quads(root, Math.round(90 * env.quality), false, F.smoke);
  const HEAL_AT = 1500;
  const POISON_AT = 2100;
  const PINK: Rgb = [1.2, 0.62, 0.85];
  return (ms, sec) => {
    const grow = easeOut(clamp((ms - 200) / 1100));
    const live = 1 - smooth(2800, 3100, ms);
    vines.forEach((v, k) => {
      const side = k % 2 ? 1 : -1;
      const x0 = mid.x + side * span * (0.45 + 0.1 * (k >> 1));
      const z0 = mid.z + (k >> 1 ? 0.6 : -0.8);
      // Each vine grows up from beside the team and arches over it toward the middle.
      v.set((u, out) => out.set(x0 + (mid.x - x0) * 1.5 * u, env.tall * 1.7 * Math.sin(u * Math.PI * 0.85) + 0.05, z0 + (mid.z - z0) * u * 0.5 + 0.1 * Math.sin(u * 7 + sec * 2)), (u) => 0.11 - 0.06 * u, grow, live);
      const tip = new THREE.Vector3(x0 + (mid.x - x0) * 1.5 * 0.55, env.tall * 1.7 * Math.sin(0.55 * Math.PI * 0.85), z0 + (mid.z - z0) * 0.28);
      flower(blooms, k * 7, 6, tip, 0.3 + env.tall * 0.1, easeOutBack(clamp((ms - 1200 - k * 60) / 300)), sec * 0.4, PINK, [1.5, 1.3, 0.5], live * smooth(1200, 1260, ms));
    });
    blooms.flush();
    for (let i = 0; i < petals.n; i++) {
      const a = allies[i % allies.length]!;
      const t = (ms - HEAL_AT + 200 - h(i, 0, 9) * 600) / 700;
      if (t <= 0 || t >= 1) {
        petals.hide(i);
        continue;
      }
      petals.put(i, a.x + (h(i, 1, 9) - 0.5) * 1.4 + 0.3 * Math.sin(t * 6 + i), env.tall * 1.8 * (1 - t), a.z + 0.2, 0.15, PINK[0], PINK[1], PINK[2], smooth(0, 0.1, t) * (1 - smooth(0.8, 1, t)));
      petals.look(i, F.petal, t * 6 + i);
    }
    petals.flush();
    allies.forEach((a, i) => signsUp(signs, i * 20, 10, 70 + i, (ms - HEAL_AT - i * GAP) / 1000, a, env.tall, HEAL, 'plus', 0.9));
    signs.flush();
    // The spores: a violet cloud drifts from the vines over to the foes and hangs on each.
    for (let i = 0; i < spores.n; i++) {
      const f = foes[i % foes.length]!;
      const t = clamp((ms - POISON_AT + 500 - h(i, 0, 11) * 300) / 600);
      const on = ms > POISON_AT - 500 + h(i, 0, 11) * 300 ? 1 : 0;
      const p = new THREE.Vector3(mid.x, env.tall * 1.6, mid.z).lerp(new THREE.Vector3(f.x + (h(i, 1, 11) - 0.5) * 1.1, env.tall * (0.3 + 0.6 * h(i, 2, 11)), f.z), easeOut(t));
      spores.put(i, p.x, p.y, p.z + 0.1, 0.5 + 0.3 * h(i, 3, 11), POISON[0], POISON[1], POISON[2], on * 0.45 * (1 - smooth(POISON_AT + 400, POISON_AT + 800, ms)));
      spores.look(i, F.smoke, h(i, 4, 11) * 6 + sec);
    }
    spores.flush();
  };
});
