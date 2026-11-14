// Parts of the void effects (decision 059): a rift (a jagged tear in space whose inside is night with stars and whose lips burn
// blue on one side and magenta on the other), a void core (a black disc full of stars inside a bright, churning ring: a gate or a
// fist of nothing), a bell of starry sky (translucent, a violet rim, cracks that light up before it breaks), and the fragments space
// breaks into. Void is strange and empty: it pulls in, twists, splits its colours, breaks, then goes quiet. Only violet and blue.
import * as THREE from 'three';
import { F } from './atlas';
import { burst, gather, type Rgb } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import type { Quads } from './quads';

type U = Record<string, { value: number }>;
export const VOID: Rgb = [0.55, 0.49, 1];
export const VOID_HOT: Rgb = [1.2, 1.1, 1.9];
export const NIGHT: Rgb = [0.05, 0.04, 0.12];

/** A plane with the shader `frag` (float uniforms, 0 to start), facing +z, hidden until used. */
function plane(root: THREE.Object3D, frag: string, names: readonly string[], w = 1, hgt = 1, order = 5) {
  const uniforms: Record<string, { value: number }> = {};
  for (const n of names) uniforms[n] = { value: 0 };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: UV_VERT, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), mat);
  mesh.visible = false;
  mesh.renderOrder = order;
  root.add(mesh);
  return { mesh, u: uniforms as U };
}

const STARS = `
float stars(vec2 p, float seed, float t){
  vec2 g=floor(p*26.); float s=step(.982,hash21(g+seed));
  return s*(.55+.45*sin(t*5.+hash21(g+3.1)*30.));
}`;

const RIFT_FRAG = `
${NOISE}${STARS}
varying vec2 vUv; uniform float uOpen, uFade, uT, uSeed;
void main(){
  vec2 p=(vUv-.5)*2.;
  // A jagged line along x, thin at both ends; it opens to a slit of night.
  float jag=(fbm(vec2(p.x*2.6+uSeed,uSeed))-.5)*.55+(vnoise(vec2(p.x*11.+uSeed*3.,1.7))-.5)*.14;
  float taper=max(0.,1.-p.x*p.x);
  float w=uOpen*.24*taper;
  float d=abs(p.y-jag);
  float inside=smoothstep(w,w-.02,d);
  float lip=smoothstep(w+.08,w,d)*(1.-inside)*taper*step(.002,uOpen);
  vec3 col=vec3(.03,.02,.08)+vec3(.9,.85,1.5)*stars(p*vec2(1.,2.),uSeed,uT)+vec3(.12,.06,.3)*fbm(p*3.+uT*.2);
  vec3 fringe=mix(vec3(1.3,.5,1.5),vec3(.55,.75,1.8),step(jag,p.y));
  col=mix(col,fringe,lip);
  gl_FragColor=vec4(col,max(inside,lip*.95)*uFade);
}`;
/** A tear in space on a plane (long along x): `set(open 0..1, fade, sec)`; scale, turn and place the mesh. */
export function rift(root: THREE.Object3D, seed = 0) {
  const { mesh, u } = plane(root, RIFT_FRAG, ['uOpen', 'uFade', 'uT', 'uSeed'], 1, 1, 6);
  u.uSeed!.value = seed * 3.7 + 1;
  return {
    mesh,
    set(open: number, fade: number, sec: number) {
      mesh.visible = fade > 0.01 && open > 0.01;
      u.uOpen!.value = open;
      u.uFade!.value = fade;
      u.uT!.value = sec;
    },
  };
}

const CORE_FRAG = `
${NOISE}${STARS}
varying vec2 vUv; uniform float uFade, uT, uHole, uSpin;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  // A disc of night, a ring that churns round it (it is pulled in: the swirl leans with the spin), a faint wide glow.
  float sw=fbm(vec2(a*2.+uT*uSpin*2.5-r*7.,r*3.+uT*.3));
  float core=smoothstep(uHole+.015,uHole-.015,r);
  float ring=smoothstep(.13,0.,abs(r-uHole-.05-.06*sw))*(.55+.7*sw)*(1.-core);
  float glow=smoothstep(1.,uHole,r)*.3*sw*(1.-core);
  vec3 col=vec3(.03,.02,.07)+vec3(.9,.85,1.5)*stars(p,7.,uT);
  vec3 lit=mix(vec3(.45,.4,1.2),vec3(1.3,1.2,2.),smoothstep(.4,.9,sw));
  col=mix(col,lit,clamp(ring+glow,0.,1.));
  gl_FragColor=vec4(col,clamp(core+ring+glow,0.,1.)*uFade);
}`;
/** A void core (disc of night in a churning ring) on a plane: `set(sec, fade, hole 0..0.8, spin)`. */
export function voidCore(root: THREE.Object3D) {
  const { mesh, u } = plane(root, CORE_FRAG, ['uFade', 'uT', 'uHole', 'uSpin'], 1, 1, 6);
  return {
    mesh,
    set(sec: number, fade: number, hole = 0.35, spin = 1) {
      mesh.visible = fade > 0.01;
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uHole!.value = hole;
      u.uSpin!.value = spin;
    },
  };
}

const BELL_FRAG = `
${NOISE}${STARS}
varying vec2 vUv; uniform float uFade, uT, uCrack, uGlow;
void main(){
  vec2 p=(vUv-.5)*2.; float x=abs(p.x), y=p.y;
  // A bell: narrow shoulders, a waist, a wide flared lip; a round crown.
  float w=.3+.6*pow(clamp((.8-y)/1.8,0.,1.),2.2)+.07*smoothstep(-.78,-.97,y);
  float top=.8+.16*sqrt(max(0.,1.-(x*x)/(.3*.3)));
  float d=min(min(w-x,y+.98),top-y);
  float inside=smoothstep(0.,.02,d);
  float rim=smoothstep(.07,0.,abs(d))+.6*smoothstep(.02,0.,abs(y+.62))*step(x,w);
  float neb=fbm(p*2.2+vec2(uT*.15,0.));
  float crack=smoothstep(.035,0.,abs(fbm(p*3.4+3.)-.5))*uCrack*inside;
  vec3 col=mix(vec3(.08,.05,.22),vec3(.3,.2,.7),neb)+vec3(.9,.85,1.5)*stars(p,2.,uT);
  col=mix(col,vec3(.75,.65,1.6)*(1.+uGlow),clamp(rim,0.,1.));
  col=mix(col,vec3(1.4,1.3,2.),crack);
  float a=inside*(.26+.22*neb)+clamp(rim,0.,1.)*.95*smoothstep(-.02,0.,d+.07);
  gl_FragColor=vec4(col,clamp(max(a,crack),0.,1.)*uFade);
}`;
/** A bell of starry sky on a plane (1 wide, 1.15 tall): `set(sec, fade, crack 0..1, glow 0..1)`. */
export function skyBell(root: THREE.Object3D) {
  const { mesh, u } = plane(root, BELL_FRAG, ['uFade', 'uT', 'uCrack', 'uGlow'], 1, 1.15, 5);
  return {
    mesh,
    set(sec: number, fade: number, crack = 0, glow = 0) {
      mesh.visible = fade > 0.01;
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uCrack!.value = crack;
      u.uGlow!.value = glow;
    },
  };
}

/** Motes of space pulled into `at` (`k` 0..1 how far the pull has come), from `count` additive particles at `from`. */
export function pull(light: Quads, from: number, count: number, seed: number, k: number, at: THREE.Vector3, radius: number) {
  gather(light, from, count, seed, { k, to: at, radius, turns: 1.4, size: 0.15, color: VOID_HOT, frame: F.star, tall: radius * 0.8 });
}

/**
 * Space breaking at `at`, `sec` after: dark fragments with a blue face thrown out slowly and stopping (they hang, then go), and
 * glints. `paint` gives `count` painted particles from `from`; `light` (if given) `lCount` glints from `lFrom`.
 */
export function shatter(paint: Quads, from: number, count: number, light: Quads | null, lFrom: number, lCount: number, seed: number, sec: number, at: THREE.Vector3, power = 1) {
  burst(paint, from, count, seed, { sec, at, life: 0.9, speed: 3.2 * power, up: 1.4 * power, grav: 0, drag: 4, size: 0.24 * Math.sqrt(power), color: [0.16, 0.13, 0.42], to: [0.05, 0.04, 0.14], frame: F.shard, flat: 0.5, shrink: 0.6 });
  if (light) burst(light, lFrom, lCount, seed + 1, { sec, at, life: 0.6, speed: 4 * power, up: 1.2, grav: 0, drag: 3, size: 0.18, color: VOID_HOT, to: VOID, frame: F.star, alpha: 0.9 });
}
