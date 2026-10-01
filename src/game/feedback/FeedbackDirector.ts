// The only place that turns GameEvents into presentation (spec §11.3, D25): per event,
// animation → VFX → sound → toast, from the data table. Rejections → ui_error + reason toast.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { GameStore } from '../../store/gameStore';
import type { AudioPort } from '../audio/audioPort';
import type { FarmEffects } from './effects';
import { feedbackPlan } from './feedbackPlan';
import { REJECT_ROW } from './feedbackTable';
import { toastText } from './toastText';

export interface FeedbackDeps {
  store: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'onEvents' | 'onReject'>;
  effects: () => FarmEffects;
  audio: AudioPort;
  toast: (message: string) => void;
}

export function createFeedbackDirector(deps: FeedbackDeps): () => void {
  // The state before the latest change, so a sold pig can still be named in its toast.
  let current: SaveGame | null = deps.store.getSnapshot().save;
  let previous: SaveGame | null = current;
  const offState = deps.store.subscribe((snap) => {
    if (snap.save === current) return;
    previous = current;
    current = snap.save;
  });

  const offEvents = deps.store.onEvents((events, origin) => {
    const after = current;
    if (!after) return;
    const reduceMotion = after.settings.reduceMotion;
    const fx = deps.effects();
    for (const event of events) {
      const plan = feedbackPlan(event, origin, reduceMotion);
      for (const a of plan.animations) fx.animate(a.animation, a.target, a.delayMs);
      for (const v of plan.vfx) fx.burst(v.fx, v.target, v.delayMs);
      if (plan.sound) deps.audio.play(plan.sound);
      const text = plan.toast ? toastText(event, after, previous ?? after) : null;
      if (text) deps.toast(text);
    }
  });

  const offReject = deps.store.onReject((error) => {
    if (REJECT_ROW.sound) deps.audio.play(REJECT_ROW.sound);
    deps.toast(vi.error[error]);
  });

  return () => {
    offState();
    offEvents();
    offReject();
  };
}
