// The two fire Ultimates in 3D (prototype, decision 059). `forge_ult` (Lò Rèn Nguyên Thủy): an anvil drops to the middle of the foes' row and
// a hammer of fire strikes it three times, each blow rolling a fire ring and geysers over the row, sparks lifting over the caster's side
// (the attack-up). `phoenix_rebirth` (Phượng Hoàng Tái Sinh): a phoenix of flame circles, dives through the row, rises as a great ghost
// bird and returns over the caster's side shedding feathers (the revive). Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, easeInOut, easeOut, rng, ripple, smooth } from './effectParts';
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

const FEATHER_VERT = `
varying vec2 vUv; uniform float uT, uWave;
void main(){ vUv=uv; vec3 p=position; p.z+=sin(p.x*3.-uT*8.)*uWave*(p.x*.5); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`;
const FEATHER_FRAG = `
varying vec2 vUv; uniform float uFade, uT;
void main(){
  float k=vUv.x;
  vec3 col=mix(vec3(1.,.97,.65),vec3(1.,.5,.1),smoothstep(0.,.45,k)); col=mix(col,vec3(.85,.12,.04),smoothstep(.45,1.,k));
  float edge=smoothstep(0.,.25,vUv.y)*smoothstep(1.,.75,vUv.y);
  float fl=.8+.2*sin(k*14.-uT*9.);
  gl_FragColor=vec4(col,edge*(1.-smoothstep(.75,1.,k))*fl*uFade);
}`;

/** One feather of flame, root at the origin, running along +x, tapering to a curled tip. */
function feather(len: number, width: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(len, width, 10, 1);
  geo.translate(len / 2, 0, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / len;
    pos.setY(i, pos.getY(i) * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.05))) * (1 - 0.55 * u) + u * u * 0.18 * len * 0.3);
  }
  return new THREE.Mesh(geo, mat);
}

/** A phoenix facing the stage, wings spread left and right (a fan of feathers each) and flapping, a crest, three tail streamers below. */
function bird() {
  const g = new THREE.Group();
  const mk = (wave: number) =>
    new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 1 }, uWave: { value: wave } }, vertexShader: FEATHER_VERT, fragmentShader: FEATHER_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const wingMat = mk(0.04);
  const tailMat = mk(0.5);
  const wings = [1, -1].map((side) => {
    const w = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const f = feather(1.0 + 0.95 * (1 - i / 7) ** 0.7, 0.34, wingMat);
      f.rotation.z = 0.05 + i * 0.2;
      w.add(f);
    }
    w.scale.x = side;
    w.position.set(side * 0.2, 0.25, 0);
    g.add(w);
    return w;
  });
  for (const a of [-0.3, 0, 0.3]) {
    const t = feather(1.9 - Math.abs(a) * 1.2, 0.36, tailMat);
    t.rotation.z = -Math.PI / 2 + a;
    t.position.set(0, -0.35, -0.05);
    g.add(t);
  }
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffd070, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), bodyMat);
  body.scale.set(0.8, 1.5, 0.8);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), bodyMat);
  head.position.set(0, 0.85, 0.05);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 8), bodyMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.8, 0.32);
  g.add(body, head, beak);
  for (const a of [-0.35, 0, 0.35]) {
    const c = feather(0.55, 0.14, tailMat);
    c.rotation.z = Math.PI / 2 + a;
    c.position.set(0, 1.0, 0);
    g.add(c);
  }
  return {
    g,
    pose(ms: number, fade: number) {
      const flap = Math.sin(ms * 0.013) * 0.55;
      for (const w of wings) w.rotation.z = 0.1 + flap;
      for (const m of [wingMat, tailMat]) {
        (m.uniforms as Record<string, { value: number }>).uT!.value = ms / 1000;
        (m.uniforms as Record<string, { value: number }>).uFade!.value = fade;
      }
      bodyMat.opacity = fade;
    },
  };
}

export function phoenixRebirth(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(89);
  const row = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const home = new THREE.Vector3(env.from.x, 0, env.from.z);
  const dir = row.x >= home.x ? 1 : -1;
  const mid = new THREE.Vector3().lerpVectors(home, row, 0.5);
  // The flight: circles over the stage, dives through the row, climbs away, then glides back over the caster's side.
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(home.x + dir * 0.4, 1.6, home.z), new THREE.Vector3(mid.x, 3.0, mid.z - 1.0), new THREE.Vector3(row.x + dir * 1.8, 3.4, row.z - 0.4),
    new THREE.Vector3(row.x + dir * 0.5, 2.2, row.z + 1.0), new THREE.Vector3(mid.x, 3.1, mid.z + 0.8), new THREE.Vector3(row.x - dir * 1.6, 2.6, row.z),
    new THREE.Vector3(row.x, 0.8, row.z), new THREE.Vector3(row.x + dir * 1.9, 1.7, row.z + 0.2), new THREE.Vector3(mid.x, 3.4, mid.z), new THREE.Vector3(home.x + dir * 0.2, 2.0, home.z),
  ]);
  const main = bird();
  const ghost = bird();
  root.add(main.g, ghost.g);
  const feathers = fireCloud(root, 140, 0.22);
  const fseed = seeds4(140, rand);
  const at = (t: number) => path.getPoint(easeInOut(clamp((t - 500) / 1900)) * 0.999);
  const spots = [-0.6, 0, 0.6].map((k) => k * Math.min(2.4, env.unit));
  const burst = fireCloud(root, 120, 0.24);
  const bs = seeds4(120, rand);
  const ring = ripple(root, 4.4, 3.4, 0xff7a2a, 0xfff0b0);
  ring.mesh.position.set(row.x, 0.02, row.z);
  const col = spots.map(() => flameColumn(root));
  col.forEach((c, i) => c.mesh.position.set(row.x + spots[i]!, 0, row.z));
  const rise = fireCloud(root, 80, 0.2);
  const rs = seeds4(80, rand);
  const tmp = new THREE.Vector3();
  return {
    update(ms) {
      const k = clamp((ms - 500) / 1900);
      const p = at(ms);
      main.g.visible = ms > 480 && ms < 2950;
      main.g.position.copy(p);
      const q = path.getTangent(easeInOut(k) * 0.999);
      main.g.rotation.set(0, 0, -q.x * 0.1);
      main.g.scale.setScalar(0.95);
      main.pose(ms, smooth(480, 640, ms) * (1 - smooth(2650, 2950, ms)));
      // A great ghost phoenix rises over the row after the dive.
      const g = clamp((ms - 1900) / 900);
      ghost.g.visible = g > 0 && ms < 2900;
      ghost.g.position.set(row.x, 1.2 + 1.4 * easeOut(g), row.z - 0.2);
      ghost.g.scale.setScalar(0.8 + 1.0 * easeOut(g));
      ghost.g.rotation.set(0, 0, 0);
      ghost.pose(ms - 1900, 0.75 * smooth(0, 0.2, g) * (1 - smooth(0.6, 1, g)));
      trail(feathers, fseed, ms, 600, 2500, 900, (t) => at(t), -0.5, 0.35);
      const hit = ms - 1500;
      for (let i = 0; i < burst.n; i++) {
        const [a, vh, vy, d] = bs[i]!;
        const t = hit / 1000 - d * 0.3;
        if (t <= 0 || t > 1) burst.hide(i);
        else {
          const ang = (a + 0.5) * 12.566;
          burst.put(i, row.x + Math.cos(ang) * (vh + 0.6) * t * 2.2, Math.max(0.05, (vy + 1.5) * t * 3.2 - 4.9 * t * t), row.z + Math.sin(ang) * (vh + 0.6) * t * 1.2, t);
        }
      }
      burst.flush();
      ring.set(hit / 1000, hit > 0 ? smooth(0, 80, hit) * (1 - smooth(500, 1100, hit)) : 0);
      col.forEach((c, i) => {
        const e = ms - (1500 + i * 90);
        c.set(0.42, 2.2 * easeOut(clamp(e / 280)), ms / 1000, e > 0 ? smooth(0, 60, e) * (1 - smooth(350, 750, e)) : 0);
      });
      trail(rise, rs, ms, 2400, 2900, 800, () => tmp.set(home.x, 0.2, home.z), 1.4, 0.8);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
