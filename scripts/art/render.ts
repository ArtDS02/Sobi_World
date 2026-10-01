// SVG → PNG through resvg (dev-only tool; nothing here ships).
import { Resvg } from '@resvg/resvg-js';

export function renderSvg(svg: string): Buffer {
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'original' }, background: 'rgba(0,0,0,0)' }).render().asPng(),
  );
}
