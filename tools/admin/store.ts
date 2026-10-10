// Admin dashboard state: a draft of the species rows the game imports, the manifest pig rows and
// the files on disk. Edits stay in the draft until save() posts them to the dev API.
import { validateSpecies, type Issue, type PigArtRow } from '../../scripts/admin/validate';
import type { SpeciesRowData } from '../../scripts/admin/speciesText';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { FAMILY_VALUES, RARITY_TIER } from '../../src/areas/farm/logic/config/breeds';
import { BREED_ID_VALUES } from '../../src/areas/farm/logic/config/ids';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { SPECIES_ROWS } from '../../src/areas/farm/logic/config/speciesTable';

export interface InventoryItem {
  name: string;
  stem: string;
  concept: string;
  version: string | null;
  inGame: boolean;
  identical: boolean;
  /** pigs/base art ids with the same bytes (the import already happened under that id). */
  importedAs: string[];
}

/** One PNG of public/assets/pigs/base/ (the asset library). */
export interface LibraryItem {
  file: string;
  artId: string;
  rowId: string | null; // manifest pigs[] row pointing at the file
  sleep: boolean;
  bytes: number;
  modifiedAt: number;
  size: { width: number; height: number } | null;
}

/** A non-pig manifest row (props, buildings, environment, ui, fx): icons and layout pieces. */
export interface ArtRow {
  id: string;
  section: string;
  nameVi?: string;
  /** Public path of the picture (first state for multi-state props), null when none. */
  url: string | null;
}

interface FilesPayload {
  files: string[];
  pigs: PigArtRow[];
  inventory: InventoryItem[];
  library: LibraryItem[];
}

export const state = {
  rows: SPECIES_ROWS.map((r) => ({ ...r })) as SpeciesRowData[],
  pigs: [] as PigArtRow[],
  files: new Set<string>(),
  inventory: [] as InventoryItem[],
  library: [] as LibraryItem[],
  art: [] as ArtRow[],
  issues: [] as Issue[],
  apiOnline: false,
  dirty: false,
  saving: false,
  message: null as { kind: 'ok' | 'error'; text: string } | null,
};

const listeners = new Set<() => void>();
export const onChange = (fn: () => void) => listeners.add(fn);
export function emit() {
  state.issues = validateSpecies({
    rows: state.rows,
    pigs: state.pigs,
    files: state.files,
    savedIds: BREED_ID_VALUES,
    rarities: RARITY_VALUES,
    families: FAMILY_VALUES,
    tiers: RARITY_TIER,
    maxLevel: WORLD_LEVELS.maxLevel,
  });
  for (const fn of listeners) fn();
}

export async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json()) as T & { error?: string; issues?: Issue[] };
  if (!res.ok) {
    const detail = body.issues?.map((i) => `${i.speciesId ?? ''} ${i.text}`).join('\n');
    throw Object.assign(new Error(detail ? `${body.error}\n${detail}` : (body.error ?? res.statusText)), { status: res.status });
  }
  return body;
}

const SAVED_KEY = 'unin-admin:saved';

const ART_SECTIONS = ['props', 'buildings', 'environment', 'ui', 'fx'] as const;
type RawArt = { id: string; asset?: string; states?: Record<string, string>; nameVi?: string };

export function artRows(manifest: Record<string, unknown>): ArtRow[] {
  return ART_SECTIONS.flatMap((section) =>
    ((manifest[section] ?? []) as RawArt[]).map((r) => {
      const path = r.asset ?? (r.states ? (r.states.full ?? Object.values(r.states)[0]) : undefined);
      return { id: r.id, section, ...(r.nameVi ? { nameVi: r.nameVi } : {}), url: path ? `/assets/${path}` : null };
    }),
  );
}

/** Picture URL of a non-pig manifest row (props, buildings, ui…), null when none. */
export const artUrl = (id: string) => state.art.find((a) => a.id === id)?.url ?? null;

/** Keeps a confirmation across the full reload Vite does after a config file is written. */
export function rememberMessage(text: string) {
  state.message = { kind: 'ok', text };
  try {
    sessionStorage.setItem(SAVED_KEY, text);
  } catch {
    /* storage blocked: the message just won't survive the reload */
  }
}

export async function load() {
  try {
    const text = sessionStorage.getItem(SAVED_KEY);
    sessionStorage.removeItem(SAVED_KEY);
    if (text) state.message = { kind: 'ok', text };
  } catch {
    /* storage blocked */
  }
  const manifest = await json<Record<string, unknown> & { pigs: PigArtRow[] }>('/assets/manifest/assets.json');
  state.pigs = manifest.pigs;
  state.art = artRows(manifest);
  try {
    applyFiles(await json<FilesPayload>('/__admin/files'));
    state.apiOnline = true;
  } catch {
    // Opened without `npm run admin`: read-only, trust the manifest paths.
    state.files = new Set(state.pigs.flatMap((p) => [p.asset, p.sleepAsset ?? ''].filter(Boolean)));
    state.apiOnline = false;
  }
  emit();
}

export function updateRow(id: string, next: SpeciesRowData) {
  const i = state.rows.findIndex((r) => r.id === id);
  if (i < 0) state.rows.push(next);
  else state.rows[i] = next;
  state.message = {
    kind: 'ok',
    text: `${i < 0 ? 'Đã thêm' : 'Đã sửa'} ${next.nameVi} trong bản nháp — bấm “💾 Lưu vào game” để ghi vào game.`,
  };
  state.dirty = true;
  emit();
}

export function discard() {
  state.rows = SPECIES_ROWS.map((r) => ({ ...r })) as SpeciesRowData[];
  state.dirty = false;
  state.message = null;
  emit();
}

export async function save() {
  state.saving = true;
  emit();
  try {
    const r = await json<{ rows: number; manifestAdded: number }>('/__admin/species', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: state.rows }),
    });
    state.dirty = false;
    state.message = { kind: 'ok', text: `Đã lưu ${r.rows} heo vào game (+${r.manifestAdded} dòng manifest).` };
    // The written config reloads the page (Vite); keep the confirmation across it.
    try {
      sessionStorage.setItem(SAVED_KEY, state.message.text);
    } catch {
      /* storage blocked: the message just won't survive the reload */
    }
  } catch (e) {
    state.message = { kind: 'error', text: (e as Error).message };
  } finally {
    state.saving = false;
    emit();
  }
}

function applyFiles(f: FilesPayload) {
  state.files = new Set(f.files);
  state.pigs = f.pigs; // fresh from disk: rows the API just registered are usable at once
  state.inventory = f.inventory;
  state.library = f.library;
}

/** Re-reads pig files + manifest rows from disk (after any asset write). */
export async function refreshFiles() {
  applyFiles(await json<FilesPayload>('/__admin/files'));
  emit();
}

export const post = <T>(url: string, body: unknown) =>
  json<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** Source image → pigs/base/<artId>.png + manifest row: selectable for a pig right away (AD-1). */
export async function importArt(source: string, artId: string, nameVi: string) {
  await post('/__admin/import-art', { source, artId, nameVi });
  await refreshFiles();
  state.message = { kind: 'ok', text: `Đã nhập ${source} → ${artId} (đã đăng ký manifest). Có thể chọn ngay khi tạo heo.` };
  emit();
}

/** Uploaded PNG → same as importArt. */
export async function uploadArt(file: File, artId: string, nameVi: string) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  await post('/__admin/upload-art', { artId, nameVi, data: btoa(bin) });
  await refreshFiles();
  state.message = { kind: 'ok', text: `Đã tải lên ${file.name} → ${artId}. Có thể chọn ngay khi tạo heo.` };
  emit();
}

/** Manifest row for an image already in pigs/base/ (imported before AD-1). */
export async function registerArt(artId: string, nameVi: string) {
  await post('/__admin/register-art', { artId, nameVi });
  await refreshFiles();
  state.message = { kind: 'ok', text: `Đã đăng ký ${artId} vào manifest.` };
  emit();
}

/** Art ids a new species may use: manifest rows no species uses, then unregistered files. */
export function freeArtIds(exceptRowId?: string): string[] {
  const used = new Set(state.rows.filter((r) => r.id !== exceptRowId).map((r) => r.artId));
  const rows = state.pigs.map((p) => p.id);
  const files = [...state.files]
    .filter((f) => f.startsWith('pigs/base/') && !/_(sleep|wake).png$/.test(f))
    .map((f) => f.slice('pigs/base/'.length, -'.png'.length));
  return [...new Set([...rows, ...files])].filter((id) => !used.has(id)).sort();
}
