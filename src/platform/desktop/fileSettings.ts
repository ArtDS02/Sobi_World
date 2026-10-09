// Desktop adapter for settings.json (spec §4): main moves the file, the renderer parses it.
import type { SettingsStorage } from '../../core/settings/port';
import type { UninBridge } from './bridge';

export const createFileSettings = (bridge: UninBridge['settings']): SettingsStorage => ({
  load: () => bridge.load(),
  save: (json) => bridge.write(json),
});
