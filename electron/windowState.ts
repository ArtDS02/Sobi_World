// Window size/position persistence (spec §10.4): a small JSON file in userData.
import * as fsp from 'node:fs/promises';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized: boolean;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const WINDOW_DEFAULT = { width: 1280, height: 800 };
export const WINDOW_MIN = { width: 1024, height: 640 };

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Saved state, or the default when missing/invalid or no longer on any display. */
export async function readWindowState(path: string, displays: Rect[]): Promise<WindowState> {
  const fallback: WindowState = { ...WINDOW_DEFAULT, maximized: false };
  try {
    const raw = JSON.parse(await fsp.readFile(path, 'utf8')) as Partial<WindowState>;
    if (!isNum(raw.width) || !isNum(raw.height)) return fallback;
    const state: WindowState = {
      width: Math.max(raw.width, WINDOW_MIN.width),
      height: Math.max(raw.height, WINDOW_MIN.height),
      maximized: raw.maximized === true,
    };
    if (isNum(raw.x) && isNum(raw.y)) {
      const { x, y } = raw;
      const visible = displays.some(
        (d) => x < d.x + d.width && x + state.width > d.x && y < d.y + d.height && y + 40 > d.y,
      );
      if (visible) Object.assign(state, { x, y });
    }
    return state;
  } catch {
    return fallback;
  }
}

export async function writeWindowState(path: string, state: WindowState): Promise<void> {
  try {
    await fsp.writeFile(path, JSON.stringify(state), 'utf8');
  } catch {
    // Losing the window position is harmless; never block quitting on it.
  }
}
