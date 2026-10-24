// The clock of a battle step's presentation (decision 039 §1, GĐ14 motion): the step's motion (battleMotion.ts: who moves when) and
// what it says (battleFloaters.ts: numbers, one banner, the shake) are worked out once, when the step first shows, and timed from that
// moment so a redraw in the middle resumes them where they were. Also the DOM of the numbers and the banner.
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { stepFx, type BannerVm, type FloaterVm, type StepFx } from './battleFloaters';
import { stepMotion, type StepMotion } from './battleMotion';
import { iconOf } from './viewKit';

/** How long the numbers and the banner stay after the last beat (ms); the shake is shorter. */
export const FX_MS = 1600;
export const SHAKE_MS = 420;
/** The step whose effects are playing and when it began (a redraw resumes them where they were). */
const playing: { key: string; at: number; fx: StepFx; motion: StepMotion } = { key: '', at: 0, fx: { floaters: [], banner: null, shake: false, shakeAt: 0 }, motion: stepMotion(null, []) };

const clock = () => (typeof performance !== 'undefined' ? performance.now() : 0);

/** The effects of the step that produced `run.log`; `fast` (the battle's x2) is read when the step first shows. */
export function stepEffects(
  run: { battle: { seed: number; counter: number } | null; log: readonly { type: string }[] },
  battle: Parameters<typeof stepFx>[0],
  fast = false,
): { fx: StepFx; motion: StepMotion; elapsed: number } {
  const key = run.battle ? `${run.battle.seed}:${run.battle.counter}:${run.log.length}` : '';
  const now = clock();
  if (key !== playing.key) {
    playing.key = key;
    playing.at = now;
    playing.motion = stepMotion(battle, run.log, fast);
    playing.fx = stepFx(battle, run.log, playing.motion.eventAt);
  }
  return { fx: playing.fx, motion: playing.motion, elapsed: now - playing.at };
}

/** Ms until the beats of the step on screen are over (0 when nothing plays): Auto waits for it so each action can be read. */
export function stepRemaining(): number {
  return playing.key ? Math.max(0, playing.motion.total - (clock() - playing.at)) : 0;
}

export const floaterEl = (f: FloaterVm, elapsed: number) =>
  el('span', { class: `adventure-ui__float is-${f.tone}`, text: f.text, attrs: { style: `--fx-delay:${Math.round(f.at + f.index * 140 - elapsed)}ms`, 'aria-hidden': 'true' } });

export function bannerEl(b: BannerVm, portraitArt: string | null, elapsed: number): HTMLElement {
  return el(
    'div',
    { class: `adventure-ui__fxbanner is-${b.kind}`, attrs: { style: `--fx-delay:${Math.round(b.at - elapsed)}ms`, role: 'status' } },
    b.kind === 'ultimate' && portraitArt ? art(portraitArt, 'adventure-ui__fxbanner-portrait', b.sub ?? '') : iconOf(b.art, b.title, 'adventure-ui__fxbanner-icon'),
    el('span', { class: 'adventure-ui__fxbanner-text' }, el('b', { text: b.title }), b.sub ? el('small', { text: b.sub }) : null),
  );
}
