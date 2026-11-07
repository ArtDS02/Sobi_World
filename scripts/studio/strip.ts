// Debug helper: lay PNGs side by side on a light checker, scaled (nearest). For looking at frames at full resolution.
//   npx tsx scripts/studio/strip.ts <out.png> <scale> <png…>
import { blit, readPng, writePng, type Img } from './qa.ts';
const [out, scaleArg, ...files] = process.argv.slice(2);
if (!out || !scaleArg || !files.length) throw new Error('usage: strip.ts <out.png> <scale> <png…>');
const scale = Number(scaleArg);
const imgs = files.map(readPng);
const pad = 8;
const W = imgs.reduce((a, i) => a + Math.round(i.width * scale) + pad, pad);
const H = Math.max(...imgs.map((i) => Math.round(i.height * scale))) + pad * 2;
const canvas: Img = { width: W, height: H, data: Buffer.alloc(W * H * 4) };
for (let i = 0; i < W * H; i++) {
  const c = ((Math.floor((i % W) / 12) + Math.floor(Math.floor(i / W) / 12)) & 1) === 0 ? 236 : 222;
  canvas.data.fill(c, i * 4, i * 4 + 3);
  canvas.data[i * 4 + 3] = 255;
}
let x = pad;
for (const img of imgs) {
  blit(canvas, img, x, pad, scale);
  x += Math.round(img.width * scale) + pad;
}
writePng(out, canvas);
