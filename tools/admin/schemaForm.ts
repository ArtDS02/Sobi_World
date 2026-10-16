// Schema-driven forms (decision 036): any JSON value edited through the JSON Schema of the game's zod schema —
// objects as field groups, long lists of rows as a searchable list + detail, short lists of flat rows as an inline
// table, scalar lists inline; optional fields can be added / removed, nullable ones cleared, unions switched.
// Scalar edits change the draft in place (no redraw, the caret stays); structural edits redraw through `onEdit`.
import { ENUM_LABEL, fieldLabel } from './fieldLabels';
import { esc } from './labels';
import {
  branchOf, defaultOf, durationHint, freeId, getAt, isFlatRow, nullableInner, resolve, rowTitle, schemaAt, setAt, typeOf, unionBranches,
  type Json, type JsonSchema, type Path,
} from './schemaModel';

export interface FormUi {
  /** Selected row of each list (by path key). */
  selected: Map<string, number>;
  search: Map<string, string>;
  /** Rows added since the draft was loaded: their id can still be typed. */
  fresh: WeakSet<object>;
  /** Inputs that do not hold a valid value (path key → message). */
  invalid: Map<string, string>;
  /** Groups the user opened or closed (path key → open). */
  open: Map<string, boolean>;
}

export const newUi = (): FormUi => ({ selected: new Map(), search: new Map(), fresh: new WeakSet(), invalid: new Map(), open: new Map() });

export interface FormOptions {
  root: JsonSchema;
  /** Display name of an id (items, species, crops…), for enum options and row titles. */
  nameOf: (id: string) => string | undefined;
  /** Picture of a row (item icon, species art), or null. */
  rowImage?: (row: unknown) => string | null;
  /** Extra markup at the top of a row's detail (e.g. names kept in the string tables). */
  rowExtra?: (path: Path, row: unknown) => string;
  /** Lists at these paths show as list + detail even when short (the main rows of a file). */
  masterPaths?: readonly string[];
}

const key = (p: Path) => JSON.stringify(p);
const P = (p: Path) => `data-p="${esc(key(p))}"`;
const fold = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
const isObj = (v: unknown): v is Record<string, Json> => !!v && typeof v === 'object' && !Array.isArray(v);
const lastKey = (p: Path) => String([...p].reverse().find((k) => typeof k === 'string') ?? '');

function enumLabel(v: unknown, o: FormOptions): string {
  const s = String(v);
  const name = ENUM_LABEL[s] ?? o.nameOf(s);
  return name && name !== s ? `${name} · ${s}` : s;
}

function scalar(p: Path, s: JsonSchema, v: unknown, o: FormOptions, ui: FormUi, parentRow: unknown, compact = false): string {
  const k = lastKey(p);
  if (k === 'id' && typeof v === 'string' && isObj(parentRow) && !ui.fresh.has(parentRow)) return `<code class="sf-id">${esc(v)}</code>`;
  if (s.enum && !(k === 'id' && isObj(parentRow) && ui.fresh.has(parentRow))) {
    const opts = s.enum.includes(v) ? s.enum : [v, ...s.enum];
    return `<select data-k="enum" ${P(p)}>${opts.map((e) => `<option value="${esc(JSON.stringify(e))}"${e === v ? ' selected' : ''}>${esc(enumLabel(e, o))}</option>`).join('')}</select>`;
  }
  if (s.const !== undefined) return `<code>${esc(JSON.stringify(s.const))}</code>`;
  const t = typeOf(s);
  if (t === 'boolean') return `<label class="switch"><input type="checkbox" data-k="bool" ${P(p)} ${v ? 'checked' : ''} /><span></span></label>`;
  if (t === 'number' || t === 'integer') {
    const min = s.minimum ?? s.exclusiveMinimum;
    const max = s.maximum ?? s.exclusiveMaximum;
    const hint = durationHint(k, Number(v));
    return `<input type="number" data-k="${t === 'integer' ? 'int' : 'num'}" ${P(p)} value="${esc(v ?? '')}" step="${t === 'integer' ? 1 : 'any'}"
      ${min !== undefined ? `min="${min}"` : ''} ${max !== undefined && max < 1e15 ? `max="${max}"` : ''} />
      <small class="sf-hint" data-hint="${esc(k)}">${hint ?? ''}</small>`;
  }
  if (t === 'string') {
    const text = String(v ?? '');
    const long = !compact && (text.length > 48 || /(Vi|desc|text|lines?|Template|tips?)$/i.test(k));
    const swatch = /^#[0-9a-f]{6}$/i.test(text) ? `<span class="swatch" style="background:${esc(text)}"></span>` : '';
    return long
      ? `<textarea data-k="str" ${P(p)} rows="${Math.min(4, Math.ceil(text.length / 60) || 1)}">${esc(text)}</textarea>`
      : `<span class="sf-str">${swatch}<input data-k="str" ${P(p)} value="${esc(text)}" ${s.maxLength ? `maxlength="${s.maxLength}"` : ''} /></span>`;
  }
  return `<textarea data-k="json" class="mono" ${P(p)} rows="3">${esc(JSON.stringify(v, null, 1))}</textarea>`;
}

const isScalarSchema = (s: JsonSchema, root: JsonSchema): boolean => {
  const inner = nullableInner(s, root) ?? s;
  if (unionBranches(inner, root)) return false;
  return !!inner.enum || inner.const !== undefined || ['number', 'integer', 'string', 'boolean'].includes(typeOf(inner) ?? '');
};

/** The switches of an optional / nullable field (remove it, clear it). */
function switches(p: Path, v: unknown, inner: JsonSchema | null, optional: boolean): string {
  const remove = optional ? `<button type="button" class="sf-x" data-act="opt-off" ${P(p)} title="Bỏ trường này (dùng giá trị mặc định)">✕</button>` : '';
  const nullSwitch = inner ? `<label class="sf-null"><input type="checkbox" data-act-change="null" ${P(p)} ${v === null ? 'checked' : ''} /> không có</label>` : '';
  return nullSwitch + remove;
}

/** A labelled scalar field. */
function field(p: Path, s: JsonSchema, v: unknown, o: FormOptions, ui: FormUi, optional: boolean, parentRow: unknown): string {
  const inner = nullableInner(s, o.root);
  const body = inner && v === null ? '<span class="muted">— không có —</span>' : node(p, inner ?? s, v, o, ui, parentRow);
  const bad = ui.invalid.get(key(p));
  return `<div class="sf-field${bad ? ' is-bad' : ''}"><div class="sf-label"><span title="${esc(lastKey(p))}">${esc(fieldLabel(p))}</span>${switches(p, v, inner, optional)}</div>${body}</div>`;
}

/** A complex field (object, list, union) as a group that opens and closes. */
function complexField(p: Path, s: JsonSchema, v: unknown, o: FormOptions, ui: FormUi, optional: boolean): string {
  const inner = nullableInner(s, o.root);
  const count = Array.isArray(v) ? `${v.length} dòng` : isObj(v) ? `${Object.keys(v).length} trường` : v === null ? 'không có' : '';
  const tools = switches(p, v, inner, optional);
  const body = inner && v === null ? '<p class="muted">— không có —</p>' : node(p, inner ?? s, v, o, ui, null);
  return group(p, fieldLabel(p), count, `${tools ? `<div class="sf-group__tools">${tools}</div>` : ''}${body}`, ui, p.length < 3);
}

function objectFields(p: Path, s: JsonSchema, v: Record<string, Json>, o: FormOptions, ui: FormUi): string {
  const props = s.properties ?? {};
  const req = new Set(s.required ?? []);
  const scalars: string[] = [];
  const groups: string[] = [];
  const absent: string[] = [];
  for (const [k, ps0] of Object.entries(props)) {
    const ps = resolve(ps0, o.root);
    const cp = [...p, k];
    if (!(k in v)) {
      if (!req.has(k)) absent.push(`<button type="button" class="chip" data-act="opt-on" ${P(cp)}>＋ ${esc(fieldLabel(cp))}</button>`);
      continue;
    }
    if (isScalarSchema(ps, o.root)) scalars.push(field(cp, ps, v[k], o, ui, !req.has(k), v));
    else groups.push(complexField(cp, ps, v[k], o, ui, !req.has(k)));
  }
  const extra = typeof s.additionalProperties === 'object' ? record(p, s, v, o, ui, Object.keys(props)) : '';
  return `${scalars.length ? `<div class="sf-grid">${scalars.join('')}</div>` : ''}${groups.join('')}${extra}
    ${absent.length ? `<div class="sf-optional"><span class="muted">Trường chưa đặt (đang dùng mặc định):</span> ${absent.join(' ')}</div>` : ''}`;
}

/** A map of free keys (`Record<string, X>`). */
function record(p: Path, s: JsonSchema, v: Record<string, Json>, o: FormOptions, ui: FormUi, fixed: readonly string[]): string {
  const vs = resolve(s.additionalProperties as JsonSchema, o.root);
  const keys = Object.keys(v).filter((k) => !fixed.includes(k));
  const names = resolve(s.propertyNames, o.root).enum?.map(String);
  const free = names?.filter((n) => !keys.includes(n));
  const rows = keys.map((k) => {
    const cp = [...p, k];
    const title = o.nameOf(k);
    return `<div class="sf-kv"><div class="sf-kv__key"><code>${esc(k)}</code>${title && title !== k ? `<small>${esc(title)}</small>` : ''}</div>
      <div class="sf-kv__val">${node(cp, vs, v[k], o, ui, v)}</div>
      <button type="button" class="sf-x" data-act="key-del" ${P(cp)} title="Xoá khóa">✕</button></div>`;
  });
  const add = names
    ? free?.length ? `<select data-add-key ${P(p)}><option value="">＋ Thêm khóa…</option>${free.map((n) => `<option value="${esc(n)}">${esc(enumLabel(n, o))}</option>`).join('')}</select>` : ''
    : `<span class="sf-addkey"><input data-add-key-text ${P(p)} placeholder="Khóa mới" /><button type="button" class="btn btn-small" data-act="key-add" ${P(p)}>＋ Thêm</button></span>`;
  return `<div class="sf-record">${rows.join('') || '<p class="muted">Trống</p>'}<div class="sf-record__add">${add}</div></div>`;
}

function group(p: Path, title: string, count: string, body: string, ui: FormUi, defaultOpen: boolean): string {
  const open = ui.open.get(key(p)) ?? defaultOpen;
  return `<details class="sf-group" data-group="${esc(key(p))}"${open ? ' open' : ''}><summary><b>${esc(title)}</b> <span class="muted">${esc(count)}</span></summary><div class="sf-group__body">${body}</div></details>`;
}

const rowActions = (p: Path, i: number, n: number) =>
  `<span class="row-actions"><button type="button" class="btn btn-small" data-act="up" ${P([...p, i])} ${i === 0 ? 'disabled' : ''} title="Lên">↑</button><button type="button" class="btn btn-small" data-act="down" ${P([...p, i])} ${i === n - 1 ? 'disabled' : ''} title="Xuống">↓</button><button type="button" class="btn btn-small" data-act="dup" ${P([...p, i])} title="Nhân bản">⧉</button><button type="button" class="btn btn-small btn-ghost-danger" data-act="del" ${P([...p, i])} title="Xoá">🗑</button></span>`;

function arrayNode(p: Path, s: JsonSchema, v: Json[], o: FormOptions, ui: FormUi): string {
  if (s.prefixItems) return `<div class="sf-grid">${s.prefixItems.map((ps, i) => (isScalarSchema(resolve(ps, o.root), o.root) ? field([...p, i], resolve(ps, o.root), v[i], o, ui, false, v) : complexField([...p, i], resolve(ps, o.root), v[i], o, ui, false))).join('')}</div>`;
  const is = resolve(s.items, o.root);
  const full = s.maxItems !== undefined && v.length >= s.maxItems;
  const add = full ? '' : `<button type="button" class="btn btn-small" data-act="add" ${P(p)}>＋ Thêm</button>`;
  if (isScalarSchema(is, o.root)) {
    return `<div class="sf-list">${v.map((x, i) => `<div class="sf-li">${node([...p, i], is, x, o, ui, v)}<button type="button" class="sf-x" data-act="del" ${P([...p, i])} title="Xoá">✕</button></div>`).join('')}${add}</div>`;
  }
  // A file's own rows (a top-level list with ids) read best one at a time; short lists of flat rows as a table.
  const ownRows = p.length === 1 && v.length > 6 && v.every((r) => isObj(r) && typeof r.id === 'string');
  const master = o.masterPaths?.includes(key(p)) || ownRows || !isFlatRow(is, o.root) || v.length > 40;
  if (!master) {
    const cols = Object.keys(is.properties ?? {});
    const req = new Set(is.required ?? []);
    const head = cols.map((c) => `<th title="${esc(c)}">${esc(fieldLabel([...p, 0, c]))}</th>`).join('');
    const rows = v.map((row, i) => `<tr>${cols.map((c) => {
      const cp = [...p, i, c];
      const r = row as Record<string, Json>;
      const cs = resolve(is.properties![c], o.root);
      if (!(c in r)) return `<td><button type="button" class="chip" data-act="opt-on" ${P(cp)} title="Đặt giá trị">＋</button></td>`;
      const inner = nullableInner(cs, o.root);
      const ctl = inner && r[c] === null ? `<button type="button" class="chip" data-act-null-off ${P(cp)}>— đặt —</button>` : scalar(cp, inner ?? cs, r[c], o, ui, r, true);
      return `<td class="${ui.invalid.has(key(cp)) ? 'is-bad' : ''}">${ctl}${!req.has(c) ? `<button type="button" class="sf-x" data-act="opt-off" ${P(cp)} title="Bỏ">✕</button>` : ''}</td>`;
    }).join('')}<td>${rowActions(p, i, v.length)}</td></tr>`).join('');
    return `<div class="table-wrap sf-table"><table class="table"><thead><tr>${head}<th></th></tr></thead><tbody>${rows || `<tr><td colspan="${cols.length + 1}" class="muted">Chưa có dòng nào</td></tr>`}</tbody></table></div>${add}`;
  }
  const sel = Math.min(ui.selected.get(key(p)) ?? 0, Math.max(0, v.length - 1));
  const search = ui.search.get(key(p)) ?? '';
  const items = v.map((row, i) => {
    const t = rowTitle(row, i, o.nameOf);
    const img = o.rowImage?.(row);
    const text = fold(`${t.title} ${t.sub} ${JSON.stringify(row).slice(0, 400)}`);
    const hidden = search && !text.includes(fold(search));
    return `<button type="button" class="sf-row${i === sel ? ' is-on' : ''}" data-act="sel" ${P([...p, i])} data-text="${esc(text)}"${hidden ? ' hidden' : ''}>
      ${img ? `<img src="${esc(img)}" alt="" loading="lazy" />` : '<span class="sf-row__dot"></span>'}<span><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></span></button>`;
  }).join('');
  const row = v[sel];
  const detail = v.length
    ? `<div class="sf-detail__head"><h4>${esc(rowTitle(row, sel, o.nameOf).title)}</h4>${rowActions(p, sel, v.length)}</div>
       ${o.rowExtra?.([...p, sel], row) ?? ''}${node([...p, sel], is, row, o, ui, v)}`
    : '<p class="empty">Chưa có dòng nào — bấm “＋ Thêm”.</p>';
  return `<div class="sf-master"><div class="sf-master__list"><div class="sf-master__tools"><input type="search" placeholder="Tìm trong ${v.length} dòng…" data-search="${esc(key(p))}" value="${esc(search)}" />${add}</div>
    <div class="sf-master__rows">${items}</div></div><div class="sf-detail">${detail}</div></div>`;
}

/** The control(s) of value `v` at `p` (no label). */
export function node(p: Path, s0: JsonSchema, v: unknown, o: FormOptions, ui: FormUi, parentRow: unknown = null): string {
  const s = resolve(s0, o.root);
  const inner = nullableInner(s, o.root);
  if (inner) return v === null ? '<span class="muted">— không có —</span>' : node(p, inner, v, o, ui, parentRow);
  const branches = unionBranches(s, o.root);
  if (branches) {
    const at = branchOf(v, branches);
    const label = (b: JsonSchema, i: number) => {
      const disc = Object.entries(b.properties ?? {}).find(([, x]) => x.const !== undefined);
      return disc ? `${fieldLabel([disc[0]])}: ${String(disc[1].const)}` : b.const !== undefined ? String(b.const) : `${typeOf(b) ?? 'kiểu'} #${i + 1}`;
    };
    return `<div class="sf-union"><select data-k="variant" ${P(p)}>${branches.map((b, i) => `<option value="${i}"${i === at ? ' selected' : ''}>${esc(label(b, i))}</option>`).join('')}</select>${node(p, branches[at]!, v, o, ui, parentRow)}</div>`;
  }
  const t = typeOf(s);
  if (t === 'object' && isObj(v)) {
    if (!s.properties && typeof s.additionalProperties === 'object') return record(p, s, v, o, ui, []);
    return objectFields(p, s, v, o, ui);
  }
  if (t === 'array' && Array.isArray(v)) return arrayNode(p, s, v, o, ui);
  return scalar(p, s, v, o, ui, parentRow);
}

/** The whole form of `value` (the file / save slice). */
export function renderForm(value: unknown, o: FormOptions, ui: FormUi): string {
  const s = resolve(o.root, o.root);
  if (typeOf(s) === 'object' && isObj(value) && s.properties) {
    // Top level: each complex part of the file becomes a group of its own.
    return `<div class="sf">${objectFields([], s, value, o, ui)}</div>`;
  }
  return `<div class="sf">${node([], s, value, o, ui)}</div>`;
}

const pathOf = (el: Element): Path => JSON.parse((el as HTMLElement).dataset.p ?? '[]') as Path;

/**
 * Wires a rendered form: `value()` is the draft the form edits in place; `onEdit(kind)` after each change — `value`
 * (a scalar: no redraw), `structure` (rows, optional fields, unions: redraw) or `view` (another row picked: redraw, no edit).
 */
export type EditKind = 'value' | 'structure' | 'view';

export function bindForm(host: HTMLElement, value: () => unknown, o: FormOptions, ui: FormUi, onEdit: (kind: EditKind) => void) {
  const schema = (p: Path) => schemaAt(o.root, value(), p);
  const invalid = (el: HTMLElement, p: Path, msg: string | null) => {
    const k = key(p);
    if (msg) ui.invalid.set(k, msg);
    else ui.invalid.delete(k);
    el.closest('.sf-field, td')?.classList.toggle('is-bad', !!msg);
    el.title = msg ?? '';
  };
  host.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.search !== undefined) {
      ui.search.set(el.dataset.search, el.value);
      const q = fold(el.value);
      el.closest('.sf-master')?.querySelectorAll<HTMLElement>('.sf-row').forEach((r) => (r.hidden = !!q && !(r.dataset.text ?? '').includes(q)));
      return;
    }
    const k = el.dataset.k;
    if (!k || !el.dataset.p) return;
    const p = pathOf(el);
    if (k === 'num' || k === 'int') {
      const n = Number(el.value);
      const bad = el.value.trim() === '' ? 'Cần một số' : !Number.isFinite(n) ? 'Không phải số' : k === 'int' && !Number.isInteger(n) ? 'Cần số nguyên' : null;
      invalid(el, p, bad);
      if (bad) return;
      setAt(value(), p, n);
      const hint = el.parentElement?.querySelector<HTMLElement>('.sf-hint');
      if (hint) hint.textContent = durationHint(hint.dataset.hint ?? '', n) ?? '';
    } else if (k === 'str') {
      setAt(value(), p, el.value);
    } else if (k === 'json') {
      try {
        setAt(value(), p, JSON.parse(el.value) as Json);
        invalid(el, p, null);
      } catch {
        return invalid(el, p, 'JSON chưa đúng');
      }
    } else return;
    onEdit('value');
  });
  host.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (!el.dataset.p) return;
    const p = pathOf(el);
    if (el.dataset.k === 'bool') setAt(value(), p, (el as HTMLInputElement).checked);
    else if (el.dataset.k === 'enum') setAt(value(), p, JSON.parse(el.value) as Json);
    else if (el.dataset.k === 'variant') {
      const container = schema(p);
      const branches = unionBranches(nullableInner(container, o.root) ?? container, o.root) ?? [];
      setAt(value(), p, defaultOf(branches[Number(el.value)], o.root));
      return onEdit('structure');
    } else if (el.dataset.actChange === 'null') {
      const s = schema(p);
      setAt(value(), p, (el as HTMLInputElement).checked ? null : defaultOf(nullableInner(s, o.root) ?? s, o.root));
      return onEdit('structure');
    } else if (el.dataset.addKey !== undefined && el.value) {
      const s = resolve(schema(p).additionalProperties as JsonSchema, o.root);
      (getAt(value(), p) as Record<string, Json>)[el.value] = defaultOf(s, o.root);
      return onEdit('structure');
    } else return;
    onEdit('value');
  });
  host.addEventListener('toggle', (e) => {
    const d = e.target as HTMLDetailsElement;
    if (d.dataset.group) ui.open.set(d.dataset.group, d.open);
  }, true);
  host.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act], [data-act-null-off]');
    if (!btn || !host.contains(btn)) return;
    const p = pathOf(btn);
    if (btn.dataset.actNullOff !== undefined) {
      const s = schema(p);
      setAt(value(), p, defaultOf(nullableInner(s, o.root) ?? s, o.root));
      return onEdit('structure');
    }
    const act = btn.dataset.act!;
    const listPath = p.slice(0, -1);
    const i = p[p.length - 1] as number;
    const list = getAt(value(), listPath) as Json[];
    const select = (n: number) => ui.selected.set(key(listPath), n);
    const ids = () => new Set(list.map((r) => (isObj(r) && typeof r.id === 'string' ? r.id : '')));
    switch (act) {
      case 'sel':
        select(i);
        break;
      case 'add': {
        const arr = getAt(value(), p) as Json[];
        const s = schema(p);
        const sel = ui.selected.get(key(p)) ?? 0;
        const template = arr[sel] ?? arr[arr.length - 1];
        const row = isObj(template) ? (structuredClone(template) as Json) : defaultOf(s.items, o.root);
        if (isObj(row)) {
          ui.fresh.add(row);
          if (typeof row.id === 'string') row.id = freeId(row.id, new Set(arr.map((r) => (isObj(r) ? String(r.id) : ''))));
        }
        arr.push(row);
        ui.selected.set(key(p), arr.length - 1);
        break;
      }
      case 'dup': {
        const copy = structuredClone(list[i]) as Json;
        if (isObj(copy)) {
          ui.fresh.add(copy);
          if (typeof copy.id === 'string') copy.id = freeId(copy.id, ids());
        }
        list.splice(i + 1, 0, copy);
        select(i + 1);
        break;
      }
      case 'del':
        list.splice(i, 1);
        select(Math.max(0, i - 1));
        break;
      case 'up':
      case 'down': {
        const j = act === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j]!, list[i]!];
        select(j);
        break;
      }
      case 'opt-on': {
        const parent = getAt(value(), p.slice(0, -1)) as Record<string, Json>;
        parent[p[p.length - 1] as string] = defaultOf(schema(p), o.root);
        break;
      }
      case 'opt-off':
      case 'key-del':
        setAt(value(), p, undefined);
        ui.invalid.delete(key(p));
        break;
      case 'key-add': {
        const input = btn.parentElement?.querySelector<HTMLInputElement>('[data-add-key-text]');
        const k = input?.value.trim();
        if (!k) return;
        const obj = getAt(value(), p) as Record<string, Json>;
        if (k in obj) return;
        obj[k] = defaultOf(resolve(schema(p).additionalProperties as JsonSchema, o.root), o.root);
        break;
      }
      default:
        return;
    }
    onEdit(act === 'sel' ? 'view' : 'structure');
  });
}
