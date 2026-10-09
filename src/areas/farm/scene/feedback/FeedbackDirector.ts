// The only place that turns GameEvents into presentation (spec §11.3, D25): per event,
// animation → VFX → sound → toast, from the data table. Rejections → ui_error + reason toast.
// Also the two sounds that are not game events: a pig tap and a DOM button press (§12).
import { SAVE } from '../../../../core/config/save';
import type { GameEvent } from '../../logic/events';
import type { FarmGame } from '../../logic/types';
import { vi } from '../../../../i18n/vi';
import type { FarmStore } from '../../store';
import type { AudioPort } from '../audio/audioPort';
import type { FarmEffects } from './effects';
import { tapSound } from '../audio/tapSound';
import { feedbackPlan } from './feedbackPlan';
import { REJECT_ROW } from './feedbackTable';
import { toastText } from './toastText';

export interface FeedbackDeps {
  store: Pick<FarmStore, 'getSnapshot' | 'subscribe' | 'onEvents' | 'onReject'>;
  effects: () => FarmEffects;
  audio: AudioPort;
  toast: (message: string) => void;
  /** A catch-up of SAVE.AWAY_SUMMARY_MIN_MS or more: one summary instead of toasts (§9.5). */
  away?: (events: GameEvent[], awayMs: number) => void;
}

export interface FeedbackDirector {
  /** A pig was clicked on the farm (spec §12: pig_oink_happy / pig_oink_hungry). */
  pigTapped(pigId: string): void;
  /** Any DOM button was pressed (spec §12: ui_click). */
  uiClick(): void;
  /** The player tried something that does nothing (a closed door): ui_error. */
  denied(): void;
  dispose(): void;
}

export function createFeedbackDirector(deps: FeedbackDeps): FeedbackDirector {
  // The state before the latest change, so a sold pig can still be named in its toast.
  let current: FarmGame | null = deps.store.getSnapshot().save;
  let previous: FarmGame | null = current;
  const offState = deps.store.subscribe((snap) => {
    if (snap.save === current) return;
    previous = current;
    current = snap.save;
  });

  const offEvents = deps.store.onEvents((events, origin, catchup) => {
    const after = current;
    if (!after) return;
    if (deps.away && catchup && catchup.awayMs >= SAVE.AWAY_SUMMARY_MIN_MS) {
      deps.away(events, catchup.awayMs);
      return;
    }
    const reduceMotion = after.settings.reduceMotion;
    const fx = deps.effects();
    for (const event of events) {
      const plan = feedbackPlan(event, origin, reduceMotion);
      for (const a of plan.animations) fx.animate(a.animation, a.target, a.delayMs, a.from);
      for (const v of plan.vfx) fx.burst(v.fx, v.target, v.delayMs);
      for (const f of plan.floats) fx.float(f.lines, f.target, f.delayMs);
      if (plan.life) fx.life(event);
      if (plan.sound) deps.audio.play(plan.sound);
      const text = plan.toast ? toastText(event, after, previous ?? after) : null;
      if (text) deps.toast(text);
    }
  });

  const offReject = deps.store.onReject((error) => {
    if (REJECT_ROW.sound) deps.audio.play(REJECT_ROW.sound);
    deps.toast(vi.error[error]);
  });

  return {
    pigTapped(pigId) {
      const pig = current?.pigs.find((p) => p.id === pigId);
      const key = pig ? tapSound(pig) : null;
      if (key) deps.audio.play(key);
    },
    uiClick: () => deps.audio.play('ui_click'),
    denied: () => deps.audio.play('ui_error'),
    dispose() {
      offState();
      offEvents();
      offReject();
    },
  };
}
