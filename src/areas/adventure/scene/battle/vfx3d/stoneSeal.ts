// "Địa Chấn Phong Ấn" in 3D (decision 059): a seal burns on the ground under the foes' row (two rings turning against each other,
// a broken square inside), cracks spread from it, it tears apart at 1200 and slabs of glowing stone heave up under every foe, with
// one more jolt at 1700. Times are ms from the start of the act.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, easeOutBack, smooth } from './effectParts';
import { h, pulse, rise } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import { lightBlend, quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { STONE, cracks, rock, rubble, spikeClump } from './stoneParts';
import { shock } from './stormParts';

const ground = (p: THREE.Vector3) => new THREE.Vector3(p.x, 0, p.z);

const SEAL_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uT, uFade, uBreak;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  // Two rings turning against each other, a band of notches between them, a broken square inside.
  float outer=smoothstep(.03,0.,abs(r-.9))+smoothstep(.02,0.,abs(r-.74));
  float notch=step(.74,r)*step(r,.9)*smoothstep(.35,.45,abs(fract((a+uT*.6)*2.546)-.5));
  float inner=smoothstep(.025,0.,abs(r-.5));
  vec2 q=mat2(cos(-uT*.9),-sin(-uT*.9),sin(-uT*.9),cos(-uT*.9))*p;
  float sq=smoothstep(.03,0.,abs(max(abs(q.x),abs(q.y))-.34));
  float bars=smoothstep(.03,0.,abs(abs(q.x)-abs(q.y)))*step(r,.5)*step(.12,r);
  float g=clamp(outer+notch*.7+inner+sq+bars*.6,0.,1.);
  // Breaking: the seal tears along noise.
  g*=smoothstep(uBreak-.05,uBreak+.15,fbm(p*3.+7.)+.15);
  gl_FragColor=vec4(vec3(1.4,1.05,.4)*g+vec3(.6,.35,.05)*smoothstep(1.,.2,r)*.25,(g+smoothstep(1.,.3,r)*.2)*uFade);
}`;

export function sealQuake(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const foes = env.struck.map(ground);
  const mid = ground(env.origin);
  const span = Math.max(3.4, ...foes.map((t) => Math.abs(t.x - mid.x) * 2 + 2.4));
  const sealMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uBreak: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: SEAL_FRAG, transparent: true, depthWrite: false, depthTest: false });
  lightBlend(sealMat);
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(span * 1.35, span * 0.82), sealMat);
  seal.rotation.x = -Math.PI / 2;
  seal.position.set(mid.x, 0.03, mid.z);
  root.add(seal);
  const stone = rock(STONE, [1.3, 0.95, 0.35]);
  const hits = foes.map((p, i) => ({ p, t: 1200 + i * 100, clump: spikeClump(root, stone.mat, p, 5, 0.8 + env.tall * 0.7, 40 + i * 7), scar: cracks(root, p, 3, 11 + i), ring: shock(root, p, 3.6, [1.2, 0.9, 0.35]) }));
  const big = cracks(root, mid, span * 1.1, 21);
  const per = Math.round(55 * env.quality);
  const chips = quads(root, hits.length * per, false, F.shard);
  const dust = quads(root, hits.length * 10, false, F.smoke);
  const motes = quads(root, Math.round(90 * env.quality), true, F.ember);
  const a = new THREE.Vector3();
  const BREAK = 1200;
  return {
    update(ms) {
      const sec = ms / 1000;
      // The seal draws itself, burns brighter, then tears; cracks spread from it all the while and glow as it breaks.
      const u = sealMat.uniforms as Record<string, { value: number }>;
      u.uT!.value = sec;
      u.uFade!.value = smooth(100, 450, ms) * (0.75 + 0.25 * Math.sin(ms * 0.02)) * (1 + 0.6 * pulse(ms, BREAK - 80, 60, 120)) * (1 - smooth(BREAK + 150, BREAK + 500, ms));
      u.uBreak!.value = smooth(BREAK - 40, BREAK + 380, ms);
      seal.visible = u.uFade!.value > 0.01;
      big(easeOut(clamp((ms - 300) / 900)), smooth(300, 500, ms) * (1 - smooth(1900, 2300, ms)), 0.25 + 0.75 * pulse(ms, BREAK, 60, 500));
      rise(motes, 0, motes.n, 1, { sec: sec - 0.3, dur: 1.5, life: 0.7, at: (_b, k) => a.set(mid.x + (h(k, 8, 1) - 0.5) * span * 1.1, 0.05, mid.z + (h(k, 9, 1) - 0.5) * span * 0.6), rise: 1.5, jitter: 0.1, size: 0.14, color: [1.5, 1.1, 0.4], to: [0.9, 0.5, 0.1], frame: F.ember, grow: 0.3 });
      motes.flush();
      stone.set(1, 0.9 * (1 - smooth(1500, 2100, ms)));
      hits.forEach((x, i) => {
        const age = ms - x.t;
        // Slabs heave up at the break, sag, then jolt up once more at 1700 before they sink.
        const second = 0.35 * pulse(ms, 1700 + i * 40, 60, 160);
        x.clump(age > 0 ? (easeOutBack(clamp(age / 180)) * (0.8 - 0.2 * smooth(200, 480, age)) + second) * (1 - smooth(820, 1100, age)) : 0);
        x.scar(easeOut(clamp(age / 200)), age > 0 ? 1 - smooth(850, 1150, age) : 0, 0.6 * Math.exp(-Math.max(0, age) / 400));
        x.ring(age / 360, age > 0 ? 1 - smooth(180, 360, age) : 0);
        rubble(chips, i * per, per, dust, i * 10, 10, 50 + i, age / 1000, x.p, 1);
      });
      chips.flush();
      dust.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
