// Support effects in 3D for skills without an element (prototype, decision 059). They take the act's `color` (each stat or purpose has its own)
// and spread over three spots when the act is over a whole side (`env.row`). `heal_bloom`: crosses rise and a green ring opens. `buff_up`: chevrons
// climb in a column. `shield_dome`: a hexagon-patterned dome closes. `cleanse`: white sparks lift and a clean ring runs out. `mp_channel`: blue orbs
// flow from the caster to the ally. `doom_mark`: a dark seal and a ring that contracts. Times are ms from the start of the act.
import * as THREE from 'three';
import { slots } from './earthParts';
import { clamp, cloud, easeOut, easeOutBack, park, rng, ripple, smooth, sprite } from './effectParts';
import { glare, sigil } from './lightningParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

/** Where the effect stands: one spot for a unit, three across a row. */
export const places = (env: Vfx3dEnv): THREE.Vector3[] => (env.row ? slots(env) : [new THREE.Vector3(env.origin.x, 0, env.origin.z)]);
const tex = (draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  draw(c.getContext('2d')!);
  return new THREE.CanvasTexture(c);
};
let plusT: THREE.CanvasTexture | null = null;
let chevT: THREE.CanvasTexture | null = null;
const plusTex = () => (plusT ??= tex((g) => { g.fillStyle = '#fff'; g.fillRect(24, 6, 16, 52); g.fillRect(6, 24, 52, 16); }));
const chevTex = () => (chevT ??= tex((g) => { g.strokeStyle = '#fff'; g.lineWidth = 11; g.lineJoin = 'round'; g.beginPath(); g.moveTo(10, 44); g.lineTo(32, 18); g.lineTo(54, 44); g.stroke(); }));

/** `n` sprites rising round each place from `t0`, living `life` ms; `fn` may shape their sideways path. */
function risers(root: THREE.Object3D, n: number, size: number, color: number, map: THREE.Texture, seed: number) {
  const c = cloud(root, n, size, color, true, 0.95, map);
  const sd = seeds(n, rng(seed));
  return (ms: number, ps: THREE.Vector3[], t0: number, life: number, h: number, r: number) => {
    for (let i = 0; i < n; i++) {
      const [b, jx, , ph] = sd[i]!;
      const p = ps[i % ps.length]!;
      const age = ms - (t0 + b * life * 0.6);
      if (age < 0 || age > life) {
        park(c, i);
        continue;
      }
      const k = age / life;
      c.pos.setXYZ(i, p.x + Math.cos(ph + k * 3) * r * (0.5 + Math.abs(jx)), 0.1 + k * h, p.z + Math.sin(ph + k * 3) * r * 0.5);
    }
    c.pos.needsUpdate = true;
    (c.pts.material as THREE.PointsMaterial).opacity = 0.95;
  };
}

function ringsAt(root: THREE.Object3D, ps: THREE.Vector3[], color: number, w = 2.2) {
  return ps.map((p) => {
    const r = ripple(root, w, w * 0.8, color, 0xffffff);
    r.mesh.position.set(p.x, 0.02, p.z);
    return r;
  });
}
const ringStep = (rs: ReturnType<typeof ringsAt>, ms: number, t0: number, stagger = 0) =>
  rs.forEach((r, i) => {
    const t = (ms - t0 - i * stagger) / 1000;
    r.set(t, smooth(0, 0.07, t) * (1 - smooth(0.4, 0.9, t)));
  });

export function healBloom(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0x8ff0b0;
  const ps = places(env);
  const plus = risers(root, 40 * ps.length, 0.34, color, plusTex(), 301);
  const sparks = risers(root, 50 * ps.length, 0.14, 0xffffff, sprite(), 302);
  const rs = ringsAt(root, ps, color, 2 + ps.length * 0.4);
  const glints = ps.map(() => glare(root, color));
  return {
    update(ms) {
      plus(ms, ps, 250, 800, 1.9, 0.5 * Math.min(2, env.unit + 0.6));
      sparks(ms, ps, 300, 700, 1.5, 0.7 * Math.min(2, env.unit + 0.6));
      ringStep(rs, ms, 350, 60);
      ps.forEach((p, i) => glints[i]!(new THREE.Vector3(p.x, 0.6, p.z), (ms - 350 - i * 60) / 1000, 2.2));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function buffUp(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0xffd66a;
  const ps = places(env);
  const chev = risers(root, 30 * ps.length, 0.36, color, chevTex(), 311);
  const motes = risers(root, 40 * ps.length, 0.12, 0xffffff, sprite(), 312);
  const rs = ringsAt(root, ps, color, 1.8 + ps.length * 0.3);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const columns = ps.map((p) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1, 20, 1, true), mat);
    m.position.set(p.x, 0, p.z);
    root.add(m);
    return m;
  });
  return {
    update(ms) {
      chev(ms, ps, 250, 800, 2.1, 0.55);
      motes(ms, ps, 300, 700, 1.6, 0.6);
      ringStep(rs, ms, 300, 60);
      const u = clamp((ms - 250) / 300);
      mat.opacity = 0.35 * smooth(250, 330, ms) * (1 - smooth(650, 1000, ms));
      columns.forEach((m) => {
        m.scale.set(1, Math.max(0.001, 2 * easeOut(u)), 1);
        m.position.y = easeOut(u);
        m.visible = mat.opacity > 0.01;
      });
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

const DOME_VERT = 'varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }';
const DOME_FRAG = `
varying vec3 vN; varying vec3 vV; uniform float uFade, uT; uniform vec3 uCol;
void main(){
  float f=pow(1.-clamp(dot(normalize(vN),normalize(vV)),0.,1.),2.);
  float hex=.5+.5*sin(vN.x*13.+uT*2.)*sin(vN.y*13.-uT*1.6);
  vec3 col=mix(uCol,vec3(1.),f*.6)+hex*.1;
  gl_FragColor=vec4(col,(.14+f*.65+hex*.05)*uFade);
}`;

export function shieldDome(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0xffd66a;
  const ps = places(env);
  const R = env.row ? 0.95 : Math.min(1.1, 0.5 + env.unit * 0.5);
  const domes = ps.map((p) => {
    const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 }, uT: { value: 0 }, uCol: { value: new THREE.Color(color) } }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
    m.position.set(p.x, 0.55, p.z);
    root.add(m);
    return { m, mat };
  });
  const rs = ringsAt(root, ps, color, 2);
  const glints = ps.map(() => glare(root, color));
  return {
    update(ms) {
      domes.forEach(({ m, mat }, i) => {
        const t0 = 250 + i * 70;
        m.scale.setScalar(Math.max(0.001, R * easeOutBack(clamp((ms - t0) / 380))));
        const u = mat.uniforms as Record<string, { value: number }>;
        u.uFade!.value = smooth(t0, t0 + 100, ms) * (1 - smooth(900, 1250, ms));
        u.uT!.value = ms / 1000;
        m.visible = u.uFade!.value > 0.01;
        glints[i]!(new THREE.Vector3(ps[i]!.x, 0.6, ps[i]!.z), (ms - t0 - 150) / 1000, 2.4);
      });
      ringStep(rs, ms, 330, 70);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function cleanse(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0xe8f4ff;
  const ps = places(env);
  const motes = risers(root, 70 * ps.length, 0.16, 0xffffff, sprite(), 321);
  const stars = risers(root, 20 * ps.length, 0.3, color, chevTex(), 322);
  const rs = ringsAt(root, ps, color, 2.4);
  const rs2 = ringsAt(root, ps, 0xffffff, 3.4);
  const glints = ps.map(() => glare(root, 0xffffff));
  return {
    update(ms) {
      motes(ms, ps, 250, 800, 2.2, 0.6 * Math.min(2, env.unit + 0.6));
      stars(ms, ps, 300, 700, 1.8, 0.5);
      ringStep(rs, ms, 350, 60);
      ringStep(rs2, ms, 480, 60);
      ps.forEach((p, i) => glints[i]!(new THREE.Vector3(p.x, 0.7, p.z), (ms - 380 - i * 60) / 1000, 3));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function mpChannel(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0x6fc4ff;
  const from = new THREE.Vector3(env.from.x, 0.9, env.from.z);
  const to = new THREE.Vector3(env.origin.x, 0.8, env.origin.z);
  const orbs = cloud(root, 60, 0.3, color);
  const sd = seeds(orbs.n, rng(331));
  const rs = ringsAt(root, [new THREE.Vector3(to.x, 0, to.z)], color, 2.2);
  const mine = ringsAt(root, [new THREE.Vector3(from.x, 0, from.z)], color, 1.8);
  const glint = glare(root, color);
  return {
    update(ms) {
      for (let i = 0; i < orbs.n; i++) {
        const [b, jx, jy] = sd[i]!;
        const age = ms - (200 + b * 500);
        if (age < 0 || age > 450) {
          park(orbs, i);
          continue;
        }
        const k = easeOut(age / 450);
        orbs.pos.setXYZ(i, from.x + (to.x - from.x) * k + jx * 0.3 * Math.sin(Math.PI * k), from.y + (to.y - from.y) * k + Math.sin(Math.PI * k) * 0.7 + jy * 0.3, from.z + (to.z - from.z) * k);
      }
      orbs.pos.needsUpdate = true;
      ringStep(mine, ms, 200);
      ringStep(rs, ms, 650);
      glint(to, (ms - 650) / 1000, 2.6);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function doomMark(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const color = env.color ?? 0xa04ad0;
  const goal = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const sg = sigil(root);
  sg.mesh.position.set(goal.x, 0.04, goal.z);
  const mark = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 28), new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const cross = [0, 1].map((k) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.05), mark.material);
    m.rotation.z = Math.PI / 4 + (k ? Math.PI / 2 : 0);
    mark.add(m);
    return m;
  });
  void cross;
  mark.position.set(goal.x, 1.6, goal.z);
  root.add(mark);
  const fog = cloud(root, 60, 0.8, 0x3a1a5a, false, 0.5);
  const fs = seeds(fog.n, rng(341));
  const rs = ringsAt(root, [goal], color, 3.2);
  return {
    update(ms) {
      const g = easeOut(clamp((ms - 200) / 500));
      sg.set(2.2 * g + 0.2, 1.6 * g + 0.15, ms / 1000, smooth(200, 400, ms) * (1 - smooth(1250, 1450, ms)));
      const k = clamp((ms - 450) / 350);
      mark.scale.setScalar(Math.max(0.001, (1.6 - 0.8 * easeOut(k)) * smooth(300, 480, ms)));
      mark.rotation.z = ms * 0.004;
      (mark.material as THREE.Material).opacity = smooth(300, 480, ms) * (1 - smooth(1100, 1400, ms));
      mark.position.y = 1.6 - 0.6 * easeOut(k);
      for (let i = 0; i < fog.n; i++) {
        const [b, jx, jy, ph] = fs[i]!;
        const t = (ms - 300) / 1200 - b * 0.1;
        if (t <= 0 || t > 1) park(fog, i);
        else fog.pos.setXYZ(i, goal.x + Math.cos(ph + t * 2) * (0.3 + b) * 1.1, 0.2 + t * 1.1 + jy * 0.4, goal.z + Math.sin(ph + t * 2) * 0.6 + jx * 0.2);
      }
      fog.pos.needsUpdate = true;
      (fog.pts.material as THREE.PointsMaterial).opacity = 0.5 * smooth(0, 0.1, (ms - 300) / 1200) * (1 - smooth(0.6, 1, (ms - 300) / 1200));
      ringStep(rs, ms, 700);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
