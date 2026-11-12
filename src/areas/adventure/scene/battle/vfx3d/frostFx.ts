// The two cold skills of Water (decision 059). `ice_bloom` (Đóng Băng): snow spirals in on the foe, frost creeps over the ground
// under it, then a ring of ice crystals snaps up round it in a burst of flakes. `frost_breath` (Hơi Thở Băng): a cone of freezing
// breath rolls from the monster's mouth over the target, frost and small crystals where it lands. Neither draws the block of ice:
// the Frozen status draws that itself, only when the chance really lands. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, crystals, easeOut, easeOut3, smooth } from './effectParts';
import { burst, gather, h, type Rgb } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const ICE: Rgb = [0.75, 0.95, 1.25];
const SNOW: Rgb = [0.92, 0.98, 1];
const COLD: Rgb = [0.55, 0.78, 0.95];

const FROST_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uGrow, uFade;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  // Fern-like fingers of frost reaching out from the middle.
  float fingers=fbm(vec2(a*4.,r*3.))*.5+.25*sin(a*9.+r*6.);
  float edge=uGrow*(.55+.45*fingers);
  float body=1.-smoothstep(edge-.12,edge,r);
  float vein=smoothstep(.6,.9,fbm(vec2(a*9.,r*7.)));
  vec3 col=mix(vec3(.62,.84,1.),vec3(.97,1.,1.),vein*.8+smoothstep(edge-.25,edge,r)*.6);
  gl_FragColor=vec4(col,body*(.5+.4*vein)*uFade);
}`;
/** Frost creeping outward over the ground: call it with `(grow 0..1, fade)`. */
function frost(root: THREE.Object3D, at: THREE.Vector3, size: number) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uGrow: { value: 0 }, uFade: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: FROST_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.4, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(at.x, 0.02, at.z);
  mesh.renderOrder = -1;
  root.add(mesh);
  return (grow: number, fade: number) => {
    mesh.visible = fade > 0.01 && grow > 0.01;
    mat.uniforms.uGrow!.value = grow;
    mat.uniforms.uFade!.value = fade;
  };
}

export function iceBloom(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const chest = new THREE.Vector3(feet.x, env.tall * 0.5, feet.z);
  const patch = frost(root, feet, 3);
  const ring = shock(root, feet, 3.6, [0.5, 0.85, 1.2]);
  const holder = new THREE.Group();
  holder.position.copy(feet);
  root.add(holder);
  const ice = crystals(holder, 11, 0.62, 0.5, 0.75 + env.tall * 0.55, 31);
  const flakes = quads(root, Math.round(170 * env.quality), false, F.flake);
  const light = quads(root, Math.round(60 * env.quality) + 2, true, F.star);
  const HIT = 700;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const hit = ms - HIT;
      const half = Math.floor(flakes.n / 2);
      gather(flakes, 0, half, 1, { k: clamp(ms / 720), to: chest, radius: 2.6, turns: 1.3, size: 0.2, color: SNOW, frame: F.flake, tall: 2.6, alpha: 0.95 });
      burst(flakes, half, flakes.n - half, 2, { sec: hit / 1000, at: chest, life: 1, speed: 3.4, up: 3.2, grav: 3, drag: 2, size: 0.22, color: SNOW, to: COLD, frame: F.flake, alpha: 0.95 });
      flakes.flush();
      patch(easeOut3(clamp((ms - 150) / 620)) * 0.75 + 0.25 * easeOut(clamp(hit / 200)), smooth(150, 300, ms) * (1 - smooth(1150, 1450, ms)));
      ice.set(clamp(hit / 260), 1 - smooth(1050, 1400, ms), ms);
      holder.visible = hit > 0;
      ring(hit / 360, hit > 0 ? 1 - smooth(180, 360, hit) : 0);
      const g = hit >= 0 ? Math.exp(-hit / 110) : 0;
      light.put(0, chest.x, chest.y, chest.z, 1.6 + 2.4 * g, ICE[0], ICE[1], ICE[2], g);
      light.look(0, F.star, 0.3);
      light.put(1, chest.x, chest.y, chest.z, 1.4 + 1.5 * g, 0.5, 0.8, 1.2, g * 0.7);
      light.look(1, F.soft);
      // Glints dancing on the crystals while they stand.
      for (let i = 2; i < light.n; i++) {
        const t = ((ms - HIT - h(i, 0, 3) * 500) % 320) / 320;
        const on = hit > 60 && ms < 1300 && t > 0;
        if (!on) {
          light.hide(i);
          continue;
        }
        const a = h(i, 1, 3) * 6.2832;
        p.set(feet.x + Math.cos(a) * 0.75, 0.2 + h(i, 2, 3) * (0.6 + env.tall * 0.6), feet.z + Math.sin(a) * 0.5);
        light.put(i, p.x, p.y, p.z, 0.3 * Math.sin(Math.PI * t), ICE[0], ICE[1], ICE[2], 0.9);
        light.look(i, F.star, a);
      }
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function frostBreath(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const from = new THREE.Vector3(env.from.x + dir * 0.55, env.tall * 0.55, env.from.z);
  const feet = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const chest = new THREE.Vector3(feet.x, env.tall * 0.45, feet.z);
  const breath = quads(root, Math.round(150 * env.quality), false, F.smoke);
  const flakes = quads(root, Math.round(110 * env.quality), false, F.flake);
  const light = quads(root, Math.round(50 * env.quality), true, F.streak);
  const patch = frost(root, feet, 2.8);
  const holder = new THREE.Group();
  holder.position.copy(feet);
  root.add(holder);
  const ice = crystals(holder, 7, 0.6, 0.25, 0.35 + env.tall * 0.3, 37);
  const HIT = 850;
  const p = new THREE.Vector3();
  const v = new THREE.Vector3().subVectors(chest, from);
  return {
    update(ms) {
      // The breath: puffs leave the mouth one after the other, swell as they travel and pile up on the target.
      const stream = (q: typeof breath, i: number, seed: number, life: number) => {
        const t = (ms - 330 - h(i, 0, seed) * 620) / life;
        if (t <= 0 || t >= 1) {
          q.hide(i);
          return -1;
        }
        const e = easeOut(t);
        const wide = 0.1 + 0.95 * e;
        p.copy(from).addScaledVector(v, e * 1.08);
        p.y += (h(i, 1, seed) - 0.5) * wide + 0.12 * Math.sin(t * 9 + i);
        p.z += (h(i, 2, seed) - 0.5) * wide * 0.5;
        return t;
      };
      for (let i = 0; i < breath.n; i++) {
        const t = stream(breath, i, 1, 520);
        if (t < 0) continue;
        const c = 0.75 + 0.25 * h(i, 3, 1);
        breath.put(i, p.x, p.y, p.z, 0.35 + 1.0 * t, 0.78 * c, 0.92 * c, 1, 0.5 * smooth(0, 0.12, t) * (1 - smooth(0.6, 1, t)));
        breath.look(i, F.smoke, h(i, 4, 1) * 6.28 + t);
      }
      breath.flush();
      for (let i = 0; i < flakes.n; i++) {
        const t = stream(flakes, i, 2, 420);
        if (t < 0) continue;
        flakes.put(i, p.x, p.y, p.z, 0.16 + 0.1 * h(i, 3, 2), SNOW[0], SNOW[1], SNOW[2], 0.95 * (1 - smooth(0.8, 1, t)));
        flakes.look(i, F.flake, t * 6 + i);
      }
      flakes.flush();
      for (let i = 0; i < light.n; i++) {
        const t = stream(light, i, 3, 300);
        if (t < 0) continue;
        light.put(i, p.x, p.y, p.z, 0.12, ICE[0], ICE[1], ICE[2], 0.8 * (1 - t));
        light.stretch(i, v.x * 0.12, v.y * 0.12, v.z * 0.12);
        light.look(i, F.streak, 0, 0.4);
      }
      light.flush();
      patch(easeOut3(clamp((ms - 600) / 500)), smooth(600, 750, ms) * (1 - smooth(1200, 1480, ms)));
      ice.set(clamp((ms - HIT) / 240), 1 - smooth(1150, 1450, ms), ms);
      holder.visible = ms > HIT;
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
