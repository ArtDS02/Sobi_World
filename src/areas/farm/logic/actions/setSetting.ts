// setSetting: the player toggles kept in the save (spec §10.3 tutorialDone, §10.4 reduceMotion,
// §12 musicOn / sfxOn).
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

export const SETTING_KEYS = ['musicOn', 'sfxOn', 'reduceMotion', 'tutorialDone'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export function setSetting(
  state: FarmGame,
  args: { key: SettingKey; value: boolean },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    if (!SETTING_KEYS.includes(args.key) || typeof args.value !== 'boolean') {
      return { ok: false, error: 'INVALID_REQUEST' };
    }
    const next: FarmGame = { ...s, settings: { ...s.settings, [args.key]: args.value } };
    return ok(next, [{ type: 'SETTING_CHANGED', key: args.key, value: args.value }]);
  });
}

export const EFFECTS_VALUES = ['off', 'light', 'full'] as const;

/** The effects intensity (decision 057, B8): how much light and how many particles the scenes show. Presentation only. */
export function setEffects(state: FarmGame, args: { value: (typeof EFFECTS_VALUES)[number] }, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    if (!EFFECTS_VALUES.includes(args.value)) return { ok: false, error: 'INVALID_REQUEST' };
    if (s.settings.effects === args.value) return { ok: false, error: 'NOTHING_TO_DO' };
    return ok({ ...s, settings: { ...s.settings, effects: args.value } }, [{ type: 'SETTING_CHANGED', key: 'effects', value: args.value }]);
  });
}
