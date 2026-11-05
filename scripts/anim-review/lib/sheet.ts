// Contact sheets: an SVG laid out with labelled cells, rendered to PNG by resvg (text labels need no font code).
import { Resvg } from '@resvg/resvg-js';

export interface Cell {
  png: Buffer;
  width: number;
  height: number;
  label: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A grid of cells, `cols` wide, each drawn `cellW` px wide, with a title on top. Returns the PNG. */
export function contactSheet(title: string, cells: readonly Cell[], cols: number, cellW = 600): Buffer {
  const pad = 8;
  const head = 44;
  const lab = 26;
  const ratio = cells.length > 0 ? Math.max(...cells.map((c) => c.height / c.width)) : 0.5;
  const cellH = Math.round(cellW * ratio);
  const rows = Math.ceil(cells.length / cols);
  const W = cols * (cellW + pad) + pad;
  const H = head + rows * (cellH + lab + pad) + pad;
  const body = cells
    .map((c, i) => {
      const x = pad + (i % cols) * (cellW + pad);
      const y = head + Math.floor(i / cols) * (cellH + lab + pad);
      return (
        `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH + lab}" fill="#1b1b22"/>` +
        `<text x="${x + 6}" y="${y + 19}" font-family="Arial" font-size="17" fill="#ffe28a">${esc(c.label)}</text>` +
        `<image x="${x}" y="${y + lab}" width="${cellW}" height="${Math.round(cellW * (c.height / c.width))}" href="data:image/png;base64,${c.png.toString('base64')}"/>`
      );
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0c0c10"/><text x="${pad}" y="30" font-family="Arial" font-size="22" font-weight="bold" fill="#ffffff">${esc(title)}</text>${body}</svg>`;
  return Buffer.from(new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: 'Arial' } }).render().asPng());
}
