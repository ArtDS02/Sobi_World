// Small helpers the 3D effects share (prototype, decision 059): easing, a seeded generator, soft sprites, point clouds, the ground
// ripple shader and a ring of ice crystals. Effects are pure functions of time, so nothing here keeps a clock.
import * as THREE from 'three';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
export const easeOut3 = (t: number) => 1 - (1 - t) ** 3;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
/** Small deterministic generator: the same drops every play (the effect is a function of time, not of luck). */
export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

let soft: THREE.CanvasTexture | null = null;
/** A soft round sprite shared by the drops, the glows and the mist. */
export function sprite(): THREE.CanvasTexture {
  if (soft) return soft;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  soft = new THREE.CanvasTexture(c);
  return soft;
}

let star: THREE.CanvasTexture | null = null;
/** A four-point sparkle (the snowflake). */
export function starSprite(): THREE.CanvasTexture {
  if (star) return star;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.translate(64, 64);
  g.fillStyle = 'rgba(255,255,255,0.95)';
  for (let i = 0; i < 6; i++) {
    g.rotate(Math.PI / 3);
    g.beginPath();
    g.moveTo(0, -60);
    g.lineTo(7, 0);
    g.lineTo(0, 60);
    g.lineTo(-7, 0);
    g.fill();
  }
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 34);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(-64, -64, 128, 128);
  star = new THREE.CanvasTexture(c);
  return star;
}

/** Three sizes points by distance, not by the lens: with the stage's far, narrow camera a size in world units must be multiplied by this. */
export const POINT_SCALE = 11.6;

export interface Cloud {
  pts: THREE.Points;
  pos: THREE.BufferAttribute;
  n: number;
}
/** A cloud of `n` soft points of world size `size` (additive by default; normal blending for mist and snow). */
export function cloud(root: THREE.Object3D, n: number, size: number, color: number, additive = true, opacity = 0.9, map: THREE.Texture = sprite()): Cloud {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map, size: size * POINT_SCALE, color, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true, opacity }));
  pts.frustumCulled = false;
  root.add(pts);
  return { pts, pos: geo.attributes.position as THREE.BufferAttribute, n };
}
/** Parks point `i` far below the stage (not drawn). */
export const park = (c: Cloud, i: number) => c.pos.setXYZ(i, 0, -50, 0);

/** Ripples running out over the ground from the middle of a plane. */
export const RIPPLE_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
export const RIPPLE_FRAG = `
varying vec2 vUv; uniform float uT, uFade; uniform vec3 uCol, uFoam;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=0.;
  for(int i=0;i<4;i++){
    float f=uT*.62-float(i)*.17; float d=abs(r-f);
    float w=.045+.02*float(i);
    float ring=smoothstep(w,0.,d)*step(0.,f)*(1.-smoothstep(.55,1.,f));
    a+=ring*(1.-float(i)*.2);
  }
  float pool=smoothstep(1.,.15,r)*smoothstep(0.,.3,uT)*.34;
  float edge=1.-smoothstep(.82,1.,r);
  float al=clamp(a*.95+pool,0.,1.)*edge*uFade;
  gl_FragColor=vec4(mix(uCol,uFoam,clamp(a,0.,1.)),al);
}`;
export interface Ripple {
  mesh: THREE.Mesh;
  /** `sec` since it began, `fade` 0–1. */
  set(sec: number, fade: number): void;
}
export function ripple(root: THREE.Object3D, w: number, d: number, col: number, foam: number): Ripple {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uCol: { value: new THREE.Color(col) }, uFoam: { value: new THREE.Color(foam) } },
    vertexShader: RIPPLE_VERT,
    fragmentShader: RIPPLE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.scale.set(w, d, 1);
  mesh.visible = false;
  root.add(mesh);
  return {
    mesh,
    set(sec, fade) {
      mesh.visible = sec > 0 && fade > 0.001;
      mat.uniforms.uT!.value = Math.max(0, sec);
      mat.uniforms.uFade!.value = fade;
    },
  };
}

export interface Crystals {
  /** Poses the crystals: `grow` 0–1 (how far they have risen), `fade` 1–0. */
  set(grow: number, fade: number, ms: number): void;
}
/** `n` ice crystals standing in a ring of world radius `radius` (some in the middle), the tallest up to `hmax`. */
export function crystals(root: THREE.Object3D, n: number, radius: number, hmin: number, hmax: number, seed: number): Crystals {
  const rand = rng(seed);
  const mat = new THREE.MeshStandardMaterial({ color: 0xcdf1ff, metalness: 0.1, roughness: 0.12, emissive: 0x5ac8ff, emissiveIntensity: 0.45, transparent: true, opacity: 0.85, flatShading: true });
  const items = Array.from({ length: n }, (_, i) => {
    const h = hmin + rand() * (hmax - hmin);
    const g = new THREE.ConeGeometry(0.1 + rand() * 0.07 + h * 0.06, h, 6);
    g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, mat);
    const a = (i / n) * 6.2832 + rand() * 0.5;
    const r = radius * (0.65 + rand() * 0.5);
    m.position.set(Math.cos(a) * r * 1.2, 0, Math.sin(a) * r * 0.9);
    m.rotation.set(Math.sin(a) * 0.35 + (rand() - 0.5) * 0.2, rand() * 3, -Math.cos(a) * 0.35 + (rand() - 0.5) * 0.2);
    root.add(m);
    return { m, delay: rand() * 0.35 };
  });
  return {
    set(grow, fade) {
      mat.opacity = 0.85 * fade;
      for (const it of items) {
        const k = easeOutBack(clamp((grow - it.delay) / (1 - it.delay)));
        it.m.scale.set(1, Math.max(0.001, k), 1);
        it.m.visible = grow > it.delay && fade > 0.01;
      }
    },
  };
}
