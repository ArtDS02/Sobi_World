// The Map Builder's dev API on the page side (decision 047): read the builder's data (published areas and zones read from disk,
// drafts, notes) parsed by the game's own schemas, and the dialogs shared by "Quản lý map" and "Mạng map" with what they save.
import { z } from 'zod';
import { mapSchema } from '../../content/schemas/adventure/maps';
import { zoneSchema } from '../../content/schemas/adventure/zones';
import { openExits } from './mapExits';
import type * as M from './mapModel';
import { openSpawns } from './mapSpawns';
import { json, post } from './store';

export const MAP_API = '/__admin/adventure/maps';

/** The builder's data as the game reads it: rows parsed by the game's own schemas (defaults filled in). */
export async function fetchBuilder(): Promise<M.BuilderData> {
  const raw = await json<{ published: unknown[]; zones: unknown[]; drafts: Record<string, { road: 'main' | 'branch'; map: unknown }>; meta: Record<string, M.MapMeta> }>(MAP_API);
  return {
    published: z.array(mapSchema).parse(raw.published),
    zones: z.array(zoneSchema).parse(raw.zones),
    drafts: Object.fromEntries(Object.entries(raw.drafts).map(([id, d]) => [id, { road: d.road, map: mapSchema.parse(d.map) }])),
    meta: raw.meta,
  };
}

export const postDraft = (draft: M.MapDraft, extra: { create?: boolean; previousId?: string } = {}) => post(`${MAP_API}/draft`, { draft, ...extra });
export const postMeta = (id: string, patch: Partial<Pick<M.MapMeta, 'descriptionVi' | 'disabled' | 'node' | 'exits'>>) => post(`${MAP_API}/meta`, { id, patch });

/** Called after a dialog saved: what to tell the admin (the page reloads its data and redraws). */
export type Saved = (message: string) => Promise<void>;

/** "Lối ra" of an area: saves the drafts it touched and its exit notes, then opens the next area's when asked. */
export function editExits(data: M.BuilderData, id: string, saved: Saved, selectExit?: string) {
  openExits(
    data,
    id,
    async ({ drafts, notes, next }) => {
      for (const draft of drafts) await postDraft(draft);
      await postMeta(id, { exits: notes });
      await saved(`Đã lưu lối ra của ${drafts[0]!.map.nameVi}${drafts.length > 1 ? ` và ${drafts.length - 1} map đích` : ''} (bản nháp).`);
      if (next) editExits(await fetchBuilder(), next, saved);
    },
    selectExit,
  );
}

/** "Điểm xuất hiện" of an area, saved as its draft. */
export function editSpawns(data: M.BuilderData, draft: M.MapDraft, saved: Saved) {
  openSpawns(data, draft, async (d) => {
    await postDraft(d);
    await saved(`Đã lưu điểm xuất hiện của ${d.map.nameVi} (bản nháp).`);
  });
}
