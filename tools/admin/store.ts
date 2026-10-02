// Admin dashboard state: a draft of the species rows the game imports, the manifest pig rows and
// the files on disk. Edits stay in the draft until save() posts them to the dev API.
import { validateSpecies, type Issue, type PigArtRow } from '../../scripts/admin/validate';
import type { SpeciesRowData } from '../../scripts/admin/speciesText';
import { BALANCE } from '../../src/core/config/balance';
import { FAMILY_VALUES, RARITY_TIER } from '../../src/core/config/breeds';
import { BREED_ID_VALUES } from '../../src/core/config/ids';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { SPECIES_ROWS } from '../../src/core/config/speciesTable';

export interface InventoryItem {
  name: string;
  stem: string;
  concept: string;
  version: string | null;
  inGame: boolean;
  identical: boolean;
}

export const state = {
  rows: SPECIES_ROWS.map((r) => ({ ...r })) as SpeciesRowData[],
  pigs: [] as PigArtRow[],
  files: new Set<string>(),
  inventory: [] as InventoryItem[],
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
    maxLevel: BALANCE.MAX_LEVEL,
  });
  for (const fn of listeners) fn();
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json()) as T & { error?: string; issues?: Issue[] };
  if (!res.ok) {
    const detail = body.issues?.map((i) => `${i.speciesId ?? ''} ${i.text}`).join('\n');
    throw new Error(detail ? `${body.error}\n${detail}` : (body.error ?? res.statusText));
  }
  return body;
}

const SAVED_KEY = 'unin-admin:saved';

export async function load() {
  try {
    const text = sessionStorage.getItem(SAVED_KEY);
    sessionStorage.removeItem(SAVED_KEY);
    if (text) state.message = { kind: 'ok', text };
  } catch {
    /* storage blocked */
  }
  const manifest = await json<{ pigs: PigArtRow[] }>('/assets/manifest/assets.json');
  state.pigs = manifest.pigs;
  try {
    const f = await json<{ files: string[]; inventory: InventoryItem[] }>('/__admin/files');
    state.files = new Set(f.files);
    state.inventory = f.inventory;
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

export async function importArt(source: string, artId: string) {
  await json('/__admin/import-art', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, artId }),
  });
  const f = await json<{ files: string[]; inventory: InventoryItem[] }>('/__admin/files');
  state.files = new Set(f.files);
  state.inventory = f.inventory;
  state.message = { kind: 'ok', text: `Đã nhập ${source} → pigs/base/${artId}.png` };
  emit();
}

/** Art ids a new species may use: manifest rows no species uses, then unregistered files. */
export function freeArtIds(exceptRowId?: string): string[] {
  const used = new Set(state.rows.filter((r) => r.id !== exceptRowId).map((r) => r.artId));
  const rows = state.pigs.map((p) => p.id);
  const files = [...state.files]
    .filter((f) => f.startsWith('pigs/base/') && !f.endsWith('_sleep.png'))
    .map((f) => f.slice('pigs/base/'.length, -'.png'.length));
  return [...new Set([...rows, ...files])].filter((id) => !used.has(id)).sort();
}
