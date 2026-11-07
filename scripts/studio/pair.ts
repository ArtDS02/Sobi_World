// Review helper: the same rectangle cut from two in-game pictures, old (left) | new (right), optionally scaled.
//   npx tsx scripts/studio/pair.ts <old.png> <new.png> <x,y,w,h> <out.png> [scale]
import { blit, readPng, writePng, type Img } from './qa.ts';

const [oldFile, newFile, rect, out, scaleArg] = process.argv.slice(2);
if (!oldFile || !newFile || !rect || !out)
  throw new Error('usage: pair.ts <old.png> <new.png> <x,y,w,h> <out.png> [scale]');
const [x, y, w, h] = rect.split(',').map(Number) as [number, number, number, number];
const scale = Number(scaleArg ?? 1);

function crop(img: Img): Img {
  const data = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++)
    img.data.copy(
      data,
      r * w * 4,
      ((y + r) * img.width + x) * 4,
      ((y + r) * img.width + x + w) * 4,
    );
  return { width: w, height: h, data };
}
const pad = 10;
const sw = Math.round(w * scale);
const sh = Math.round(h * scale);
const canvas: Img = {
  width: sw * 2 + pad * 3,
  height: sh + pad * 2,
  data: Buffer.alloc((sw * 2 + pad * 3) * (sh + pad * 2) * 4, 255),
};
blit(canvas, crop(readPng(oldFile)), pad, pad, scale);
blit(canvas, crop(readPng(newFile)), sw + pad * 2, pad, scale);
writePng(out, canvas);
