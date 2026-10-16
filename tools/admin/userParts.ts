// Generic editors of a part of a player's save (decision 036): an Area's whole state, the goals, the character —
// drawn from the schema the game itself validates that part with (each Area's save spec, core's goals / player
// schemas), so every field the game keeps can be read and changed, and nothing the game would refuse can be saved.
// The part is edited on its own copy in the draft; each change is recorded so it can be replayed on a newer save.
import type { z } from 'zod';
import { AREAS } from '../../src/app/areas';
import { goalsSchema } from '../../src/core/goals/state';
import { playerSchema } from '../../src/core/player/player';
import { liveSchema } from '../../src/core/live/state';
import { esc } from './labels';
import { imageOf, nameOf } from './idNames';
import { bindForm, newUi, renderForm, type FormOptions, type FormUi } from './schemaForm';
import { getAt, toJsonSchema, type JsonSchema } from './schemaModel';
import { touched } from './userDraft';
import { users } from './users';
import { setPart, type Edit } from './worldEdits';

const schemaOf = (path: readonly string[]): z.ZodType | null => {
  if (path[0] === 'areas') return AREAS.get(path[1]!)?.save.schema ?? null;
  return ({ goals: goalsSchema, player: playerSchema, live: liveSchema } as Record<string, z.ZodType>)[path[0]!] ?? null;
};

const jsonSchemas = new Map<string, JsonSchema>();
const uis = new Map<string, FormUi>();

const keyOf = (path: readonly string[]) => JSON.stringify(path);

function jsonSchema(path: readonly string[]): JsonSchema | null {
  const k = keyOf(path);
  if (!jsonSchemas.has(k)) {
    const s = schemaOf(path);
    if (!s) return null;
    jsonSchemas.set(k, toJsonSchema(s));
  }
  return jsonSchemas.get(k)!;
}

/** The part's own copy, placed in the draft (it is what the form edits in place). */
function partObj(path: readonly string[]): unknown {
  const o = users.open!;
  const k = keyOf(path);
  const current = getAt(o.draft, path);
  const part = o.parts.get(k);
  if (part && part.obj === current) return part.obj;
  const obj = structuredClone(current);
  o.parts.set(k, { path, obj });
  // Same content, its own objects (nothing shared with the save as opened): not a change.
  o.draft = setPart(path, obj)(o.draft);
  Object.assign(getAt(o.draft, path.slice(0, -1)) as object, { [path[path.length - 1]!]: obj });
  return obj;
}

const rowId = (row: unknown): string | null => {
  const r = row as Record<string, unknown> | null;
  const id = [r?.breed, r?.species, r?.speciesId, r?.cropId, r?.flowerId, r?.fishId, r?.itemId, r?.id].find((x) => typeof x === 'string');
  return (id as string | undefined) ?? null;
};

function options(path: readonly string[]): FormOptions {
  return {
    root: jsonSchema(path)!,
    nameOf,
    rowImage: (row) => {
      const id = rowId(row);
      return id ? imageOf(id) : null;
    },
  };
}

const uiOf = (path: readonly string[]) => {
  const k = `${users.open!.id}:${keyOf(path)}`;
  if (!uis.has(k)) uis.set(k, newUi());
  return uis.get(k)!;
};

/** The editor of the save part at `path` (a panel; bound by bindPart). */
export function partEditor(path: readonly string[], title: string, intro = false): string {
  if (!jsonSchema(path)) return '';
  const obj = partObj(path);
  return `<section class="panel" data-part="${esc(keyOf(path))}"><h3>${esc(title)}</h3>
    ${intro ? '<p class="muted">Mọi trường game lưu cho khu này, kiểm bằng đúng schema save của khu. Danh sách dài: chọn dòng bên trái, sửa bên phải. Thời gian là mốc epoch (ms).</p>' : ''}
    <div data-part-form>${renderForm(obj, options(path), uiOf(path))}</div></section>`;
}

/** Wires one part editor: scalar edits mark the draft changed in place, structural ones redraw. */
export function bindPart(host: HTMLElement, page: HTMLElement, rerender: () => void) {
  const path = JSON.parse(host.dataset.part!) as string[];
  const o = users.open!;
  const obj = o.parts.get(keyOf(path))?.obj;
  if (obj === undefined) return;
  // Replay on a newer save writes this copy as it is then (the newest state of the form).
  const replay: Edit & { part?: unknown } = Object.assign((w: Parameters<Edit>[0]) => setPart(path, obj)(w), { part: obj });
  bindForm(host.querySelector<HTMLElement>('[data-part-form]')!, () => obj, options(path), uiOf(path), (kind) => {
    if (kind === 'view') return rerender();
    if ((o.edits.at(-1) as { part?: unknown } | undefined)?.part !== obj) o.edits.push(replay);
    touched(page);
    if (kind === 'structure') {
      o.dirty = true;
      rerender();
    }
  });
}
