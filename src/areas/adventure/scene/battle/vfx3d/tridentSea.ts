// "Đinh Ba Hải Vương" in 3D (prototype, decision 059): water gathers in the sky, a trident of light falls on the middle of the foes' row,
// and on landing a crown of drops leaps up while three walls of water ("a million waves") sweep outward over the ground, ripples
// running ahead of them. Timeline in ms (the skill's impact is at 1100): gather 0–550, fall 550–1100, impact 1100, waves 1100–2500.
import * as THREE from 'three';
import { POINT_SCALE, RIPPLE_FRAG, RIPPLE_VERT, clamp, easeOut, easeOut3, rng, smooth, sprite } from './effectParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const IMPACT = 1100;
/** A wall of water in the shape of a ring: its height and reach come from uniforms, its crest curls outward and glows white. */
const WAVE_VERT = `
varying vec2 vUv; varying float vY;
uniform float uR, uH, uT, uLean;
void main(){
  vUv=uv; float y01=uv.y; float ang=uv.x*6.2832; vY=y01;
  float wob=1.+.2*sin(ang*9.+uT*9.)+.12*sin(ang*17.-uT*6.);
  float rad=uR+uLean*y01*y01*uH*.9;
  vec3 pos=vec3(cos(ang)*rad, y01*uH*wob, sin(ang)*rad);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
}`;
const WAVE_FRAG = `
varying vec2 vUv; varying float vY; uniform float uFade, uT; uniform vec3 uDeep, uMid, uFoam;
void main(){
  float ang=vUv.x*6.2832;
  float bands=.5+.5*sin(vY*16.-uT*7.+ang*3.);
  vec3 col=mix(uDeep,uMid,smoothstep(0.,.7,vY));
  col+=bands*.07;
  float crest=smoothstep(.72,.97,vY+.05*sin(ang*22.+uT*11.));
  col=mix(col,uFoam,crest);
  float rim=smoothstep(0.,.12,vY);
  float al=(.78+.2*crest)*rim*uFade*(1.-smoothstep(.97,1.,vY)*.5);
  gl_FragColor=vec4(col,al);
}`;

export function tridentSea(env: Vfx3dEnv): Vfx3dHandle {
  const U = env.unit;
  const root = new THREE.Group();
  root.position.copy(env.origin);
  env.scene.add(root);
  const rand = rng(7);
  const cyan = new THREE.Color(0x4cc8ff);

  // ---- the trident (about 2.8 units tall at scale 1, tip down) ----
  const tri = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xe6f4ff, metalness: 0.6, roughness: 0.3, emissive: 0x1f7fd6, emissiveIntensity: 0.55, transparent: true });
  const part = (geo: THREE.BufferGeometry, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, steel);
    m.position.set(x, y, z);
    tri.add(m);
    return m;
  };
  part(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 14), 0, 1.2, 0);
  part(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 14), 0, 2.38, 0);
  // Three prongs at the top: the middle one straight, the sides curved up and out.
  part(new THREE.ConeGeometry(0.2, 0.8, 12), 0, 2.88, 0);
  for (const s of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(s * 0.32, 2.45, 0), new THREE.Vector3(s * 0.55, 2.62, 0), new THREE.Vector3(s * 0.55, 2.95, 0)]);
    part(new THREE.TubeGeometry(curve, 20, 0.1, 10));
    const tip = part(new THREE.ConeGeometry(0.16, 0.6, 12), s * 0.55, 3.2, 0);
    tip.rotation.z = 0;
  }
  // Invert: the trident falls point down, so the whole group is turned upside down around its middle.
  tri.rotation.z = Math.PI;
  const triHolder = new THREE.Group();
  triHolder.add(tri);
  tri.position.y = 3.1;
  root.add(triHolder);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: cyan, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  root.add(halo);
  const triPointLight = new THREE.PointLight(0x4cc8ff, 0, 7 * U, 1.6);
  root.add(triPointLight);

  // ---- ripples on the ground ----
  const rippleMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uCol: { value: new THREE.Color(0x2a9bff) }, uFoam: { value: new THREE.Color(0xe8fbff) } },
    vertexShader: RIPPLE_VERT,
    fragmentShader: RIPPLE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ripple = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.y = 0.02;
  ripple.scale.set(4.4 * U, 4.4 * U * 0.8, 1);
  root.add(ripple);

  // ---- the walls of water ----
  const waveGeo = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true);
  const waves = [0, 1, 2].map((i) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uR: { value: 0 }, uH: { value: 0 }, uT: { value: 0 }, uLean: { value: 0.35 }, uFade: { value: 0 },
        uDeep: { value: new THREE.Color(0x0a4a9a) }, uMid: { value: new THREE.Color(0x2fa8ec) }, uFoam: { value: new THREE.Color(0xf2fdff) },
      },
      vertexShader: WAVE_VERT,
      fragmentShader: WAVE_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(waveGeo, mat);
    m.scale.set(1.25, 1, 0.9);
    m.visible = false;
    root.add(m);
    return { m, mat, start: IMPACT + i * 150, len: 1250 + i * 120, reach: (0.85 + i * 0.4) * U, peak: Math.max(0.55, (0.62 - i * 0.1) * U) };
  });
  // A column of water thrown up at the point of impact.
  const colMat = waves[0]!.mat.clone();
  colMat.uniforms.uLean = { value: -0.1 };
  const column = new THREE.Mesh(waveGeo, colMat);
  column.visible = false;
  root.add(column);

  // ---- drops: the crown at the impact, the spray riding the waves, the gathering sky ----
  const dropTex = sprite();
  const mkPoints = (n: number, size: number, color: number, add = true) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: dropTex, size: size * POINT_SCALE, color, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true, opacity: 0.9 }));
    pts.frustumCulled = false;
    root.add(pts);
    return { pts, pos: geo.attributes.position as THREE.BufferAttribute, n };
  };
  const crown = mkPoints(240, 0.16 * U, 0xdff6ff);
  const crownSeed = Array.from({ length: crown.n }, () => [rand() * 6.2832, 1.2 + rand() * 3.4, 3 + rand() * 5.5, rand() * 120] as const);
  const spray = mkPoints(260, 0.11 * U, 0xf2fdff);
  const spraySeed = Array.from({ length: spray.n }, (_, i) => [rand() * 6.2832, 0.35 + rand() * 0.65, rand(), i % 3] as const);
  const sky = mkPoints(140, 0.05 * U, 0x9fe0ff);
  const skySeed = Array.from({ length: sky.n }, () => [rand() * 6.2832, 0.6 + rand() * 1.6, rand(), rand() * 0.5] as const);

  const SKY_Y = 3.6;
  const TRI = 0.95; // the trident is about 3.3 world units tall: three times a fighter
  return {
    update(ms: number) {
      // -- trident: appears while the water gathers, falls with gravity-like acceleration, sticks in the ground, then dissolves --
      const appear = smooth(150, 520, ms);
      const fall = clamp((ms - 550) / (IMPACT - 550));
      const y = SKY_Y * (1 - fall * fall * fall) + 0.05 * fall - smooth(1700, 2500, ms) * 0.9;
      const sc = TRI * (0.5 + 0.5 * appear);
      triHolder.position.set(0, y, 0);
      triHolder.scale.setScalar(sc);
      triHolder.rotation.y = ms * 0.0012;
      steel.opacity = appear * (1 - smooth(1900, 2500, ms));
      steel.emissiveIntensity = 0.55 + 1.3 * Math.exp(-Math.max(0, ms - IMPACT) / 260) + 0.15 * Math.sin(ms * 0.012);
      triHolder.visible = steel.opacity > 0.01;
      const haloS = (ms < IMPACT ? 0.5 + fall * 0.4 : 0.5 + 0.8 * Math.exp(-(ms - IMPACT) / 220)) * 2.2 * appear;
      halo.position.set(0, y + sc * 0.4, 0);
      halo.scale.set(haloS, haloS, 1);
      (halo.material as THREE.SpriteMaterial).opacity = 0.9 * (1 - smooth(1500, 2300, ms));
      triPointLight.position.set(0, y + sc * 0.4, 0);
      triPointLight.intensity = 3.5 * U * (ms < IMPACT ? appear * 0.7 : Math.exp(-(ms - IMPACT) / 380));

      // -- ground ripples --
      const rt = (ms - IMPACT) / 1000;
      ripple.visible = rt > 0;
      rippleMat.uniforms.uT!.value = Math.max(0, rt);
      rippleMat.uniforms.uFade!.value = smooth(0, 120, ms - IMPACT) * (1 - smooth(1500, 2600, ms - IMPACT));

      // -- the three walls --
      for (const w of waves) {
        const u = (ms - w.start) / w.len;
        w.m.visible = u > 0 && u < 1;
        if (!w.m.visible) continue;
        const rr = 0.08 * U + w.reach * easeOut3(u);
        const h = w.peak * Math.sin(Math.PI * Math.min(1, u * 0.85 + 0.0)) ** 0.7 * (1 - 0.25 * u);
        const uni = w.mat.uniforms as Record<string, { value: number }>;
        uni.uR!.value = rr;
        uni.uH!.value = Math.max(0.001, h);
        uni.uT!.value = ms / 1000;
        uni.uFade!.value = smooth(0, 0.12, u) * (1 - smooth(0.7, 1, u));
      }
      const cu = (ms - IMPACT) / 900;
      column.visible = cu > 0 && cu < 1;
      if (column.visible) {
        const rr = (0.12 + 0.12 * U) * (1 + 0.5 * cu);
        const h = (0.5 + 0.9 * U) * Math.sin(Math.PI * Math.min(1, cu * 0.8)) ** 0.6;
        const uni = colMat.uniforms as Record<string, { value: number }>;
        uni.uR!.value = rr;
        uni.uH!.value = Math.max(0.001, h);
        uni.uT!.value = ms / 1000;
        uni.uFade!.value = smooth(0, 0.1, cu) * (1 - smooth(0.6, 1, cu));
      }

      // -- crown of drops: ballistic from the impact --
      const ct = Math.max(0, ms - IMPACT) / 1000;
      for (let i = 0; i < crown.n; i++) {
        const [a, vh, vy, delay] = crownSeed[i]!;
        const t = ct - delay / 1000;
        if (t <= 0 || t > 1.5) {
          crown.pos.setXYZ(i, 0, -50, 0);
          continue;
        }
        const x = Math.cos(a) * vh * t * U * 0.3 * 1.25;
        const z = Math.sin(a) * vh * t * U * 0.3 * 0.9;
        const yy = Math.max(0, (vy * t - 4.9 * t * t) * U * 0.26);
        crown.pos.setXYZ(i, x, yy, z);
      }
      crown.pos.needsUpdate = true;
      (crown.pts.material as THREE.PointsMaterial).opacity = 0.9 * (1 - smooth(1100, 1500, ms - IMPACT));

      // -- spray riding the three wave fronts --
      for (let i = 0; i < spray.n; i++) {
        const [a, hh, r2, k] = spraySeed[i]!;
        const w = waves[k]!;
        const u = (ms - w.start) / w.len;
        if (u <= 0 || u >= 1) {
          spray.pos.setXYZ(i, 0, -50, 0);
          continue;
        }
        const rr = 0.08 * U + w.reach * easeOut3(u);
        const h = w.peak * Math.sin(Math.PI * Math.min(1, u * 0.85)) ** 0.7;
        const lift = h * (hh + 0.35 * r2) + 0.05 * U * Math.sin(ms * 0.01 + i);
        spray.pos.setXYZ(i, Math.cos(a) * rr * 1.25 * 1.04, lift, Math.sin(a) * rr * 0.9 * 1.04);
      }
      spray.pos.needsUpdate = true;
      (spray.pts.material as THREE.PointsMaterial).opacity = 0.85 * (1 - smooth(2200, 2700, ms));

      // -- the gathering sky: drops spiral in toward the trident's start, then are gone --
      const gt = clamp(ms / 650);
      for (let i = 0; i < sky.n; i++) {
        const [a, r0, h0, off] = skySeed[i]!;
        const k = clamp(gt * 1.4 - off);
        const rad = r0 * U * 0.4 * (1 - easeOut(k));
        const ang = a + k * 6;
        sky.pos.setXYZ(i, Math.cos(ang) * rad, SKY_Y + (h0 - 0.5) * 0.4 * U * (1 - k), Math.sin(ang) * rad * 0.8);
      }
      sky.pos.needsUpdate = true;
      (sky.pts.material as THREE.PointsMaterial).opacity = 0.9 * smooth(0, 150, ms) * (1 - smooth(500, 900, ms));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
