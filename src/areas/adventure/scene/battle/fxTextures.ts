// The pictures the battle's effects are made of (decision 042), drawn once in white on canvases when the battle scene starts and tinted
// as they are used: one per particle shape (battle_fx.json `particles[].shape`), the magic circle laid on the ground and the column of
// light a fighter comes in through. A manifest image (`fx_…`) is used as it is instead.
import type * as Phaser from 'phaser';
import { PARTICLE_SHAPES, type ParticleShape } from '../../../../../content/schemas/adventure/battleFx';

export const SHAPE_PX = 64;
export const shapeKey = (s: ParticleShape) => `advfx_${s}`;
export const CIRCLE_KEY = 'advfx_circle';
export const PILLAR_KEY = 'advfx_pillar';

function star(c: CanvasRenderingContext2D, r: number, points: number, inner: number) {
  c.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
}

function soft(c: CanvasRenderingContext2D, r: number, core: number) {
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(core, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(-r, -r, r * 2, r * 2);
}

/** One particle shape in white, centred, about SHAPE_PX wide (a spark lies along x: it is turned to where it flies). */
function drawShape(c: CanvasRenderingContext2D, shape: ParticleShape) {
  const r = SHAPE_PX / 2 - 2;
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#ffffff';
  c.lineCap = 'round';
  c.lineJoin = 'round';
  switch (shape) {
    case 'glow':
      soft(c, r, 0.3);
      break;
    case 'smoke':
      soft(c, r, 0.55);
      break;
    case 'spark':
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(-r, 0);
      c.lineTo(r * 0.6, 0);
      c.stroke();
      break;
    case 'star':
      star(c, r, 4, 0.35);
      c.fill();
      break;
    case 'leaf':
    case 'petal':
      c.beginPath();
      c.moveTo(-r, 0);
      c.quadraticCurveTo(0, shape === 'leaf' ? -r * 0.8 : -r, r, 0);
      c.quadraticCurveTo(0, shape === 'leaf' ? r * 0.8 : r * 0.5, -r, 0);
      c.fill();
      if (shape === 'leaf') {
        c.strokeStyle = 'rgba(0,0,0,0.25)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-r * 0.8, 0);
        c.lineTo(r * 0.8, 0);
        c.stroke();
      }
      break;
    case 'drop':
      c.beginPath();
      c.moveTo(r * 1, 0);
      c.bezierCurveTo(r * 0.1, r * 0.6, -r * 0.6, r * 0.5, -r * 0.6, 0);
      c.bezierCurveTo(-r * 0.6, -r * 0.5, r * 0.1, -r * 0.6, r, 0);
      c.fill();
      break;
    case 'rock':
      c.beginPath();
      for (const [x, y] of [[-1, -0.3], [-0.3, -1], [0.8, -0.6], [1, 0.4], [0, 1], [-0.8, 0.6]] as const) c.lineTo(x * r, y * r);
      c.closePath();
      c.fill();
      break;
    case 'bubble':
      c.lineWidth = 5;
      c.beginPath();
      c.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(-r * 0.3, -r * 0.3, r * 0.2, 0, Math.PI * 2);
      c.fill();
      break;
    case 'shard':
      c.beginPath();
      c.moveTo(r, 0);
      c.lineTo(0, r * 0.3);
      c.lineTo(-r, 0);
      c.lineTo(0, -r * 0.3);
      c.closePath();
      c.fill();
      break;
    case 'ring':
      c.lineWidth = 5;
      c.beginPath();
      c.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      c.stroke();
      break;
    case 'plus':
      c.fillRect(-r * 0.25, -r, r * 0.5, r * 2);
      c.fillRect(-r, -r * 0.25, r * 2, r * 0.5);
      break;
    case 'arrow':
      c.beginPath();
      for (const [x, y] of [[0, -1], [0.8, 0], [0.3, 0], [0.3, 1], [-0.3, 1], [-0.3, 0], [-0.8, 0]] as const) c.lineTo(x * r, y * r);
      c.closePath();
      c.fill();
      break;
    case 'rune':
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-r * 0.5, -r);
      c.lineTo(r * 0.5, -r * 0.2);
      c.lineTo(-r * 0.5, r * 0.3);
      c.lineTo(r * 0.4, r);
      c.stroke();
      break;
  }
}

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  const c = tex?.getContext();
  if (!tex || !c) return;
  c.save();
  paint(c);
  c.restore();
  tex.refresh();
}

/** Draws every texture of the battle's effects that is not there yet. */
export function ensureFxTextures(scene: Phaser.Scene) {
  for (const s of PARTICLE_SHAPES) {
    canvasTexture(scene, shapeKey(s), SHAPE_PX, SHAPE_PX, (c) => {
      c.translate(SHAPE_PX / 2, SHAPE_PX / 2);
      drawShape(c, s);
    });
  }
  // The magic circle: two rings, a star of lines and runes around, seen from above (laid flat on the ground when drawn).
  canvasTexture(scene, CIRCLE_KEY, 256, 256, (c) => {
    c.translate(128, 128);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(0, 0, 120, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, 98, 0, Math.PI * 2);
    c.stroke();
    star(c, 96, 6, 0.5);
    c.stroke();
    c.lineWidth = 3;
    for (let i = 0; i < 12; i += 1) {
      c.save();
      c.rotate((i / 12) * Math.PI * 2);
      c.translate(0, -109);
      c.beginPath();
      c.moveTo(-4, -5);
      c.lineTo(4, 0);
      c.lineTo(-3, 5);
      c.stroke();
      c.restore();
    }
  });
  // A column of light, bright in the middle and fading at its sides and top.
  canvasTexture(scene, PILLAR_KEY, 64, 256, (c) => {
    const across = c.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, 'rgba(255,255,255,0)');
    across.addColorStop(0.5, 'rgba(255,255,255,1)');
    across.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = across;
    c.fillRect(0, 0, 64, 256);
    c.globalCompositeOperation = 'destination-in';
    const up = c.createLinearGradient(0, 0, 0, 256);
    up.addColorStop(0, 'rgba(255,255,255,0)');
    up.addColorStop(0.35, 'rgba(255,255,255,1)');
    up.addColorStop(1, 'rgba(255,255,255,1)');
    c.fillStyle = up;
    c.fillRect(0, 0, 64, 256);
  });
}
