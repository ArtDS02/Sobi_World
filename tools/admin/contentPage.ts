// Admin page "Nội dung game" (decision 036): every content file of the game, grouped by Area, edited through a form
// drawn from its own zod schema (schemaForm.ts): numbers, words, switches, lists, new rows. The draft is checked live
// with the same schema; "Lưu" sends the whole file and the dev API keeps it only if the game loads it
// (scripts/admin/contentSave.ts). Names kept in the string tables (items, decorations, achievements) are edited
// beside their row. A save reloads the page (Vite): the draft and the outcome survive it in sessionStorage.
import type { z } from 'zod';
import { CONTENT_FILES, CONTENT_GROUPS, EDITABLE_FILES, TEXT_TABLES, contentDef, type RowTexts } from '../../scripts/admin/contentCatalog';
import { esc } from './labels';
import { imageOf, loadNames, nameOf, resetNames } from './idNames';
import { bindForm, newUi, renderForm, type FormOptions, type FormUi } from './schemaForm';
import { toJsonSchema, type JsonSchema, type Path } from './schemaModel';
import { json, post, rememberMessage, state } from './store';

const SCHEMAS = import.meta.glob<Record<string, unknown>>('/content/schemas/**/*.ts', { eager: true });
const PENDING_KEY = 'sobi-admin:content-pending';
/** Unsaved drafts, kept across a reload of the tab (written after each edit). */
const DRAFTS_KEY = 'sobi-admin:content-drafts';

type RowText = RowTexts[string];
interface Draft {
  value: unknown;
  ui: FormUi;
  dirty: boolean;
  /** Names of rows kept in the string tables, by row object (a new row's id can still change). */
  texts: WeakMap<object, RowText>;
}

const page = {
  files: null as Record<string, unknown> | null,
  texts: {} as Record<string, RowTexts>,
  drafts: new Map<string, Draft>(),
  message: null as { kind: 'ok' | 'error'; text: string } | null,
  saving: false,
  /** Set once the drafts are stored for the reload after a save: leaving then asks nothing. */
  persisted: false,
  filter: '',
  error: null as string | null,
};

const schemaOf = (file: string): z.ZodType | null => {
  const def = contentDef(file);
  const mod = def?.schemaPath ? SCHEMAS[def.schemaPath] : undefined;
  return (mod?.[def!.exportName!] as z.ZodType | undefined) ?? null;
};
const jsonSchemas = new Map<string, JsonSchema>();
const jsonSchemaOf = (file: string): JsonSchema => {
  if (!jsonSchemas.has(file)) jsonSchemas.set(file, toJsonSchema(schemaOf(file)!));
  return jsonSchemas.get(file)!;
};

function draftOf(file: string): Draft {
  let d = page.drafts.get(file);
  if (!d) {
    d = { value: structuredClone(page.files![file]), ui: newUi(), dirty: false, texts: new WeakMap() };
    page.drafts.set(file, d);
  }
  return d;
}

export const contentDirty = () => !page.persisted && [...page.drafts.values()].some((d) => d.dirty);

type StoredDraft = { file: string; value: unknown; texts: RowTexts };

/** Every dirty draft into sessionStorage (they come back after a reload). */
function persistDrafts(forReload = false) {
  const out: StoredDraft[] = [...page.drafts].filter(([, d]) => d.dirty).map(([file, d]) => ({ file, value: d.value, texts: changedTexts(file, d) }));
  try {
    sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(out));
    if (forReload) page.persisted = true;
  } catch {
    /* storage blocked or full: the drafts only live in this page */
  }
}

let persistTimer = 0;
const persistLater = () => {
  clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => persistDrafts(), 400);
};

/** Drafts stored before a reload; rows absent from the saved file are new (their id can still be typed). */
function restoreDrafts() {
  let stored: StoredDraft[];
  try {
    stored = JSON.parse(sessionStorage.getItem(DRAFTS_KEY) ?? '[]') as StoredDraft[];
  } catch {
    return;
  }
  for (const s of stored) {
    if (!page.files?.[s.file] || page.drafts.has(s.file)) continue;
    const d: Draft = { value: s.value, ui: newUi(), dirty: true, texts: new WeakMap() };
    const saved = page.files[s.file] as Record<string, unknown>;
    for (const [k, list] of Object.entries(s.value as Record<string, unknown>)) {
      if (!Array.isArray(list)) continue;
      const known = new Set(((saved[k] ?? []) as { id?: unknown }[]).map((r) => r?.id));
      for (const row of list as Record<string, unknown>[]) if (row && typeof row === 'object' && 'id' in row && !known.has(row.id)) d.ui.fresh.add(row);
    }
    for (const row of rowsOf(s.file, s.value)) if (s.texts[String(row.id)]) d.texts.set(row, s.texts[String(row.id)]!);
    page.drafts.set(s.file, d);
  }
}

const rowsOf = (file: string, value: unknown): Record<string, unknown>[] => {
  const t = TEXT_TABLES[file];
  return t ? (((value as Record<string, unknown>)[t.rowsKey] ?? []) as Record<string, unknown>[]) : [];
};

function textOf(file: string, d: Draft, row: Record<string, unknown>): RowText {
  let t = d.texts.get(row);
  if (!t) {
    const saved = page.texts[file]?.[String(row.id)];
    t = saved ? { ...saved } : { vi: '', en: '', ...(TEXT_TABLES[file]?.desc ? { viDesc: '', enDesc: '' } : {}) };
    d.texts.set(row, t);
  }
  return t;
}

/** Texts to send: rows whose names differ from the tables (or that are new). */
function changedTexts(file: string, d: Draft): RowTexts {
  const out: RowTexts = {};
  for (const row of rowsOf(file, d.value)) {
    const t = d.texts.get(row);
    const saved = page.texts[file]?.[String(row.id)];
    if (t && JSON.stringify(t) !== JSON.stringify(saved)) out[String(row.id)] = t;
  }
  return out;
}

/** Problems the game's schema finds in the draft (ids of new rows are added by the save, not errors yet). */
function liveIssues(file: string, d: Draft): string[] {
  const r = schemaOf(file)?.safeParse(d.value);
  if (!r || r.success) return [];
  return r.error.issues
    .filter((i) => !(i.path[i.path.length - 1] === 'id' && i.code === 'invalid_value'))
    .map((i) => `${i.path.join(' › ') || 'file'}: ${i.message}`);
}

async function load(rerender: () => void) {
  try {
    const r = await json<{ files: Record<string, unknown>; texts: Record<string, RowTexts> }>('/__admin/content');
    page.files = r.files;
    page.texts = r.texts;
    page.error = null;
    restoreDrafts();
    await recoverPending();
  } catch (e) {
    page.error = (e as Error).message;
  }
  rerender();
}

/** After Vite's reload: the outcome of the save that was running, and the draft back when it was refused. */
async function recoverPending() {
  type Pending = { id: string; file: string; value: unknown; texts: RowTexts };
  let pending: Pending | null;
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? 'null') as Pending | null;
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    return;
  }
  if (!pending) return;
  try {
    const r = await fetch(`/__admin/content/result?id=${encodeURIComponent(pending.id)}`);
    const body = (await r.json()) as { ok?: boolean; error?: string };
    if (r.ok && body.ok) page.message = { kind: 'ok', text: `Đã lưu ${pending.file}. Game dùng dữ liệu mới ngay lần chạy / tải lại tới.` };
    else restoreDraft(pending, body.error ?? 'Không rõ kết quả lưu — kiểm tra lại rồi lưu lần nữa.');
  } catch {
    restoreDraft(pending, 'Không rõ kết quả lưu — kiểm tra lại rồi lưu lần nữa.');
  }
}

function restoreDraft(p: { file: string; value: unknown; texts: RowTexts }, error: string) {
  const d: Draft = { value: p.value, ui: newUi(), dirty: true, texts: new WeakMap() };
  for (const row of rowsOf(p.file, p.value)) if (p.texts[String(row.id)]) d.texts.set(row, p.texts[String(row.id)]!);
  page.drafts.set(p.file, d);
  page.message = { kind: 'error', text: `Chưa lưu ${p.file} (bản nháp của bạn vẫn còn):\n${error}` };
}

async function save(file: string, rerender: () => void) {
  const d = draftOf(file);
  const texts = changedTexts(file, d);
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id, file, value: d.value, texts }));
  } catch {
    /* storage blocked: the outcome just won't survive a reload */
  }
  page.saving = true;
  rerender();
  try {
    await post('/__admin/content', { file, value: d.value, texts, requestId: id });
    sessionStorage.removeItem(PENDING_KEY);
    page.drafts.delete(file);
    page.message = null;
    resetNames();
    // Reload: the schemas and id lists the dashboard imported may have changed (asks first if another draft is open).
    persistDrafts(true);
    rememberMessage(`Đã lưu ${file}. Game dùng dữ liệu mới ngay lần chạy / tải lại tới.`);
  } catch (e) {
    sessionStorage.removeItem(PENDING_KEY);
    state.message = null;
    page.message = { kind: 'error', text: `Chưa lưu ${file}:\n${(e as Error).message}` };
  } finally {
    page.saving = false;
    rerender();
  }
}

function countOf(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const lists = Object.values(value).filter(Array.isArray) as unknown[][];
  const rows = lists.reduce((n, l) => n + l.length, 0);
  return rows ? `${rows} dòng` : `${Object.keys(value).length} mục`;
}

function catalog(): string {
  const q = page.filter.trim().toLowerCase();
  return CONTENT_GROUPS.map(([g, label]) => {
    const files = CONTENT_FILES.filter((f) => f.group === g && (!q || `${f.title} ${f.hint} ${f.file}`.toLowerCase().includes(q)));
    if (!files.length) return '';
    return `<section class="cat-group"><h3>${esc(label)}</h3><div class="cat-grid">${files
      .map((f) => {
        const href = f.page ?? `#/content/${encodeURIComponent(f.file)}`;
        const dirty = page.drafts.get(f.file)?.dirty;
        return `<a class="cat-card${f.page ? ' is-page' : ''}" href="${href}"><span class="cat-card__icon">${f.icon}</span>
          <span class="cat-card__text"><b>${esc(f.title)}${dirty ? ' <span class="dot-warn" title="Chưa lưu"></span>' : ''}</b><small>${esc(f.hint)}</small>
          <code>${esc(f.file)}</code></span><span class="cat-card__meta">${f.page ? 'Trang riêng →' : esc(countOf(page.files?.[f.file]))}</span></a>`;
      })
      .join('')}</div></section>`;
  }).join('');
}

function fileNav(current: string): string {
  return CONTENT_GROUPS.map(([g, label]) => {
    const files = EDITABLE_FILES.filter((f) => f.group === g);
    return `<p class="filenav__group">${esc(label)}</p>${files
      .map((f) => `<a class="filenav__item${f.file === current ? ' is-active' : ''}" href="#/content/${encodeURIComponent(f.file)}">
        <span>${f.icon}</span><span>${esc(f.title)}</span>${page.drafts.get(f.file)?.dirty ? '<span class="dot-warn" title="Chưa lưu"></span>' : ''}</a>`)
      .join('')}`;
  }).join('');
}

function textsPanel(file: string, d: Draft, row: Record<string, unknown>): string {
  const table = TEXT_TABLES[file]!;
  const t = textOf(file, d, row);
  const input = (k: keyof RowText, label: string, long = false) =>
    `<label class="field${long ? ' span-2' : ''}"><span>${label}</span>${long ? `<textarea data-t="${k}" rows="2">${esc(t[k] ?? '')}</textarea>` : `<input data-t="${k}" value="${esc(t[k] ?? '')}" />`}</label>`;
  return `<div class="panel panel--tint sf-texts" data-texts-row><h5>🏷️ Tên hiển thị <small class="muted">(bảng chuỗi src/i18n — game hiện tên này)</small></h5>
    <div class="form-grid">${input('vi', 'Tên tiếng Việt')}${input('en', 'Tên tiếng Anh')}${table.desc ? `${input('viDesc', 'Mô tả tiếng Việt', true)}${input('enDesc', 'Mô tả tiếng Anh', true)}` : ''}</div></div>`;
}

function editor(root: HTMLElement, file: string, rerender: () => void) {
  const def = contentDef(file)!;
  const d = draftOf(file);
  const issues = liveIssues(file, d);
  const table = TEXT_TABLES[file];
  const opts: FormOptions = {
    root: jsonSchemaOf(file),
    nameOf,
    rowImage: (row) => {
      const id = (row as { id?: unknown })?.id;
      return typeof id === 'string' ? imageOf(id) : null;
    },
    masterPaths: table ? [JSON.stringify([table.rowsKey])] : [],
    rowExtra: table ? (p: Path, row) => (p.length === 2 && p[0] === table.rowsKey && row && typeof row === 'object' ? textsPanel(file, d, row as Record<string, unknown>) : '') : undefined,
  };
  const bad = d.ui.invalid.size;
  const msg = page.message ? `<div class="toast ${page.message.kind}"><pre>${esc(page.message.text)}</pre><button class="icon-btn" data-dismiss>✕</button></div>` : '';
  root.innerHTML = `<div class="content-layout">
    <aside class="filenav"><a class="link" href="#/content">← Mọi file</a>${fileNav(file)}</aside>
    <section class="fileedit">
      <header class="fileedit__head">
        <div><h2>${def.icon} ${esc(def.title)}</h2><p class="muted">${esc(def.hint)} · <code>content/${esc(file)}</code></p></div>
        <div class="fileedit__actions">
          ${d.dirty ? '<span class="badge status-warn">● Chưa lưu</span><button class="btn" data-revert>↺ Hoàn tác</button>' : '<span class="badge status-ok">✓ Đã lưu</span>'}
          <button class="btn btn-primary" data-save ${!d.dirty || page.saving || bad ? 'disabled' : ''} title="${bad ? 'Sửa các ô đỏ trước' : 'Kiểm tra bằng schema của game rồi ghi'}">${page.saving ? 'Đang lưu…' : '💾 Lưu file'}</button>
        </div>
      </header>
      ${msg}
      ${issues.length || bad ? `<div class="issues-box"><b>⚠ Game sẽ từ chối bản nháp này:</b><ul>${[...[...d.ui.invalid.entries()].map(([k, m]) => `${JSON.parse(k).join(' › ')}: ${m}`), ...issues].slice(0, 12).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>` : ''}
      <div data-form>${renderForm(d.value, opts, d.ui)}</div>
    </section></div>`;
  const form = root.querySelector<HTMLElement>('[data-form]')!;
  const revert = () => {
    page.drafts.delete(file);
    page.message = null;
    persistDrafts();
    rerender();
  };
  bindForm(form, () => d.value, opts, d.ui, (kind) => {
    if (kind !== 'view') {
      d.dirty = true;
      persistLater();
    }
    if (kind === 'value') {
      // No redraw (the caret stays): just the save state.
      const btn = root.querySelector<HTMLButtonElement>('[data-save]');
      if (btn) btn.disabled = page.saving || d.ui.invalid.size > 0;
      if (!root.querySelector('[data-revert]')) refreshHeader(root, revert);
      return;
    }
    rerender();
  });
  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    const k = el.dataset.t as keyof RowText | undefined;
    if (!k || !table) return;
    const sel = d.ui.selected.get(JSON.stringify([table.rowsKey])) ?? 0;
    const row = rowsOf(file, d.value)[sel];
    if (!row) return;
    textOf(file, d, row)[k] = el.value;
    d.dirty = true;
    persistLater();
    if (!root.querySelector('[data-revert]')) refreshHeader(root, revert);
  });
  root.querySelector('[data-save]')?.addEventListener('click', () => void save(file, rerender));
  root.querySelector('[data-revert]')?.addEventListener('click', revert);
  root.querySelector('[data-dismiss]')?.addEventListener('click', () => {
    page.message = null;
    rerender();
  });
}

/** Shows "Chưa lưu" after the first scalar edit without redrawing the form. */
function refreshHeader(root: HTMLElement, revert: () => void) {
  const actions = root.querySelector('.fileedit__actions');
  const badge = actions?.querySelector('.badge');
  if (!actions || !badge) return;
  badge.className = 'badge status-warn';
  badge.textContent = '● Chưa lưu';
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.dataset.revert = '';
  btn.textContent = '↺ Hoàn tác';
  btn.addEventListener('click', revert);
  badge.after(btn);
  const save = actions.querySelector<HTMLButtonElement>('[data-save]');
  if (save) save.disabled = page.saving;
}

export function renderContent(root: HTMLElement, file: string | null, apiOnline: boolean, rerender: () => void) {
  if (!apiOnline) {
    root.innerHTML = '<p class="empty">Cần chạy <code>npm run admin</code> để đọc và ghi nội dung game.</p>';
    return;
  }
  if (!page.files) {
    root.innerHTML = page.error ? `<p class="empty">Không tải được nội dung: ${esc(page.error)}</p>` : '<p class="loading">Đang tải nội dung game…</p>';
    if (!page.error) void Promise.all([load(rerender), loadNames()]);
    return;
  }
  if (file && EDITABLE_FILES.some((f) => f.file === file)) return editor(root, file, rerender);
  const msg = page.message ? `<div class="toast ${page.message.kind}"><pre>${esc(page.message.text)}</pre><button class="icon-btn" data-dismiss>✕</button></div>` : '';
  root.innerHTML = `${msg}<div class="toolbar"><input type="search" class="search-input" placeholder="Tìm file: vật phẩm, cá, lễ hội…" value="${esc(page.filter)}" data-filter />
      <span class="muted">${EDITABLE_FILES.length} file sửa ở đây · ${CONTENT_FILES.length - EDITABLE_FILES.length} file có trang riêng. Mỗi lần lưu, server kiểm bằng schema của game và nạp lại toàn bộ dữ liệu trước khi ghi.</span></div>
    <div data-catalog>${catalog()}</div>`;
  const filter = root.querySelector<HTMLInputElement>('[data-filter]')!;
  filter.addEventListener('input', () => {
    page.filter = filter.value;
    root.querySelector('[data-catalog]')!.innerHTML = catalog();
  });
  root.querySelector('[data-dismiss]')?.addEventListener('click', () => {
    page.message = null;
    rerender();
  });
}
