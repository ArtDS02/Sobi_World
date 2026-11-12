// The support Ultimates in 3D (prototype, decision 059): `ult_party`. A great sigil opens under the caster's side, a pillar of light stands on each ally,
// the colour of the skill (`color`) spirals up and stars rain, rings roll out. Used by the water, earth, light and nature Ultimates that heal or shield the team.
// Times are ms from the start of the act: sigil 500–1100, pillars 1300, rain 1500–2800.
import * as THREE from 'three';
import { slots } from './earthParts';
import { clamp, cloud, easeOut, park, rng, ripple, smooth } from './effectParts';
import { glare, sigil } from './lightningParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

export function ultParty(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(401);
  const color = env.color ?? 0xffe9a0;
  const spread = Math.min(2.4, env.unit);
  const ps = slots(env);
  const W = 3 * spread + 1.6;
  const sg = sigil(root);
  sg.mesh.position.set(env.origin.x, 0.05, env.origin.z);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const pillars = ps.map((p) => {
    const g = new THREE.CylinderGeometry(0.45, 0.6, 1, 24, 1, true);
    g.translate(0, 0.5, 0);
    const m = new THREE.Mesh(g, mat);
    m.position.set(p.x, 0, p.z);
    root.add(m);
    return m;
  });
  const spiral = cloud(root, 200, 0.2, color);
  const ss = seeds(spiral.n, rand);
  const stars = cloud(root, 160, 0.24, 0xffffff);
  const ts = seeds(stars.n, rand);
  const rs = ps.map((p) => {
    const r = ripple(root, 3, 2.3, color, 0xffffff);
    r.mesh.position.set(p.x, 0.02, p.z);
    return r;
  });
  const wave = ripple(root, 7, 5, color, 0xffffff);
  wave.mesh.position.set(env.origin.x, 0.02, env.origin.z);
  const glints = ps.map(() => glare(root, color));
  return {
    update(ms) {
      const g = easeOut(clamp((ms - 500) / 600));
      sg.set(W * g + 0.4, W * 0.7 * g + 0.3, ms / 1000, smooth(500, 700, ms) * (1 - smooth(2600, 3050, ms)));
      mat.opacity = 0.5 * smooth(1300, 1420, ms) * (1 - smooth(2100, 2600, ms));
      pillars.forEach((m, i) => {
        const u = easeOut(clamp((ms - 1300 - i * 90) / 260));
        m.scale.set(1, Math.max(0.001, 4.2 * u), 1);
        m.visible = mat.opacity > 0.01;
      });
      for (let i = 0; i < spiral.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const p = ps[i % 3]!;
        const age = ms - (1350 + b * 900);
        if (age < 0 || age > 1100) park(spiral, i);
        else {
          const k = age / 1100;
          spiral.pos.setXYZ(i, p.x + Math.cos(ph + k * 9) * (0.7 - k * 0.4), 0.1 + k * 3.4, p.z + Math.sin(ph + k * 9) * 0.45 + jx * 0.05 + jy * 0.05);
        }
      }
      spiral.pos.needsUpdate = true;
      (spiral.pts.material as THREE.PointsMaterial).opacity = 0.9;
      for (let i = 0; i < stars.n; i++) {
        const [b, jx, jy, ph] = ts[i]!;
        const age = ms - (1500 + b * 1200);
        if (age < 0 || age > 900) park(stars, i);
        else stars.pos.setXYZ(i, env.origin.x + (b - 0.5) * (2 * spread + 1.4) + jx * 0.3, 3.8 - (age / 900) * 3.4, env.origin.z + jy * 1.2 + (ph - 3) * 0.1);
      }
      stars.pos.needsUpdate = true;
      (stars.pts.material as THREE.PointsMaterial).opacity = 0.9;
      ps.forEach((p, i) => {
        const t = (ms - 1300 - i * 90) / 1000;
        rs[i]!.set(t, smooth(0, 0.07, t) * (1 - smooth(0.4, 0.9, t)));
        glints[i]!(new THREE.Vector3(p.x, 0.7, p.z), t, 3.6);
      });
      const tw = (ms - 1500) / 1000;
      wave.set(tw, smooth(0, 0.06, tw) * (1 - smooth(0.5, 1, tw)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
