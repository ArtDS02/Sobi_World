// A fire Ultimate in 3D (prototype, decision 059; the phoenix is in phoenixFx.ts). `forge_ult` (Lò Rèn Nguyên Thủy): an anvil drops to the middle of the foes' row and
// a hammer of fire strikes it three times, each blow rolling a fire ring and geysers over the row, sparks lifting over the caster's side
// (the attack-up). `phoenix_rebirth` (Phượng Hoàng Tái Sinh): a phoenix of flame circles, dives through the row, rises as a great ghost
// bird and returns over the caster's side shedding feathers (the revive). Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, easeOut, rng, ripple, smooth } from './effectParts';
import { fireCloud, flameColumn, forgeAnvil, forgeHammer, lavaPool, seeds4, trail } from './fireParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const BLOWS = [1200, 1650, 2100] as const;

export function forgeUlt(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  root.position.set(env.origin.x, 0, env.origin.z);
  env.scene.add(root);
  const rand = rng(81);
  const fa = forgeAnvil();
  const fh = forgeHammer();
  const anvil = fa.g;
  const hammer = fh.g;
  root.add(anvil, hammer);
  const fountain = BLOWS.map(() => fireCloud(root, 90, 0.2));
  const fseed = seeds4(90, rand);
  const rings = BLOWS.map((_, i) => {
    const r = ripple(root, 3.4 + i * 0.9, 2.6 + i * 0.7, 0xff5a1a, 0xffe0a0);
    r.mesh.position.y = 0.02;
    return r;
  });
  const spots = [-0.6, 0, 0.6].map((k) => k * Math.min(2.4, env.unit));
  const geysers = spots.map(() => flameColumn(root));
  geysers.forEach((g, i) => g.mesh.position.set(spots[i]!, 0, (i - 1) * 0.15));
  const lava = lavaPool(root);
  const buff = fireCloud(root, 70, 0.2);
  const bseed = seeds4(70, rand);
  const mine = new THREE.Vector3(env.from.x - env.origin.x, 0, env.from.z - env.origin.z);

  return {
    update(ms) {
      // Anvil: drops in from above and sits at the middle of the row.
      const drop = easeOut(clamp((ms - 500) / 380));
      anvil.position.y = 3.2 * (1 - drop);
      const flash = Math.max(...BLOWS.map((t) => Math.exp(-Math.max(0, ms - t) / 300) * (ms > t ? 1 : 0)));
      const vis = smooth(500, 600, ms) * (1 - smooth(2900, 3200, ms));
      fa.iron.opacity = vis;
      fa.glow.opacity = vis * (0.25 + 0.75 * flash);
      // Hammer: hangs raised at the right, swings down onto the anvil before each blow, lifts again.
      let swing = 0;
      for (const t of BLOWS) swing = Math.max(swing, ms < t ? smooth(t - 170, t, ms) : 1 - smooth(t, t + 260, ms));
      hammer.visible = ms > 650 && ms < 3000;
      hammer.position.set(0.9 - swing * 0.9, 1.7 - swing * 1.55 + 0.1 * Math.sin(ms * 0.004), 0);
      hammer.rotation.z = -0.8 * (1 - swing);
      const hv = smooth(650, 800, ms) * (1 - smooth(2800, 3000, ms));
      fh.iron.opacity = hv;
      fh.glow.opacity = hv * (0.45 + 0.55 * swing);
      BLOWS.forEach((t, i) => {
        const s = ms - t;
        const f = fountain[i]!;
        for (let k = 0; k < f.n; k++) {
          const [b, jx, jy, jz] = fseed[k]!;
          const tt = s / 1000 - b * 0.1;
          if (tt <= 0 || tt > 0.9) f.hide(k);
          else f.put(k, jx * 2.4 * tt * (1 + i * 0.5), 1.15 + Math.max(0, (2.5 + jy * 3 + i) * tt - 4.9 * tt * tt), jz * 1.6 * tt, tt / 0.9);
        }
        f.flush();
        rings[i]!.set(s / 1000, s > 0 ? smooth(0, 70, s) * (1 - smooth(500, 1100, s)) : 0);
      });
      geysers.forEach((g, i) => {
        const e = ms - (BLOWS[2] + i * 60);
        g.set(0.4 + 0.15 * easeOut(clamp(e / 300)), 2.4 * easeOut(clamp(e / 260)), ms / 1000, e > 0 ? smooth(0, 60, e) * (1 - smooth(400, 800, e)) : 0);
      });
      const le = ms - BLOWS[1];
      const lg = easeOut(clamp(le / 500));
      lava.set(3.2 * lg * Math.min(1.4, env.unit + 0.4), 2.2 * lg * Math.min(1.4, env.unit + 0.4), ms / 1000, le > 0 ? smooth(0, 150, le) * (1 - smooth(1200, 1700, le)) : 0);
      // The team's attack-up: sparks of the forge rising over the caster's side.
      trail(buff, bseed, ms, 2500, 2950, 700, () => new THREE.Vector3(mine.x, 0.2, mine.z), 1.3, 0.9);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
