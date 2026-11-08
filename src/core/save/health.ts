// Save health (D1): what the "check my save" button reports. Pure: it runs the same read path as loading
// (migrate + per-Area slice validation) on a copy and says what it found, without repairing or writing anything.
import { migrate, type SaveCodec } from './migrate';

export interface SaveInspection {
  state: 'healthy' | 'repairable' | 'corrupt' | 'tooNew' | 'codeError';
  /** `schemaVersion` of the document, null when unreadable. */
  version: number | null;
  /** Every Area slice the document holds and whether it passes its own schema. */
  areas: { id: string; ok: boolean }[];
}

const versionOf = (raw: unknown): number | null =>
  typeof raw === 'object' && raw !== null && typeof (raw as { schemaVersion?: unknown }).schemaVersion === 'number'
    ? (raw as { schemaVersion: number }).schemaVersion
    : null;

export function inspectSave(raw: unknown, codec: SaveCodec): SaveInspection {
  const version = versionOf(raw);
  const r = migrate(raw, codec);
  if (!r.ok) {
    const state = r.error === 'SAVE_TOO_NEW' ? 'tooNew' : r.error === 'SAVE_CODE_ERROR' ? 'codeError' : 'corrupt';
    return { state, version, areas: [] }; // the slices cannot be judged one by one when the document itself fails
  }
  const bad = new Set(r.repairedAreas ?? []);
  return {
    state: bad.size > 0 ? 'repairable' : 'healthy',
    version,
    areas: Object.keys(r.save.areas).map((id) => ({ id, ok: !bad.has(id) })),
  };
}

/** True when the newest backup is older than `maxAgeMs` (or there is none although backups exist on this platform). */
export const backupIsStale = (newestAt: number | null, now: number, maxAgeMs: number): boolean => newestAt === null || now - newestAt > maxAgeMs;
