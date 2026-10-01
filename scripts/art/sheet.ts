// Contact sheet of rendered PNGs on a grass-green backdrop, for reviewing a family side by side.
import { PNG } from 'pngjs';

export function contactSheet(
  items: Buffer[],
  cols: number,
  cell: [number, number],
  bg = [196, 224, 160],
): Buffer {
  const pngs = items.map((b) => PNG.sync.read(b));
  const rows = Math.ceil(pngs.length / cols);
  const W = cols * cell[0],
    H = rows * cell[1];
  const o = new PNG({ width: W, height: H });
  for (let i = 0; i < W * H; i++) {
    o.data[i * 4] = bg[0]!;
    o.data[i * 4 + 1] = bg[1]!;
    o.data[i * 4 + 2] = bg[2]!;
    o.data[i * 4 + 3] = 255;
  }
  pngs.forEach((p, k) => {
    const ox = (k % cols) * cell[0],
      oy = Math.floor(k / cols) * cell[1];
    for (let y = 0; y < Math.min(p.height, cell[1]); y++) {
      for (let x = 0; x < Math.min(p.width, cell[0]); x++) {
        const s = (y * p.width + x) * 4,
          d = ((oy + y) * W + ox + x) * 4,
          a = p.data[s + 3]! / 255;
        for (let c = 0; c < 3; c++)
          o.data[d + c] = Math.round(p.data[s + c]! * a + o.data[d + c]! * (1 - a));
      }
    }
  });
  return PNG.sync.write(o);
}
