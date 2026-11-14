// Parts of the dark effects (decision 059): a body of murk (ink-black with a violet edge, its outline eaten by slow noise), an eye
// that opens, a maw of shadow with teeth, a net of night threads with stars at its knots, and the motes dark leaves behind.
// Dark is painted, never lit: it covers what is behind it, moves slowly, and its only light is a thin violet rim.
import * as THREE from 'three';
import { F } from './atlas';
import { burst, h, rise, type Rgb } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import type { Quads } from './quads';

type U = Record<string, { value: number }>;
export const INK: Rgb = [0.07, 0.05, 0.13];
export const VIOLET: Rgb = [0.5, 0.32, 0.86];
export const PALE: Rgb = [0.86, 0.74, 1];

/** A plane with the shader `frag` (its uniforms all floats, 0 to start), facing +z, hidden until used. */
function plane(root: THREE.Object3D, frag: string, names: readonly string[], order = 5) {
  const uniforms: Record<string, { value: number }> = {};
  for (const n of names) uniforms[n] = { value: 0 };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: UV_VERT, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  mesh.renderOrder = order;
  root.add(mesh);
  return { mesh, u: uniforms as U };
}

const MURK_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uT, uFade, uGrow, uSeed;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p);
  float n=fbm(p*2.4+vec2(uSeed,-uT*.5));
  float n2=fbm(p*5.2+vec2(-uT*.35,uSeed*2.));
  float d=uGrow-r+(n-.5)*.7+(n2-.5)*.24;
  float body=smoothstep(0.,.14,d);
  // A violet edge, ink inside, a faint swirl of lighter murk turning in the middle.
  vec3 col=mix(vec3(.5,.3,.86),vec3(.07,.05,.13),smoothstep(.03,.3,d));
  col+=vec3(.16,.1,.3)*smoothstep(.55,.75,fbm(p*3.+vec2(uT*.3,uT*.2)))*smoothstep(.2,.5,d);
  gl_FragColor=vec4(col,body*uFade);
}`;
/** A body of murk on a plane: `set(sec, fade, grow 0..1)`; scale and place the mesh. */
export function murk(root: THREE.Object3D, seed = 0, order = 4) {
  const { mesh, u } = plane(root, MURK_FRAG, ['uT', 'uFade', 'uGrow', 'uSeed'], order);
  u.uSeed!.value = seed * 2.3;
  return {
    mesh,
    set(sec: number, fade: number, grow = 1) {
      mesh.visible = fade > 0.01 && grow > 0.02;
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uGrow!.value = grow;
    },
  };
}

const EYE_FRAG = `
varying vec2 vUv; uniform float uOpen, uFade, uLook, uT;
void main(){
  vec2 p=(vUv-.5)*vec2(2.,2.);
  // An almond between two lids; the lids are a dark, lashless band with a pale inner edge.
  float lid=uOpen*(1.-p.x*p.x)*.78;
  float inside=smoothstep(.0,.05,lid-abs(p.y));
  float band=smoothstep(.2,.0,abs(lid-abs(p.y)))*step(abs(p.x),.98)*smoothstep(0.,.2,uOpen+.15);
  vec2 c=p-vec2(uLook*.3,0.);
  float iris=smoothstep(.46,.42,length(c));
  float ring=smoothstep(.06,0.,abs(length(c)-.4));
  float pupil=smoothstep(.02,0.,length(c/vec2(.09+.03*sin(uT*3.),.36))-1.);
  float glint=smoothstep(.07,.03,length(c-vec2(-.14,.16)));
  vec3 col=vec3(.1,.06,.17);
  col=mix(col,mix(vec3(.75,.5,1.15),vec3(.36,.16,.7),smoothstep(.1,.42,length(c))),iris);
  col=mix(col,vec3(.03,.02,.06),pupil*iris);
  col+=vec3(.9,.8,1.2)*ring*.5*iris+vec3(1.3)*glint*iris;
  col=mix(vec3(.05,.03,.1),col,inside);
  col+=vec3(.6,.42,.95)*smoothstep(.08,0.,abs(lid-abs(p.y)))*step(abs(p.x),.98)*.9;
  gl_FragColor=vec4(col,clamp(inside+band,0.,1.)*uFade);
}`;
/** An eye on a plane (twice as wide as tall): `set(open 0..1, fade, look −1..1, sec)`. */
export function eye(root: THREE.Object3D) {
  const { mesh, u } = plane(root, EYE_FRAG, ['uOpen', 'uFade', 'uLook', 'uT'], 6);
  return {
    mesh,
    set(open: number, fade: number, look = 0, sec = 0) {
      mesh.visible = fade > 0.01;
      u.uOpen!.value = open;
      u.uFade!.value = fade;
      u.uLook!.value = look;
      u.uT!.value = sec;
    },
  };
}

const MAW_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uOpen, uFade, uT;
void main(){
  vec2 p=(vUv-.5)*2.;
  float n=fbm(p*3.+vec2(0.,uT*.6));
  float head=1.-length(p*vec2(.95,1.05))+(n-.5)*.25;
  // The gape: a lens-shaped gap between the jaws, its edges cut into teeth.
  float teeth=abs(fract(p.x*3.2+.5)-.5)*.34*(1.-p.x*p.x);
  float gap=uOpen*(1.-p.x*p.x)*.62;
  float upper=p.y-(gap-teeth);
  float lower=-p.y-(gap-teeth);
  // Each jaw is a band along its bite line, not a whole disc, so the prey shows above and below it.
  float up=smoothstep(-.02,.02,upper)*smoothstep(.62,.46,upper);
  float lo=smoothstep(-.02,.02,lower)*smoothstep(.62,.46,lower);
  float jaw=max(up,lo);
  float body=smoothstep(0.,.1,head)*jaw;
  // Fangs pale violet along the bite line, a glow in the throat.
  float edge=max(smoothstep(.12,0.,upper)*step(0.,upper),smoothstep(.12,0.,lower)*step(0.,lower));
  vec3 col=mix(vec3(.07,.05,.13),vec3(.8,.68,1.1),edge*.9);
  col=mix(vec3(.5,.3,.86),col,smoothstep(0.,.25,head));
  float throat=step(upper,0.)*step(lower,0.)*smoothstep(0.,.1,head)*.3;
  gl_FragColor=vec4(mix(col,vec3(.3,.1,.5),step(body,.01)),max(body,throat)*uFade);
}`;
/** A maw of shadow seen from the front: `set(open 0..1, fade, sec)`. */
export function maw(root: THREE.Object3D) {
  const { mesh, u } = plane(root, MAW_FRAG, ['uOpen', 'uFade', 'uT'], 6);
  return {
    mesh,
    set(open: number, fade: number, sec: number) {
      mesh.visible = fade > 0.01;
      u.uOpen!.value = open;
      u.uFade!.value = fade;
      u.uT!.value = sec;
    },
  };
}

const NET_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uWeave, uFade, uT, uSag;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p);
  // The cloth sags between its edges; threads run both diagonals, thicker every fourth.
  vec2 q=p*(1.+uSag*.25*(1.-r*r));
  float a=abs(fract((q.x+q.y)*4.+.5)-.5);
  float b=abs(fract((q.x-q.y)*4.+.5)-.5);
  float thick=.035+.02*step(.75,fract((q.x+q.y)*1.));
  float thread=max(smoothstep(thick,thick*.4,a),smoothstep(thick,thick*.4,b));
  float knot=smoothstep(.1,.02,a)*smoothstep(.1,.02,b);
  // It is woven from the middle outward, and its rim is ragged.
  float edge=.95+.08*(fbm(vec2(atan(p.y,p.x)*3.,2.))-.5);
  float woven=smoothstep(uWeave*edge,uWeave*edge-.12,r);
  float tw=.6+.4*sin(uT*5.+floor((q.x+q.y)*4.)*1.7+floor((q.x-q.y)*4.)*2.3);
  vec3 col=mix(vec3(.3,.18,.6),vec3(.95,.85,1.25),knot*tw);
  gl_FragColor=vec4(col,clamp(thread*.85+knot,0.,1.)*woven*uFade);
}`;
/** A net of night threads on a plane: `set(weave 0..1, fade, sec, sag 0..1)`. */
export function net(root: THREE.Object3D) {
  const { mesh, u } = plane(root, NET_FRAG, ['uWeave', 'uFade', 'uT', 'uSag'], 6);
  return {
    mesh,
    set(weave: number, fade: number, sec: number, sag = 0) {
      mesh.visible = fade > 0.01 && weave > 0.02;
      u.uWeave!.value = weave;
      u.uFade!.value = fade;
      u.uT!.value = sec;
      u.uSag!.value = sag;
    },
  };
}

const P = new THREE.Vector3();
/**
 * Dark breaking over something at `at`, `sec` after: blots of ink thrown out, shreds of murk that sink, and (in `light`, if given)
 * a few violet glints. `paint` gives `count` painted particles from `from`.
 */
export function blot(paint: Quads, from: number, count: number, light: Quads | null, lFrom: number, lCount: number, seed: number, sec: number, at: THREE.Vector3, power = 1) {
  const half = Math.floor(count * 0.6);
  P.copy(at);
  burst(paint, from, half, seed, { sec, at: P, life: 0.8, speed: 3.6 * power, up: 3.4 * power, grav: 9, drag: 1.4, size: 0.2 * Math.sqrt(power), color: INK, to: [0.2, 0.12, 0.38], frame: F.drop, stretch: 0.035 });
  // The shreds stay thin so the foe still shows through them.
  rise(paint, from + half, count - half, seed + 1, { sec, dur: 0.2, life: 0.8, at: (_b, k) => P.set(at.x + (h(k, 8, seed) - 0.5) * 1.6 * power, at.y + (h(k, 9, seed) - 0.5) * 1.0, at.z), rise: -0.5, jitter: 0.3, size: 0.38 * Math.sqrt(power), color: [0.14, 0.09, 0.26], to: INK, frame: F.smoke, grow: 1.3, alpha: 0.32 });
  if (light) burst(light, lFrom, lCount, seed + 2, { sec, at: at, life: 0.7, speed: 2.6 * power, up: 1.6, grav: 0, drag: 3, size: 0.2, color: [1, 0.75, 1.5], to: VIOLET, frame: F.star, alpha: 0.9 });
}
