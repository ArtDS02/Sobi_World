// The sky over the world (GĐ12): the weather of the day drawn over the place the player is in (placeholder CSS: tint, streaks, snow,
// a rainbow arc), and a small chip with the weather, a mark for a running festival and one for the merchant. Presentation only: the
// numbers of the weather run the same in every Area, seen or not. Re-rendered only when what it shows changes.
import { DAY_MS } from '../../core/clock';
import { FESTIVAL_RULES, MERCHANT_RULES } from '../../core/config/live';
import { canClaimGift, liveFestival } from '../../core/live/festival';
import { merchantVisits } from '../../core/live/visit';
import type { WorldSave } from '../../core/save/world';
import { vi } from '../../i18n/vi';
import { weatherNow } from '../../systems/weather/live';
import type { PanelId } from '../components/popup';
import { el } from '../dom';
import { localOffsetMs } from '../localDay';
import { WEATHER_GLYPH } from './liveVm';

export interface SkyDeps {
  save: () => WorldSave | null;
  now: () => number;
  open: (panel: PanelId) => void;
}

export interface SkyLayer {
  root: HTMLElement;
  /** Re-reads the world; `place` is the Area on screen (the Adventure has no weather of its own). */
  update: (place: string, reduceMotion: boolean) => void;
}

export function createSkyLayer(d: SkyDeps): SkyLayer {
  const fx = el('div', { class: 'sky__fx', attrs: { 'aria-hidden': 'true' } });
  const chips = el('div', { class: 'sky__chips' });
  const root = el('div', { class: 'sky', data: { weather: 'sunny' } }, fx, chips);
  let shown = '';

  const chip = (glyph: string, label: string, panel: PanelId, kind: string) =>
    el(
      'button',
      { class: `sky__chip sky__chip--${kind}`, attrs: { type: 'button', title: label, 'aria-label': label }, on: { click: () => d.open(panel) } },
      el('span', { class: 'sky__glyph', text: glyph, attrs: { 'aria-hidden': 'true' } }),
      el('span', { class: 'sky__text', text: label }),
    );

  return {
    root,
    update(place, reduceMotion) {
      const save = d.save();
      const now = d.now();
      const hidden = save === null || place === 'adventure';
      const offset = localOffsetMs(now);
      const weather = save ? weatherNow(save, now, offset) : 'sunny';
      const day = Math.floor((now + offset) / DAY_MS);
      const festival = save ? liveFestival(day, save.live.dev.festival, FESTIVAL_RULES) : null;
      const merchant = save ? merchantVisits(day, MERCHANT_RULES, save.live.dev.merchant) : false;
      const gift = save !== null && festival !== null && canClaimGift(save, day, FESTIVAL_RULES);
      const signature = [place, hidden, weather, festival?.id ?? '', merchant, gift, reduceMotion].join('|');
      if (signature === shown) return;
      shown = signature;
      root.hidden = hidden;
      root.dataset.weather = weather;
      root.dataset.place = place;
      root.classList.toggle('is-still', reduceMotion);
      chips.replaceChildren(
        chip(WEATHER_GLYPH[weather], vi.weather.names[weather], 'weather', 'weather'),
        ...(festival ? [chip('★', gift ? `${festival.nameVi} · ${vi.festival.giftWaiting}` : festival.nameVi, 'festival', 'festival')] : []),
        ...(merchant ? [chip('⛺', vi.weather.merchantBadge, 'merchant', 'merchant')] : []),
      );
    },
  };
}
