// The rod (spec V2 §8.3): the dock dialog with its mini-game. A marker sweeps a bar on the frame loop; pulling reads the
// clock once and sends the score to castLine; the result is read from the action's events.
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { formatDuration, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { castLine } from '../logic/actions/fishing';
import { FISH } from '../logic/config/content';
import type { AquariumEvent } from '../logic/events';
import { dockVm, markerAt, MINI, scoreOf, zoneCentre } from './dockVm';
import { actionButton, type DialogKit } from './dialogKit';

type Phase = { kind: 'idle' } | { kind: 'casting'; startedAt: number; centre: number } | { kind: 'result'; text: string; good: boolean };

export function openFishing(k: DialogKit) {
  let phase: Phase = { kind: 'idle' };
  let marker: HTMLElement | null = null;
  const moveMarker = () => {
    if (phase.kind === 'casting' && marker) marker.style.left = `${markerAt(k.now() - phase.startedAt) * 100}%`;
  };

  async function pull() {
    if (phase.kind !== 'casting') return;
    const score = scoreOf(markerAt(k.now() - phase.startedAt), phase.centre);
    const q = vi.aquarium.fishing.quality;
    const label = score >= 0.85 ? q.perfect : score >= 0.55 ? q.good : q.ok;
    const before = new Set(k.world()?.collection.discovered.fish ?? []);
    const r = await k.dispatch((s, c) => castLine(s, { score }, c));
    const cast = (r.events ?? []).find((e): e is AquariumEvent & { type: 'AQUARIUM_CAST' } => e.type === 'AQUARIUM_CAST');
    if (!r.ok || !cast) phase = { kind: 'idle' };
    else if (cast.itemId === null) phase = { kind: 'result', text: vi.aquarium.fishing.missed, good: false };
    else {
      const species = cast.speciesId ? FISH[cast.speciesId] : undefined;
      const name = species?.nameVi ?? vi.aquarium.fishing.oyster;
      const isNew = !!species && !before.has(species.id);
      phase = { kind: 'result', text: `${label} ${t(isNew ? vi.aquarium.fishing.caughtNew : vi.aquarium.fishing.caught, { name })}`, good: true };
    }
    k.redraw();
  }

  k.open(vi.aquarium.fishing.title, (w) => {
    const dock = dockVm(w, k.now(), k.offset());
    const odds = el(
      'ul',
      { class: 'aquarium-dialog__odds' },
      ...dock.odds.map((o) =>
        el(
          'li',
          { class: o.known ? '' : 'is-unknown' },
          art(o.art, 'aquarium-dialog__odds-icon'),
          el('span', { text: `${o.name}${o.night ? ' 🌙' : ''}` }),
          el('small', { text: `${o.percent < 1 ? '<1' : Math.round(o.percent)}%` }),
        ),
      ),
    );
    let stage: HTMLElement;
    if (phase.kind === 'casting') {
      const centre = phase.centre;
      marker = el('span', { class: 'aquarium-mini__marker', attrs: { 'aria-hidden': 'true' } });
      moveMarker();
      stage = el(
        'div',
        { class: 'aquarium-dialog__stage' },
        el('p', { text: vi.aquarium.fishing.waiting }),
        el(
          'div',
          { class: 'aquarium-mini', attrs: { role: 'img', 'aria-label': vi.aquarium.fishing.intro } },
          el('span', { class: 'aquarium-mini__zone', attrs: { style: `left: ${(centre - MINI.zoneHalf) * 100}%; width: ${MINI.zoneHalf * 200}%` } }),
          marker,
        ),
        el('button', { class: 'c-button', text: vi.aquarium.fishing.pull, attrs: { type: 'button' }, on: { click: () => void pull() } }),
      );
    } else {
      marker = null;
      const cooling = dock.cooldownMs > 0;
      stage = el(
        'div',
        { class: 'aquarium-dialog__stage' },
        phase.kind === 'result' ? el('p', { class: `aquarium-dialog__result${phase.good ? ' is-good' : ''}`, text: phase.text }) : el('p', { text: vi.aquarium.fishing.intro }),
        actionButton(
          { label: phase.kind === 'result' ? vi.aquarium.fishing.again : vi.aquarium.fishing.cast, reason: cooling ? t(vi.aquarium.fishing.rest, { time: formatDuration(dock.cooldownMs) }) : null },
          () => {
            const startedAt = k.now();
            phase = { kind: 'casting', startedAt, centre: zoneCentre(startedAt) };
            k.redraw();
          },
        ),
      );
    }
    return el('div', { class: 'aquarium-dialog' }, stage, el('p', { class: 'c-dialog__strong', text: t(vi.aquarium.fishing.odds, { time: dock.period }) }), odds);
  });
  // The marker moves on the frame loop, not on world changes.
  k.onFrame(moveMarker);
}
