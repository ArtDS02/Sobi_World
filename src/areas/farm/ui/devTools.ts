// Dev-only time travel (?dev=1 in `npm run dev`). Callers gate on import.meta.env.DEV, so a
// production build drops this module.
import { BALANCE } from '../../../core/config/balance';
import { DECOR_IDS } from '../../../core/config/decor';
import { BREED_IDS } from '../../../core/config/breeds';
import { DAY_PHASES, type DayPhase } from '../../../core/config/dayNight';
import { SEASON_IDS, type SeasonId } from '../../../core/config/seasons';
import { parseSeason } from '../../../core/engine/season';
import { randomId } from '../../../core/rng';
import type { Pig } from '../../../core/types';
import type { BoundAction } from '../../../core/world/gameStore';
import { el } from '../../../ui/dom';

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
  // Every decoration too, so the full farm layout can be checked (PG-3).
  const state = { ...s, player, pigs: [...s.pigs, ...pigs], decor: [...DECOR_IDS] };
  return { ok: true, state, events: [] };
};

export function renderDevTools(
  skip: (ms: number) => void,
  gallery?: () => void,
  fillPigs?: () => void,
  previewPhase?: (phase: DayPhase | null) => void,
  previewSeason?: (season: SeasonId | null) => void,
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
  return el(
    'div',
    { class: 'c-devtools' },
    button(1),
    button(6),
    assets,
    fill,
    previewPhase ? phaseSelect(previewPhase) : null,
    previewSeason ? seasonSelect(previewSeason) : null,
    meter,
  );
}

/** Day / night preview (DN): auto = local clock; a phase is shown until auto again. Never saved. */
function phaseSelect(previewPhase: (phase: DayPhase | null) => void): HTMLElement {
  const select = el(
    'select',
    { attrs: { 'aria-label': 'day / night preview' } },
    el('option', { text: 'auto', attrs: { value: '' } }),
    ...DAY_PHASES.map((p) => el('option', { text: p, attrs: { value: p } })),
  );
  select.value = devPhaseParam() ?? '';
  select.addEventListener('change', () => previewPhase(parsePhase(select.value)));
  return select;
}

/** Season preview (SE-1): auto = local calendar; `?season=winter` in the dev URL preselects one. */
function seasonSelect(previewSeason: (season: SeasonId | null) => void): HTMLElement {
  const select = el(
    'select',
    { attrs: { 'aria-label': 'season preview' } },
    el('option', { text: 'auto', attrs: { value: '' } }),
    ...SEASON_IDS.map((s) => el('option', { text: s, attrs: { value: s } })),
  );
  select.value = devSeasonParam() ?? '';
  select.addEventListener('change', () => previewSeason(parseSeason(select.value)));
  return select;
}

export const devSeasonParam = (): SeasonId | null =>
  parseSeason(new URLSearchParams(location.search).get('season'));

const parsePhase = (value: string | null): DayPhase | null =>
  (DAY_PHASES as readonly string[]).includes(value ?? '') ? (value as DayPhase) : null;

/** `?phase=night` in the dev URL (the admin dashboard's "open in game" link). */
export const devPhaseParam = (): DayPhase | null =>
  parsePhase(new URLSearchParams(location.search).get('phase'));

/**
 * The farm's measured frame rate (R12A performance check with 12 pigs). Called on every store
 * notify (the game's one 1 s tick), so no extra timer.
 */
export function showFps(tools: HTMLElement, fps: number | null) {
  const meter = tools.querySelector('.c-devtools__fps');
  if (meter) meter.textContent = fps === null ? 'fps -' : `fps ${Math.round(fps)}`;
}
