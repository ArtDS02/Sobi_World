// "Sóng Thần Cổ" in 3D (prototype, decision 059): a breaking wave rises behind the caster's side, runs across the stage in a curl of
// foam, crashes over the foes' row (the skill's impact is at 1050 ms) and spills over the ground, spray flung up from its crest.
// Times are ms from the start of the act: rise 300–700, run 380–1050, crash 1050–1450, spill to 1900.
import * as THREE from 'three';
import { clamp, cloud, easeInOut, park, rng, ripple, smooth } from './effectParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const CRASH = 1050;
const WAVE_VERT = `
varying float vY; varying float vZ; varying float vX; uniform float uT;
void main(){
  vZ=position.z; vX=position.x;
  vec3 p=position;
  p.y*=1.+.14*sin(p.z*13.+uT*4.5)+.07*sin(p.z*29.-uT*6.);
  p.x+=.05*sin(p.z*9.+uT*5.)*p.y;
  vY=p.y;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const WAVE_FRAG = `
varying float vY; varying float vZ; varying float vX; uniform float uFade, uT; uniform vec3 uDeep, uMid, uFoam;
void main(){
  float y=clamp(vY,0.,1.1);
  vec3 col=mix(uDeep,uMid,smoothstep(0.,.5,y));
  col+=.07*(.5+.5*sin(y*18.-uT*7.+vZ*14.));
  float foam=smoothstep(.78,.99,y+.05*sin(vZ*26.+uT*10.));
  col=mix(col,uFoam,foam);
  gl_FragColor=vec4(col,(.74+.2*foam)*uFade*smoothstep(0.,.05,y+.02)*smoothstep(-1.,-.35,vX));
}`;

export function tsunamiSweep(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(23);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const depth = clamp(1.3 * env.unit, 2.4, 4.8);
  const startX = env.from.x + dir * 1.9;
  const endX = env.origin.x + dir * 0.5;

  // The cross-section of a breaking wave, front at x = 0, the curl hanging over it; extruded along the depth of the stage.
  const top = new THREE.SplineCurve([
    new THREE.Vector2(-1, 0), new THREE.Vector2(-0.72, 0.05), new THREE.Vector2(-0.48, 0.17), new THREE.Vector2(-0.28, 0.42), new THREE.Vector2(-0.12, 0.76),
    new THREE.Vector2(0.0, 0.98), new THREE.Vector2(0.14, 1.0), new THREE.Vector2(0.26, 0.9), new THREE.Vector2(0.27, 0.72), new THREE.Vector2(0.19, 0.54),
    new THREE.Vector2(0.1, 0.34), new THREE.Vector2(0.06, 0.14), new THREE.Vector2(0.05, 0),
  ]);
  const sh = new THREE.Shape(top.getPoints(72));
  sh.lineTo(-1, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, steps: 24 });
  geo.translate(0, 0, -0.5);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uDeep: { value: new THREE.Color(0x1a7fd0) }, uMid: { value: new THREE.Color(0x6fd4ff) }, uFoam: { value: new THREE.Color(0xf2fdff) } },
    vertexShader: WAVE_VERT,
    fragmentShader: WAVE_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wave = new THREE.Mesh(geo, mat);
  wave.visible = false;
  root.add(wave);
  const spray = cloud(root, 280, 0.13, 0xf2fdff);
  const seed = Array.from({ length: spray.n }, () => [rand() - 0.5, rand(), rand() * 6.2832, 1.5 + rand() * 3.5, 1.2 + rand() * 3] as const);
  const spill = ripple(root, depth * 1.7, depth * 1.2, 0x2a9bff, 0xe8fbff);

  return {
    update(ms: number) {
      // Front position: runs from the caster's side to the row; after the crash it slows to a stop.
      const run = clamp((ms - 380) / (CRASH - 380));
      const front = startX + (endX - startX) * easeInOut(run) + dir * 0.9 * smooth(CRASH, CRASH + 500, ms);
      const rise = smooth(300, 760, ms);
      const crash = clamp((ms - CRASH) / 420);
      const H = 0.5 + 1.1 * rise;
      const h = H * (1 - crash * crash * 0.92);
      const L = 1.7 + 1.3 * crash;
      wave.visible = ms > 300 && ms < 1750;
      wave.position.set(front, 0, env.origin.z);
      wave.scale.set(dir * L, Math.max(0.001, h), depth);
      const u = mat.uniforms as Record<string, { value: number }>;
      u.uT!.value = ms / 1000;
      u.uFade!.value = smooth(300, 460, ms) * (1 - smooth(1400, 1750, ms));

      // Spray: rides the crest while the wave runs, then is flung up and over when it crashes.
      const ct = Math.max(0, ms - CRASH) / 1000;
      for (let i = 0; i < spray.n; i++) {
        const [zr, k, ang, vy, vh] = seed[i]!;
        if (ms < 420 || ct > 1.3) {
          park(spray, i);
          continue;
        }
        const crestY = H * (0.8 + 0.25 * k);
        if (ct <= 0) {
          spray.pos.setXYZ(i, front + dir * 0.05 - dir * k * 0.5, crestY + 0.1 * Math.sin(ms * 0.012 + i), env.origin.z + zr * depth);
          continue;
        }
        const t = ct - k * 0.12;
        if (t <= 0) {
          spray.pos.setXYZ(i, front + dir * 0.05, crestY, env.origin.z + zr * depth);
          continue;
        }
        spray.pos.setXYZ(i, front + dir * (0.05 + vh * t * 0.55 * Math.cos(ang)), Math.max(0, crestY + vy * t * 0.7 - 4.9 * t * t * 0.9), env.origin.z + zr * depth + Math.sin(ang) * vh * t * 0.3);
      }
      spray.pos.needsUpdate = true;
      (spray.pts.material as THREE.PointsMaterial).opacity = 0.9 * smooth(420, 600, ms) * (1 - smooth(1900, 2350, ms));

      // The spill over the ground where it crashed.
      spill.mesh.position.set(env.origin.x, 0.02, env.origin.z);
      spill.set((ms - CRASH) / 1000, smooth(0, 120, ms - CRASH) * (1 - smooth(700, 1500, ms - CRASH)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
