// Water bubbles in 3D (prototype, decision 059). `bubble_shot` (Bong Bóng Nước): a bubble swells at the caster, floats over in an arc,
// wraps the target and pops in a crown of drops. `bubble_spray` (Phun Bọt): three small bubbles blown one after another that pop on arrival.
// Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, cloud, easeInOut, easeOutBack, park, rng, ripple, smooth } from './effectParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const BUBBLE_VERT = `
varying vec3 vN; varying vec3 vV;
void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const BUBBLE_FRAG = `
varying vec3 vN; varying vec3 vV; uniform float uFade;
void main(){
  float f=pow(1.-clamp(dot(normalize(vN),normalize(vV)),0.,1.),2.2);
  vec3 irid=mix(vec3(.45,.85,1.),vec3(.95,.7,1.),clamp(vN.y*.5+.5+vN.x*.25,0.,1.));
  float hl=smoothstep(.86,.97,dot(normalize(vN),normalize(vec3(-.4,.7,.6))));
  vec3 col=irid*(.75+f*.6)+hl;
  float al=(.24+f*.7+hl*.8)*uFade;
  gl_FragColor=vec4(col,al);
}`;

interface Flight {
  /** Swells at the caster from `inflate` for `grow` ms, flies from `start` for `fly` ms. */
  inflate: number;
  grow: number;
  start: number;
  fly: number;
  radius: number;
  arc: number;
  /** Pops on arrival (`bubble_spray`), or after wrapping the target until `popAt` (`bubble_shot`). */
  popAt: number;
  engulf: number;
}

function bubbles(env: Vfx3dEnv, flights: Flight[], splashAt: number): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(11);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const hand = new THREE.Vector3(env.from.x + dir * 0.45, 0.62, env.from.z);
  const goal = new THREE.Vector3(env.origin.x, 0.55, env.origin.z);
  const geo = new THREE.SphereGeometry(1, 32, 24);
  const items = flights.map((f) => {
    const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 } }, vertexShader: BUBBLE_VERT, fragmentShader: BUBBLE_FRAG, transparent: true, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    root.add(m);
    return { f, m, mat, off: new THREE.Vector3((rand() - 0.5) * 0.4, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.4) };
  });
  const drops = items.map(() => ({ c: cloud(root, 36, 0.14, 0xe6fbff), seed: Array.from({ length: 36 }, () => [rand() * 6.2832, 0.8 + rand() * 1.6, 1.4 + rand() * 2.6] as const) }));
  const splash = ripple(root, 2.2 * env.unit * 0.6 + 1.2, 1.4 * env.unit * 0.6 + 0.8, 0x2a9bff, 0xe8fbff);

  return {
    update(ms: number) {
      items.forEach(({ f, m, mat, off }, bi) => {
        const popT = f.engulf > 0 ? f.popAt : f.start + f.fly;
        const a = ms - f.inflate;
        const fl = (ms - f.start) / f.fly;
        let r: number;
        const pos = new THREE.Vector3();
        const alive = ms >= f.inflate && ms < popT;
        if (ms < f.start) {
          // Swelling at the caster's hand, wobbling.
          r = f.radius * easeOutBack(clamp(a / f.grow));
          pos.copy(hand);
        } else if (fl < 1) {
          const e = easeInOut(clamp(fl));
          pos.lerpVectors(hand, goal, e);
          pos.add(off.clone().multiplyScalar(Math.sin(Math.PI * e)));
          pos.y += Math.sin(Math.PI * e) * f.arc;
          r = f.radius;
        } else {
          // Wrapped around the target.
          const w = f.engulf > 0 ? smooth(0, f.engulf, ms - (f.start + f.fly)) : 0;
          pos.copy(goal);
          r = f.radius * (1 + w * 1.3);
        }
        const wob = 1 + 0.06 * Math.sin(ms * 0.02 + bi);
        m.visible = alive && r > 0.001;
        m.position.copy(pos);
        m.scale.set(r * wob, r / wob, r * wob);
        mat.uniforms.uFade!.value = ms > f.start + f.fly && f.engulf > 0 ? 0.55 : 1;
        // The shell breaks into drops.
        const d = drops[bi]!;
        const pt = (ms - popT) / 1000;
        for (let i = 0; i < d.c.n; i++) {
          const [ang, vh, vy] = d.seed[i]!;
          if (pt <= 0 || pt > 1.1) {
            park(d.c, i);
            continue;
          }
          const rr = r > 0 ? r : f.radius * (1 + (f.engulf > 0 ? 1.5 : 0));
          d.c.pos.setXYZ(i, goal.x + Math.cos(ang) * (rr + vh * pt * 0.7), goal.y + vy * pt - 4.9 * pt * pt, goal.z + Math.sin(ang) * (rr + vh * pt * 0.7) * 0.8);
        }
        (d.c.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(0.6, 1.1, pt));
        d.c.pts.visible = pt > 0;
      });
      splash.mesh.position.set(goal.x, 0.02, goal.z);
      splash.set((ms - splashAt) / 1000, smooth(0, 100, ms - splashAt) * (1 - smooth(500, 1100, ms - splashAt)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

/** Bong Bóng Nước: one big bubble (ms: swell 0–300, fly 300–720, wrap, pop at 860). */
export const bubbleShot = (env: Vfx3dEnv) => bubbles(env, [{ inflate: 0, grow: 300, start: 300, fly: 420, radius: 0.62, arc: 1.0, popAt: 860, engulf: 140 }], 860);
/** Phun Bọt: three small bubbles one after another, each popping on arrival. */
export const bubbleSpray = (env: Vfx3dEnv) =>
  bubbles(env, [
    { inflate: 250, grow: 70, start: 320, fly: 400, radius: 0.3, arc: 0.5, popAt: 0, engulf: 0 },
    { inflate: 330, grow: 70, start: 400, fly: 380, radius: 0.38, arc: 0.6, popAt: 0, engulf: 0 },
    { inflate: 410, grow: 70, start: 480, fly: 360, radius: 0.48, arc: 0.7, popAt: 0, engulf: 0 },
  ], 820);
