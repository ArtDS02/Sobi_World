// JSON export/import (spec §9.3). Pure: the export time is passed in, never read from a clock.
import { SAVE } from '../config/save';
import type { SaveGame } from '../types';
import { parseSave, type MigrateResult } from './migrate';

const pad = (n: number) => String(n).padStart(2, '0');

/** `un-in-save-YYYYMMDD-HHmm.json` in the local time of `at`. */
export function exportFileName(at: Date): string {
  const date = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}`;
  return `${SAVE.EXPORT_FILE_PREFIX}${date}-${pad(at.getHours())}${pad(at.getMinutes())}.json`;
}

/** Stamps settings.lastExportAt and returns the file to download plus the updated save. */
export function exportSave(
  save: SaveGame,
  at: Date,
): { fileName: string; json: string; save: SaveGame } {
  const stamped = { ...save, settings: { ...save.settings, lastExportAt: at.getTime() } };
  return { fileName: exportFileName(at), json: JSON.stringify(stamped), save: stamped };
}

/**
 * Validates an imported file. Never touches storage: the caller confirms the overwrite and
 * persists only on `ok: true` (the previous save then goes to the backup key).
 */
export function importSave(text: string): MigrateResult {
  return parseSave(text);
}

/** True when the reminder to export should be shown (no export yet, or older than 7 days). */
export function exportReminderDue(save: SaveGame, now: number): boolean {
  const last = save.settings.lastExportAt;
  return last === null || now - last > SAVE.EXPORT_REMINDER_DAYS * 24 * 3600 * 1000;
}
