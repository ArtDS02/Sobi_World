// The diorama's water (G0): one sheet over the area, drawn only where the distance-to-shore field (field.ts) says water — shallow
// turquoise to deep blue with the depth, flowing ripples and streaks, foam that breathes along the banks, and glints bright enough
// for the bloom. It reads the time-of-day light as a uniform (it is unlit, like a painted surface).
import * as THREE from 'three';
import { GLSL_NOISE } from './noise';
import { waterDistance, type Grid } from './field';

const RES = 6;

export interface WaterUniforms {
  uTime: { value: number };
  uLight: { value: THREE.Color };
  uGlint: { value: number };
}

/** `foot`: where a waterfall plunges in (tiles) and how far its foam reaches; the pool turns white there and rings spread from it. */
/** `pool`: a calmer palette for a map's water (shallow and deep colours, the depth over which they blend, how stretched the flow ripples are). */
export interface PoolLook {
  shallow: number;
  deep: number;
  ramp: number;
  stretch: number;
}

export function buildWater(g: Grid, u: WaterUniforms, foot?: { x: number; z: number; r: number }, pool?: PoolLook): THREE.Mesh {
  const dist = waterDistance(g, RES);
  // Bytes (signed distance −2 … +4 tiles), so the texture filters linearly everywhere.
  // R: the distance; G: the water share itself, smooth, which draws the edge (a distance from a sampled mask would step).
  const bytes = new Uint8Array(dist.data.length * 2);
  dist.data.forEach((v, i) => {
    bytes[i * 2] = Math.round(((v + 2) / 6) * 255);
    bytes[i * 2 + 1] = Math.round(Math.min(1, Math.max(0, dist.share[i]!)) * 255);
  });
  const tex = new THREE.DataTexture(bytes, dist.w, dist.h, THREE.RGFormat, THREE.UnsignedByteType);
  tex.unpackAlignment = 2;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  const geo = new THREE.PlaneGeometry(g.cols, g.rows).rotateX(-Math.PI / 2).translate(g.cols / 2, -0.12, g.rows / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      tDist: { value: tex },
      uSize: { value: new THREE.Vector2(g.cols, g.rows) },
      uTime: u.uTime,
      uLight: u.uLight,
      uGlint: u.uGlint,
      uShallow: { value: new THREE.Color(pool?.shallow ?? 0x63d4d0) },
      uRamp: { value: pool?.ramp ?? 1.8 },
      uStretch: { value: pool?.stretch ?? 1 },
      uDeep: { value: new THREE.Color(pool?.deep ?? 0x2a6fb8) },
      uFall: { value: new THREE.Vector3(foot?.x ?? 0, foot?.z ?? 0, foot?.r ?? 0) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDist; uniform vec2 uSize; uniform float uTime; uniform vec3 uLight; uniform float uGlint;
      uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uFall; uniform float uRamp; uniform float uStretch;
      varying vec3 vW;
      ${GLSL_NOISE}
      void main(){
        // The texture's rows run with z (row 0 = top of the area); DataTexture puts row 0 at v = 0.
        vec2 dw = texture2D(tDist, vW.xz / uSize).rg;
        float edgeW = smoothstep(.47, .53, dw.g);
        if (edgeW <= 0.) discard;
        float d = max(dw.r * 6. - 2., (dw.g - .5) * .6);
        vec2 flow = vW.xz + vec2(sin(vW.z * .4) * .3, -uTime * .55);
        float rip = dFbm(flow * vec2(1.3, .7) * vec2(1., uStretch));
        vec3 col = mix(uShallow, uDeep, smoothstep(.15, uRamp, d + (rip - .5) * .3));
        col *= .9 + .2 * dFbm(vW.xz * 2.4 + vec2(uTime * .12, -uTime * .4));
        float crest = smoothstep(.035, .0, abs(fract(dNoise(flow * vec2(1.6, .5)) * 3.) - .5)) * smoothstep(.4, 1.2, d);
        col = mix(col, vec3(.8, .95, 1.), crest * .22);
        float foamEdge = .28 + .16 * rip + .05 * sin(uTime * 1.7 + vW.x * 1.3) + (uFall.z > 0. ? .06 * sin(uTime * 1.2 + vW.z * 1.7 + rip * 9.) : 0.);
        float foam = 1. - smoothstep(.02, foamEdge, d);
        col = mix(col, vec3(.97, 1., 1.), foam * .8);
        if (uFall.z > 0.) {
          // The plunge pool of a waterfall: a churning white core and rings of foam that spread out from it.
          float fd = length((vW.xz - uFall.xy) * vec2(.62, 1.));
          float core = (1. - smoothstep(.3, uFall.z, fd)) * (.55 + .45 * dNoise(vW.xz * 5. + vec2(0., uTime * 1.5)));
          float ring = (1. - smoothstep(.5, uFall.z * 1.9, fd)) * smoothstep(.55, .95, .5 + .5 * sin(fd * 9. - uTime * 2.6 + rip * 3.)) * smoothstep(.3, .8, fd) * .5;
          col = mix(col, vec3(.98, 1., 1.), clamp(core + ring, 0., 1.) * .78);
        }
        float glint = pow(dNoise(vW.xz * 3.5 + vec2(uTime * .4, -uTime * .9)), 46.) * 7. * uGlint;
        col += vec3(glint);
        col *= uLight;
        float a = edgeW * mix(.72, .94, smoothstep(.2, 1.4, d));
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 2;
  return mesh;
}
