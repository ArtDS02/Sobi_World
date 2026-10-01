// Settings screen view-model (spec §9.3, §10.4, §12): toggles, export status, backups, credits
// and version. Pure.
import type { AssetManifest } from '../core/assets/manifestSchema';
import { SAVE } from '../core/config/save';
import type { BackupInfo } from '../core/save/port';
import type { SaveGame } from '../core/types';
import { formatDateTime, t } from '../i18n/format';
import { vi } from '../i18n/vi';

const DAY_MS = 24 * 3600 * 1000;

/** §9.3: more than 7 days since the last export (or since the farm began, if never). */
export function exportReminderDue(save: SaveGame, now: number): boolean {
  const since = save.settings.lastExportAt ?? save.createdAt;
  return now - since > SAVE.EXPORT_REMINDER_DAYS * DAY_MS;
}

/** null = still loading; [] = none; undefined = the platform keeps no backups. */
export type BackupsState = BackupInfo[] | null | undefined;

export interface SettingsVm {
  lastExport: string;
  backupsNote: string | null;
  backups: { name: string; label: string }[];
  credits: string[];
  version: string;
}

/** Every manifest row with a credit (audio and third-party files, art standard §7.2). */
export function creditLines(manifest: AssetManifest | null): string[] {
  if (!manifest) return [];
  const rows = Object.values(manifest).flatMap((v) => (Array.isArray(v) ? v : []));
  return rows.flatMap((row: { id?: string; credit?: string; license?: string }) =>
    row.id && row.credit
      ? [t(vi.settings.credit, { id: row.id, credit: row.credit, license: row.license ?? '?' })]
      : [],
  );
}

/** The backup list part of the screen (also used by the recovery screen). */
export function backupsVm(backups: BackupsState): Pick<SettingsVm, 'backups' | 'backupsNote'> {
  return {
    backupsNote:
      backups === undefined
        ? vi.settings.backupsUnavailable
        : backups === null
          ? vi.settings.backupsLoading
          : backups.length === 0
            ? vi.settings.backupsEmpty
            : null,
    backups: (backups ?? []).map((b) => ({
      name: b.name,
      label: t(vi.settings.backupAt, { date: formatDateTime(b.at) }),
    })),
  };
}

export function settingsVm(
  save: SaveGame,
  backups: BackupsState,
  manifest: AssetManifest | null,
  version: string | null,
): SettingsVm {
  const at = save.settings.lastExportAt;
  const credits = creditLines(manifest);
  return {
    lastExport: at
      ? t(vi.settings.lastExport, { date: formatDateTime(at) })
      : vi.settings.neverExported,
    ...backupsVm(backups),
    credits: credits.length > 0 ? credits : [vi.settings.creditsEmpty],
    version: t(vi.desktop.version, { version: version ?? vi.settings.devVersion }),
  };
}
