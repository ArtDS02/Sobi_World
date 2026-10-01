// Dev-only time travel (?dev=1 in `npm run dev`). Callers gate on import.meta.env.DEV, so a
// production build drops this module.
import { el } from './dom';

const HOUR = 3_600_000;

export function devClockOffset() {
  let offset = 0;
  return {
    now: (real: number) => real + offset,
    add: (ms: number) => {
      offset += ms;
    },
  };
}

export function renderDevTools(skip: (ms: number) => void, gallery?: () => void): HTMLElement {
  const button = (hours: number) =>
    el('button', {
      class: 'c-button c-button--ghost',
      text: `+${hours}h`,
      attrs: { type: 'button' },
      on: { click: () => skip(hours * HOUR) },
    });
  const assets = gallery
    ? el('button', {
        class: 'c-button c-button--ghost',
        text: 'assets',
        attrs: { type: 'button' },
        on: { click: gallery },
      })
    : null;
  const meter = el('span', { class: 'c-devtools__fps', text: 'fps -' });
  return el('div', { class: 'c-devtools' }, button(1), button(6), assets, meter);
}

/**
 * The farm's measured frame rate (R12A performance check with 12 pigs). Called on every store
 * notify (the game's one 1 s tick), so no extra timer.
 */
export function showFps(tools: HTMLElement, fps: number | null) {
  const meter = tools.querySelector('.c-devtools__fps');
  if (meter) meter.textContent = fps === null ? 'fps -' : `fps ${Math.round(fps)}`;
}
