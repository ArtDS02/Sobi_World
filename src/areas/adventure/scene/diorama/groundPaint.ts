// The painted colour of the diorama's ground (G0): grass in patches, the dirt path, the forest floor, the bank and the mossy rock tops,
// mixed from the kind shares on the vertices with noise on every border so edges curve. It is costly per pixel (about thirty noise
// calls), so it is painted ONCE per area into a texture seen from straight above (the tile grid is the layout), and the frame only
// looks it up (ground.ts). Cliff faces and cloud shadows depend on the view and stay live.
import * as THREE from 'three';
import { MARGIN, type Grid } from './field';
import { GLSL_NOISE } from './noise';

const FLAT = /* glsl */ `
uniform sampler2D tGrass;
uniform float uTone;
${GLSL_NOISE}
float edge(float w, float n, float soft){ return smoothstep(.5 - soft, .5 + soft, w + (n - .5) * .34); }
vec3 srgb(vec3 c){ return pow(c, vec3(2.2)); }
vec3 flatGround(vec2 wp, vec4 sp, float mo){
  float n1 = dFbm(wp * 1.7);
  float n2 = dFbm(wp * .23 + 3.1);
  float detail = dot(texture2D(tGrass, wp * .21).rgb, vec3(.33));
  // Grass in painted patches: three soft tones laid by large noise, the kit's painted grass for the brush texture, light strokes.
  float patchA = smoothstep(.38, .62, n2);
  float patchB = smoothstep(.52, .7, dFbm(wp * .38 + 9.));
  vec3 grass = mix(srgb(vec3(.43, .64, .27)), srgb(vec3(.55, .74, .32)), patchA);
  grass = mix(grass, srgb(vec3(.36, .56, .27)), patchB * .7);
  grass *= .8 + detail * .5;
  float stroke = smoothstep(.72, .8, dNoise(vec2(wp.x * 2.2 + wp.y * .6, wp.y * 7.5)));
  grass = mix(grass, srgb(vec3(.66, .8, .4)), stroke * .35);
  float bloomDots = step(.93, dHash(floor(wp * 5.))) * step(.5, dNoise(wp * .7 + 4.));
  grass = mix(grass, mix(srgb(vec3(1., .96, .82)), srgb(vec3(1., .78, .86)), dHash(floor(wp * 5.) + 2.)), bloomDots * smoothstep(.3, .0, length(fract(wp * 5.) - .5)) * .9);
  // Grass darkens and cools near the woods (their shade and their floor).
  grass *= mix(1., .72, smoothstep(.05, .45, sp.y));
  vec3 path = mix(srgb(vec3(.88, .77, .58)), srgb(vec3(.8, .67, .47)), smoothstep(.35, .7, n1));
  path *= .95 + .1 * dNoise(wp * 3.);
  // A darker, cooler dirt (a deep wood: damp earth under the pines, not sun-baked sand).
  path = mix(path, path * vec3(.5, .56, .5), uTone);
  float pebble = smoothstep(.06, .0, length(fract(wp * 3.1 + dNoise(wp * 2.) * .4) - .5)) * step(.82, dHash(floor(wp * 3.1 + dNoise(wp * 2.) * .4)));
  path = mix(path, srgb(vec3(.7, .64, .56)), pebble);
  path *= .9 + .1 * smoothstep(.5, .95, sp.x);
  vec3 floorC = mix(srgb(vec3(.22, .33, .16)), srgb(vec3(.33, .28, .17)), smoothstep(.4, .7, n1));
  vec3 bank = mix(srgb(vec3(.78, .68, .5)), srgb(vec3(.56, .5, .38)), n1);
  vec3 col = grass;
  float wp_ = edge(sp.x, n1, .1);
  col = mix(col, path, wp_);
  // A darker rim where path meets grass (worn edge).
  col *= 1. - .18 * (1. - abs(wp_ * 2. - 1.)) * step(.02, wp_);
  col = mix(col, floorC, edge(sp.y, n1, .2));
  col = mix(col, bank, smoothstep(.15, .55, sp.z + (n1 - .5) * .5));
  // Flat rock tops are mossy ground.
  vec3 moss = mix(grass * vec3(.86, .92, .8), srgb(vec3(.5, .55, .4)), .35);
  col = mix(col, moss, edge(sp.w, n1, .15));
  // The moss floor (the c tiles): dark, cool green with a spongy mottle and a few lighter cushions, melting into the grass at its rim.
  vec3 deepMoss = mix(srgb(vec3(.15, .26, .15)), srgb(vec3(.24, .36, .19)), smoothstep(.35, .75, dFbm(wp * 2.4 + 7.)));
  deepMoss = mix(deepMoss, srgb(vec3(.31, .44, .22)), step(.8, dHash(floor(wp * 4.))) * .5);
  return mix(col, deepMoss, smoothstep(.12, .6, mo + (n1 - .5) * .3));
}`;

/** Pixels per tile of the painted ground. */
const PX = { full: 32, light: 16 } as const;

/** Paints the ground colour of `geo` (the ground mesh with its `aSplat` shares) over the whole grid; the caller owns the target. */
export function paintGround(renderer: THREE.WebGLRenderer, geo: THREE.BufferGeometry, g: Grid, grass: THREE.Texture, quality: 'full' | 'light', pathTone = 0): THREE.WebGLRenderTarget {
  const px = PX[quality];
  const rt = new THREE.WebGLRenderTarget(g.W * px, g.H * px, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: { tGrass: { value: grass }, uTone: { value: pathTone }, uSize: { value: new THREE.Vector2(g.W, g.H) } },
    side: THREE.DoubleSide,
    vertexShader: `attribute vec4 aSplat; attribute float aMoss; uniform vec2 uSize; varying vec2 vW; varying vec4 vS; varying float vM;
      void main(){ vW = position.xz; vS = aSplat; vM = aMoss; gl_Position = vec4(((position.xz + ${MARGIN}.) / uSize) * 2. - 1., 0., 1.); }`,
    fragmentShader: `${FLAT}
      varying vec2 vW; varying vec4 vS; varying float vM;
      void main(){ gl_FragColor = vec4(flatGround(vW, vS, vM), 1.); }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const before = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(scene, new THREE.Camera());
  renderer.setRenderTarget(before);
  mat.dispose();
  return rt;
}
