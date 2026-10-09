// Port between the settings store and the platform: the player's settings are their own file
// (settings.json), apart from the save (spec §4). Adapters live in src/platform; parsing stays here.

export interface SettingsStorage {
  /** The file's text, or null when there is none yet (first launch). */
  load(): Promise<string | null>;
  /** Writes the whole file. Rejects on failure; the store surfaces it, never swallows it. */
  save(json: string): Promise<void>;
}
