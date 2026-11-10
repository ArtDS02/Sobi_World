// Editing an Area's scene layout (content/<area>/layout.json, decision 057 B5) as pure operations on the file's value, unit-tested.
// The page (areaLayout.ts) only calls these; every result is a new value, so "dirty" is a plain comparison with what was loaded.
import type { AreaLayoutFile, LayoutSpot } from '../../content/schemas/shared/areaLayout';

export type SpotField = keyof LayoutSpot;

/** How far outside the design frame a spot may be dragged (things may stand half off-screen, never lost). */
export const OUTSIDE_PX = 200;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const snapTo = (n: number, snap: number) => (snap > 1 ? Math.round(n / snap) * snap : Math.round(n));

function withSpot(file: AreaLayoutFile, view: number, key: string, next: (spot: LayoutSpot) => LayoutSpot): AreaLayoutFile {
  const at = file.views[view];
  const spot = at?.spots[key];
  if (!at || !spot) return file;
  return { ...file, views: file.views.map((v, i) => (i === view ? { ...v, spots: { ...v.spots, [key]: next(spot) } } : v)) };
}

/** The spot moved to design px (`x`, `y`), snapped to the grid and kept near the frame. */
export function moveSpot(file: AreaLayoutFile, view: number, key: string, x: number, y: number, snap = 1): AreaLayoutFile {
  const { width, height } = file.designSize;
  return withSpot(file, view, key, (s) => ({ ...s, x: clamp(snapTo(x, snap), -OUTSIDE_PX, width + OUTSIDE_PX), y: clamp(snapTo(y, snap), -OUTSIDE_PX, height + OUTSIDE_PX) }));
}

/** The spot moved by (`dx`, `dy`) design px (arrow keys). */
export function nudgeSpot(file: AreaLayoutFile, view: number, key: string, dx: number, dy: number): AreaLayoutFile {
  const spot = file.views[view]?.spots[key];
  return spot ? moveSpot(file, view, key, spot.x + dx, spot.y + dy) : file;
}

/**
 * One number of a spot typed in the panel. Only a field the spot already has can change (the schema says which spots have which),
 * a value that is not a finite number is ignored, and sizes / scales stay positive.
 */
export function patchSpot(file: AreaLayoutFile, view: number, key: string, field: SpotField, value: number): AreaLayoutFile {
  if (!Number.isFinite(value)) return file;
  return withSpot(file, view, key, (s) => {
    if (s[field] === undefined) return s;
    if (field === 'x' || field === 'y') return { ...s, [field]: Math.round(value) };
    if (value <= 0) return s;
    return { ...s, [field]: field === 'scale' ? Math.round(value * 100) / 100 : Math.round(value) };
  });
}

/** Where the right-hand menu's circle sits, percent from the top (0..90). */
export const withMenuTop = (file: AreaLayoutFile, top: number): AreaLayoutFile => (Number.isFinite(top) ? { ...file, sideMenu: { top: clamp(Math.round(top), 0, 90) } } : file);

/** Centres of the cells of a grid spot (the plot field), row by row. */
export function gridCells(spot: LayoutSpot, columns: number, rows: number): { x: number; y: number }[] {
  const stepX = spot.stepX ?? 0;
  const stepY = spot.stepY ?? 0;
  return Array.from({ length: columns * rows }, (_, i) => ({ x: spot.x + (i % columns) * stepX, y: spot.y + Math.floor(i / columns) * stepY }));
}

export const sameLayout = (a: AreaLayoutFile, b: AreaLayoutFile): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Design px of a pointer at (`clientX`, `clientY`) over a stage drawn in `rect`. */
export function toDesign(file: AreaLayoutFile, rect: { left: number; top: number; width: number; height: number }, clientX: number, clientY: number): { x: number; y: number } {
  return { x: ((clientX - rect.left) / rect.width) * file.designSize.width, y: ((clientY - rect.top) / rect.height) * file.designSize.height };
}
