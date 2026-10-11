// The text of settings.json before the game modules load (app/main.ts needs the language first, because the
// string table is read while modules evaluate). Same two sources as the full platform: the desktop bridge or
// the browser's local storage. Any failure reads as "no file yet", so a broken settings file never stops the start.
import type { UninBridge } from './desktop/bridge';
import { SETTINGS_KEY } from './web/localSettings';

export async function readSettingsText(): Promise<string | null> {
  try {
    const bridge = (globalThis as { unin?: UninBridge }).unin;
    if (bridge) return await bridge.settings.load();
    return globalThis.localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
}
