// Debug helper: painted bounding box of PNGs (alpha > 20). npx tsx scripts/studio/bbox.ts <png…>
import { readPng } from './qa.ts';
for (const f of process.argv.slice(2)) {
  const p = readPng(f);
  let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++)
      if (p.data[(y * p.width + x) * 4 + 3]! > 20)
        [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  console.log(
    f,
    `${p.width}x${p.height}`,
    'bbox',
    x0,
    y0,
    x1,
    y1,
    'size',
    x1 - x0 + 1,
    y1 - y0 + 1,
  );
}
