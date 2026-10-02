// Dev-only time travel (?dev=1 in `npm run dev`). Callers gate on import.meta.env.DEV, so a
// production build drops this module.
import { BALANCE } from '../core/config/balance';
import { BREED_IDS } from '../core/config/breeds';
import { randomId } from '../core/rng';
import type { Pig } from '../core/types';
import type { BoundAction } from '../store/gameStore';
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

/**
 * Performance check (U05): fills every slot up to MAX_SLOTS with adult pigs of every species.
 * Dev save only — it skips the shop and the slot prices on purpose.
 */
export const devFillPigs: BoundAction = (s, c) => {
  const used = new Set(s.pigs.map((p) => p.slotIndex));
  const pigs: Pig[] = [];
  for (let slot = 0; slot < BALANCE.MAX_SLOTS; slot += 1) {
    if (used.has(slot)) continue;
    const breed = BREED_IDS[slot % BREED_IDS.length]!;
    pigs.push({
      id: randomId(c.rng),
      slotIndex: slot,
      breed,
      name: `Heo ${slot + 1}`,
      gender: slot % 2 === 0 ? 'MALE' : 'FEMALE',
      growthProgress: 100,
      hunger: 100,
      cleanliness: 100,
      isSick: false,
      pregnancy: null,
      lastTickedAt: c.now,
      createdAt: c.now,
    });
  }
  const player = { ...s.player, unlockedSlots: BALANCE.MAX_SLOTS };
  return { ok: true, state: { ...s, player, pigs: [...s.pigs, ...pigs] }, events: [] };
};

export function renderDevTools(
  skip: (ms: number) => void,
  gallery?: () => void,
  fillPigs?: () => void,
): HTMLElement {
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
  const fill = fillPigs
    ? el('button', {
        class: 'c-button c-button--ghost',
        text: 'pigs',
        attrs: { type: 'button' },
        on: { click: fillPigs },
      })
    : null;
  const meter = el('span', { class: 'c-devtools__fps', text: 'fps -' });
  return el('div', { class: 'c-devtools' }, button(1), button(6), assets, fill, meter);
}

/**
 * The farm's measured frame rate (R12A performance check with 12 pigs). Called on every store
 * notify (the game's one 1 s tick), so no extra timer.
 */
export function showFps(tools: HTMLElement, fps: number | null) {
  const meter = tools.querySelector('.c-devtools__fps');
  if (meter) meter.textContent = fps === null ? 'fps -' : `fps ${Math.round(fps)}`;
}
