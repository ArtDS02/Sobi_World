// The phoenix of "Phượng Hoàng Tái Sinh" (decision 059): an original firebird painted by code. Its three pieces — a wing of layered
// feathers, a body with a curved neck and a crest, a tail of long plumes ending in flame "eyes" — are drawn on canvases as heat maps
// (white = hottest) and shown on planes whose shader turns heat into living fire: the colours of the fire ramp, noise flowing through
// the feathers, edges that lick and break. The wings bend as they beat and the tail streams. A generic bird of myth, no one's design.
import * as THREE from 'three';
import { NOISE, RAMPS } from './glsl';

type Ctx = CanvasRenderingContext2D;
const grey = (v: number, a = 1) => `rgba(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)},${a})`;

/** One feather from (0,0) along +x: hot at the root (`v0`), cooler at the tip (`v1`), with a dark shaft. */
function featherShape(g: Ctx, x: number, y: number, ang: number, len: number, wid: number, v0: number, v1: number) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const gr = g.createLinearGradient(0, 0, len, 0);
  gr.addColorStop(0, grey(v0));
  gr.addColorStop(0.55, grey((v0 + v1) / 2));
  gr.addColorStop(1, grey(v1));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(len * 0.25, -wid, len * 0.8, -wid * 0.9, len, 0);
  g.bezierCurveTo(len * 0.85, wid * 0.7, len * 0.3, wid * 0.75, 0, 0);
  g.fill();
  g.strokeStyle = grey(0.12, 0.5);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(len * 0.05, 0);
  g.quadraticCurveTo(len * 0.5, -wid * 0.12, len * 0.96, 0);
  g.stroke();
  g.restore();
}

function canvas(w: number, h: number, draw: (g: Ctx) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  // A little softness on every edge: the shader eats into it with noise.
  g.filter = 'blur(1.6px)';
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** The right wing, root at (36, 232) of a 512 × 336 canvas: primaries fanning from the wrist, secondaries under the arm, coverts over it. */
const wingArt = () =>
  canvas(512, 336, (g) => {
    const root = [36, 232] as const;
    const wrist = [262, 74] as const;
    for (let i = 0; i < 9; i++) {
      const k = i / 8;
      featherShape(g, wrist[0] - k * 26, wrist[1] + k * 18, -0.34 + k * 1.62, 236 - k * 62 + (i === 1 ? 10 : 0), 25, 0.72, 0.3);
    }
    for (let i = 0; i < 8; i++) {
      const k = (i + 0.6) / 8.4;
      featherShape(g, wrist[0] + (root[0] - wrist[0]) * k, wrist[1] + (root[1] - wrist[1]) * k, 1.32 + k * 0.42, 172 - k * 74, 23, 0.8, 0.36);
    }
    // Coverts: two rows of short, hot feathers lying over the roots of the long ones.
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 10; i++) {
        const k = i / 9.4;
        featherShape(g, wrist[0] + (root[0] - wrist[0]) * k + 4, wrist[1] + (root[1] - wrist[1]) * k + 4 + row * 6, 0.95 + k * 0.55 - (1 - k) * 0.6 * (1 - row * 0.4), 70 - row * 22 - k * 16, 15, 0.98, 0.62);
      }
    }
    // The arm: a white-hot leading edge from shoulder to wrist and on to the wing's point.
    g.strokeStyle = grey(1);
    g.lineCap = 'round';
    g.lineWidth = 17;
    g.beginPath();
    g.moveTo(root[0], root[1]);
    g.quadraticCurveTo(120, 96, wrist[0], wrist[1]);
    g.stroke();
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(wrist[0], wrist[1]);
    g.quadraticCurveTo(360, 26, 470, 14);
    g.stroke();
  });

/** The body on a 256 × 400 canvas: a teardrop chest, a curved neck, a head with a beak and an eye, a crest of three plumes. */
const bodyArt = () =>
  canvas(256, 400, (g) => {
    const blob = (x: number, y: number, rx: number, ry: number, v0: number, v1: number) => {
      const gr = g.createRadialGradient(x, y - ry * 0.2, 2, x, y, Math.max(rx, ry));
      gr.addColorStop(0, grey(v0));
      gr.addColorStop(1, grey(v1));
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0, 0, 6.2832);
      g.fill();
    };
    // Crest first (behind the head): three plumes sweeping back with flame tips.
    for (const [dx, dy, len] of [[-64, -44, 1], [-40, -66, 0.9], [-80, -16, 0.8]] as const) {
      g.strokeStyle = grey(0.7);
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(138, 96);
      g.quadraticCurveTo(138 + dx * 0.3, 96 + dy * 1.1, 138 + dx * len, 96 + dy * len);
      g.stroke();
      blob(138 + dx * len, 96 + dy * len, 12, 12, 1, 0.55);
    }
    blob(128, 268, 50, 92, 1, 0.5);
    // Neck: an S from the chest up to the head.
    g.strokeStyle = grey(0.86);
    g.lineCap = 'round';
    g.lineWidth = 34;
    g.beginPath();
    g.moveTo(126, 206);
    g.bezierCurveTo(96, 170, 104, 128, 140, 108);
    g.stroke();
    blob(146, 100, 27, 24, 1, 0.7);
    // Beak: a hooked wedge pointing forward and down.
    g.fillStyle = grey(1);
    g.beginPath();
    g.moveTo(164, 88);
    g.quadraticCurveTo(206, 96, 208, 124);
    g.quadraticCurveTo(190, 112, 160, 114);
    g.fill();
    // Eye: a dark almond with a white-hot spark.
    g.fillStyle = grey(0.08);
    g.beginPath();
    g.ellipse(153, 96, 8, 5, -0.3, 0, 6.2832);
    g.fill();
    g.fillStyle = grey(1);
    g.beginPath();
    g.arc(155, 95, 2.2, 0, 6.2832);
    g.fill();
    // Chest feathers: scallops down the breast.
    g.strokeStyle = grey(0.4, 0.55);
    g.lineWidth = 3;
    for (let r = 0; r < 5; r++) for (let c = -1; c <= 1; c++) {
      g.beginPath();
      g.arc(128 + c * 24 + (r % 2) * 12 - 6, 222 + r * 26, 14, 0.25, Math.PI - 0.25);
      g.stroke();
    }
  });

/** The tail on a 448 × 560 canvas, hanging from (224, 8): five long plumes that curve outward, each ending in a flame "eye". */
const tailArt = () =>
  canvas(448, 560, (g) => {
    const plume = (dx: number, len: number, bow: number, w: number) => {
      const ex = 224 + dx;
      const ey = 8 + len;
      for (const [lw, v] of [[w * 2.1, 0.34], [w * 1.2, 0.62], [w * 0.5, 1]] as const) {
        g.strokeStyle = grey(v);
        g.lineWidth = lw;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(224, 8);
        g.bezierCurveTo(224 + bow * 0.2, len * 0.35, ex - bow, len * 0.6, ex, ey);
        g.stroke();
      }
      // The eye: a teardrop of fire with a dark heart and a white pupil.
      g.save();
      g.translate(ex, ey);
      g.rotate(Math.atan2(len * 0.4, bow) - Math.PI / 2);
      for (const [r, v] of [[30, 0.6], [21, 1], [12, 0.18], [5, 1]] as const) {
        g.fillStyle = grey(v);
        g.beginPath();
        g.moveTo(0, -r * 1.7);
        g.bezierCurveTo(r * 1.1, -r * 0.4, r, r, 0, r);
        g.bezierCurveTo(-r, r, -r * 1.1, -r * 0.4, 0, -r * 1.7);
        g.fill();
      }
      g.restore();
    };
    plume(-168, 430, -60, 20);
    plume(168, 430, 60, 20);
    plume(-86, 490, -26, 22);
    plume(86, 490, 26, 22);
    plume(0, 520, 0, 26);
  });

const VERT = `
varying vec2 vUv; uniform float uT, uBend, uWave;
void main(){
  vUv=uv; vec3 p=position;
  // A wing bends more toward its tip; the tail streams from its root (the top edge).
  p.y+=uBend*uv.x*uv.x*1.5;
  float hang=1.-uv.y;
  p.x+=sin(hang*5.-uT*5.5)*uWave*hang*hang;
  p.z+=cos(hang*4.-uT*4.)*uWave*.6*hang;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const FRAG = `
${NOISE}${RAMPS}
varying vec2 vUv; uniform sampler2D tMap; uniform float uT, uFade, uHeat; uniform vec2 uFlow;
void main(){
  // Fire flows along the feathers, away from the body.
  vec2 flow=vUv*vec2(5.,5.)-uFlow*uT*2.2;
  float n=fbm(flow);
  float n2=fbm(flow*2.3+3.);
  vec4 t=texture2D(tMap,vUv+vec2(n-.5,n2-.5)*.012);
  float edge=smoothstep(.2,.62,t.a+(n-.5)*.55);
  float heat=clamp(t.r*(.48+.52*n)*uHeat,0.,1.3);
  vec3 col=fireRamp(heat);
  // The hottest parts go over white so the bloom takes them; a glowing fringe where the edge is being eaten.
  col*=1.+smoothstep(.86,1.2,heat)*.8;
  col+=vec3(1.,.45,.08)*smoothstep(.62,.2,t.a)*edge*.9;
  gl_FragColor=vec4(col,edge*uFade);
}`;

type U = Record<string, { value: number }>;
let art: { wing: THREE.CanvasTexture; body: THREE.CanvasTexture; tail: THREE.CanvasTexture } | null = null;

export interface Phoenix {
  g: THREE.Group;
  /** `open` −1 (wings folded down) .. 1 (raised high), `bend` the wingtips' curl, `heat` 0..1.3, `stream` how hard the tail flies. */
  pose(sec: number, fade: number, open: number, bend: number, heat?: number, stream?: number): void;
}

/** The bird in its display pose, facing the viewer: about 6 world units from wingtip to wingtip and 4.6 tall at scale 1. */
export function phoenix(): Phoenix {
  const pic = (art ??= { wing: wingArt(), body: bodyArt(), tail: tailArt() });
  const g = new THREE.Group();
  const mats: THREE.ShaderMaterial[] = [];
  const piece = (map: THREE.Texture, w: number, h: number, ax: number, ay: number, flow: [number, number], seg: number) => {
    const geo = new THREE.PlaneGeometry(w, h, seg, seg);
    // Move the piece so its root (ax, ay as shares of the plane) sits at the mesh's origin.
    geo.translate(w * (0.5 - ax), h * (0.5 - ay), 0);
    const mat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: map }, uT: { value: 0 }, uFade: { value: 1 }, uHeat: { value: 1 }, uBend: { value: 0 }, uWave: { value: 0 }, uFlow: { value: new THREE.Vector2(...flow) } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
    mats.push(mat);
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    return m;
  };
  const tail = piece(pic.tail, 2.3, 2.5, 0.5, 1 - 8 / 560, [0, -1], 14);
  tail.position.set(0, -0.55, 0);
  const wings = [1, -1].map((s) => {
    const w = piece(pic.wing, 3.05, 2.0, 36 / 512, 1 - 232 / 336, [1, 0.2], 12);
    const holder = new THREE.Group();
    holder.add(w);
    holder.position.set(s * 0.2, 0.42, 0);
    holder.scale.x = s;
    g.add(holder);
    return { w, holder, s };
  });
  const body = piece(pic.body, 1.55, 2.42, 0.5, 0.42, [0, 1], 2);
  body.position.set(0, 0.1, 0);
  g.add(tail, body);
  tail.renderOrder = 3;
  wings.forEach((x) => (x.w.renderOrder = 4));
  body.renderOrder = 5;
  return {
    g,
    pose(sec, fade, open, bend, heat = 1, stream = 0.25) {
      for (const m of mats) {
        const u = m.uniforms as U;
        u.uT!.value = sec;
        u.uFade!.value = fade;
        u.uHeat!.value = heat;
      }
      for (const x of wings) {
        x.holder.rotation.z = x.s * (open * 0.8 - 0.3);
        (x.w.material as THREE.ShaderMaterial).uniforms.uBend!.value = bend;
      }
      (tail.material as THREE.ShaderMaterial).uniforms.uWave!.value = stream;
      g.visible = fade > 0.01;
    },
  };
}
