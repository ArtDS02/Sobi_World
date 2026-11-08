// D1: the save check (pure), its dialog text and the stale-backup warning.
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { backupIsStale, inspectSave } from '../../src/core/save/health';
import { WORLD_SAVE_VERSION } from '../../src/core/save/world';
import { saveCheckText } from '../../src/areas/farm/ui/saveCheckVm';
import { backupsVm } from '../../src/areas/farm/ui/settingsVm';
import { mulberry32 } from '../../src/core/rng';

const fresh = () => JSON.parse(JSON.stringify(SAVE_CODEC.newWorld({ now: 1_700_000_000_000, rng: mulberry32(1) })));
const DAY = 86_400_000;

describe('inspectSave', () => {
  it('a fresh world is healthy and lists its Areas', () => {
    const r = inspectSave(fresh(), SAVE_CODEC);
    expect(r.state).toBe('healthy');
    expect(r.version).toBe(WORLD_SAVE_VERSION);
    expect(r.areas.length).toBeGreaterThan(0);
    expect(r.areas.every((a) => a.ok)).toBe(true);
  });

  it('a damaged Area slice is reported by name and the others stay ok; nothing is changed', () => {
    const w = fresh();
    w.areas.sobi_garden = { broken: true };
    const before = JSON.stringify(w);
    const r = inspectSave(w, SAVE_CODEC);
    expect(r.state).toBe('repairable');
    expect(r.areas.find((a) => a.id === 'sobi_garden')?.ok).toBe(false);
    expect(r.areas.filter((a) => a.id !== 'sobi_garden').every((a) => a.ok)).toBe(true);
    expect(JSON.stringify(w)).toBe(before);
  });

  it('a damaged shared part, a newer save and a code error each get their own verdict', () => {
    const w = fresh();
    w.wallet = { coins: 'x' };
    expect(inspectSave(w, SAVE_CODEC).state).toBe('corrupt');
    expect(inspectSave({ ...fresh(), schemaVersion: WORLD_SAVE_VERSION + 1 }, SAVE_CODEC).state).toBe('tooNew');
    const boom = { ...SAVE_CODEC, legacy: () => { throw new Error('bug'); } };
    expect(inspectSave({ schemaVersion: 3 }, boom).state).toBe('codeError');
    expect(inspectSave('nonsense', SAVE_CODEC)).toMatchObject({ state: 'corrupt', version: null });
  });

  it('the dialog text has a verdict, the version and one line per Area', () => {
    const lines = saveCheckText(inspectSave(fresh(), SAVE_CODEC));
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.join('\n')).toContain(String(WORLD_SAVE_VERSION));
  });
});

describe('stale backup warning', () => {
  it('stale when the newest backup is over the age limit or missing', () => {
    expect(backupIsStale(1000, 1000 + 8 * DAY, 7 * DAY)).toBe(true);
    expect(backupIsStale(1000, 1000 + 6 * DAY, 7 * DAY)).toBe(false);
    expect(backupIsStale(null, 5, 7 * DAY)).toBe(true);
  });

  it('the settings view-model warns only with a known, non-empty, old list; the platform without backups never warns', () => {
    const now = 100 * DAY;
    expect(backupsVm([{ name: 'a', at: now - 9 * DAY }], now).backupWarning).toContain('9');
    expect(backupsVm([{ name: 'a', at: now - 1 * DAY }], now).backupWarning).toBeNull();
    expect(backupsVm([], now).backupWarning).toBeNull(); // the empty note already says so
    expect(backupsVm(undefined, now).backupWarning).toBeNull();
    expect(backupsVm(null, now).backupWarning).toBeNull();
    expect(backupsVm([{ name: 'a', at: 0 }]).backupWarning).toBeNull(); // no clock given
  });
});
