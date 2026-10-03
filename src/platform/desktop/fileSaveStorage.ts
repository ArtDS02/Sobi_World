// Desktop adapter (spec §9.1, §9.2): the read chain runs here with core's parseSave; main only
// moves files. A candidate that fails to parse is renamed save.corrupt-* (never deleted).
import { parseSave } from '../../core/save/migrate';
import {
  isSaveChangedExternally,
  SAVE_CHANGED_EXTERNALLY,
  type LoadSource,
  type SaveStorage,
} from '../../core/save/port';
import type { SaveCandidateSource, UninBridge } from './bridge';

const loadSource = (s: SaveCandidateSource): LoadSource => (s === 'save' ? 'primary' : 'backup');

/** The file calls a save storage needs: window.unin.save, or the dev server's twin (AM-1). */
export type SaveFileBridge = Pick<UninBridge['save'], 'load' | 'write' | 'markCorrupt' | 'onExternalChange'>;

export function createFileSaveStorage(bridge: SaveFileBridge): SaveStorage {
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
      try {
        await bridge.write(JSON.stringify(save));
      } catch (e) {
        // IPC wraps the message ("Error invoking remote method…"): normalise it for the store.
        throw isSaveChangedExternally(e) ? new Error(SAVE_CHANGED_EXTERNALLY) : e;
      }
    },

    onExternalChange: (fn) => bridge.onExternalChange(fn),
  };
}
