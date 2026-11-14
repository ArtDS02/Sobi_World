// Dark skills on one foe, rebuilt on the shade parts (decision 059; the row-wide ones are in shadeArea.ts). `ink_spray` (Phun
// Mực): a jet of ink arcs from the caster, splats over the foe and runs down it into a puddle. `nightmare` (Ác Mộng): murk climbs
// behind the foe, a mask with burning eyes looms out of it, grins, and comes down over the foe. `shadow_bite` (Cắn Trong Bóng Tối):
// a pool of shadow slides under the foe and a maw rises out of it and snaps shut. `wraith_touch` (Chạm Hồn Ma): a pale hand
// reaches up out of the mist behind the foe and closes on it, drawing wisps out of it. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOut3, easeOutBack, smooth } from './effectParts';
import { h, rise } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import { stem } from './plantParts';
import { quads } from './quads';
import { INK, PALE, VIOLET, blot, maw, murk } from './shadeParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { shock } from './stormParts';

const TILT = -0.45;
const feetOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, 0, env.origin.z);
const chestOf = (env: Vfx3dEnv) => new THREE.Vector3(env.origin.x, env.tall * 0.5, env.origin.z);

export function inkSpray(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const from = new THREE.Vector3(env.from.x + dir * 0.55, env.tall * 0.55, env.from.z);
  const feet = feetOf(env);
  const face = new THREE.Vector3(feet.x, env.tall * 0.74, feet.z);
  const jet = quads(root, Math.round(130 * env.quality), false, F.drop);
  const paint = quads(root, Math.round(110 * env.quality), false, F.drop);
  const cover = murk(root, 3, 6);
  cover.mesh.position.set(face.x, face.y, face.z + 0.25);
  cover.mesh.rotation.x = TILT;
  const puddle = murk(root, 7, -1);
  puddle.mesh.position.set(feet.x, 0.02, feet.z);
  puddle.mesh.rotation.x = -Math.PI / 2;
  const HIT = 620;
  const p = new THREE.Vector3();
  const v = new THREE.Vector3().subVectors(face, from);
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // The jet: gobs leave the mouth for 300 ms and each takes 320 ms to arc across, fattest in the middle of the burst.
      for (let i = 0; i < jet.n; i++) {
        const t = (ms - 280 - h(i, 0, 1) * 300) / 340;
        if (t <= 0 || t >= 1) {
          jet.hide(i);
          continue;
        }
        const wide = 0.06 + 0.22 * t;
        p.copy(from).addScaledVector(v, t);
        p.y += Math.sin(t * Math.PI) * 0.9 + (h(i, 1, 1) - 0.5) * wide;
        p.z += (h(i, 2, 1) - 0.5) * wide;
        jet.put(i, p.x, p.y, p.z, 0.16 + 0.2 * h(i, 3, 1), INK[0], INK[1], INK[2] + 0.08 * h(i, 4, 1), 0.95);
        jet.stretch(i, v.x * 0.07, v.y * 0.07 + Math.cos(t * Math.PI) * 0.2, 0);
        jet.look(i, F.drop, 0, 0.6);
      }
      jet.flush();
      // The splat claps over the foe's head, sags and breaks up into drips quickly (the foe must show again within ~150 ms);
      // the drips run down its body into a puddle.
      cover.mesh.scale.setScalar((0.75 + env.tall * 0.32) * (1 + 0.06 * Math.sin(ms * 0.01)));
      cover.mesh.position.y = face.y - 0.3 * smooth(60, 400, hit);
      cover.set(sec, hit > 0 ? 0.92 * (1 - smooth(140, 360, hit)) : 0, easeOutBack(clamp(hit / 110)) * 0.85 * (1 - 0.35 * smooth(120, 360, hit)));
      const half = Math.floor(paint.n / 2);
      blot(paint, 0, half, null, 0, 0, 2, hit / 1000, face, 0.8);
      for (let i = half; i < paint.n; i++) {
        const t = (hit - 120 - h(i, 0, 3) * 380) / 560;
        if (t <= 0 || t >= 1) {
          paint.hide(i);
          continue;
        }
        paint.put(i, face.x + (h(i, 1, 3) - 0.5) * (0.5 + env.tall * 0.3), face.y - 0.1 - face.y * 0.9 * t * t, face.z + 0.3, 0.12 + 0.08 * h(i, 2, 3), INK[0], INK[1], INK[2] + 0.06, 0.95 * (1 - smooth(0.8, 1, t)));
        paint.stretch(i, 0, -0.1 - 0.25 * t, 0);
        paint.look(i, F.drop, 0, 0.55);
      }
      paint.flush();
      puddle.mesh.scale.set(2.6, 1.6, 1);
      puddle.set(sec, hit > 0 ? smooth(100, 300, hit) * (1 - smooth(560, 840, hit)) : 0, 0.3 + 0.65 * easeOut(clamp((hit - 100) / 400)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

const MASK_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uEyes, uGrin, uFade, uT;
void main(){
  vec2 p=(vUv-.5)*2.;
  // A long face, broad at the brow and drawn to a point at the chin; its outline wavers.
  float n=fbm(p*3.+vec2(0.,uT*.5));
  float crown=max(0.,p.y-.45)/.5;
  float w=(.74-.36*smoothstep(.1,-1.,p.y))*sqrt(max(0.,1.-crown*crown));
  float face=smoothstep(0.,.06,w-abs(p.x)+(n-.5)*.1)*smoothstep(.97,.9,abs(p.y));
  // Two slanted eyes that open, a crooked grin with teeth.
  vec2 e=vec2(abs(p.x)-.3,p.y-.22); e=mat2(.94,-.34,.34,.94)*e;
  float eyes=smoothstep(.02,-.02,length(e/vec2(.22,.11*uEyes+.005))-1.);
  float mouthY=-.42+.3*p.x*p.x;
  float teeth=abs(fract(p.x*5.)-.5)*.16;
  float grin=smoothstep(.02,-.02,abs(p.y-mouthY)-(.11*uGrin-teeth*uGrin))*step(abs(p.x),.5);
  float glow=clamp(eyes+grin,0.,1.);
  vec3 col=mix(vec3(.5,.3,.86),vec3(.07,.05,.13),smoothstep(.0,.16,w-abs(p.x)));
  col=mix(col,vec3(1.5,1.1,1.9),glow);
  gl_FragColor=vec4(col,face*uFade);
}`;

export function nightmare(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const feet = feetOf(env);
  const chest = chestOf(env);
  const fog = murk(root, 5, 3);
  fog.mesh.rotation.x = TILT;
  const u = { uEyes: { value: 0 }, uGrin: { value: 0 }, uFade: { value: 0 }, uT: { value: 0 } };
  const mask = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.25), new THREE.ShaderMaterial({ uniforms: u, vertexShader: UV_VERT, fragmentShader: MASK_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
  mask.rotation.x = TILT;
  mask.renderOrder = 6;
  root.add(mask);
  const arms = [-1, 1].map(() => stem(root, 18, INK, [0.42, 0.28, 0.76], 0.001));
  const paint = quads(root, Math.round(90 * env.quality), false, F.smoke);
  const light = quads(root, Math.round(40 * env.quality), true, F.star);
  const ring = shock(root, feet, 3.4, [0.7, 0.4, 1.3]);
  const HIT = 820;
  // The mask is about the size of the foe's head and body together: big enough to read, small enough not to hide the foe.
  const S = 0.5 + env.tall * 0.24;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // Murk climbs behind the foe; the mask swells out of it above the foe's head, sways, opens its eyes, then its grin;
      // on the impact it swoops down onto the foe and is gone within ~250 ms.
      const loom = easeOut(clamp((ms - 200) / 520));
      const down = smooth(-80, 20, hit);
      const gone = smooth(90, 260, hit);
      fog.mesh.position.set(feet.x, env.tall * 1.15, feet.z - 0.6);
      fog.mesh.scale.setScalar(S * 2.4);
      fog.set(sec, 0.75 * smooth(100, 400, ms) * (1 - smooth(120, 420, hit)), 0.25 + 0.7 * loom);
      mask.position.set(feet.x + 0.08 * Math.sin(ms * 0.006) * (1 - down), env.tall * (1.5 - 0.85 * down) + 0.2 * loom, feet.z - 0.2 + 0.5 * down);
      mask.scale.setScalar(S * (0.5 + 0.5 * loom) * (1 + 0.2 * down));
      mask.rotation.z = 0.08 * Math.sin(ms * 0.004) * (1 - down);
      u.uEyes.value = smooth(420, 600, ms);
      u.uGrin.value = smooth(620, 760, ms) * (1 + 0.6 * down);
      u.uFade.value = smooth(200, 420, ms) * (1 - gone);
      u.uT.value = sec;
      mask.visible = u.uFade.value > 0.01;
      // Two arms of shadow reach round the foe and close as the mask comes down.
      arms.forEach((a, k) => {
        const s = k ? 1 : -1;
        a.set((t, out) => out.set(feet.x + s * (0.5 + env.tall * 0.25) * (1 - 0.7 * down * t) * (0.4 + 0.6 * Math.sin(t * 2.2)), env.tall * (1.4 - 0.9 * t) + 0.15 * Math.sin(t * 5 + ms * 0.006), feet.z + 0.25 * t), (t) => 0.09 - 0.07 * t, smooth(380, 760, ms), (1 - gone) * 0.9);
      });
      blot(paint, 0, paint.n, light, 0, light.n, 4, hit / 1000, p.copy(chest), 0.8);
      paint.flush();
      light.flush();
      ring(hit / 380, hit > 0 ? 1 - smooth(190, 380, hit) : 0);
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function shadowBite(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const home = new THREE.Vector3(env.from.x, 0, env.from.z);
  const feet = feetOf(env);
  const chest = chestOf(env);
  const pool = murk(root, 2, -1);
  pool.mesh.rotation.x = -Math.PI / 2;
  const jaws = maw(root);
  jaws.mesh.rotation.x = TILT;
  const paint = quads(root, Math.round(90 * env.quality), false, F.drop);
  const light = quads(root, Math.round(50 * env.quality) + 2, true, F.star);
  const HIT = 520;
  const S = 0.9 + env.tall * 0.36;
  const p = new THREE.Vector3();
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      // The pool slides from where the beast vanished to under the foe, widening as it stops.
      const slide = easeOut3(clamp((ms - 60) / 320));
      p.copy(home).lerp(feet, slide);
      pool.mesh.position.set(p.x, 0.02, p.z);
      pool.mesh.scale.set(1.5 + 1.1 * slide, 0.9 + 0.6 * slide, 1);
      pool.set(sec, 0.8 * smooth(40, 160, ms) * (1 - smooth(200, 440, hit)), 0.85);
      // The maw rises out of it, gaping round the foe (the wind-up), and snaps shut on the impact; it lets go and melts at once.
      const riseK = easeOutBack(clamp((ms - 330) / 150));
      const shut = smooth(HIT - 50, HIT, ms);
      const sink = smooth(60, 240, hit);
      jaws.mesh.position.set(feet.x, env.tall * 0.55 * riseK - 0.6 * sink, feet.z + 0.3);
      jaws.mesh.scale.set(S * (0.6 + 0.4 * riseK), S * (0.6 + 0.4 * riseK) * (1 - 0.18 * shut), 1);
      jaws.set(Math.max(0.03, (0.3 + 0.7 * smooth(330, 460, ms)) * (1 - shut) + (hit > 0 ? 0.12 * Math.exp(-hit / 70) * Math.cos(hit / 24) : 0)), smooth(330, 400, ms) * (1 - sink), sec);
      blot(paint, 0, paint.n, light, 2, light.n - 2, 3, hit / 1000, chest, 0.75);
      // A violet slit of light where the teeth meet.
      const g = hit >= 0 ? Math.exp(-hit / 80) : 0;
      light.put(0, chest.x, chest.y, chest.z + 0.4, 1.4 + 2.2 * g, PALE[0] * 1.5, PALE[1] * 1.2, PALE[2] * 1.7, g);
      light.look(0, F.streak, 0, 0.5);
      light.put(1, chest.x, chest.y, chest.z + 0.4, 1 + g, VIOLET[0] * 1.6, VIOLET[1] * 1.6, VIOLET[2] * 1.6, g * 0.6);
      light.look(1, F.soft);
      paint.flush();
      light.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function wraithTouch(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const feet = feetOf(env);
  const chest = chestOf(env);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const mist = murk(root, 6, 3);
  mist.mesh.rotation.x = TILT;
  // A hand: a forearm and palm as one thick stem, five fingers fanned from the palm, all pale and cold.
  const BONE = [0.5, 0.62, 0.72] as const;
  const SKIN = [0.86, 0.98, 1.05] as const;
  const arm = stem(root, 14, BONE, SKIN, 0.001);
  const fingers = [-2, -1, 0, 1, 2].map(() => stem(root, 12, BONE, SKIN, 3));
  const wisps = quads(root, Math.round(70 * env.quality), true, F.soft);
  const fog = quads(root, Math.round(50 * env.quality), false, F.smoke);
  const HIT = 650;
  const L = 0.45 + env.tall * 0.32;
  const palm = new THREE.Vector3();
  const p = new THREE.Vector3();
  // The 3D layer is drawn over the creatures, so an arm "behind" the foe would cross its face: it rises beside the foe instead,
  // on the caster's side (the foe's own allies stand on the other side).
  const base = new THREE.Vector3(feet.x - dir * (0.7 + env.tall * 0.35), 0.05, feet.z + 0.1);
  return {
    update(ms) {
      const sec = ms / 1000;
      const hit = ms - HIT;
      const up = easeOut(clamp((ms - 150) / 380));
      const grip = smooth(HIT - 120, HIT, ms);
      const live = smooth(150, 300, ms) * (1 - smooth(200, 480, hit));
      mist.mesh.position.set(base.x, env.tall * 0.4, feet.z - 0.2);
      mist.mesh.scale.setScalar(1.6 + env.tall * 0.8);
      mist.set(sec, smooth(0, 250, ms) * (1 - smooth(300, 600, hit)) * 0.5, 0.25 + 0.4 * up);
      // The arm rises out of the mist beside the foe and arches over it; the hand hangs high above its head, fingers fanned
      // and reaching up, then drops onto the head and turns its fingers down round it on the impact.
      palm.set(feet.x, env.tall * (0.4 + 1.1 * up) - env.tall * 0.4 * grip, feet.z + 0.1);
      arm.set((u, out) => out.set(base.x + (palm.x - base.x) * u, base.y + (palm.y - base.y) * u ** 0.6 + Math.sin(u * Math.PI) * env.tall * 0.3, base.z + (palm.z - base.z) * u), (u) => 0.1 + 0.07 * u * u, up, live * 0.92);
      fingers.forEach((f, k) => {
        const spread = (k - 2) * 0.36;
        const len = L * (k === 0 || k === 4 ? 0.55 : k === 2 ? 0.8 : 0.7) * (1 + 0.3 * grip);
        // Open: the fan points up (0.5π) and wavers. Closing: it turns over toward the arm's side to point down (1.5π), spreads a
        // little wider and longer to cup the head, and the tips bend in like a claw.
        const a = Math.PI * 0.5 - dir * grip * Math.PI + spread * (1 + 0.25 * grip) + 0.06 * Math.sin(ms * 0.01 + k) * (1 - grip);
        const bend = grip * 0.55 * Math.sign(spread) * -Math.cos(grip * Math.PI);
        f.set((u, out) => out.set(palm.x + Math.cos(a - bend * u * u) * len * u, palm.y + Math.sin(a - bend * u * u) * len * u, palm.z + 0.12 * u), (u) => 0.08 - 0.035 * u, up, live * 0.95);
      });
      // What the touch draws out of the foe: pale wisps streaming up and back along the arm.
      rise(wisps, 0, wisps.n, 2, { sec: hit / 1000, dur: 0.35, life: 0.75, at: (_b, k) => p.set(chest.x + (h(k, 8, 2) - 0.5) * 0.8, chest.y + (h(k, 9, 2) - 0.5) * env.tall * 0.7, chest.z), rise: 1.7, jitter: 0.15, size: 0.3, color: [0.7, 1, 1.25], to: [0.3, 0.4, 0.8], frame: F.soft, grow: 0.5, sway: 0.25, alpha: 0.8 });
      wisps.flush();
      rise(fog, 0, fog.n, 3, { sec: (ms - 100) / 1000, dur: 0.7, life: 0.9, at: (_b, k) => p.set(feet.x + (h(k, 8, 3) - 0.5) * 2.4, 0.15, feet.z + (h(k, 9, 3) - 0.5) * 0.8), rise: 0.5, jitter: 0.2, size: 0.8, color: [0.62, 0.72, 0.82], to: [0.4, 0.45, 0.6], frame: F.smoke, grow: 1.6, alpha: 0.3 });
      fog.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
