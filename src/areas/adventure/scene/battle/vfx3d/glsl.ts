// GLSL pieces the 3D effects share (decision 059): hashes, value noise, fbm, a billboard-free full-screen vertex stage and the colour
// ramps of the elements. Colours are display-referred (the layer runs with colour management off): a literal is what the screen shows.

/** Hash, value noise and fbm in 2D and 3D. `fbm` is 4 octaves, `fbm3` 3 octaves (scroll the third coordinate for time). */
export const NOISE = `
float hash11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float hash21(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float hash31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y); }
float vnoise3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y);
  float b=mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y);
  return mix(a,b,f.z); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return s; }
float fbm3(vec3 p){ float s=0., a=.5; for(int i=0;i<3;i++){ s+=a*vnoise3(p); p=p*2.02+vec3(11.7,5.3,7.9); a*=.5; } return s; }
`;

/** Vertex stage of a plain mesh that hands `vUv` on. */
export const UV_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;

/**
 * Colour ramps by "heat" h in 0..1 (0 = edge / cold, 1 = core / hot). Each steps through a few painted tones with soft joins, so an
 * effect reads as flat-shaded art, not as a photographic gradient.
 */
export const RAMPS = `
vec3 ramp4(float h, vec3 c0, vec3 c1, vec3 c2, vec3 c3){
  vec3 c=mix(c0,c1,smoothstep(.12,.34,h)); c=mix(c,c2,smoothstep(.42,.62,h)); return mix(c,c3,smoothstep(.72,.92,h)); }
vec3 fireRamp(float h){ return ramp4(h, vec3(.62,.07,.03), vec3(1.,.36,.05), vec3(1.,.72,.16), vec3(1.,.97,.78)); }
vec3 waterRamp(float h){ return ramp4(h, vec3(.03,.2,.52), vec3(.1,.5,.92), vec3(.36,.8,1.), vec3(.93,1.,1.)); }
vec3 boltRamp(float h){ return ramp4(h, vec3(.5,.3,.02), vec3(1.,.78,.1), vec3(1.,.94,.5), vec3(1.,1.,.96)); }
`;
