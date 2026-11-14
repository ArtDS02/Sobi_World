// "Đoàn Kỵ Thép" in 3D (decision 059). A troop of riders of living steel forms up behind the caster, lances levelled; three lines
// of them thunder through the foes' row one after the other (1350, 1600, 1850), each rider's lance scoring a line of light across a
// foe; at 2200 they all strike together. Then plates of steel close into a shield before the caster (the 25 % shield).
// The rider is an original figure painted by code as a tone map (two gallop poses) and shown in polished steel.
// Times are ms from the start of the act; the skill's impact is at 1200.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, easeOut, smooth } from './effectParts';
import { h, pulse, rise } from './fxKit';
import { lines } from './lines';
import { quads } from './quads';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';
import { SPARK, clang, plates } from './steelParts';
import { shock } from './stormParts';

type Ctx = CanvasRenderingContext2D;
const grey = (v: number) => `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})`;

/** A rider at the gallop facing right on a 512 × 384 canvas; `gathered` draws the legs bunched under the horse, else stretched out. */
function riderArt(gathered: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const g = c.getContext('2d')!;
  g.filter = 'blur(1.2px)';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const limb = (pts: readonly (readonly [number, number])[], w: number, v: number) => {
    g.strokeStyle = grey(v);
    g.lineWidth = w;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };
  const blob = (x: number, y: number, rx: number, ry: number, rot: number, v: number) => {
    g.fillStyle = grey(v);
    g.beginPath();
    g.ellipse(x, y, rx, ry, rot, 0, 6.2832);
    g.fill();
  };
  const body = (draw: (g: Ctx) => void) => draw(g);
  // Far-side legs (darker), then the tail.
  if (gathered) {
    limb([[330, 240], [352, 296], [318, 322]], 17, 0.3);
    limb([[178, 242], [214, 300], [250, 318]], 19, 0.3);
  } else {
    limb([[330, 240], [398, 300], [436, 318]], 17, 0.3);
    limb([[178, 242], [112, 300], [76, 322]], 19, 0.3);
  }
  limb([[100, 196], [52, 200], [20, gathered ? 236 : 214]], 15, 0.42);
  // The horse: quarters, barrel, chest, a neck arched forward, a long head.
  blob(172, 212, 60, 54, 0, 0.5);
  blob(250, 220, 96, 46, 0, 0.5);
  blob(326, 206, 54, 52, 0, 0.55);
  body((gg) => {
    gg.fillStyle = grey(0.52);
    gg.beginPath();
    gg.moveTo(318, 168);
    gg.quadraticCurveTo(372, 110, 420, 96);
    gg.lineTo(440, 126);
    gg.quadraticCurveTo(396, 150, 372, 228);
    gg.closePath();
    gg.fill();
  });
  blob(442, 118, 44, 19, 0.55, 0.55);
  body((gg) => {
    gg.fillStyle = grey(0.5);
    gg.beginPath();
    gg.moveTo(404, 92);
    gg.lineTo(410, 62);
    gg.lineTo(424, 90);
    gg.fill();
  });
  // Barding: plates on the head, the chest and the quarters, brighter than the horse.
  blob(448, 116, 34, 12, 0.55, 0.8);
  blob(344, 200, 34, 24, 0.5, 0.7);
  blob(168, 196, 44, 22, -0.2, 0.66);
  limb([[330, 150], [392, 104]], 9, 0.9);
  // Near-side legs.
  if (gathered) {
    limb([[344, 244], [372, 300], [340, 334]], 20, 0.56);
    limb([[160, 244], [200, 304], [238, 330]], 22, 0.56);
  } else {
    limb([[344, 244], [420, 296], [462, 300]], 20, 0.56);
    limb([[160, 244], [92, 296], [52, 304]], 22, 0.56);
  }
  // The rider: a leg, a body leaning into the charge, a round shield, a helm with a crest streaming back.
  limb([[262, 172], [284, 232], [272, 262]], 17, 0.72);
  blob(256, 138, 32, 46, 0.3, 0.78);
  limb([[262, 88], [222, 58], [176, 66]], 12, 0.95);
  blob(278, 86, 25, 24, 0, 0.9);
  g.fillStyle = grey(0.12);
  g.fillRect(282, 80, 24, 6);
  blob(300, 152, 27, 30, 0, 0.92);
  blob(300, 152, 20, 23, 0, 0.5);
  blob(300, 152, 7, 8, 0, 0.95);
  // The lance: couched under the arm, a long white line with a pennant behind the head.
  limb([[196, 160], [506, 132]], 8, 1);
  body((gg) => {
    gg.fillStyle = grey(0.88);
    gg.beginPath();
    gg.moveTo(452, 136);
    gg.lineTo(404, 122);
    gg.lineTo(418, 142);
    gg.lineTo(400, 160);
    gg.closePath();
    gg.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

const RIDER_FRAG = `
varying vec2 vUv; uniform sampler2D tA, tB; uniform float uPose, uFade, uSweep, uFlash;
void main(){
  vec4 t=mix(texture2D(tA,vUv),texture2D(tB,vUv),uPose);
  float v=t.r;
  // Tone → polished steel in four painted steps, a gold edge where the plates are brightest.
  vec3 col=mix(vec3(.07,.09,.17),vec3(.24,.31,.47),smoothstep(.25,.4,v));
  col=mix(col,vec3(.52,.6,.76),smoothstep(.55,.68,v));
  col=mix(col,vec3(.96,.95,.88),smoothstep(.86,.95,v));
  // A band of light running along the troop, and the flash of a strike.
  col+=vec3(.9,1.,1.3)*smoothstep(.07,0.,abs(vUv.x*.8+vUv.y*.3-uSweep))*.35*step(.3,v);
  col*=1.+uFlash;
  gl_FragColor=vec4(col,smoothstep(.3,.7,t.a)*uFade);
}`;
let art: { a: THREE.CanvasTexture; b: THREE.CanvasTexture } | null = null;

/** One rider on a plane 3.2 × 2.4, its hooves at the mesh's origin: `set(pose 0..1, fade, sweep, flash)`. */
function rider(root: THREE.Object3D, flip: number) {
  const pic = (art ??= { a: riderArt(false), b: riderArt(true) });
  const mat = new THREE.ShaderMaterial({ uniforms: { tA: { value: pic.a }, tB: { value: pic.b }, uPose: { value: 0 }, uFade: { value: 0 }, uSweep: { value: -9 }, uFlash: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: RIDER_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(3.2, 2.4);
  geo.translate(0, 1.2 - 0.3, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -0.3;
  mesh.scale.x = flip;
  mesh.renderOrder = 6;
  mesh.visible = false;
  root.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(pose: number, fade: number, sweep = -9, flash = 0) {
      mesh.visible = fade > 0.01;
      u.uPose!.value = pose;
      u.uFade!.value = fade;
      u.uSweep!.value = sweep;
      u.uFlash!.value = flash;
    },
  };
}

const WAVES = [1350, 1600, 1850, 2200] as const;

export function steelCavalry(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const q = env.quality;
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const row = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const home = new THREE.Vector3(env.from.x, 0, env.from.z);
  const foes = env.targets.map((t) => new THREE.Vector3(t.x, 0, t.z));
  const startX = home.x - dir * 2.6;
  const endX = row.x + dir * 6.5;
  // Three riders abreast; they hold formation behind the caster, then run the row once per wave.
  const troop = [0, 1, 2].map((k) => ({ r: rider(root, dir), z: row.z + (k - 1) * 0.95, lag: k * 0.75, scale: 0.78 + env.tall * 0.14 + (k === 1 ? 0.08 : 0) }));
  const lance = lines(root, WAVES.length * foes.length * 2 + 30);
  const per = Math.round(44 * q) + 2;
  const light = quads(root, WAVES.length * foes.length * per + Math.round(60 * q), true, F.streak);
  const chips = quads(root, 40, false, F.shard);
  const dust = quads(root, Math.round(80 * q), false, F.smoke);
  const rings = foes.map((p) => shock(root, p, 3.4, [0.8, 0.95, 1.3]));
  const big = shock(root, row, 9, [1.1, 1.05, 0.9]);
  const shield = plates([0.62, 0.68, 0.78], 8, 9);
  shield.g.position.set(home.x + dir * 0.9, env.tall * 0.55, home.z + 0.3);
  shield.g.rotation.y = dir * 0.3;
  root.add(shield.g);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const RUN = 520;
  /** Which wave is running at `t` ms and how far along the row it is (0..1). */
  const runAt = (t: number) => {
    const w = WAVES.findIndex((x) => t < x + RUN * 0.45);
    const wi = w < 0 ? WAVES.length - 1 : w;
    return { wi, run: clamp((t - (WAVES[wi]! - RUN * 0.55)) / RUN) };
  };

  return {
    update(ms) {
      // Where the troop is: mustering (500–1150), then for each wave a run from behind the caster to beyond the row.
      const { wi, run } = runAt(ms);
      const muster = smooth(500, 900, ms);
      const charging = ms >= WAVES[0] - RUN * 0.55;
      const gone = smooth(WAVES[3] + 250, WAVES[3] + 520, ms);
      troop.forEach((m, k) => {
        const x = charging ? startX + (endX - startX) * run - dir * m.lag : startX + dir * (0.9 * muster) - dir * m.lag * 1.6;
        // Rearing while they wait: a slow bob; at the gallop the two poses alternate.
        const pose = charging ? 0.5 + 0.5 * Math.sin(ms * 0.045 + k * 2) : 0.5 + 0.5 * Math.sin(ms * 0.012 + k);
        m.r.mesh.position.set(x, charging ? 0.12 * Math.abs(Math.sin(ms * 0.045 + k * 2)) : 0, m.z);
        m.r.mesh.scale.set(dir * m.scale * (wi === 3 && charging ? 1.2 : 1), m.scale * (wi === 3 && charging ? 1.2 : 1), 1);
        const fade = (charging ? smooth(0, 0.08, run) * (1 - smooth(0.82, 1, run)) : muster * 0.85) * (1 - gone);
        m.r.set(pose, fade, ((ms * 0.0016 + k * 0.3) % 2) - 0.4, 0.2 * Math.max(...WAVES.map((t) => pulse(ms, t, 20, 120))));
      });
      // Dust under the hooves all along the run.
      const first = WAVES[0] - RUN * 0.55;
      rise(dust, 0, dust.n, 1, { sec: (ms - first) / 1000, dur: 1.4, life: 0.5, at: (born, k) => a.set(startX + (endX - startX) * runAt(first + born * 1000).run, 0.15, row.z + (h(k, 8, 1) - 0.5) * 1.8), rise: 0.6, jitter: 0.4, size: 0.7, color: [0.72, 0.7, 0.66], to: [0.5, 0.5, 0.5], frame: F.smoke, grow: 1.8, alpha: 0.32 });
      dust.flush();
      // Each wave scores a line of light through every foe as the lances pass, with a clang.
      let n = 0;
      WAVES.forEach((t, w) => {
        foes.forEach((f, i) => {
          const hitT = t + ((f.x - row.x) * dir) * 22;
          const age = ms - hitT;
          const power = w === 3 ? 1.2 : 0.6;
          if (age > -30 && age < 200) {
            const y = env.tall * (0.35 + 0.3 * h(w * 5 + i, 0, 3));
            const len = (1.6 + 1.4 * clamp(age / 80)) * power;
            lance.put(n++, a.set(f.x - dir * len * 0.4, y + 0.1, f.z + 0.2), b.set(f.x + dir * len, y - 0.05, f.z + 0.2), 0.02, 0.09 * power, 0.85, 1, 1.4, 1.5 * (1 - smooth(60, 200, age)));
          }
          clang(light, (w * foes.length + i) * per, per, w === 3 ? chips : null, 0, chips.n, w * 7 + i, age / 1000, a.set(f.x, env.tall * 0.5, f.z), power);
          if (w === 3) rings[i]!(age / 360, age > 0 ? 1 - smooth(180, 360, age) : 0);
        });
      });
      lance.show(n, 1);
      lance.flush();
      const fa = ms - WAVES[3];
      big(fa / 520, fa > 0 ? 1 - smooth(260, 520, fa) : 0);
      // The shield: plates fly in and lock together before the caster, a glint runs over them, then they fade.
      const sa = (ms - 2450) / 380;
      const S = 0.3 + env.tall * 0.22;
      shield.g.scale.setScalar(S);
      shield.set(1 - easeOut(clamp(sa)), sa > 0 ? smooth(0, 0.3, sa) * (1 - smooth(1.6, 2.1, sa)) : 0, 0.7 * pulse(ms, 2450 + 380, 30, 160), -2.5 + clamp((ms - 2830) / 260) * 5);
      const lockN = light.n - WAVES.length * foes.length * per;
      rise(light, light.n - lockN, lockN, 9, { sec: (ms - 2830) / 1000, dur: 0.05, life: 0.5, at: () => a.copy(shield.g.position), rise: 0.6, jitter: 1.6 * S, size: 0.16, color: SPARK, to: [0.6, 0.8, 1.2], frame: F.star, grow: 0.3 });
      light.flush();
      chips.flush();
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
