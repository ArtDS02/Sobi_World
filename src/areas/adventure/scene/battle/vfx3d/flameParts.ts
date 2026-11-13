// Parts of the fire effects rebuilt on noise (decision 059): a tongue of flame with a body (a plane facing the camera whose outline
// is eaten by rising noise, painted in the fire ramp's flat tones with a white-hot heart), and a soft glow. Fire is painted, not only
// added as light: on a bright backdrop an additive flame washes out, a painted one keeps its red edge.
import * as THREE from 'three';
import { F } from './atlas';
import { sprite } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { NOISE, RAMPS, UV_VERT } from './glsl';
import { lightBlend, type Quads } from './quads';

type U = Record<string, { value: number }>;

const FLAME_FRAG = `
${NOISE}${RAMPS}
varying vec2 vUv; uniform float uT, uFade, uSeed, uLean;
void main(){
  float y=vUv.y; float x=(vUv.x-.5)*2.-uLean*y*y;
  // Noise climbs faster than the flame is tall: tongues tear off the top.
  float n=fbm(vec2(x*2.4+uSeed, y*2.2-uT*2.6));
  float n2=fbm(vec2(x*5.+uSeed*2., y*4.5-uT*4.2));
  float width=(1.-y)*(.55+.45*smoothstep(0.,.25,y))+.08;
  float d=1.-abs(x)/max(width,.001);
  float body=d*.9+(n-.5)*.9+(n2-.5)*.35-y*.35;
  float a=smoothstep(.05,.22,body)*smoothstep(0.,.05,y);
  float heat=clamp(body*.9+(1.-y)*.35,0.,1.2);
  vec3 col=fireRamp(heat)*(1.+smoothstep(.8,1.15,heat)*1.2);
  gl_FragColor=vec4(col,a*uFade);
}`;
export interface Flame {
  mesh: THREE.Mesh;
  /** World width and height, seconds, fade 0..1, lean (the top blown sideways, −1..1). */
  set(width: number, height: number, sec: number, fade: number, lean?: number): void;
}
/** A flame standing at its mesh's position (its foot at the origin). */
export function flame(root: THREE.Object3D, seed = 0): Flame {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uSeed: { value: seed * 3.7 }, uLean: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.Mesh(geo, mat);
  // Tilted back a little toward the raised camera.
  mesh.rotation.x = -0.35;
  mesh.visible = false;
  mesh.renderOrder = 6;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(width, height, sec, fade, lean = 0) {
      mesh.visible = fade > 0.01 && height > 0.02;
      mesh.scale.set(Math.max(0.001, width), Math.max(0.001, height), 1);
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uLean!.value = lean;
    },
  };
}

/** A soft glow of light: call it with `(x, y, z, size, opacity)`. */
export function glow(root: THREE.Object3D, color: number) {
  const m = new THREE.SpriteMaterial({ map: sprite(), color, transparent: true, depthWrite: false, depthTest: false });
  lightBlend(m);
  const s = new THREE.Sprite(m);
  s.visible = false;
  root.add(s);
  return (x: number, y: number, z: number, size: number, opacity: number) => {
    s.visible = opacity > 0.01 && size > 0.01;
    s.position.set(x, y, z);
    s.scale.set(size, size, 1);
    m.opacity = opacity;
  };
}

const IRON_VERT = `
varying vec3 vN; varying vec3 vP;
void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const IRON_FRAG = `
${NOISE}${RAMPS}
varying vec3 vN; varying vec3 vP; uniform float uHeat, uFade; uniform vec3 uBase;
void main(){
  vec3 n=normalize(vN);
  float l=.32+.68*max(dot(n,normalize(vec3(.35,.8,.5))),0.);
  float rim=pow(1.-abs(n.z),2.5);
  vec3 iron=uBase*l+vec3(.5,.52,.6)*rim*.5;
  // Heat sits in blotches and creeps out to the edges; white-hot metal goes over the top for the bloom.
  float h=uHeat*(.3+.8*fbm(vP.xy*2.6+vP.z))+uHeat*rim*.4;
  vec3 col=mix(iron,fireRamp(clamp(h,0.,1.)),smoothstep(.3,.72,h));
  col*=1.+smoothstep(.95,1.3,h)*.6;
  gl_FragColor=vec4(col,uFade);
}`;
/** Iron that can glow: `set(heat 0..1.3, fade)`. `base` is its cold colour (dark iron by default; a red-brown reads as stone or coal). */
export function hotIron(base = 0x34323c) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uHeat: { value: 0 }, uFade: { value: 1 }, uBase: { value: new THREE.Color(base) } }, vertexShader: IRON_VERT, fragmentShader: IRON_FRAG, transparent: true });
  const u = mat.uniforms as U;
  return {
    mat,
    set(heat: number, fade: number) {
      u.uHeat!.value = heat;
      u.uFade!.value = fade;
      mat.visible = fade > 0.01;
    },
  };
}

const LAVA_FRAG = `
${NOISE}${RAMPS}
varying vec2 vUv; uniform float uT, uFade, uGrow, uHeat;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  float edge=uGrow*(.8+.16*fbm(vec2(a*2.4,uT*.3)));
  float body=1.-smoothstep(edge-.05,edge,r);
  // Plates of dark crust drifting on the melt; the seams between them and the rim glow.
  vec2 q=p*3.2+vec2(uT*.12,-uT*.07);
  float cell=fbm(q+fbm(q*1.7+uT*.2)*1.4);
  float seam=1.-smoothstep(.0,.16,abs(cell-.5));
  float rim=smoothstep(edge-.22,edge-.03,r);
  float heat=clamp((seam*.8+rim*.6+.12)*min(uHeat,1.),0.,1.);
  vec3 col=mix(vec3(.16,.06,.05),fireRamp(heat),smoothstep(.2,.5,heat));
  col*=1.+smoothstep(.85,1.,heat)*.5;
  gl_FragColor=vec4(col,body*uFade);
}`;
/** Lava lying on the ground: a crust with glowing seams, its rim creeping outward. `set(grow 0..1, sec, fade, heat 0..1.2)`. */
export function lava(root: THREE.Object3D, width: number, depth: number) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uGrow: { value: 0 }, uHeat: { value: 1 } }, vertexShader: UV_VERT, fragmentShader: LAVA_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  mesh.visible = false;
  mesh.renderOrder = -2;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(grow: number, sec: number, fade: number, heat = 1) {
      mesh.visible = fade > 0.01 && grow > 0.01;
      u.uGrow!.value = grow;
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uHeat!.value = heat;
    },
  };
}

export const HOT: Rgb = [1.7, 1.35, 0.6];
export const FIRE: Rgb = [1.3, 0.55, 0.1];
export const RED: Rgb = [0.75, 0.12, 0.03];
const P = new THREE.Vector3();
/**
 * A blast of fire at `at`, `sec` after it went off: tongues of flame thrown out, sparks as streaks, embers that float up. Uses
 * `count` particles of the additive set `light` from index `from`.
 */
export function fireBurst(light: Quads, from: number, count: number, seed: number, sec: number, at: THREE.Vector3, power = 1) {
  const a = Math.floor(count * 0.4);
  const b = Math.floor(count * 0.35);
  P.copy(at);
  burst(light, from, a, seed, { sec, at: P, life: 0.75, speed: 4.5 * power, up: 4.5 * power, grav: 4, drag: 2.2, size: 0.38 * Math.sqrt(power), color: [1, 0.42, 0.07], to: RED, frame: F.flame, alpha: 0.32 });
  burst(light, from + a, b, seed + 1, { sec, at: P, life: 0.7, speed: 8 * power, up: 7.5 * power, grav: 14, drag: 1.6, size: 0.13, color: HOT, to: FIRE, frame: F.streak, stretch: 0.05 });
  burst(light, from + a + b, count - a - b, seed + 2, { sec, at: P, life: 1.3, speed: 2.2 * power, up: 3.4 * power, grav: 1.5, drag: 1.5, size: 0.12, color: HOT, to: RED, frame: F.ember, alpha: 0.9 });
}
/** Smoke rolling up from `at` after a fire (paint): uses all of `smoke` from `from` for `count`. */
export function smokeUp(smoke: Quads, from: number, count: number, seed: number, sec: number, at: THREE.Vector3, spread = 0.8, size = 0.8) {
  rise(smoke, from, count, seed, { sec, dur: 0.6, life: 1.1, at: (_b, k) => P.set(at.x + (h(k, 8, seed) - 0.5) * spread * 2, at.y + 0.3 + h(k, 9, seed) * 0.6, at.z), rise: 1.4, jitter: 0.3, size, color: [0.4, 0.25, 0.2], to: [0.2, 0.16, 0.18], frame: F.smoke, grow: 2, alpha: 0.3 });
}
