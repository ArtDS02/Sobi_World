// setSetting: the sound toggles of settings (spec §12: musicOn / sfxOn live in the save).
import type { ActionContext, ActionResult, SaveGame } from '../types';
import { ok, runAction } from './runAction';

export const SETTING_KEYS = ['musicOn', 'sfxOn'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export function setSetting(
  state: SaveGame,
  args: { key: SettingKey; value: boolean },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    if (!SETTING_KEYS.includes(args.key) || typeof args.value !== 'boolean') {
      return { ok: false, error: 'INVALID_REQUEST' };
    }
    const next: SaveGame = { ...s, settings: { ...s.settings, [args.key]: args.value } };
    return ok(next, [{ type: 'SETTING_CHANGED', key: args.key, value: args.value }]);
  });
}
