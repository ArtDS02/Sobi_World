// The DOM of a battle step's effects (decision 039 §1): the numbers rising over the units and the one banner, timed from when the step
// first showed so a redraw in the middle resumes them where they were. What they say comes from battleFloaters.ts.
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { stepFx, type BannerVm, type FloaterVm, type StepFx } from './battleFloaters';
import { iconOf } from './viewKit';

/** How long the numbers and the banner of a step stay (ms); the shake is shorter. */
export const FX_MS = 1600;
export const SHAKE_MS = 420;
/** The step whose effects are playing and when it began (a redraw resumes them where they were). */
const playing: { key: string; at: number; fx: StepFx } = { key: '', at: 0, fx: { floaters: [], banner: null, shake: false } };

export function stepEffects(run: { battle: { seed: number; counter: number } | null; log: readonly { type: string }[] }, battle: Parameters<typeof stepFx>[0]): { fx: StepFx; elapsed: number } {
  const key = run.battle ? `${run.battle.seed}:${run.battle.counter}:${run.log.length}` : '';
  const clock = typeof performance !== 'undefined' ? performance.now() : 0;
  if (key !== playing.key) {
    playing.key = key;
    playing.at = clock;
    playing.fx = stepFx(battle, run.log);
  }
  return { fx: playing.fx, elapsed: clock - playing.at };
}

export const floaterEl = (f: FloaterVm, elapsed: number) =>
  el('span', { class: `adventure-ui__float is-${f.tone}`, text: f.text, attrs: { style: `--fx-delay:${f.index * 140 - elapsed}ms`, 'aria-hidden': 'true' } });

export function bannerEl(b: BannerVm, portraitArt: string | null, elapsed: number): HTMLElement {
  return el(
    'div',
    { class: `adventure-ui__fxbanner is-${b.kind}`, attrs: { style: `--fx-delay:${-elapsed}ms`, role: 'status' } },
    b.kind === 'ultimate' && portraitArt ? art(portraitArt, 'adventure-ui__fxbanner-portrait', b.sub ?? '') : iconOf(b.art, b.title, 'adventure-ui__fxbanner-icon'),
    el('span', { class: 'adventure-ui__fxbanner-text' }, el('b', { text: b.title }), b.sub ? el('small', { text: b.sub }) : null),
  );
}
