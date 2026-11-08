// Debug helper: separate pieces (connected alpha) of one frame of a sheet at a git ref, with their pixel rects.
//   npx tsx scripts/studio/blobs.ts <manifest file> <frame> <frameW> [ref]
import { oldAsset } from './qa.ts';
const [file, frameArg, fwArg, ref] = process.argv.slice(2);
if (!file || !frameArg || !fwArg) throw new Error('usage: blobs.ts <file> <frame> <frameW> [ref]');
const img = oldAsset(file, ref ?? 'pre-unity-studio');
if (!img) throw new Error('not found');
const fw = Number(fwArg);
const x0 = Number(frameArg) * fw;
const seen = new Uint8Array(fw * img.height);
const on = (x: number, y: number) => img.data[(y * img.width + x0 + x) * 4 + 3]! > 40;
const out: number[][] = [];
for (let y = 0; y < img.height; y++)
  for (let x = 0; x < fw; x++) {
    if (seen[y * fw + x] || !on(x, y)) continue;
    let [a, b, c, d, n] = [x, y, x, y, 0];
    const stack = [[x, y]];
    seen[y * fw + x] = 1;
    while (stack.length) {
      const [px, py] = stack.pop()!;
      n++;
      a = Math.min(a, px!);
      b = Math.min(b, py!);
      c = Math.max(c, px!);
      d = Math.max(d, py!);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = px! + dx!,
          ny = py! + dy!;
        if (nx < 0 || ny < 0 || nx >= fw || ny >= img.height || seen[ny * fw + nx] || !on(nx, ny))
          continue;
        seen[ny * fw + nx] = 1;
        stack.push([nx, ny]);
      }
    }
    if (n > 30) out.push([a + x0, b, c - a + 1, d - b + 1, n]);
  }
out.sort((p, q) => q[4]! - p[4]!);
for (const r of out) console.log(`rect [${r[0]}, ${r[1]}, ${r[2]}, ${r[3]}]  pixels ${r[4]}`);
