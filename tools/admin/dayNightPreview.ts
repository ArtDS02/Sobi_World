// Day / night preview canvas of the admin (DN): the farm frame painted with the game's own painters
// (sky, backdrop, layout placements, one sample pig) under the look's multiply tint and warm glows.
// A still picture — it never touches the game's save or clock.
import {
  ASSET_URL_BASE,
  createAssetRegistry,
  type AssetRegistry,
} from '../../src/core/assets/registry';
import type { AssetManifest } from '../../src/core/assets/manifestSchema';
import { DAY_NIGHT_VIEW, type PhaseLook } from '../../src/core/config/dayNight';
import { paintBackdrop } from '../../src/areas/farm/scene/view/backdropPaint';
import { placementTransform, placementView, visibleLayout } from '../../src/areas/farm/scene/view/sceneLayout';
import { cssColor, paintSky } from '../../src/areas/farm/scene/view/skyPaint';

type Registry = AssetRegistry;

let registry: Registry | null = null;
const images = new Map<string, Promise<HTMLImageElement | null>>();

function image(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  let p = images.get(url);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `/${url}`;
    });
    images.set(url, p);
  }
  return p;
}

async function loadRegistry(): Promise<Registry> {
  if (registry) return registry;
  const res = await fetch('/assets/manifest/assets.json');
  registry = createAssetRegistry((await res.json()) as AssetManifest);
  return registry;
}

/** First drawable file of a row: its asset, else a "full" state (the trough). */
const fileUrl = (reg: Registry, id: string) => reg.url(id, 'asset') ?? reg.url(id, 'full');

/** Paints the farm at `look` into `canvas` (any size; the 1600×900 frame is scaled to fit). */
export async function paintPreview(canvas: HTMLCanvasElement, look: PhaseLook) {
  const reg = await loadRegistry();
  const layout = visibleLayout(reg.manifest.layout);
  const { width: W, height: H } = layout.designSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = { x: 0, y: 0, width: W, height: H };
  const placed = await Promise.all(
    layout.placements.map(async (p, i) => ({
      p,
      v: placementView(p, i, layout),
      img: await image(fileUrl(reg, p.id)),
    })),
  );
  const pigRow = reg.manifest.pigs[0];
  const pig = await image(pigRow ? `${ASSET_URL_BASE}${pigRow.asset}` : null);

  ctx.save();
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.clearRect(0, 0, W, H);
  paintSky(ctx, rect, look);
  paintBackdrop(ctx, rect);
  const lit: { x: number; y: number; w: number; h: number }[] = [];
  for (const { p, v, img } of [...placed].sort((a, b) => a.v.depth - b.v.depth)) {
    if (!img) continue;
    const t = placementTransform(p, img.width, img.height);
    const w = img.width * t.scaleX;
    const h = img.height * t.scaleY;
    const x = v.x - w * v.originX;
    const y = v.y - h * v.originY;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate((t.angle * Math.PI) / 180);
    ctx.scale(t.flipX ? -1 : 1, 1);
    ctx.drawImage(img, -w * v.originX, -h * v.originY, w, h);
    ctx.restore();
    if (p.action && DAY_NIGHT_VIEW.litActions.includes(p.action)) lit.push({ x, y, w, h });
  }
  if (pig) {
    const size = 200;
    ctx.drawImage(pig, W / 2 - size / 2, layout.walkArea.y * H + 120, size, size);
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = cssColor(look.ambient);
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  const g = DAY_NIGHT_VIEW.glow;
  ctx.globalAlpha = look.lights * g.alpha;
  for (const b of lit) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * g.centerY;
    const rx = (b.w * g.width) / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, (b.h * g.height) / (b.w * g.width));
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, cssColor(g.color));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
