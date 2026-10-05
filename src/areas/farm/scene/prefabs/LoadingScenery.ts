// Scenery of the loading screen (DECISIONS AM-1, AM-2): the season's painted farm backdrop under a
// bright sky, sun rays, terraced crop beds, trees, a hay bale, butterflies, a soft green glow behind the
// sign, a vignette and a green-gold swirl carrying leaves and vegetables around the sign. Shapes only
// (nothing is loaded yet); every motion is skipped with reduceMotion.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../config/farmView';
import { LOADING_SCREEN as L } from '../config/loadingScreen';
import { SEASON_LOOKS, type SeasonId } from '../../../../core/config/seasons';
import { fitCamera } from '../config/phaser';
import { backdropRect, type WorldRect } from '../view/farmCamera';
import { paintBackdrop } from '../view/backdropPaint';
import type { FarmLayout } from '../view/pigView';
import { butterfly, cabbage, carrot, corn, flower, leaf, tomato } from './loadingIcons';

const SKY = 'loading_sky';
const SHADE = 'loading_shade';
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export function drawLoadingScenery(scene: Phaser.Scene, layout: FarmLayout, season: SeasonId, still: boolean) {
  const { width, height } = layout.designSize;
  fitCamera(scene, layout, (view) => {
    const rect = backdropRect(view, width, height, FARM_VIEW.VIEW_MAX_EXTEND);
    paintSky(scene, rect, season);
    paintShade(scene, rect);
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const k of [SKY, SHADE]) if (scene.textures.exists(k)) scene.textures.remove(k);
  });
  rays(scene, still);
  beds(scene);
  trees(scene);
  hay(scene);
  swirl(scene, still);
  butterflies(scene, still);
}

/** A canvas texture covering `rect`, replaced on every resize. */
function canvasLayer(scene: Phaser.Scene, key: string, rect: WorldRect, depth: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, rect.width, rect.height);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.translate(-rect.x, -rect.y);
  paint(ctx);
  tex.refresh();
  scene.children.getByName(key)?.destroy();
  scene.add.image(rect.x, rect.y, key).setOrigin(0).setName(key).setDepth(depth);
}

function paintSky(scene: Phaser.Scene, rect: WorldRect, season: SeasonId) {
  canvasLayer(scene, SKY, rect, -10, (ctx) => {
    const grad = ctx.createLinearGradient(0, rect.y, 0, FARM_VIEW.BACKDROP.sky.gradientEndY);
    grad.addColorStop(0, hex(L.sky.top));
    grad.addColorStop(1, hex(L.sky.bottom));
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    paintBackdrop(ctx, rect, SEASON_LOOKS[season].backdrop);
  });
}

/** Green glow behind the sign + a soft vignette, over the scenery and under the sign. */
function paintShade(scene: Phaser.Scene, rect: WorldRect) {
  canvasLayer(scene, SHADE, rect, -2, (ctx) => {
    const G = L.glow;
    ctx.save();
    ctx.translate(G.x, G.y);
    ctx.scale(1, G.ry / G.rx);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, G.rx);
    glow.addColorStop(0, G.inner);
    glow.addColorStop(1, G.outer);
    ctx.fillStyle = glow;
    ctx.fillRect(-G.rx, -G.rx, G.rx * 2, G.rx * 2);
    ctx.restore();
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const r = Math.hypot(rect.width, rect.height) / 2;
    const v = ctx.createRadialGradient(cx, cy, r * L.vignette.inner, cx, cy, r);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, L.vignette.color);
    ctx.fillStyle = v;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  });
}

function rays(scene: Phaser.Scene, still: boolean) {
  const R = L.rays;
  const g = scene.add.graphics().setDepth(-3);
  for (let i = 0; i < R.count; i++) {
    const a = Phaser.Math.DegToRad(R.fromDeg + (i * R.spreadDeg) / R.count);
    const w = Phaser.Math.DegToRad(2 + (i % 3) * 1.5);
    g.fillStyle(R.color, R.alpha * (i % 2 ? 0.6 : 1)).fillTriangle(
      R.x, R.y,
      R.x + Math.cos(a - w) * R.length, R.y + Math.sin(a - w) * R.length,
      R.x + Math.cos(a + w) * R.length, R.y + Math.sin(a + w) * R.length,
    );
  }
  if (!still) scene.tweens.add({ targets: g, alpha: 0.55, duration: R.pulseMs, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
}

function beds(scene: Phaser.Scene) {
  const B = L.beds;
  const g = scene.add.graphics().setDepth(-6);
  for (const bed of B.list) {
    const [ax, ay, bx, by, cx, cy, dx, dy] = bed.pts;
    g.fillStyle(B.grassEdge, 1).fillPoints([{ x: ax, y: ay - 8 }, { x: bx, y: by - 8 }, { x: cx, y: cy + 10 }, { x: dx, y: dy + 10 }], true);
    g.fillStyle(B.soilDark, 1).fillPoints([{ x: ax, y: ay + 6 }, { x: bx, y: by + 6 }, { x: cx, y: cy + 6 }, { x: dx, y: dy + 6 }], true);
    g.fillStyle(B.soil, 1).fillPoints([{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }], true);
    // Two rows of plants along the strip, bigger towards the front.
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(2, Math.floor(len / B.plantEveryPx));
    for (const row of [0.3, 0.72]) {
      for (let i = 0; i <= n; i++) {
        const t = (i + 0.5) / (n + 1);
        const x = ax + (bx - ax) * t + (dx - ax + (cx - bx - (dx - ax)) * t) * row;
        const y = ay + (by - ay) * t + (dy - ay + (cy - by - (dy - ay)) * t) * row;
        const s = 0.75 + row * 0.5;
        if (bed.crop === 'carrot') carrot(g, x, y, s * 0.9, -0.2);
        else if (bed.crop === 'corn') corn(g, x, y - 8, s * 1.3);
        else if (bed.crop === 'tomato') {
          cabbage(g, x, y, s * 0.8);
          tomato(g, x + 6, y - 4, s * 0.55);
        } else cabbage(g, x, y, s);
      }
    }
  }
}

function trees(scene: Phaser.Scene) {
  const g = scene.add.graphics().setDepth(-5);
  for (const t of L.trees) {
    const s = t.s;
    g.fillStyle(0x7a4a26, 1).fillRoundedRect(t.x - 9 * s, t.y - 10 * s, 18 * s, 70 * s, 6 * s);
    g.fillStyle(0x3f8a2e, 1).fillCircle(t.x - 34 * s, t.y - 18 * s, 42 * s).fillCircle(t.x + 34 * s, t.y - 18 * s, 42 * s).fillCircle(t.x, t.y - 52 * s, 50 * s);
    g.fillStyle(0x5fae35, 1).fillCircle(t.x - 26 * s, t.y - 28 * s, 34 * s).fillCircle(t.x + 26 * s, t.y - 30 * s, 34 * s).fillCircle(t.x, t.y - 60 * s, 40 * s);
    g.fillStyle(0x8fd14f, 0.8).fillCircle(t.x - 14 * s, t.y - 72 * s, 16 * s);
  }
}

function hay(scene: Phaser.Scene) {
  const H = L.hay;
  const g = scene.add.graphics().setDepth(-4);
  g.fillStyle(H.dark, 1).fillRoundedRect(H.x - H.width / 2, H.y - H.height / 2 + 6, H.width, H.height, 16);
  g.fillStyle(H.color, 1).fillRoundedRect(H.x - H.width / 2, H.y - H.height / 2, H.width, H.height, 16);
  g.lineStyle(3, H.dark, 0.8);
  for (let i = 1; i < 6; i++) g.lineBetween(H.x - H.width / 2 + 10, H.y - H.height / 2 + i * 13, H.x + H.width / 2 - 10, H.y - H.height / 2 + i * 13);
}

/** A glowing arc around the sign with leaves and vegetables riding along it. */
function swirl(scene: Phaser.Scene, still: boolean) {
  const S = L.swirl;
  const tilt = Phaser.Math.DegToRad(S.tiltDeg);
  const at = (deg: number) => {
    const a = Phaser.Math.DegToRad(deg);
    const x = Math.cos(a) * S.rx;
    const y = Math.sin(a) * S.ry;
    return { x: S.cx + x * Math.cos(tilt) - y * Math.sin(tilt), y: S.cy + x * Math.sin(tilt) + y * Math.cos(tilt) };
  };
  const g = scene.add.graphics().setDepth(-1);
  for (const [w, a] of [[S.widthPx * 2.2, S.alpha * 0.35], [S.widthPx, S.alpha], [S.widthPx * 0.3, 0.55]] as const) {
    g.lineStyle(w, S.color, a).beginPath();
    for (let d = S.arcFrom; d <= S.arcTo; d += 3) {
      const p = at(d);
      if (d === S.arcFrom) g.moveTo(p.x, p.y);
      else g.lineTo(p.x, p.y);
    }
    g.strokePath();
  }
  const draw = [
    (x: Phaser.GameObjects.Graphics) => leaf(x, 0, 0, 1.3),
    (x: Phaser.GameObjects.Graphics) => carrot(x, 0, 0, 1.2),
    (x: Phaser.GameObjects.Graphics) => leaf(x, 0, 0, 1.1, 0xf2d75a),
    (x: Phaser.GameObjects.Graphics) => corn(x, 0, 0, 1),
    (x: Phaser.GameObjects.Graphics) => tomato(x, 0, 0, 1.1),
    (x: Phaser.GameObjects.Graphics) => flower(x, 0, 0, 1.3),
  ];
  for (let i = 0; i < S.items; i++) {
    const ig = scene.add.graphics();
    draw[i % draw.length]!(ig);
    const item = scene.add.container(0, 0, [ig]).setDepth(4);
    const state = { deg: S.arcFrom + ((S.arcTo - S.arcFrom) * i) / S.items };
    const place = () => {
      const p = at(state.deg);
      item.setPosition(p.x, p.y);
      // Fade in/out at the ends of the arc.
      const t = (state.deg - S.arcFrom) / (S.arcTo - S.arcFrom);
      item.setAlpha(Math.min(1, t * 6, (1 - t) * 6));
    };
    place();
    if (still) continue;
    scene.tweens.add({
      targets: state, deg: S.arcTo, duration: (S.orbitMs * (S.arcTo - state.deg)) / (S.arcTo - S.arcFrom),
      onUpdate: place,
      onComplete: () => {
        state.deg = S.arcFrom;
        scene.tweens.add({ targets: state, deg: S.arcTo, duration: S.orbitMs, repeat: -1, onUpdate: place });
      },
    });
    scene.tweens.add({ targets: item, angle: 360, duration: 4000 + i * 300, repeat: -1 });
  }
}

function butterflies(scene: Phaser.Scene, still: boolean) {
  const F = L.flutter;
  for (const [i, b] of L.butterflies.entries()) {
    const g = scene.add.graphics();
    butterfly(g, b.color, b.edge);
    const wings = scene.add.container(0, 0, [g]);
    const fly = scene.add.container(b.x, b.y, [wings]).setScale(b.s).setDepth(5).setAngle(i % 2 ? 12 : -10);
    if (still) continue;
    scene.tweens.add({ targets: wings, scaleX: 0.25, duration: F.flapMs, yoyo: true, repeat: -1, delay: i * 60 });
    scene.tweens.add({
      targets: fly, x: b.x + (i % 2 ? -F.driftPx : F.driftPx), y: b.y - F.driftPx * 0.6,
      duration: F.driftMs + i * 500, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
  }
}
