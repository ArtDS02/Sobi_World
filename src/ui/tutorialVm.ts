// First-run tutorial (spec §10.3): 5 skippable steps. Steps 1–2 wait for the real thing (a pig,
// food in the trough); the rest only explain. The step index lives in the UI, `tutorialDone` in
// the save. Pure.
import type { SaveGame } from '../core/types';
import { t } from '../i18n/format';
import { vi } from '../i18n/vi';

export const TUTORIAL_STEPS = [
  vi.tutorial.step1, // buy a pig (choose gender)
  vi.tutorial.step2, // fill the trough
  vi.tutorial.step3, // clean
  vi.tutorial.step4, // see growth
  vi.tutorial.step5, // read the happiness → price line
] as const;

/** Whether step `i` is done in this save (only steps that ask for an action check anything). */
function stepDone(save: SaveGame, i: number): boolean {
  if (i === 0) return save.pigs.length > 0;
  if (i === 1) return save.trough.food > 0;
  return true;
}

export interface TutorialVm {
  title: string;
  text: string;
  progress: string;
  /** "Tiếp" / "Bắt đầu chơi"; disabled with a reason until the step's action is done. */
  next: { label: string; reason: string | null };
  last: boolean;
}

export function tutorialVm(save: SaveGame, step: number): TutorialVm | null {
  if (save.settings.tutorialDone || step >= TUTORIAL_STEPS.length) return null;
  const last = step === TUTORIAL_STEPS.length - 1;
  return {
    title: vi.tutorial.title,
    text: TUTORIAL_STEPS[step]!,
    progress: t(vi.tutorial.progress, { n: step + 1, total: TUTORIAL_STEPS.length }),
    next: {
      label: last ? vi.tutorial.finish : vi.action.next,
      reason: stepDone(save, step) ? null : vi.tutorial.waiting,
    },
    last,
  };
}
