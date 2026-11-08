// Review helper: frames of one Battle Lab case from two capture runs (npm run anim:capture), old on the top row and new
// below, cut around the target and limited to a time window.
//   npx tsx scripts/studio/battlePair.ts <oldRunDir> <newRunDir> <caseId> <fromMs> <toMs> <x,y,w,h> <out.png> [scale]
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { blit, readPng, writePng, type Img } from './qa.ts';

const [oldRun, newRun, caseId, fromArg, toArg, rect, out, scaleArg] = process.argv.slice(2);
if (!oldRun || !newRun || !caseId || !fromArg || !toArg || !rect || !out)
  throw new Error(
    'usage: battlePair.ts <oldRun> <newRun> <caseId> <fromMs> <toMs> <x,y,w,h> <out.png> [scale]',
  );
const [x, y, w, h] = rect.split(',').map(Number) as [number, number, number, number];
const scale = Number(scaleArg ?? 1);
const from = Number(fromArg);
const to = Number(toArg);

const framesOf = (run: string) =>
  readdirSync(join(run, 'frames', caseId))
    .map((f) => ({ f, ms: Number(/_(\d+)ms/.exec(f)?.[1] ?? NaN) }))
    .filter((r) => r.ms >= from && r.ms <= to)
    .sort((a, b) => a.ms - b.ms);

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

const a = framesOf(oldRun);
const b = framesOf(newRun);
const n = Math.max(a.length, b.length);
const pad = 6;
const cw = Math.round(w * scale);
const ch = Math.round(h * scale);
const canvas: Img = {
  width: n * (cw + pad) + pad,
  height: 2 * (ch + pad) + pad,
  data: Buffer.alloc((n * (cw + pad) + pad) * (2 * (ch + pad) + pad) * 4, 255),
};
[a, b].forEach((row, r) =>
  row.forEach((fr, i) =>
    blit(
      canvas,
      crop(readPng(join(r === 0 ? oldRun : newRun, 'frames', caseId, fr.f))),
      pad + i * (cw + pad),
      pad + r * (ch + pad),
      scale,
    ),
  ),
);
writePng(out, canvas);
console.log(`${a.length} old / ${b.length} new frames, ${a.map((r) => r.ms).join(' ')}`);
