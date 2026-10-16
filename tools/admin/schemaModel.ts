// The data side of the schema-driven forms (decision 036): the game's zod schemas as JSON Schema (zod's own
// converter, input shape), paths into a draft, the value a new field / row starts with, and the edits a form makes.
// Pure functions on plain JSON; schemaForm.ts draws them.
import { z } from 'zod';

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  propertyNames?: JsonSchema;
  items?: JsonSchema;
  prefixItems?: JsonSchema[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: unknown;
  description?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
}

export type Path = readonly (string | number)[];
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** A zod schema as the JSON Schema of what a file / save holds (before transforms). */
export const toJsonSchema = (schema: z.ZodType): JsonSchema =>
  z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any', reused: 'inline', cycles: 'ref' }) as JsonSchema;

/** `s` with $ref and single-branch allOf resolved against the root's $defs. */
export function resolve(s: JsonSchema | undefined, root: JsonSchema): JsonSchema {
  let cur = s ?? {};
  for (let i = 0; i < 8 && cur.$ref; i++) {
    const name = cur.$ref.replace(/^#\/\$defs\//, '');
    cur = cur.$ref === '#' ? root : (root.$defs?.[name] ?? {});
  }
  if (cur.allOf?.length === 1) return resolve(cur.allOf[0], root);
  return cur;
}

const isNullSchema = (s: JsonSchema) => s.type === 'null';

/** The non-null branch of a nullable schema (`X | null`), or null when `s` is not nullable. */
export function nullableInner(s: JsonSchema, root: JsonSchema): JsonSchema | null {
  const branches = s.anyOf ?? s.oneOf;
  if (branches && branches.length === 2 && branches.some(isNullSchema)) return resolve(branches.find((b) => !isNullSchema(b)), root);
  if (Array.isArray(s.type) && s.type.includes('null')) {
    const rest = s.type.filter((t) => t !== 'null');
    return { ...s, type: rest.length === 1 ? rest[0] : rest };
  }
  return null;
}

/** The branches of a union that is not a plain nullable. */
export const unionBranches = (s: JsonSchema, root: JsonSchema): JsonSchema[] | null => {
  const branches = (s.anyOf ?? s.oneOf)?.filter((b) => !isNullSchema(b));
  return branches && branches.length > 1 ? branches.map((b) => resolve(b, root)) : null;
};

export const typeOf = (s: JsonSchema): string | undefined =>
  Array.isArray(s.type) ? s.type.find((t) => t !== 'null') : (s.type ?? (s.properties ? 'object' : s.items ? 'array' : undefined));

/** Which union branch a value matches best (a const discriminator, then the required keys, then the type). */
export function branchOf(value: unknown, branches: readonly JsonSchema[]): number {
  let best = 0;
  let score = -1;
  branches.forEach((b, i) => {
    let sc = 0;
    if (b.const !== undefined) sc = b.const === value ? 10 : -10;
    else if (b.enum) sc = b.enum.includes(value) ? 8 : -10;
    else if (value && typeof value === 'object' && !Array.isArray(value) && b.properties) {
      const v = value as Record<string, unknown>;
      for (const [k, p] of Object.entries(b.properties)) {
        if (p.const !== undefined) sc += v[k] === p.const ? 10 : -10;
        else if (k in v) sc += 1;
        else if (b.required?.includes(k)) sc -= 3;
      }
      for (const k of Object.keys(v)) if (!(k in b.properties)) sc -= 2;
    } else {
      const t = typeOf(b);
      const vt = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
      sc = t === vt || (t === 'integer' && vt === 'number') ? 5 : -5;
    }
    if (sc > score) [best, score] = [i, sc];
  });
  return best;
}

/** The value a new field / row of schema `s` starts with (valid where the schema allows it). */
export function defaultOf(s0: JsonSchema | undefined, root: JsonSchema): Json {
  const s = resolve(s0, root);
  if (s.default !== undefined) return structuredClone(s.default) as Json;
  if (s.const !== undefined) return s.const as Json;
  if (s.enum?.length) return s.enum[0] as Json;
  if (nullableInner(s, root)) return null;
  const branches = unionBranches(s, root);
  if (branches) return defaultOf(branches[0], root);
  switch (typeOf(s)) {
    case 'boolean':
      return false;
    case 'number':
    case 'integer': {
      const min = s.minimum ?? (s.exclusiveMinimum !== undefined ? s.exclusiveMinimum + 1 : 0);
      return s.maximum !== undefined ? Math.min(min, s.maximum) : min;
    }
    case 'string':
      return s.minLength ? 'x'.repeat(s.minLength) : '';
    case 'array': {
      if (s.prefixItems) return s.prefixItems.map((p) => defaultOf(p, root));
      return Array.from({ length: s.minItems ?? 0 }, () => defaultOf(s.items, root));
    }
    case 'object': {
      const out: Record<string, Json> = {};
      for (const k of s.required ?? []) out[k] = defaultOf(s.properties?.[k], root);
      return out;
    }
    default:
      return null;
  }
}

/** The schema at `path` inside `root` (following the value for unions), or {} when unknown. */
export function schemaAt(root: JsonSchema, value: unknown, path: Path): JsonSchema {
  let s = resolve(root, root);
  let v = value as Record<string | number, unknown> | undefined;
  for (const k of path) {
    const inner = nullableInner(s, root);
    if (inner) s = inner;
    const branches = unionBranches(s, root);
    if (branches) s = branches[branchOf(v, branches)]!;
    if (typeof k === 'number') s = resolve(s.prefixItems?.[k] ?? s.items, root);
    else s = resolve(s.properties?.[k] ?? (typeof s.additionalProperties === 'object' ? s.additionalProperties : {}), root);
    v = v?.[k] as Record<string | number, unknown> | undefined;
  }
  return s;
}

export function getAt(value: unknown, path: Path): unknown {
  let v = value as Record<string | number, unknown> | undefined;
  for (const k of path) v = v?.[k] as Record<string | number, unknown> | undefined;
  return v;
}

/** Sets `next` at `path` in place (the parent must exist); `undefined` deletes an object key. */
export function setAt(value: unknown, path: Path, next: unknown): void {
  const parent = getAt(value, path.slice(0, -1)) as Record<string | number, unknown>;
  const key = path[path.length - 1]!;
  if (next === undefined && !Array.isArray(parent)) delete parent[key];
  else parent[key] = next;
}

/** A label for a row: its id and its name, from the fields a content row usually has. */
export function rowTitle(row: unknown, index: number, nameOf: (id: string) => string | undefined): { title: string; sub: string } {
  if (!row || typeof row !== 'object') return { title: String(row), sub: `#${index + 1}` };
  const r = row as Record<string, unknown>;
  const id = [r.id, r.itemId, r.key, r.result].find((x) => typeof x === 'string') as string | undefined;
  const nameObj = r.name as { vi?: unknown } | undefined;
  const name = [r.nameVi, nameObj?.vi, r.titleVi, r.textVi, id ? nameOf(id) : undefined].find((x) => typeof x === 'string' && x) as string | undefined;
  return { title: name ?? id ?? `#${index + 1}`, sub: name && id ? id : `#${index + 1}` };
}

/** An id like `base` that `taken` does not hold yet (base_2, base_3…). */
export function freeId(base: string, taken: ReadonlySet<string>): string {
  const stem = base.replace(/_\d+$/, '');
  for (let n = 2; ; n++) if (!taken.has(`${stem}_${n}`)) return `${stem}_${n}`;
}

/** Objects whose fields are all scalars and few: they read best as table rows. */
export function isFlatRow(s: JsonSchema, root: JsonSchema): boolean {
  if (typeOf(s) !== 'object' || !s.properties) return false;
  const props = Object.values(s.properties).map((p) => resolve(p, root));
  return props.length <= 8 && props.every((p) => {
    const inner = nullableInner(p, root) ?? p;
    return !unionBranches(inner, root) && ['number', 'integer', 'string', 'boolean'].includes(typeOf(inner) ?? '') || !!inner.enum;
  });
}

/** Readable duration for a number of a field named like a time (…Ms, …Sec, …Hours, …Min, …Days). */
export function durationHint(key: string, n: number): string | null {
  const unit = /Ms$/.test(key) ? 1 : /(Sec|Seconds)$/.test(key) ? 1_000 : /(Min|Minutes)$/.test(key) ? 60_000 : /(Hours?|Hrs)$/i.test(key) ? 3_600_000 : /Days?$/.test(key) ? 86_400_000 : 0;
  if (!unit || !Number.isFinite(n) || n <= 0) return null;
  const ms = n * unit;
  const parts: string[] = [];
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  if (d) parts.push(`${d} ngày`);
  if (h) parts.push(`${h} giờ`);
  if (m && !d) parts.push(`${m} phút`);
  if (sec && !d && !h) parts.push(`${sec} giây`);
  return parts.length ? `≈ ${parts.join(' ')}` : ms < 1000 ? `${ms} ms` : null;
}
