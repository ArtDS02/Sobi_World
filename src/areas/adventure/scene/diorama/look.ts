// Light and finish of the diorama (G0): a sun (or moon) with soft shadows that follows the view, sky / ground fill light, and the
// post chain — bloom only on what is really bright, a gentle tilt-shift blur at the top and bottom of the frame (the "model village"
// look), a colour grade per time of day and a vignette — then tone mapping that keeps the painted colours.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type TimeOfDay = 'day' | 'golden' | 'night';

export interface Preset {
  sun: number;
  sunI: number;
  /** Sun direction (from the target toward the sun). */
  sunDir: [number, number, number];
  sky: number;
  ground: number;
  hemiI: number;
  water: [number, number, number];
  glint: number;
  bloom: number;
  /** Grade: saturation, warmth (+ warm / − cool), lift of the shadows. */
  sat: number;
  warm: number;
  fireflies: number;
  lantern: number;
  clear: number;
}

export const PRESETS: Record<TimeOfDay, Preset> = {
  day: {
    sun: 0xffe7c2,
    sunI: 3.1,
    sunDir: [-0.55, 1, 0.62],
    sky: 0xc9e2ff,
    ground: 0x5d7a46,
    hemiI: 1.0,
    water: [1, 1, 1],
    glint: 1,
    bloom: 0.32,
    sat: 1.08,
    warm: 0.02,
    fireflies: 0,
    lantern: 0,
    clear: 0x1f3a1a,
  },
  golden: {
    sun: 0xffc488,
    sunI: 2.5,
    sunDir: [-0.95, 0.55, 0.35],
    sky: 0xffd6a8,
    ground: 0x5c4a2c,
    hemiI: 0.95,
    water: [1.05, 0.86, 0.72],
    glint: 1.4,
    bloom: 0.5,
    sat: 1.0,
    warm: 0.035,
    fireflies: 0.35,
    lantern: 0,
    clear: 0x2a2416,
  },
  night: {
    sun: 0x8fb0ff,
    sunI: 0.75,
    sunDir: [0.5, 1, 0.45],
    sky: 0x31447a,
    ground: 0x0f1a14,
    hemiI: 0.55,
    water: [0.26, 0.32, 0.55],
    glint: 0.8,
    bloom: 0.85,
    sat: 0.92,
    warm: -0.06,
    fireflies: 1,
    lantern: 7,
    clear: 0x070b12,
  },
};

const FINAL = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTilt: { value: 1 },
    uSat: { value: 1 },
    uWarm: { value: 0 },
    uFog: { value: 0 },
    uFogCol: { value: new THREE.Color(0xbcd2e0) },
    uDim: { value: 1 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTilt; uniform float uSat; uniform float uWarm; uniform float uFog; uniform vec3 uFogCol; uniform float uDim;
    varying vec2 vUv;
    void main(){
      float b = smoothstep(.24, .52, abs(vUv.y - .46)) * uTilt * 2.4;
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      if (b > .05) {
        vec3 s = c;
        for (int i = 0; i < 12; i++) {
          float a = float(i) * 2.39996;
          float r = sqrt(float(i) + .5) / sqrt(12.);
          s += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * r * b / uRes).rgb;
        }
        c = s / 13.;
      }
      float l = dot(c, vec3(.2126, .7152, .0722));
      // Far haze: the top of the frame (the far side of the diorama) melts into the fog colour.
      c = mix(c, uFogCol * (.35 + l), uFog * smoothstep(.5, 1., vUv.y) * .75);
      l = dot(c, vec3(.2126, .7152, .0722));
      c = mix(vec3(l), c, uSat);
      c *= vec3(1. + uWarm, 1., 1. - uWarm) * uDim;
      vec2 q = vUv - .5;
      c *= 1. - .32 * smoothstep(.25, .75, dot(q, q) * 2.2);
      gl_FragColor = vec4(c, 1.);
    }`,
};

export interface LightTweak {
  sat: number;
  warm: number;
  fog: number;
  fogTint: number;
  /** Overall brightness of the picture, 1 = the preset's. */
  dim?: number;
  /** Added to the hemisphere light at night, so paths stay readable beyond the lantern. */
  moon?: number;
}
const NO_TWEAK: LightTweak = { sat: 0, warm: 0, fog: 0, fogTint: 0xbcd2e0 };

export class Look {
  readonly sun = new THREE.DirectionalLight(0xffffff, 2);
  readonly hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  readonly lantern = new THREE.PointLight(0xffcf7a, 0, 7, 1.6);
  readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly final: ShaderPass;
  private readonly fxaa: ShaderPass;
  preset: Preset = PRESETS.day;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1536, 1536);
    const sc = this.sun.shadow.camera;
    sc.left = -31;
    sc.right = 31;
    sc.top = 26;
    sc.bottom = -26;
    sc.near = 1;
    sc.far = 80;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.sun.shadow.radius = 3;
    scene.add(this.sun, this.sun.target, this.hemi, this.lantern);
    // A stencil, so the see-through ghosts of the party never draw over the party itself (party.ts).
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, stencilBuffer: true });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.45, 0.92);
    this.composer.addPass(this.bloom);
    this.final = new ShaderPass(FINAL);
    this.composer.addPass(this.final);
    this.composer.addPass(new OutputPass());
    // Edge smoothing by one cheap pass on the finished picture: multisampling the half-float target cost more than all the rest.
    this.fxaa = new ShaderPass(FXAAShader);
    this.composer.addPass(this.fxaa);
  }

  setSize(w: number, h: number) {
    this.composer.setSize(w, h);
    (this.final.uniforms.uRes!.value as THREE.Vector2).set(w, h);
    (this.fxaa.uniforms.resolution!.value as THREE.Vector2).set(1 / w, 1 / h);
  }

  /** `tweak`: the map's offsets from the preset (saturation, warmth) and its far fog, 0–0.6, tinted. */
  apply(p: Preset, opts: { shadows: boolean; bloom: boolean; tilt: boolean; smooth?: boolean }, tweak: LightTweak = NO_TWEAK) {
    this.preset = p;
    this.sun.color.set(p.sun);
    this.sun.intensity = p.sunI;
    this.hemi.color.set(p.sky);
    this.hemi.groundColor.set(p.ground);
    this.hemi.intensity = p.hemiI + (p === PRESETS.night ? (tweak.moon ?? 0) : 0);
    this.lantern.intensity = p.lantern;
    this.lantern.visible = p.lantern > 0;
    this.scene.background = new THREE.Color(p.clear);
    this.renderer.shadowMap.enabled = opts.shadows;
    this.sun.castShadow = opts.shadows;
    this.bloom.enabled = opts.bloom;
    this.fxaa.enabled = opts.smooth ?? true;
    this.bloom.strength = p.bloom;
    this.final.uniforms.uTilt!.value = opts.tilt ? 1 : 0;
    this.final.uniforms.uSat!.value = p.sat + tweak.sat;
    this.final.uniforms.uWarm!.value = p.warm + tweak.warm;
    this.final.uniforms.uFog!.value = tweak.fog * (p === PRESETS.night ? 0.6 : 1);
    (this.final.uniforms.uFogCol!.value as THREE.Color).set(tweak.fogTint);
    this.final.uniforms.uDim!.value = p === PRESETS.night ? 1 : (tweak.dim ?? 1);
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m) m.needsUpdate = true;
    });
  }

  /** Keeps the sun and its shadow box over what the camera looks at, and the lantern over the party. */
  follow(target: THREE.Vector3, party: THREE.Vector3) {
    const d = this.preset.sunDir;
    this.sun.position.set(target.x + d[0] * 30, target.y + d[1] * 30, target.z + d[2] * 30);
    this.sun.target.position.copy(target);
    this.lantern.position.set(party.x, party.y + 2.2, party.z + 0.6);
  }
}
