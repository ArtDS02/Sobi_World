// Parts of the fire effects (prototype, decision 059): a cloud of flame points coloured by age, a tapering column of flame, a pool of
// lava with a cooling crust, and the glowing metal of the forge pieces. Pure functions of time, like every effect.
import * as THREE from 'three';
import { POINT_SCALE, sprite } from './effectParts';

export type Seeds4 = readonly (readonly [number, number, number, number])[];
/** `n` rows of four random numbers 0..1 (a particle's birth time and three jitters). */
export const seeds4 = (n: number, rand: () => number): Seeds4 => Array.from({ length: n }, () => [rand(), rand() - 0.5, rand() - 0.5, rand() - 0.5] as const);

export interface FireCloud {
  n: number;
  pts: THREE.Points;
  /** Puts point `i` at (x, y, z) at `life` 0 (white-hot) .. 1 (burnt out: invisible). */
  put(i: number, x: number, y: number, z: number, life: number): void;
  hide(i: number): void;
  flush(): void;
}
/** Additive flame points: white-yellow when young, orange, red, then dark (additive: dark is invisible). */
export function fireCloud(root: THREE.Object3D, n: number, size: number): FireCloud {
  const geo = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  const col = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  geo.setAttribute('position', pos);
  geo.setAttribute('color', col);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: sprite(), size: size * POINT_SCALE, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  pts.frustumCulled = false;
  root.add(pts);
  return {
    n,
    pts,
    put(i, x, y, z, life) {
      const l = Math.min(1, Math.max(0, life));
      pos.setXYZ(i, x, y, z);
      // 0 -> (1, .93, .6), .35 -> (1, .5, .12), .75 -> (.55, .1, .04), 1 -> 0
      const k = 1 - l;
      col.setXYZ(i, Math.min(1, 0.2 + k * 1.3), Math.max(0, l < 0.35 ? 0.93 - l * 1.23 : 0.5 - (l - 0.35) * 1.0) * Math.min(1, k * 1.6), Math.max(0, 0.6 - l * 1.4) * k);
    },
    hide(i) {
      pos.setXYZ(i, 0, -50, 0);
    },
    flush() {
      pos.needsUpdate = true;
      col.needsUpdate = true;
    },
  };
}

const COLUMN_VERT = `
varying float vY; varying float vA; uniform float uR, uH, uT;
void main(){
  float y=uv.y; vY=y; float ang=uv.x*6.2832; vA=ang;
  float taper=1.-.75*y*y;
  float wob=1.+.18*sin(ang*5.+uT*11.-y*6.)+.1*sin(ang*11.-uT*7.);
  vec3 p=vec3(cos(ang)*uR*taper*wob, y*uH, sin(ang)*uR*taper*wob);
  p.x+=.08*uR*sin(uT*8.+y*7.)*y;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const COLUMN_FRAG = `
varying float vY; varying float vA; uniform float uFade, uT;
void main(){
  vec3 hot=vec3(1.,.92,.55), mid=vec3(1.,.42,.08), cold=vec3(.5,.05,.02);
  vec3 col=mix(hot,mid,smoothstep(0.,.35,vY)); col=mix(col,cold,smoothstep(.35,1.,vY));
  float flick=.55+.45*sin(vA*7.+uT*15.-vY*9.);
  float al=pow(1.-vY,.8)*flick*uFade;
  gl_FragColor=vec4(col,al);
}`;
export interface FlameColumn {
  mesh: THREE.Mesh;
  /** Poses the column: world `radius` and `height`, `sec` since the start, `fade` 0..1. */
  set(radius: number, height: number, sec: number, fade: number): void;
}
export function flameColumn(root: THREE.Object3D): FlameColumn {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 1 }, uH: { value: 1 }, uT: { value: 0 }, uFade: { value: 0 } },
    vertexShader: COLUMN_VERT,
    fragmentShader: COLUMN_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 40, 12, true), mat);
  mesh.visible = false;
  root.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(radius, height, sec, fade) {
      mesh.visible = fade > 0.01 && height > 0.01;
      u.uR!.value = radius;
      u.uH!.value = height;
      u.uT!.value = sec;
      u.uFade!.value = fade;
    },
  };
}

const LAVA_FRAG = `
varying vec2 vUv; uniform float uT, uFade;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p);
  float heat=.5+.5*sin(p.x*10.+sin(p.y*8.+uT*2.)*2.)*sin(p.y*9.+sin(p.x*7.-uT*1.5)*2.);
  vec3 crust=vec3(.1,.04,.03), lava=vec3(1.,.42,.08), core=vec3(1.,.82,.35);
  vec3 col=mix(crust,lava,smoothstep(.4,.8,heat)); col=mix(col,core,smoothstep(.9,1.,heat));
  float edge=1.-smoothstep(.7,1.,r);
  float rim=smoothstep(.55,.8,r)*(1.-smoothstep(.8,1.,r));
  col+=vec3(.9,.3,.05)*rim*.8;
  gl_FragColor=vec4(col,edge*uFade*.95);
}`;
export interface LavaPool {
  mesh: THREE.Mesh;
  set(width: number, depth: number, sec: number, fade: number): void;
}
export function lavaPool(root: THREE.Object3D): LavaPool {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFade: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: LAVA_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  mesh.visible = false;
  root.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(width, depth, sec, fade) {
      mesh.visible = fade > 0.01 && width > 0.01;
      mesh.scale.set(Math.max(0.001, width), Math.max(0.001, depth), 1);
      u.uT!.value = sec;
      u.uFade!.value = fade;
    },
  };
}

/** Metal that glows: `heat` 0 (dark iron) .. 1 (white-hot) is set per frame on `.emissive`. */
export function hotMetal(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x4a3a35, metalness: 0.7, roughness: 0.45, emissive: 0xff4a10, emissiveIntensity: 0, transparent: true });
}

/** Particles born at random times in [t0, t1] where `at(born)` is, then rising and cooling for `lifeMs` (a trail of flame). */
export function trail(fc: FireCloud, seeds: Seeds4, ms: number, t0: number, t1: number, lifeMs: number, at: (t: number) => THREE.Vector3, rise = 0.6, spread = 0.25) {
  for (let i = 0; i < fc.n; i++) {
    const [b, jx, jy, jz] = seeds[i % seeds.length]!;
    const born = t0 + b * (t1 - t0);
    const age = ms - born;
    if (age < 0 || age > lifeMs) {
      fc.hide(i);
      continue;
    }
    const p = at(born);
    const l = age / lifeMs;
    fc.put(i, p.x + jx * spread * (1 + l), p.y + jy * spread * 0.8 + rise * l, p.z + jz * spread, l);
  }
  fc.flush();
}

export interface ForgePiece {
  g: THREE.Group;
  iron: THREE.MeshStandardMaterial;
  /** Additive glow of the hot faces: `opacity` is the heat. */
  glow: THREE.MeshBasicMaterial;
}
const ironMat = () => new THREE.MeshStandardMaterial({ color: 0x5a5560, metalness: 0.6, roughness: 0.38, transparent: true });
const glowMat = () => new THREE.MeshBasicMaterial({ color: 0xff7a20, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
/** A hammer of dark iron (lit, so it has shape) whose striking faces glow with the heat. */
export function forgeHammer(): ForgePiece {
  const g = new THREE.Group();
  const iron = ironMat();
  const glow = glowMat();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    g.add(m);
  };
  add(new THREE.BoxGeometry(1.3, 0.85, 0.85), iron, 0, 2.1, 0);
  add(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 10), iron, 0, 1, 0);
  for (const y of [1.8, 2.4]) add(new THREE.BoxGeometry(1.42, 0.14, 0.98), iron, 0, y, 0);
  add(new THREE.BoxGeometry(0.3, 0.5, 0.3), iron, 0.78, 2.1, 0);
  add(new THREE.PlaneGeometry(1.0, 0.5), glow, 0, 2.1, 0.44);
  add(new THREE.PlaneGeometry(1.0, 0.6), glow, 0, 2.53, 0, -Math.PI / 2);
  add(new THREE.PlaneGeometry(0.5, 0.5), glow, 0.8, 2.1, 0.17);
  return { g, iron, glow };
}
/** An anvil of dark iron with a glowing face. */
export function forgeAnvil(): ForgePiece {
  const g = new THREE.Group();
  const iron = ironMat();
  const glow = glowMat();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, rz = 0, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    m.rotation.set(rx, 0, rz);
    g.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(1.5, 0.3, 0.9), iron, 0, 0.15);
  add(new THREE.BoxGeometry(0.8, 0.5, 0.7), iron, 0, 0.55);
  add(new THREE.BoxGeometry(1.7, 0.32, 0.85), iron, 0, 0.96);
  add(new THREE.ConeGeometry(0.4, 0.8, 10), iron, 1.2, 0.96, -Math.PI / 2);
  add(new THREE.PlaneGeometry(1.5, 0.7), glow, 0, 1.13, 0, -Math.PI / 2);
  add(new THREE.PlaneGeometry(1.5, 0.26), glow, 0, 0.96, 0).position.z = 0.43;
  return { g, iron, glow };
}
