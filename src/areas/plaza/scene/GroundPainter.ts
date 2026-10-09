// Paints the plaza's ground once, into one canvas texture the size of the design frame: sky, grass from the
// sheet's tiles, the sand and sea, dirt paths and the cobbled square. Static, so it costs nothing per frame.
import * as Phaser from 'phaser';
import type { GroundShape, PlazaLayout } from '../../../../content/schemas/plaza/layout';
import { textureKey } from '../../../ui/world/keys';
import { PLAZA_GROUND, PLAZA_VIEW } from './plazaView';

export const GROUND_TEXTURE = 'plaza_ground';

/** 0xRRGGBB as a canvas colour. */
const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/** Small deterministic generator: the same ground every start. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function paintGround(scene: Phaser.Scene, layout: PlazaLayout): Phaser.GameObjects.Image {
  const { width, height } = layout.designSize;
  if (scene.textures.exists(GROUND_TEXTURE)) scene.textures.remove(GROUND_TEXTURE);
  const canvas = scene.textures.createCanvas(GROUND_TEXTURE, width, height)!;
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;
  const random = rng(PLAZA_GROUND.seed);
  const tile = (id: string): HTMLImageElement | HTMLCanvasElement | null => {
    const key = textureKey(id);
    return scene.textures.exists(key) ? (scene.textures.get(key).getSourceImage() as HTMLImageElement) : null;
  };
  const pattern = (id: string): CanvasPattern | string | null => {
    const img = tile(id);
    return img ? ctx.createPattern(img, 'repeat') : null;
  };

  // Sky, then grass from the horizon down (tiles flipped at random so the tufts do not line up).
  const horizon = (layout.horizon ?? layout.walkArea.y - PLAZA_VIEW.horizonAbove / height) * height;
  ctx.fillStyle = css(layout.palette.sky);
  ctx.fillRect(0, 0, width, horizon);
  ctx.fillStyle = css(layout.palette.grass);
  ctx.fillRect(0, horizon, width, height - horizon);
  const grass = PLAZA_GROUND.grassTiles.map(tile).filter((t): t is HTMLImageElement => t !== null);
  if (grass.length > 0) {
    // The tiles go over their own average colour at half strength: the tufts stay, the tile seams do not show.
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    const pctx = probe.getContext('2d')!;
    pctx.imageSmoothingEnabled = true;
    pctx.drawImage(grass[0]!, 0, 0, 1, 1);
    const [r, g, b] = pctx.getImageData(0, 0, 1, 1).data;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, horizon, width, height - horizon);
    ctx.globalAlpha = PLAZA_GROUND.tileStrength;
    const size = grass[0]!.width;
    for (let y = horizon; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        const img = grass[Math.floor(random() * grass.length)]!;
        ctx.save();
        ctx.translate(x + (random() < 0.5 ? size : 0), y);
        ctx.scale(random() < 0.5 ? -1 : 1, 1);
        ctx.drawImage(img, 0, 0, size, size);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  for (const shape of layout.ground) {
    if (shape.kind === 'ellipse') paintEllipse(ctx, shape, layout, pattern, random);
    else paintPath(ctx, shape, layout, pattern);
  }
  canvas.refresh();
  // Beyond the frame (a window of another shape) the sky and the grass go on as flat colours.
  const wide = width * PLAZA_VIEW.bleed;
  scene.add.rectangle(width / 2, horizon - wide / 2, wide, wide, layout.palette.sky).setDepth(PLAZA_VIEW.skyDepth);
  scene.add.rectangle(width / 2, horizon + wide / 2, wide, wide, layout.palette.grass).setDepth(PLAZA_VIEW.skyDepth);
  return scene.add.image(0, 0, GROUND_TEXTURE).setOrigin(0, 0).setDepth(PLAZA_VIEW.groundDepth);
}

type Ellipse = Extract<GroundShape, { kind: 'ellipse' }>;
type Pathway = Extract<GroundShape, { kind: 'path' }>;
type Pat = (id: string) => CanvasPattern | string | null;

function ellipsePath(ctx: CanvasRenderingContext2D, s: Ellipse, w: number, h: number) {
  ctx.beginPath();
  ctx.ellipse(s.x * w, s.y * h, (s.width * w) / 2, (s.height * h) / 2, 0, 0, Math.PI * 2);
}

function paintEllipse(ctx: CanvasRenderingContext2D, s: Ellipse, layout: PlazaLayout, pat: Pat, random: () => number) {
  const { width: w, height: h } = layout.designSize;
  ellipsePath(ctx, s, w, h);
  if (s.fill === 'stone') {
    paintStones(ctx, s, w, h, random);
  } else {
    ctx.fillStyle = s.fill === 'water' ? (pat(PLAZA_GROUND.waterTile) ?? css(s.color)) : css(s.color);
    ctx.fill();
  }
  if (s.stroke !== undefined) {
    ellipsePath(ctx, s, w, h);
    ctx.lineWidth = PLAZA_VIEW.edgeWidth;
    ctx.strokeStyle = css(s.stroke);
    ctx.stroke();
  }
}

/** Cobbles on mortar, clipped to the ellipse. */
function paintStones(ctx: CanvasRenderingContext2D, s: Ellipse, w: number, h: number, random: () => number) {
  const st = PLAZA_GROUND.stones;
  ctx.save();
  ctx.clip();
  ctx.fillStyle = st.mortar;
  ctx.fillRect(s.x * w - (s.width * w) / 2, s.y * h - (s.height * h) / 2, s.width * w, s.height * h);
  const x0 = s.x * w - (s.width * w) / 2;
  const y0 = s.y * h - (s.height * h) / 2;
  for (let y = y0; y < y0 + s.height * h; y += st.minH + 2) {
    const offset = random() * 8;
    for (let x = x0 - offset; x < x0 + s.width * w; ) {
      const sw = st.minW + random() * (st.maxW - st.minW);
      const sh = st.minH + random() * (st.maxH - st.minH);
      ctx.fillStyle = st.colors[Math.floor(random() * st.colors.length)]!;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, sw - 2, sh - 2, 6);
      ctx.fill();
      x += sw;
    }
  }
  ctx.restore();
}

/** A dirt road: a grassy fringe, then the dirt tile over it, round at the bends and the ends. */
function paintPath(ctx: CanvasRenderingContext2D, s: Pathway, layout: PlazaLayout, pat: Pat) {
  const { width: w, height: h } = layout.designSize;
  const trace = () => {
    ctx.beginPath();
    s.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * w, y * h) : ctx.lineTo(x * w, y * h)));
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  trace();
  ctx.lineWidth = s.width + PLAZA_GROUND.pathEdgePx * 2;
  ctx.strokeStyle = PLAZA_GROUND.pathEdge;
  ctx.stroke();
  trace();
  ctx.lineWidth = s.width;
  ctx.strokeStyle = (s.fill === 'dirt' ? pat(PLAZA_GROUND.dirtTile) : null) ?? css(s.color);
  ctx.stroke();
}
