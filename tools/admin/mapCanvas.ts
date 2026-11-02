// An Adventure area drawn small on a canvas for the Map Builder (decision 047): the ground by tile colour and marks on top (spawns,
// exits, portal, groups…), one square per tile in the game's own grid — the scale only changes the drawing, a click always gives the
// logical tile.
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';

/** The tiles of `maps.json` terrain, with their names in the admin. */
export const GROUND = [['.', 'Đất'], [',', 'Đường'], ['=', 'Cầu'], ['#', 'Vách / tường'], ['~', 'Nước'], ['^', 'Đất cao'], ['s', 'Bậc đá'], ['c', 'Đất tha hóa'], ['F', 'Vách cao nguyên'], ['w', 'Thác nước']] as const;
export const COLOUR: Record<string, string> = { '.': '#bfe09f', ',': '#e6d3a3', '=': '#c49a68', '#': '#5c7a4a', '~': '#7fc4e8', '^': '#d6efb8', s: '#cdb68a', c: '#c9a8dc', F: '#8a7a62', w: '#b8e4f8' };

export interface GridMark {
  x: number;
  y: number;
  w?: number;
  h?: number;
  colour: string;
  text?: string;
  /** Drawn with a thick outline (the selected one). */
  strong?: boolean;
}

/** The tile size that fits `map` in `width` px (at least 4 px). */
export const cellFor = (map: Pick<AreaMap, 'cols'>, width: number): number => Math.max(4, Math.floor(width / map.cols));

export function drawMapGrid(canvas: HTMLCanvasElement, map: AreaMap, cell: number, marks: readonly GridMark[]) {
  canvas.width = map.cols * cell;
  canvas.height = map.rows * cell;
  const g = canvas.getContext('2d')!;
  map.terrain.forEach((row, y) =>
    [...row].forEach((c, x) => {
      g.fillStyle = COLOUR[c] ?? '#000';
      g.fillRect(x * cell, y * cell, cell, cell);
    }),
  );
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 ${Math.max(8, Math.round(cell * 0.9))}px system-ui`;
  for (const m of marks) {
    const w = (m.w ?? 1) * cell;
    const h = (m.h ?? 1) * cell;
    g.fillStyle = m.colour;
    g.fillRect(m.x * cell, m.y * cell, w, h);
    if (m.strong) {
      g.lineWidth = 3;
      g.strokeStyle = '#ff2fd0';
      g.strokeRect(m.x * cell - 2, m.y * cell - 2, w + 4, h + 4);
    }
    if (m.text) {
      g.fillStyle = '#1d1410';
      g.fillText(m.text, m.x * cell + w / 2, m.y * cell + h / 2 + 1);
    }
  }
}

/** The tile under a mouse event on a canvas drawn by drawMapGrid (CSS scaling of the canvas taken into account). */
export function tileOfEvent(canvas: HTMLCanvasElement, e: MouseEvent, cell: number): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  const px = ((e.clientX - r.left) * canvas.width) / r.width;
  const py = ((e.clientY - r.top) * canvas.height) / r.height;
  return { x: Math.floor(px / cell), y: Math.floor(py / cell) };
}
