// Post-processing of the 3D layer (decision 059): the effects are drawn into an HDR target, the bright parts are blurred into a bloom,
// the sum is soft-clipped keeping its hue (stacked additive layers no longer burn to white) and written to the canvas as two halves:
// the top half is the "paint" (premultiplied colour that covers what is behind it), the bottom half the "light" (what must be ADDED
// to the screen: additive effects and the bloom). A 2D canvas cannot hold colour brighter than its alpha, hence the split.
import * as THREE from 'three';

const FS_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;

/** Keeps what is brighter than the knee (soft), sampling 4 taps (the target is half the size of the source). */
const PREFILTER_FRAG = `
varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uKnee;
void main(){
  vec3 c=vec3(0.);
  c+=texture2D(tSrc,vUv+uTexel*vec2(-.5,-.5)).rgb; c+=texture2D(tSrc,vUv+uTexel*vec2(.5,-.5)).rgb;
  c+=texture2D(tSrc,vUv+uTexel*vec2(-.5,.5)).rgb; c+=texture2D(tSrc,vUv+uTexel*vec2(.5,.5)).rgb; c*=.25;
  float m=max(c.r,max(c.g,c.b));
  float k=smoothstep(uKnee,uKnee+.45,m);
  gl_FragColor=vec4(c*k,1.);
}`;
/** One direction of a 9-tap gaussian (5 bilinear fetches). */
const BLUR_FRAG = `
varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uDir;
void main(){
  vec3 c=texture2D(tSrc,vUv).rgb*.227;
  c+=(texture2D(tSrc,vUv+uDir*1.385).rgb+texture2D(tSrc,vUv-uDir*1.385).rgb)*.316;
  c+=(texture2D(tSrc,vUv+uDir*3.231).rgb+texture2D(tSrc,vUv-uDir*3.231).rgb)*.07;
  gl_FragColor=vec4(c,1.);
}`;
const COPY_FRAG = `varying vec2 vUv; uniform sampler2D tSrc; void main(){ gl_FragColor=vec4(texture2D(tSrc,vUv).rgb,1.); }`;
const FINAL_FRAG = `
varying vec2 vUv; uniform sampler2D tScene, tB0, tB1, tB2; uniform float uBloom;
vec3 tone(vec3 c){
  float m=max(c.r,max(c.g,c.b));
  if(m<=.82) return c;
  float t=.82+.18*(1.-exp(-(m-.82)/.42));
  vec3 kept=c*(t/m);
  // Far over the top the colour heats toward white (a core), but never all the way: the hue survives.
  return mix(kept,vec3(t),smoothstep(1.5,4.,m)*.55);
}
void main(){
  vec2 uv=vec2(vUv.x,fract(vUv.y*2.));
  vec4 s=texture2D(tScene,uv);
  vec3 bloom=(texture2D(tB0,uv).rgb*.5+texture2D(tB1,uv).rgb*.34+texture2D(tB2,uv).rgb*.3)*uBloom;
  float a=clamp(s.a,0.,1.);
  vec3 total=tone(max(s.rgb,0.)+bloom);
  vec3 paint=min(total,vec3(a));
  if(vUv.y>=.5) gl_FragColor=vec4(paint,a);
  else gl_FragColor=vec4(total-paint,1.);
}`;

interface Mip {
  a: THREE.WebGLRenderTarget;
  b: THREE.WebGLRenderTarget;
}

export class Post3d {
  private readonly cam = new THREE.Camera();
  private readonly fs = new THREE.Scene();
  private readonly quad: THREE.Mesh;
  private readonly mat: Record<'pre' | 'blur' | 'copy' | 'final', THREE.ShaderMaterial>;
  private target: THREE.WebGLRenderTarget | null = null;
  private mips: Mip[] = [];
  private readonly type: THREE.TextureDataType;
  private w = 0;
  private h = 0;
  private samples = -1;

  constructor(private readonly r: THREE.WebGLRenderer) {
    const mk = (frag: string, uniforms: Record<string, THREE.IUniform>) => new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
    this.mat = {
      pre: mk(PREFILTER_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uKnee: { value: 0.9 } }),
      blur: mk(BLUR_FRAG, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }),
      copy: mk(COPY_FRAG, { tSrc: { value: null } }),
      final: mk(FINAL_FRAG, { tScene: { value: null }, tB0: { value: null }, tB1: { value: null }, tB2: { value: null }, uBloom: { value: 1 } }),
    };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat.copy);
    this.quad.frustumCulled = false;
    this.fs.add(this.quad);
    const float = r.capabilities.isWebGL2 && (r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float'));
    this.type = float ? THREE.HalfFloatType : THREE.UnsignedByteType;
  }

  /** Sizes the targets for a `w × h` picture; `samples` is the scene's multisampling (0 = none). */
  setSize(w: number, h: number, samples: number) {
    if (w === this.w && h === this.h && samples === this.samples) return;
    this.w = w;
    this.h = h;
    this.samples = samples;
    this.free();
    const rt = (ww: number, hh: number, depth: boolean, smp = 0) => new THREE.WebGLRenderTarget(Math.max(2, ww), Math.max(2, hh), { type: this.type, format: THREE.RGBAFormat, depthBuffer: depth, samples: smp, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    this.target = rt(w, h, true, samples);
    this.mips = [2, 4, 8].map((k) => ({ a: rt(Math.round(w / k), Math.round(h / k), false), b: rt(Math.round(w / k), Math.round(h / k), false) }));
  }

  private pass(mat: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget | null) {
    this.quad.material = mat;
    this.r.setRenderTarget(to);
    this.r.render(this.fs, this.cam);
  }

  /** Draws `scene` and writes the two halves to the canvas; `bloom` 0 skips the blur chain. */
  render(scene: THREE.Scene, cam: THREE.Camera, bloom: number) {
    const t = this.target;
    if (!t) return;
    const r = this.r;
    r.setRenderTarget(t);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(scene, cam);
    const u = this.mat;
    if (bloom > 0) {
      u.pre.uniforms.tSrc!.value = t.texture;
      (u.pre.uniforms.uTexel!.value as THREE.Vector2).set(1 / t.width, 1 / t.height);
      this.pass(u.pre, this.mips[0]!.a);
      this.mips.forEach((m, i) => {
        if (i > 0) {
          u.copy.uniforms.tSrc!.value = this.mips[i - 1]!.a.texture;
          this.pass(u.copy, m.a);
        }
        u.blur.uniforms.tSrc!.value = m.a.texture;
        (u.blur.uniforms.uDir!.value as THREE.Vector2).set(1 / m.a.width, 0);
        this.pass(u.blur, m.b);
        u.blur.uniforms.tSrc!.value = m.b.texture;
        (u.blur.uniforms.uDir!.value as THREE.Vector2).set(0, 1 / m.a.height);
        this.pass(u.blur, m.a);
      });
    }
    u.final.uniforms.tScene!.value = t.texture;
    u.final.uniforms.tB0!.value = this.mips[0]!.a.texture;
    u.final.uniforms.tB1!.value = this.mips[1]!.a.texture;
    u.final.uniforms.tB2!.value = this.mips[2]!.a.texture;
    u.final.uniforms.uBloom!.value = bloom;
    this.pass(u.final, null);
  }

  private free() {
    this.target?.dispose();
    for (const m of this.mips) {
      m.a.dispose();
      m.b.dispose();
    }
    this.target = null;
    this.mips = [];
  }

  dispose() {
    this.free();
    this.quad.geometry.dispose();
    for (const m of Object.values(this.mat)) m.dispose();
  }
}
