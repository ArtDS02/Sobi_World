// Desktop adapter (spec §9.1, §9.2): the read chain runs here with core's parseSave; main only
// moves files. A candidate that fails to parse is renamed save.corrupt-* (never deleted).
import { parseSave } from '../../core/save/migrate';
import type { LoadSource, SaveStorage } from '../../core/save/port';
import type { SaveCandidateSource, UninBridge } from './bridge';

const loadSource = (s: SaveCandidateSource): LoadSource => (s === 'save' ? 'primary' : 'backup');

export function createFileSaveStorage(bridge: UninBridge['save']): SaveStorage {
  let locked = false; // a newer-version save exists somewhere in the chain

  return {
    async load() {
      const candidates = await bridge.load();
      if (candidates.length === 0) return { kind: 'empty' };
      for (const { source, json } of candidates) {
        const parsed = parseSave(json);
        if (parsed.ok) return { kind: 'ok', save: parsed.save, source: loadSource(source) };
        if (parsed.error === 'SAVE_TOO_NEW') {
          locked = true; // an older copy would silently lose the newer progress
          return { kind: 'tooNew', source: loadSource(source) };
        }
        await bridge.markCorrupt(source);
      }
      return { kind: 'recovery' };
    },

    async save(save) {
      if (locked) throw new Error('SAVE_TOO_NEW: refusing to overwrite a newer save');
      await bridge.write(JSON.stringify(save));
    },
  };
}
