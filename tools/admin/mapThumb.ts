// Small pictures of Adventure areas for the dashboard (lists, dropdowns): at once the ground drawn by tile colour, and — for an area
// painted as one picture — its painting once its chunks have loaded; every `img[data-map-thumb="<id>"]` on the page then takes it.
// Also the other pictures of the World pages: a zone's card, a creature, a skill, an element (store.ts art rows).
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { sceneChunks } from '../../src/areas/adventure/scene/mapScene';
import { COLOUR } from './mapCanvas';
import { artUrl, state } from './store';

const WIDTH = 160;
const cache = new Map<string, string>();
const painting = new Set<string>();

const keyOf = (m: AreaMap) => `${m.id}|${m.cols}x${m.rows}|${m.scene?.art ?? ''}|${m.terrain.join('').length}|${hash(m.terrain.join(''))}`;
function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function canvasFor(m: AreaMap): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = WIDTH;
  c.height = Math.max(1, Math.round((WIDTH * m.rows) / m.cols));
  return c;
}

function groundThumb(m: AreaMap): string {
  const c = canvasFor(m);
  const g = c.getContext('2d')!;
  const sx = c.width / m.cols;
  const sy = c.height / m.rows;
  m.terrain.forEach((row, y) => [...row].forEach((ch, x) => {
    g.fillStyle = COLOUR[ch] ?? '#000';
    g.fillRect(Math.floor(x * sx), Math.floor(y * sy), Math.ceil(sx), Math.ceil(sy));
  }));
  return c.toDataURL();
}

/** Draws the painting of `m` when every chunk has loaded, then hands it to the pictures on the page. */
function paintThumb(m: AreaMap, key: string) {
  if (painting.has(key)) return;
  painting.add(key);
  const chunks = sceneChunks(m);
  const loaded = chunks.map((ch) => {
    const url = artUrl(ch.id);
    return new Promise<HTMLImageElement | null>((done) => {
      if (!url) return done(null);
      const img = new Image();
      img.onload = () => done(img);
      img.onerror = () => done(null);
      img.src = url;
    });
  });
  void Promise.all(loaded).then((imgs) => {
    if (imgs.some((i) => !i)) return;
    const c = canvasFor(m);
    const g = c.getContext('2d')!;
    const k = c.width / (m.cols * m.tile);
    chunks.forEach((ch, i) => g.drawImage(imgs[i]!, ch.x * k, ch.y * k, ch.w * k, ch.h * k));
    const url = c.toDataURL('image/jpeg', 0.8);
    cache.set(key, url);
    document.querySelectorAll<HTMLImageElement>(`img[data-map-thumb="${CSS.escape(m.id)}"]`).forEach((img) => (img.src = url));
    document.querySelectorAll<HTMLOptionElement>(`option[data-map-thumb="${CSS.escape(m.id)}"]`).forEach((o) => (o.dataset.img = url));
  });
}

/** A picture of the area now (the painting when ready, else its ground), and the painting on its way. */
export function mapThumb(m: AreaMap): string {
  const key = keyOf(m);
  const ready = cache.get(key);
  if (ready) return ready;
  const ground = cache.get(`${key}|ground`) ?? groundThumb(m);
  cache.set(`${key}|ground`, ground);
  if (m.scene) paintThumb(m, key);
  return ground;
}

/** The picture of a manifest row (props, ui, environment… or a pig), or null. */
export function imageOf(id: string): string | null {
  const art = artUrl(id);
  if (art) return art;
  const pig = state.pigs.find((p) => p.id === id);
  return pig?.asset ? `/assets/${pig.asset}` : null;
}

/** An element's icon (the game's own badge). */
export const elementImg = (element: string | null | undefined): string | null => (element ? imageOf(`ui_icon_elem_${element.toLowerCase()}`) : null);
