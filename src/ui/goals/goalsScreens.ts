// The world's goals screens (spec V2 §9): the Order Board of the plaza, the daily goals / login reward /
// achievements, and the Codex. DOM only; every number and every reason comes from goalsVm.ts.
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { art } from '../components/icon';
import { rarityBadge } from '../components/rarityBadge';
import { thumb } from '../components/thumb';
import type { Rarity } from '../../core/config/rarity';
import type { WorldAction } from '../../core/goals/api';
import type { AchievementVm, ActionVm, BoardVm, CodexVm, DailyGoalsVm, LoginVm } from './goalsVm';

/** What the screens do: run a world action. */
export type Act = (run: WorldAction) => void;

const button = (vm: Pick<ActionVm, 'label' | 'reason'>, onClick: () => void, variant = '') =>
  el(
    'span',
    { class: 'c-action' },
    el('button', {
      class: `c-button ${variant}`.trim(),
      text: vm.label,
      attrs: { type: 'button', ...(vm.reason !== null ? { disabled: '', 'aria-disabled': 'true' } : {}) },
      on: { click: () => vm.reason === null && onClick() },
    }),
    vm.reason !== null ? el('span', { class: 'c-action__reason', text: vm.reason }) : null,
  );

const bar = (percent: number, cls = '') =>
  el(
    'span',
    { class: `c-bar ${cls}`.trim(), attrs: { role: 'progressbar', 'aria-valuenow': String(percent) } },
    el('span', { class: 'c-bar__fill', attrs: { style: `width: ${Math.min(100, percent)}%` } }),
  );

const heading = (title: string, sub: string) =>
  el('h3', { class: 'achievements__heading' }, el('span', { text: title }), el('span', { class: 'achievements__sub', text: sub }));

/** The Order Board: one card per order with what it asks for, what it pays and the two buttons. */
export function renderBoard(vm: BoardVm, act: Act): HTMLElement {
  return el(
    'section',
    { class: 'orders__board' },
    el('p', { class: 'orders__hint', text: vm.hint }),
    el(
      'ul',
      { class: 'orders__list' },
      ...vm.cards.map((c) =>
        el(
          'li',
          { class: 'orders__card orders__card--board', data: { order: c.id } },
          el(
            'ul',
            { class: 'orders__lines' },
            ...c.lines.map((l) =>
              el(
                'li',
                { class: `orders__line${l.enough ? ' is-enough' : ''}` },
                art(l.artId, 'orders__item', l.name),
                el('span', { class: 'orders__line-name', text: `${l.qty} ${l.name}` }),
                el('span', { class: 'orders__line-have', text: `${l.have}/${l.qty}` }),
              ),
            ),
          ),
          el('p', { class: 'orders__reward', text: c.reward }),
          c.bonus ? el('p', { class: 'orders__req', text: c.bonus }) : null,
          el(
            'div',
            { class: 'orders__foot' },
            button(c.deliver, () => act(c.deliver.run)),
            button(c.reroll, () => act(c.reroll.run), 'c-button--ghost'),
          ),
        ),
      ),
      ...vm.empty.map((text) => el('li', { class: 'orders__card orders__card--empty' }, el('p', { class: 'orders__req', text }))),
    ),
  );
}

/** Daily goals (three light ones and their bonus), the login reward strip, and every achievement. */
export function renderGoals(daily: DailyGoalsVm, login: LoginVm, achievements: { summary: string; items: AchievementVm[] }, act: Act): HTMLElement {
  return el(
    'section',
    { class: 'achievements', data: { screen: 'achievements' } },
    el(
      'section',
      { class: 'achievements__daily' },
      heading(vi.goals.daily.title, ''),
      el('p', { class: 'achievements__hint', text: vi.goals.daily.hint }),
      daily.goals.length === 0
        ? el('p', { class: 'achievements__hint', text: vi.goals.daily.empty })
        : el(
            'ul',
            { class: 'achievements__list' },
            ...daily.goals.map((g) =>
              el(
                'li',
                { class: `achievements__item is-${g.status === 'ready' ? 'claimable' : g.status}`, data: { goal: g.text } },
                el(
                  'div',
                  { class: 'achievements__info' },
                  el('p', { class: 'achievements__name', text: g.text }),
                  bar(g.percent, 'achievements__bar'),
                  el('p', { class: 'achievements__meta', text: `${g.progress} · ${g.reward}` }),
                ),
                g.status === 'ready'
                  ? button(g.claim, () => act(g.claim.run))
                  : el('span', { class: 'achievements__state', text: g.status === 'claimed' ? vi.goals.daily.claimed : '' }),
              ),
            ),
          ),
      daily.goals.length === 0
        ? null
        : el(
            'div',
            { class: `achievements__item${daily.bonus.claimed ? ' is-claimed' : ''}`, data: { goal: 'bonus' } },
            el(
              'div',
              { class: 'achievements__info' },
              el('p', { class: 'achievements__name', text: daily.bonus.title }),
              el('p', { class: 'achievements__meta', text: daily.bonus.reward }),
            ),
            daily.bonus.claimed ? el('span', { class: 'achievements__state', text: vi.goals.daily.bonusClaimed }) : button(daily.bonus.claim, () => act(daily.bonus.claim.run)),
          ),
    ),
    el(
      'section',
      { class: 'achievements__daily' },
      heading(vi.daily.title, login.streak),
      el(
        'ol',
        { class: 'achievements__days' },
        ...login.days.map((d) =>
          el('li', { class: `achievements__day is-${d.state}` }, el('b', { text: d.label }), el('span', { text: d.reward })),
        ),
      ),
      login.claim
        ? el('button', { class: 'c-button achievements__claim-daily', text: vi.daily.claim, attrs: { type: 'button' }, on: { click: () => act(login.claim!) } })
        : el('p', { class: 'achievements__hint', text: vi.daily.claimed }),
      el('p', { class: 'achievements__hint', text: vi.daily.hint }),
    ),
    heading(vi.achievements.title, achievements.summary),
    el(
      'ul',
      { class: 'achievements__list' },
      ...achievements.items.map((a) =>
        el(
          'li',
          { class: `achievements__item is-${a.status}`, data: { achievement: a.id } },
          el(
            'div',
            { class: 'achievements__info' },
            el('p', { class: 'achievements__name', text: a.name }),
            bar(a.percent, 'achievements__bar'),
            el('p', { class: 'achievements__meta', text: `${a.progress} · ${a.reward}` }),
          ),
          a.status === 'claimable'
            ? button(a.claim, () => act(a.claim.run))
            : el('span', { class: 'achievements__state', text: a.status === 'claimed' ? vi.achievements.claimed : '' }),
        ),
      ),
    ),
  );
}

/** The Codex: a grid per kind (undiscovered entries as silhouettes) and the milestones with their claim buttons. */
export function renderCodex(vm: CodexVm, act: Act): HTMLElement {
  return el(
    'section',
    { class: 'collection', data: { screen: 'collection' } },
    el('h3', { class: 'collection__heading' }, el('span', { text: vi.codex.title }), el('span', { class: 'collection__progress', text: vm.total })),
    el(
      'ul',
      { class: 'collection__milestones' },
      ...vm.milestones.map((m) =>
        el(
          'li',
          { class: `collection__milestone is-${m.status}`, data: { milestone: m.id } },
          el('span', { class: 'collection__milestone-label', text: m.label }),
          el('span', { class: 'collection__progress', text: m.reward }),
          m.status === 'claimable' ? button(m.claim, () => act(m.claim.run)) : el('span', { class: 'achievements__state', text: m.status === 'claimed' ? vi.codex.claimed : '' }),
        ),
      ),
    ),
    ...vm.kinds.flatMap((k) => [
      el('h3', { class: 'collection__heading' }, el('span', { text: k.name }), el('span', { class: 'collection__progress', text: k.progress })),
      el(
        'ul',
        { class: 'collection__grid' },
        ...k.entries.map((e) =>
          el(
            'li',
            { class: `collection__entry${e.found ? '' : ' is-hidden'}`, data: { entry: e.id } },
            thumb(e.thumb, e.name, !e.found),
            el('span', { class: 'collection__name', text: e.name }),
            e.found && e.rarity ? rarityBadge(e.rarity as Rarity) : null,
          ),
        ),
      ),
    ]),
  );
}
