// Parts of the water effects (decision 059): a liquid material for solid shapes (a body of deep blue with a white rim and bands of
// light running through it), a ring-shaped wave with a curling, foaming crest, a splash crown, a wet pool on the ground and a whirl
// of water in the air. Painted in a few flat tones (glsl.ts ramps); the foam is brighter than white so the bloom catches it.
import * as THREE from 'three';
import { NOISE, RAMPS, UV_VERT } from './glsl';
import { lightBlend } from './quads';

type U = Record<string, { value: number }>;

const LIQUID_VERT = `
varying vec3 vN; varying vec3 vP; varying vec3 vV;
void main(){ vN=normalize(normalMatrix*normal); vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const LIQUID_FRAG = `
${NOISE}${RAMPS}
varying vec3 vN; varying vec3 vP; varying vec3 vV; uniform float uT, uFade, uGlow;
void main(){
  float rim=pow(1.-abs(dot(normalize(vN),normalize(vV))),1.7);
  float flow=fbm(vec2(vP.x*2.2+vP.z*1.3, vP.y*1.4-uT*1.8));
  float bands=smoothstep(.52,.6,flow)*(1.-smoothstep(.66,.74,flow));
  vec3 col=waterRamp(.2+.3*flow+.35*rim);
  col+=vec3(.6,.85,1.)*bands*.4;
  col=mix(col,vec3(.95,1.,1.),smoothstep(.6,.95,rim));
  col*=1.+uGlow*1.2;
  gl_FragColor=vec4(col,(.86+.14*rim)*uFade);
}`;
/** Water with a body: for a solid mesh (the trident). `set(sec, fade, glow)`: `glow` > 0 heats the rim (a flash). */
export function liquid() {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 1 }, uGlow: { value: 0 } }, vertexShader: LIQUID_VERT, fragmentShader: LIQUID_FRAG, transparent: true });
  const u = mat.uniforms as U;
  return {
    mat,
    set(sec: number, fade: number, glow = 0) {
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uGlow!.value = glow;
    },
  };
}

const WAVE_VERT = `
varying vec2 vUv; varying float vY; varying float vA;
uniform float uR, uH, uT, uCurl, uSpikes;
${NOISE}
void main(){
  vUv=uv; float y=uv.y; float ang=uv.x*6.2832; vY=y; vA=ang;
  // The crest height wobbles round the ring and, for a splash crown, breaks into spikes.
  float wob=1.+.16*sin(ang*7.+uT*8.)+.1*sin(ang*13.-uT*5.);
  float spike=mix(1.,.55+.9*vnoise(vec2(ang*3.2,uT*1.5)),uSpikes);
  float hgt=uH*wob*spike;
  // The wall leans outward and its top curls over ahead of it.
  float rad=uR*(1.+.02*sin(ang*5.+uT*3.))+uCurl*uH*(y*y*.9+smoothstep(.6,1.,y)*.35);
  float drop=smoothstep(.72,1.,y)*uCurl*.3;
  vec3 pos=vec3(cos(ang)*rad, y*hgt*(1.-drop), sin(ang)*rad);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
}`;
const WAVE_FRAG = `
${NOISE}${RAMPS}
varying vec2 vUv; varying float vY; varying float vA; uniform float uFade, uT, uR;
void main(){
  float n=fbm(vec2(vA*2.6*max(1.,uR), vY*3.-uT*2.4));
  float streak=fbm(vec2(vA*9.*max(1.,uR*.6), vY*1.5-uT*4.));
  float h=.08+.4*vY+.2*n;
  vec3 col=waterRamp(h);
  // Foam: a broken white band at the crest and streaks torn down the face.
  float crest=smoothstep(.76,.9,vY+.16*n);
  float lines=smoothstep(.64,.74,streak)*smoothstep(.2,.55,vY)*.45;
  col=mix(col,vec3(.94,1.,1.),clamp(crest+lines,0.,1.));
  float foot=smoothstep(0.,.1,vY);
  float top=1.-smoothstep(.93,1.,vY+.05*n);
  float al=(.58+.42*crest)*foot*top*uFade;
  gl_FragColor=vec4(col,al);
}`;
export interface WaveRing {
  mesh: THREE.Mesh;
  /** World radius and height, seconds, fade 0..1. */
  set(radius: number, height: number, sec: number, fade: number): void;
}
/** A wall of water standing on a ring (scale the mesh in x / z to flatten the ring). `curl`: how far the crest leans out; `spikes` 1 = a splash crown. */
export function waveRing(root: THREE.Object3D, curl = 0.4, spikes = 0): WaveRing {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 1 }, uH: { value: 1 }, uT: { value: 0 }, uCurl: { value: curl }, uSpikes: { value: spikes }, uFade: { value: 0 } },
    vertexShader: WAVE_VERT, fragmentShader: WAVE_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 128, 14, true), mat);
  mesh.visible = false;
  mesh.frustumCulled = false;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(radius, height, sec, fade) {
      mesh.visible = fade > 0.01 && height > 0.005;
      u.uR!.value = radius;
      u.uH!.value = Math.max(0.001, height);
      u.uT!.value = sec;
      u.uFade!.value = fade;
    },
  };
}

const POOL_FRAG = `
${NOISE}${RAMPS}
varying vec2 vUv; uniform float uT, uFade, uGrow;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  float edge=uGrow*(.82+.14*fbm(vec2(a*2.2,uT*.4)));
  float body=1.-smoothstep(edge-.06,edge,r);
  // Rings running outward and a rim of foam at the water's edge.
  float rings=smoothstep(.75,1.,sin(r*26.-uT*9.)*.5+.5)*smoothstep(.1,.5,r);
  float foam=smoothstep(edge-.16,edge-.02,r)*body*(.55+.45*fbm(vec2(a*6.,r*8.-uT)));
  vec3 col=waterRamp(.18+.25*fbm(p*3.+uT*.3)+rings*.25);
  col=mix(col,vec3(.92,1.,1.),clamp(foam+rings*.25,0.,1.));
  gl_FragColor=vec4(col,body*(.42+.45*foam)*uFade);
}`;
/** A sheet of water lying on the ground, its foamy edge creeping outward: `set(grow 0..1, sec, fade)`. */
export function pool(root: THREE.Object3D, width: number, depth: number) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uGrow: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: POOL_FRAG, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  mesh.scale.set(width, depth, 1);
  mesh.visible = false;
  mesh.renderOrder = -2;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(grow: number, sec: number, fade: number) {
      mesh.visible = fade > 0.01 && grow > 0.01;
      u.uGrow!.value = grow;
      u.uT!.value = sec;
      u.uFade!.value = fade;
    },
  };
}

const WHIRL_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uT, uFade, uTight;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  // Arms of a spiral, wound tighter as the water is drawn in.
  float arms=sin(a*3.+r*(7.+uTight*6.)-uT*7.)*.5+.5;
  float n=fbm(vec2(a*2.+uT*1.5,r*4.-uT*2.));
  float band=smoothstep(.45,.8,arms*.7+n*.5);
  float disc=smoothstep(1.,.72,r)*smoothstep(.04,.2,r);
  vec3 col=mix(vec3(.12,.5,1.),vec3(.8,1.,1.15),band);
  gl_FragColor=vec4(col,band*disc*uFade);
}`;
/** A whirl of water as light (a flat disc: lay it down or stand it up): `set(sec, fade, tight 0..1)`. */
export function whirl(root: THREE.Object3D) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uTight: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: WHIRL_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  lightBlend(mat);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(sec: number, fade: number, tight = 0) {
      mesh.visible = fade > 0.01;
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uTight!.value = tight;
    },
  };
}

const BUBBLE_FRAG = `
varying vec3 vN; varying vec3 vP; varying vec3 vV; uniform float uT, uFade;
void main(){
  vec3 n=normalize(vN); float f=1.-abs(dot(n,normalize(vV)));
  // A thin skin: clear in the middle, a bright rim whose colour slides round like oil on water.
  float rim=pow(f,2.2);
  vec3 oil=.6+.4*cos(6.2832*(f*1.3+vP.y*.6+uT*.25)+vec3(0.,2.1,4.2));
  vec3 col=mix(vec3(.35,.72,1.),oil,.45)*(.55+.9*rim);
  float spec=smoothstep(.9,.97,dot(n,normalize(vec3(-.45,.7,.55))));
  float spec2=smoothstep(.95,.99,dot(n,normalize(vec3(.5,-.45,.7))))*.5;
  col+=vec3(1.3)*(spec+spec2);
  gl_FragColor=vec4(col,(.16+.75*rim+spec+spec2)*uFade);
}`;
/** A soap-bubble skin for a sphere: `set(sec, fade)`. */
export function bubbleSkin() {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 1 } }, vertexShader: LIQUID_VERT, fragmentShader: BUBBLE_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const u = mat.uniforms as U;
  return {
    mat,
    set(sec: number, fade: number) {
      u.uT!.value = sec;
      u.uFade!.value = fade;
    },
  };
}

const SURGE_FRAG = `
${NOISE}${RAMPS}
varying vec2 vUv; uniform float uT, uFade, uCurl;
void main(){
  float x=vUv.x, y=vUv.y;
  // Seen from the side: the back of the wave climbs to a crest near the front, which leans over and curls.
  float back=smoothstep(0.,.72,x);
  float n=fbm(vec2(x*5.-uT*1.5,y*3.+uT));
  float top=.18+.62*pow(back,1.6)+.05*n;
  float front=.86+.1*uCurl*smoothstep(.45,.95,y)-.16*smoothstep(.0,.5,y)*(1.-y);
  float body=smoothstep(top,top-.04,y)*smoothstep(front,front-.03,x)*smoothstep(0.,.05,x+y*.3);
  // The curl: a lip hanging ahead of the face, hollow underneath.
  vec2 c=vec2(.8+.06*uCurl,.74); float lip=smoothstep(.17,.14,length((vUv-c)*vec2(1.,1.25)))*step(.62,y);
  float hollow=smoothstep(.1,.07,length((vUv-vec2(.86+.06*uCurl,.6))*vec2(1.,1.2)));
  float shape=clamp(max(body,lip)-hollow*uCurl,0.,1.);
  vec3 col=waterRamp(.1+.42*y+.18*n);
  float streak=fbm(vec2(x*3.-uT*2.+y*2.,y*9.));
  float foam=clamp(smoothstep(top-.1,top-.02,y)+lip*smoothstep(.66,.8,y)+smoothstep(.62,.72,streak)*.4*y,0.,1.);
  col=mix(col,vec3(.94,1.,1.),foam);
  gl_FragColor=vec4(col,shape*(.62+.38*foam)*uFade);
}`;
/** A great wave seen from the side, travelling toward +x of its plane (flip the mesh's x scale to turn it): `set(sec, fade, curl 0..1)`. */
export function surge(root: THREE.Object3D) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uCurl: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: SURGE_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(-0.36, 0.5, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -0.3;
  mesh.visible = false;
  mesh.renderOrder = 4;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(sec: number, fade: number, curl: number) {
      mesh.visible = fade > 0.01;
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uCurl!.value = curl;
    },
  };
}
