// The camp's cards (GĐ14 layout of the owner's mock-up): a zone (a slice of its painting, its words, discovery, the elements met there)
// and a companion (portrait, element and class badges, the tick when chosen, experience and energy bars, why it cannot go, its profile).
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { AB } from '../logic/config/content';
import type { ZoneCardVm } from './campVm';
import type { FighterCardVm } from './fighterVm';
import { bar, classIcon, elementIcon, type ViewCtx } from './viewKit';

export function zoneCard(z: ZoneCardVm, ctx: ViewCtx): HTMLElement {
  const chosen = z.id === ctx.state.zoneId;
  return el(
    'button',
    {
      class: `adventure-ui__zone${chosen ? ' is-selected' : ''}${z.locked ? ' is-off' : ''}`,
      attrs: { type: 'button', 'aria-pressed': String(chosen), ...(z.locked ? { title: z.locked } : {}) },
      on: {
        click: () => {
          ctx.state.zoneId = z.id;
          ctx.state.startMap = null;
          ctx.rerender();
        },
      },
    },
    art(z.backdrop, 'adventure-ui__zone-art', z.name) ?? el('span', { class: 'adventure-ui__zone-art' }),
    el(
      'span',
      { class: 'adventure-ui__zone-text' },
      el('b', { text: z.name }),
      el('small', { class: 'adventure-ui__zone-desc', text: z.desc }),
      z.cleared ? el('small', { class: 'adventure-ui__zone-meta', text: z.cleared }) : null,
      z.locked ? el('span', { class: 'adventure-ui__zone-lock', text: z.locked }) : null,
    ),
    el(
      'span',
      { class: 'adventure-ui__zone-foot' },
      el('span', { class: 'adventure-ui__zone-bar' }, bar(z.explorePct, 'explore', z.explored), el('small', { text: z.explored })),
      el('span', { class: 'adventure-ui__zone-foes', attrs: { title: z.foes } }, ...z.foeElements.map((e) => elementIcon(e))),
    ),
  );
}

export function fighterCard(c: FighterCardVm, ctx: ViewCtx): HTMLElement {
  const chosen = ctx.state.selected.includes(c.key);
  const off = c.notReady !== null;
  return el(
    'div',
    { class: `adventure-ui__fighter is-${c.elementList[0]!.toLowerCase()}${chosen ? ' is-selected' : ''}${off ? ' is-off' : ''}`, attrs: { title: `${c.name} · ${c.lineLabel} · ${c.hearts} · ${c.rageText}` } },
    el(
      'button',
      {
        class: 'adventure-ui__fighter-pick',
        attrs: { type: 'button', 'aria-pressed': String(chosen), ...(off ? { disabled: '', title: c.notReady ?? '' } : {}) },
        on: {
          click: () => {
            const s = ctx.state;
            s.selected = chosen ? s.selected.filter((k) => k !== c.key) : s.selected.length < AB.team.max ? [...s.selected, c.key] : s.selected;
            ctx.rerender();
          },
        },
      },
      el('span', { class: 'adventure-ui__fighter-els' }, ...c.elementList.map((e) => elementIcon(e))),
      classIcon(c.classId, 'adventure-ui__fighter-class'),
      chosen ? el('span', { class: 'adventure-ui__fighter-check', attrs: { 'aria-hidden': 'true' } }) : null,
      art(c.art, 'adventure-ui__fighter-art', c.name) ?? el('span', { class: 'adventure-ui__fighter-art' }),
      el('span', { class: 'adventure-ui__fighter-lv', attrs: { 'aria-label': c.level } }, el('small', { text: 'Lv' }), el('b', { text: String(c.levelNumber) })),
      el('b', { text: c.name }),
      el('small', { text: c.classLabel }),
      c.honor ? el('small', { class: 'adventure-ui__fighter-honor', text: `«${c.honor}»` }) : null,
    ),
    el(
      'div',
      { class: 'adventure-ui__meters' },
      // The level bar (adventure-big-update-1 §15): the way to the next level, with its numbers on it.
      el('span', { class: 'adventure-ui__meter-row is-exp is-level', attrs: { title: `${c.level} · ${c.expText}` } }, bar(c.expPercent, 'exp', c.expText), el('small', { class: 'adventure-ui__meter-text', text: c.expText })),
      el('span', { class: 'adventure-ui__meter-row is-energy', attrs: { title: c.energyText } }, bar(c.energyPercent, 'energy', c.energyText)),
    ),
    c.statusChip ? el('span', { class: 'adventure-ui__chip', text: c.statusChip, attrs: { title: c.statusChip } }) : null,
    el('button', { class: 'adventure-ui__sheet-btn', text: c.sp > 0 ? `${vi.adventure.camp.sheet} · ${t(vi.adventure.card.sp, { sp: c.sp })}` : vi.adventure.camp.sheet, attrs: { type: 'button' }, on: { click: () => ctx.openSheet(c.key) } }),
  );
}
