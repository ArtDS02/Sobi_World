// The battle board (adventure-big-update-1 §10, §13): the battle just won plays to its last blow (battleView's replay, with the stage's
// effects), then the board rises over it — the title, the experience, coins and gems, the items found, a guardian's gift, and for
// each fighter its experience bar filling up (emptying and filling again through every level crossed) with LEVEL UP when it rose.
// The bars and the sounds are timed from the moment the board first shows, so a redraw in the middle resumes them where they were.
import { vi } from '../../../i18n/vi';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { closeReport } from '../logic/actions/battle';
import { adventureOf } from '../logic/save/lens';
import type { AdventureSound } from './adventureUi';
import { stepRemaining } from './battleFxView';
import { renderBattle } from './battleView';
import { boardVm, type BoardItemVm } from './reportVm';
import { iconOf, type ViewCtx } from './viewKit';

/** The board rises this long after the last blow has landed (ms). */
const AFTER_MS = 500;
/** Each bar starts this long after the one above it; a leg of a bar fills in this long. */
const BAR_STAGGER_MS = 220;
const LEG_MS = 900;

/** When the board of each report first showed (performance.now ms). */
const shown = new Map<string, number>();

const itemChip = (i: BoardItemVm) =>
  el('span', { class: 'adventure-board__item', attrs: { title: i.name } }, art(i.art, 'adventure-board__item-art', i.name) ?? iconOf(i.art, i.name), el('b', { text: `×${i.count}` }), el('small', { text: i.name }));

export function renderReport(ctx: ViewCtx): HTMLElement | null {
  const run = adventureOf(ctx.world).run!;
  const report = run.report;
  const vm = boardVm(run);
  if (!report || !vm) return null;
  const replay = report.battle ? renderBattle(ctx, { ...run, phase: 'battle', battle: report.battle, log: report.log }) : null;
  const now = performance.now();
  if (!shown.has(vm.key)) shown.set(vm.key, now + (replay ? stepRemaining() + AFTER_MS : 0));
  const delay = Math.round(shown.get(vm.key)! - now);
  const B = vi.adventure.board;
  return el(
    'div',
    { class: `adventure-board-host${replay ? ' has-replay' : ''}` },
    replay,
    el(
      'section',
      { class: `adventure-board is-${vm.kind}`, attrs: { 'data-board': vm.key, role: 'dialog', 'aria-label': vm.title, style: `--board-delay:${delay}ms` } },
      el('div', { class: 'adventure-board__ribbon' }, el('h3', { text: vm.title }), vm.quick ? el('small', { class: 'adventure-board__quick', text: B.quick }) : null),
      el('div', { class: 'adventure-board__rewards' }, ...vm.rewards.map((r, i) => el('span', { class: `adventure-board__reward is-${['exp', 'coins', 'gems'][i]}`, text: r }))),
      vm.gift.length > 0
        ? el(
            'div',
            { class: 'adventure-board__gift' },
            el('b', { text: B.gift }),
            el('div', { class: 'adventure-board__items', attrs: { 'data-drag-scroll': 'gift' } }, ...vm.gift.map(itemChip)),
            el('small', { text: B.giftNote }),
          )
        : null,
      el(
        'div',
        { class: 'adventure-board__loot' },
        el('b', { text: B.loot }),
        vm.items.length > 0 ? el('div', { class: 'adventure-board__items', attrs: { 'data-drag-scroll': 'loot' } }, ...vm.items.map(itemChip)) : el('small', { class: 'adventure-ui__note', text: B.noLoot }),
      ),
      el(
        'div',
        { class: 'adventure-board__team' },
        el('b', { text: B.team }),
        ...vm.fighters.map((f, i) =>
          el(
            'div',
            { class: `adventure-board__fighter${f.leveledUp ? ' is-up' : ''}` },
            art(f.art, 'adventure-board__fighter-art', f.name) ?? el('span', { class: 'adventure-board__fighter-art' }),
            el(
              'div',
              { class: 'adventure-board__fighter-text' },
              el('span', { class: 'adventure-board__fighter-head' }, el('b', { text: f.name }), el('small', { text: f.levels }), el('em', { text: f.gained })),
              el(
                'span',
                { class: 'adventure-board__bar', attrs: { role: 'progressbar', 'aria-valuenow': String(f.legs[f.legs.length - 1]!.to), 'aria-label': `${f.name} ${f.levels}` } },
                el('span', { class: 'adventure-board__fill', attrs: { 'data-legs': f.legs.map((l) => `${l.from}-${l.to}`).join(','), 'data-start': String(i * BAR_STAGGER_MS), style: `width:${f.legs[f.legs.length - 1]!.to}%` } }),
              ),
            ),
            f.leveledUp ? el('span', { class: 'adventure-board__levelup', attrs: { 'data-at': String(i * BAR_STAGGER_MS + LEG_MS) }, text: B.levelUp }) : null,
          ),
        ),
      ),
      el('button', { class: 'c-button adventure-board__next', text: B.next, attrs: { type: 'button' }, on: { click: () => ctx.dispatch((w, c) => closeReport(w, c)) } }),
    ),
  );
}

/** Which board keys already played their sounds. */
const heard = new Set<string>();

/**
 * After a redraw: fills the bars of the board on screen leg by leg, pops LEVEL UP when a bar first tops out, and cues the sounds,
 * all from the moment the board first showed. Reduced motion: the bars stand at their end and nothing pops.
 */
export function playBoard(host: HTMLElement, sound: ((key: AdventureSound) => void) | undefined, reduce: boolean): void {
  const board = host.querySelector<HTMLElement>('[data-board]');
  if (!board) return;
  const key = board.dataset.board!;
  const start = shown.get(key);
  if (start === undefined) return;
  const since = performance.now() - start;
  const fills = [...board.querySelectorAll<HTMLElement>('.adventure-board__fill')];
  if (!heard.has(key)) {
    heard.add(key);
    const at = (ms: number, fn: () => void) => (ms - since <= 0 ? fn() : window.setTimeout(fn, ms - since));
    at(0, () => sound?.('adv_victory'));
    if (fills.length > 0) at(300, () => sound?.('adv_exp_fill'));
    for (const up of board.querySelectorAll<HTMLElement>('.adventure-board__levelup')) at(300 + Number(up.dataset.at ?? 0), () => sound?.('level_up'));
  }
  if (reduce || typeof board.animate !== 'function') return;
  for (const fill of fills) {
    const legs = (fill.dataset.legs ?? '').split(',').map((s) => s.split('-').map(Number) as [number, number]);
    const total = LEG_MS * legs.length;
    const frames: Keyframe[] = [];
    legs.forEach(([a, b], i) => {
      frames.push({ width: `${a}%`, offset: i / legs.length });
      frames.push({ width: `${b}%`, offset: Math.min(1, (i + 1) / legs.length - 0.0001) });
    });
    frames[frames.length - 1]!.offset = 1;
    const anim = fill.animate(frames, { duration: total, delay: 300 + Number(fill.dataset.start ?? 0), easing: 'linear', fill: 'both' });
    anim.currentTime = since;
  }
  for (const up of board.querySelectorAll<HTMLElement>('.adventure-board__levelup')) {
    const anim = up.animate(
      [
        { opacity: 0, transform: 'translateY(8px) scale(0.4)' },
        { opacity: 1, transform: 'translateY(-4px) scale(1.25)', offset: 0.25 },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 700, delay: 300 + Number(up.dataset.at ?? 0), easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' },
    );
    anim.currentTime = since;
  }
}
