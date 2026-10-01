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
  return el('div', { class: 'c-devtools' }, button(1), button(6), assets);
}
