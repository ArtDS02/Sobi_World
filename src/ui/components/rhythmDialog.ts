// The timing mini-game (D8): a marker sweeps a bar, the player presses when it is in the good zone, a few rounds, then the
// score goes to `onDone`. Optional by design: the caller keeps a plain "làm nhanh" button that does the job with no tip.
// The maths is src/systems/minigame/rhythm.ts; the clock is injectable so a test can drive rounds exactly.
import { vi } from '../../i18n/vi';
import { t } from '../../i18n/format';
import { hitScore, markerAt, roundsScore, type RhythmRules } from '../../systems/minigame/rhythm';
import { el } from '../dom';
import { openDialog } from './dialog';

export interface RhythmOptions {
  rules: RhythmRules;
  /** ms clock; default performance.now. */
  now?: () => number;
  /** Called once with the mean score 0..1 when the last round is pressed. */
  onDone: (score: number) => void;
}

export interface RhythmGame {
  /** Press now: scores the round and returns the round's score (null once finished). */
  press(): number | null;
  /** Marker position now. */
  marker(): number;
  scores(): readonly number[];
  done(): boolean;
}

/** The mini-game's state machine without any DOM (tested directly). */
export function createRhythm(rules: RhythmRules, now: () => number): RhythmGame {
  let start = now();
  const scores: number[] = [];
  return {
    marker: () => markerAt(now() - start, rules.periodMs),
    press() {
      if (scores.length >= rules.rounds) return null;
      const s = hitScore(markerAt(now() - start, rules.periodMs), rules.zoneHalf);
      scores.push(s);
      start = now(); // every round starts its sweep afresh
      return s;
    },
    scores: () => scores,
    done: () => scores.length >= rules.rounds,
  };
}

export function openRhythmDialog(host: HTMLElement, title: string, o: RhythmOptions): void {
  const clock = o.now ?? (() => performance.now());
  const game = createRhythm(o.rules, clock);
  const handle = openDialog(host, title, vi.action.cancel);
  const zone = el('span', { class: 'c-rhythm__zone', attrs: { style: `left:${(0.5 - o.rules.zoneHalf) * 100}%;width:${o.rules.zoneHalf * 200}%` } });
  const marker = el('span', { class: 'c-rhythm__marker' });
  const status = el('p', { class: 'c-rhythm__status', attrs: { 'aria-live': 'polite' }, text: t(vi.rhythm.round, { n: 1, of: o.rules.rounds }) });
  const press = el('button', { class: 'c-button c-rhythm__press', text: vi.rhythm.press, attrs: { type: 'button' } });
  handle.body.append(el('p', { text: vi.rhythm.hint }), el('div', { class: 'c-rhythm__bar' }, zone, marker), status, press);
  let raf = 0;
  const frame = () => {
    marker.style.left = `${game.marker() * 100}%`;
    if (!game.done()) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const onPress = () => {
    const s = game.press();
    if (s === null) return;
    status.textContent = game.done() ? t(vi.rhythm.finished, { pct: Math.round(roundsScore(game.scores()) * 100) }) : t(vi.rhythm.round, { n: game.scores().length + 1, of: o.rules.rounds });
    if (game.done()) {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      o.onDone(roundsScore(game.scores()));
      setTimeout(handle.close, 600);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (!handle.body.isConnected) return void document.removeEventListener('keydown', onKey);
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      onPress();
    }
  };
  press.addEventListener('click', onPress);
  document.addEventListener('keydown', onKey);
}
