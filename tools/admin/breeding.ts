// Breeding page (DECISIONS AD-1, BR-2). Three views of the ONE breeding data set the game uses:
// the breed map (generation graph + lineage), the rule system as it runs (numbers, recipes, audit,
// odds explorer) and the pair table of src/core/config/breedingPairs.ts — a rule = parents A + B
// (order ignored) → children with percents summing to 100; pairs without an active rule keep the
// rule system (breedingRules.ts), and the editor can start from those odds.
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { renderBreedMap, type PigLook } from './breedMap';
import { renderBreedRules } from './breedRules';
import type { BreedId } from '../../src/core/config/ids';
import { PAIR_PERCENT_EPSILON, PAIR_RULES, type PairRule } from '../../src/core/config/breedingPairs';
import { breedingOutcomes } from '../../src/core/engine/breedingOdds';
import { outcomeTotal, pairIssues, type Issue } from '../../scripts/admin/rules';
import { RARITY_LABEL, esc, rarityBadge } from './labels';
import { mountList } from './listKit';
import { byText, reverse } from './listQuery';
import { confirmDanger, openModal } from './modal';
import { post, rememberMessage, state } from './store';

type Rule = { -readonly [K in keyof PairRule]: PairRule[K] } & { outcomes: { breed: BreedId; percent: number }[] };

const clone = (r: PairRule): Rule => ({ ...r, parents: [...r.parents], outcomes: r.outcomes.map((o) => ({ ...o })) });
const draft = { rows: PAIR_RULES.map(clone), dirty: false };

const breedInfo = Object.fromEntries(BREED_IDS.map((id) => [id, { breedable: BREEDS[id].breedable, enabled: BREEDS[id].enabled }]));
const issues = (rows: readonly Rule[] = draft.rows): Issue[] => pairIssues(rows, { breeds: breedInfo, epsilon: PAIR_PERCENT_EPSILON });
const nameOf = (id: string) => state.rows.find((r) => r.id === id)?.nameVi ?? id;
const imgUrl = (id: string) => {
  const art = state.rows.find((r) => r.id === id)?.artId;
  return art ? `/assets/pigs/base/${art}.png` : null;
};
const img = (id: string) => {
  const url = imgUrl(id);
  return url ? `<img class="thumb" src="${esc(url)}" alt="" loading="lazy" />` : '';
};
const look: PigLook = { name: nameOf, img: imgUrl };

type View = 'map' | 'rules' | 'pairs';
let view: View = 'map';
const VIEWS: readonly (readonly [View, string])[] = [
  ['map', '🧬 Sơ đồ phả hệ'],
  ['rules', '📐 Luật đang chạy'],
  ['pairs', '✏️ Bảng ghi đè cặp'],
];

export function renderBreeding(root: HTMLElement, rerender: () => void) {
  const active = draft.rows.filter((r) => r.active).length;
  root.innerHTML = `<div class="subtabs" role="tablist">${VIEWS.map(([v, label]) =>
    `<button type="button" role="tab" class="subtabs__tab${v === view ? ' is-active' : ''}" aria-selected="${v === view}" data-view="${v}">${label}${v === 'pairs' ? ` (${active})` : ''}</button>`).join('')}</div>
    <div data-view-host></div>`;
  root.querySelectorAll<HTMLElement>('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      view = b.dataset.view as View;
      rerender();
    }),
  );
  const host = root.querySelector<HTMLElement>('[data-view-host]')!;
  if (view === 'map') renderBreedMap(host, look);
  else if (view === 'rules') renderBreedRules(host, look);
  else renderPairTable(host, rerender);
}

/** Species options grouped by rarity (optgroups), names A-Z, retired ones marked. */
const options = (ids: readonly string[], cur: string) =>
  RARITY_VALUES.map((rar) => {
    const group = ids.filter((id) => BREEDS[id as BreedId].rarity === rar).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'vi'));
    if (!group.length) return '';
    return `<optgroup label="${esc(RARITY_LABEL[rar] ?? rar)}">${group.map((id) => `<option value="${id}"${id === cur ? ' selected' : ''}>${esc(nameOf(id))}${BREEDS[id as BreedId].enabled ? '' : ' (đang tắt)'}</option>`).join('')}</optgroup>`;
  }).join('');
const BREEDABLE = BREED_IDS.filter((id) => BREEDS[id].breedable);

/** Default odds of the rule system for a pair, rounded to 2 decimals and fixed to sum to 100. */
function systemOdds(a: BreedId, b: BreedId): { breed: BreedId; percent: number }[] {
  const out = breedingOutcomes(a, b, []) ?? [];
  const rows = out.map((o) => ({ breed: o.breed, percent: Math.round(o.weight * 100) / 100 }));
  const diff = Math.round((100 - rows.reduce((s, o) => s + o.percent, 0)) * 100) / 100;
  if (rows[0]) rows[0].percent = Math.round((rows[0].percent + diff) * 100) / 100;
  return rows;
}

function outcomeRows(r: Rule) {
  return r.outcomes.map((o, i) => `<div class="outcome">${img(o.breed) || '<span></span>'}
      <select name="breed-${i}">${options(BREED_IDS, o.breed)}</select>
      <input type="number" name="pct-${i}" min="0.01" max="100" step="0.01" value="${o.percent}" aria-label="Tỷ lệ %" /> %
      ${rarityBadge(BREEDS[o.breed].rarity)}
      <button type="button" class="icon-btn" data-remove="${i}" aria-label="Bỏ kết quả">✕</button>
    </div>`).join('');
}

function totalLine(r: Rule) {
  const t = outcomeTotal(r);
  const ok = Math.abs(t - 100) <= PAIR_PERCENT_EPSILON;
  return `<span class="badge ${ok ? 'status-ok' : 'status-error'}">Tổng = ${t} %${ok ? ' ✓' : ' (phải = 100 %)'}</span>`;
}

function readRule(f: HTMLFormElement, base: Rule): Rule {
  const d = new FormData(f);
  const outcomes = base.outcomes.map((_, i) => ({ breed: String(d.get(`breed-${i}`)) as BreedId, percent: Number(d.get(`pct-${i}`)) }));
  return {
    ...base,
    parents: [String(d.get('a')) as BreedId, String(d.get('b')) as BreedId],
    outcomes,
    active: d.get('active') === 'on',
    ...(String(d.get('note') ?? '').trim() ? { note: String(d.get('note')).trim() } : { note: undefined }),
  };
}

function openEditor(existing: Rule | null, redraw: () => void) {
  const next = Math.max(0, ...draft.rows.map((r) => Number(/(\d+)$/.exec(r.id)?.[1] ?? 0))) + 1;
  let r: Rule = existing ? clone(existing) : {
    id: `PAIR_${String(next).padStart(3, '0')}`, parents: [BREEDABLE[0]!, BREEDABLE[1]!], outcomes: [], active: true,
  };
  if (!existing) r.outcomes = systemOdds(r.parents[0], r.parents[1]);
  const body = () => `
    <div class="form-grid">
      <label class="field"><span>Heo A</span><select name="a">${options(BREEDABLE, r.parents[0])}</select></label>
      <label class="field"><span>Heo B</span><select name="b">${options(BREEDABLE, r.parents[1])}</select></label>
      <label class="field span-2"><span>Ghi chú</span><input name="note" value="${esc(r.note ?? '')}" /></label>
      <label class="check"><input type="checkbox" name="active" ${r.active ? 'checked' : ''} /> Đang dùng</label>
    </div>
    <h3>Kết quả có thể sinh ra <span data-total>${totalLine(r)}</span></h3>
    <div class="outcomes">${outcomeRows(r)}</div>
    <div class="dn__buttons">
      <button type="button" class="btn btn-small" data-add>＋ Thêm kết quả</button>
      <button type="button" class="btn btn-small" data-system>↺ Điền theo tỷ lệ hiện tại của game</button>
      <button type="button" class="btn btn-small" data-normalize>⚖ Chia lại cho đủ 100 %</button>
      <button type="button" class="btn btn-small" data-even>≡ Chia đều</button>
      <button type="button" class="btn btn-small" data-sortodds>↓ Sắp theo tỷ lệ</button>
    </div>
    <ul class="issues" data-issues></ul>
    <p class="muted">A + B và B + A là cùng một cặp. Heo đang tắt trong kết quả bị bỏ qua khi chơi (phần còn lại tự chia lại cho đủ 100 %).</p>`;
  openModal({
    title: existing ? `Sửa luật ${existing.id}` : 'Luật phối giống mới',
    submit: existing ? 'Áp dụng' : 'Thêm vào bản nháp',
    body: `<div data-body>${body()}</div>`,
    onOpen: (f) => {
      const host = f.querySelector<HTMLElement>('[data-body]')!;
      const check = () => {
        const others = draft.rows.filter((x) => x.id !== (existing?.id ?? r.id));
        const mine = issues([...others, r]).filter((i) => i.speciesId === r.id && i.level !== 'info');
        f.querySelector('[data-issues]')!.innerHTML = mine.map((i) => `<li class="issue ${i.level}">${esc(i.text)}</li>`).join('');
        f.querySelector('[data-total]')!.innerHTML = totalLine(r);
      };
      const rebuild = () => {
        host.innerHTML = body();
        check();
      };
      f.addEventListener('input', () => {
        r = readRule(f, r);
        check();
      });
      f.addEventListener('change', (e) => {
        const name = (e.target as HTMLElement).getAttribute('name');
        if (name?.startsWith('breed-')) {
          r = readRule(f, r);
          rebuild(); // thumbnail + rarity of the new child
        } else if (name === 'a' || name === 'b') {
          r = readRule(f, r);
          // A new rule starts from the pair's current odds; an edited one keeps its outcomes.
          if (!existing) r.outcomes = systemOdds(r.parents[0], r.parents[1]);
          rebuild();
        }
      });
      host.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        r = readRule(f, r);
        if (t.closest('[data-add]')) r.outcomes.push({ breed: r.parents[0], percent: 0 });
        else if (t.closest('[data-system]')) r.outcomes = systemOdds(r.parents[0], r.parents[1]);
        else if (t.closest('[data-normalize]')) {
          const total = outcomeTotal(r) || 1;
          r.outcomes = r.outcomes.map((o) => ({ ...o, percent: Math.round((o.percent / total) * 10000) / 100 }));
          const diff = Math.round((100 - outcomeTotal(r)) * 100) / 100;
          if (r.outcomes[0]) r.outcomes[0].percent = Math.round((r.outcomes[0].percent + diff) * 100) / 100;
        } else if (t.closest('[data-even]')) {
          const n = r.outcomes.length || 1;
          const each = Math.floor((100 / n) * 100) / 100;
          r.outcomes = r.outcomes.map((o, i) => ({ ...o, percent: i === 0 ? Math.round((100 - each * (n - 1)) * 100) / 100 : each }));
        } else if (t.closest('[data-sortodds]')) r.outcomes = [...r.outcomes].sort((x, y) => y.percent - x.percent);
        else if (t.closest('[data-remove]')) r.outcomes.splice(Number(t.closest<HTMLElement>('[data-remove]')!.dataset.remove), 1);
        else return;
        rebuild();
      });
      check();
    },
    onSubmit: (f) => {
      r = readRule(f, r);
      const others = draft.rows.filter((x) => x.id !== (existing?.id ?? r.id));
      const errs = issues([...others, r]).filter((i) => i.speciesId === r.id && i.level === 'error');
      if (errs.length) return errs.map((i) => i.text).join(' · ');
      if (existing) draft.rows[draft.rows.findIndex((x) => x.id === existing.id)] = r;
      else draft.rows.push(r);
      draft.dirty = true;
      redraw();
    },
  });
}

function card(r: Rule) {
  const mine = issues().filter((i) => i.speciesId === r.id && i.level === 'error');
  const [a, b] = r.parents;
  return `<div class="rule-card${r.active ? '' : ' is-off'}">
    <div class="rule-card__pair">${img(a)}<b>${esc(nameOf(a))}</b> ＋ ${img(b)}<b>${esc(nameOf(b))}</b></div>
    <small class="mono">${esc(r.id)}${r.note ? ` · ${esc(r.note)}` : ''}</small>
    <ul class="odds">${[...r.outcomes].sort((x, y) => y.percent - x.percent).map((o) => `<li>${img(o.breed)}<span>${esc(nameOf(o.breed))}</span>
      ${rarityBadge(BREEDS[o.breed].rarity)}<span class="odds__bar"><i style="width:${o.percent}%"></i></span><b>${o.percent} %</b></li>`).join('')}</ul>
    <div class="row-actions">${totalLine(r)}
      ${r.active ? '<span class="badge status-ok">Đang dùng</span>' : '<span class="badge status-warn">Đang tắt</span>'}
      ${mine.length ? `<span class="badge status-error">✕ ${mine.length} lỗi</span>` : ''}
      <button class="btn btn-small" data-edit="${esc(r.id)}">✏️ Sửa</button>
      <button class="btn btn-small" data-toggle="${esc(r.id)}">${r.active ? '⏸ Tắt' : '▶ Bật'}</button>
      <button class="btn btn-small" data-del="${esc(r.id)}">🗑 Xoá</button></div>
  </div>`;
}

function renderPairTable(root: HTMLElement, rerender: () => void) {
  const all = issues();
  const errors = all.filter((i) => i.level === 'error');
  root.innerHTML = `
    <div class="summary-row">
      <span class="badge status-ok">🧬 ${draft.rows.filter((r) => r.active).length} luật đang dùng</span>
      <span class="badge status-warn">⏸ ${draft.rows.filter((r) => !r.active).length} đang tắt</span>
      ${errors.length ? `<span class="badge status-error">✕ ${errors.length} lỗi</span>` : ''}
    </div>
    <p class="muted">Bảng này chỉ chứa <b>ngoại lệ</b> (tầng ưu tiên cao nhất). Cặp không có luật ở đây dùng công thức đặc biệt + random genetics (tab "Luật đang chạy"). Luật ở đây thay hoàn toàn tỷ lệ của cặp đó.${draft.rows.length === 0 ? ' Hiện chưa có ngoại lệ nào — toàn bộ game đang chạy theo luật hệ thống.' : ''}</p>
    <div class="savebar">
      ${draft.dirty ? '<span class="badge status-warn">Chưa lưu</span><button class="btn" data-discard>Huỷ thay đổi</button>' : ''}
      <button class="btn btn-primary" data-save ${!draft.dirty || !state.apiOnline || errors.length ? 'disabled' : ''}>💾 Lưu luật vào game</button>
    </div>
    <div data-list></div>`;
  mountList(root.querySelector<HTMLElement>('[data-list]')!, {
    id: 'breeding',
    items: () => draft.rows,
    text: (r) => [r.id, r.note, ...r.parents, ...r.parents.map(nameOf), ...r.outcomes.map((o) => nameOf(o.breed))],
    filters: [
      { key: 'active', label: 'Mọi trạng thái', options: [['on', 'Đang dùng'], ['off', 'Đang tắt']], test: (r, v) => (v === 'on') === r.active },
      { key: 'parent', label: 'Mọi heo bố/mẹ', options: BREEDABLE.map((id) => [id, nameOf(id)] as const), test: (r, v) => r.parents.includes(v as BreedId) },
      { key: 'child', label: 'Mọi kết quả', options: BREED_IDS.map((id) => [id, nameOf(id)] as const), test: (r, v) => r.outcomes.some((o) => o.breed === v) },
      { key: 'valid', label: 'Hợp lệ / lỗi', options: [['ok', 'Hợp lệ'], ['error', 'Có lỗi']], test: (r, v) => (v === 'error') === all.some((i) => i.speciesId === r.id && i.level === 'error') },
    ],
    sorts: [
      { key: 'id', label: 'Mã luật', compare: byText((r) => r.id) },
      { key: 'az', label: 'Heo A A-Z', compare: byText((r) => nameOf(r.parents[0])) },
      { key: 'za', label: 'Heo A Z-A', compare: reverse(byText((r) => nameOf(r.parents[0]))) },
    ],
    pageSize: 30,
    placeholder: 'Tìm heo bố/mẹ, kết quả, mã luật…',
    noun: 'luật',
    resultsClass: 'rule-grid',
    actions: `<button class="btn btn-primary" data-new type="button" ${state.apiOnline ? '' : 'disabled'}>＋ Thêm luật</button>`,
    render: (rows) => rows.map(card).join(''),
    bind: (el) => {
      const find = (id: string) => draft.rows.find((r) => r.id === id)!;
      el.querySelectorAll<HTMLElement>('[data-edit]').forEach((b) => b.addEventListener('click', () => openEditor(find(b.dataset.edit!), rerender)));
      el.querySelectorAll<HTMLElement>('[data-toggle]').forEach((b) =>
        b.addEventListener('click', () => {
          const r = find(b.dataset.toggle!);
          r.active = !r.active;
          draft.dirty = true;
          rerender();
        }),
      );
      el.querySelectorAll<HTMLElement>('[data-del]').forEach((b) =>
        b.addEventListener('click', () =>
          confirmDanger('Xoá luật phối giống', `Xoá ${b.dataset.del}? Cặp này sẽ quay về tỷ lệ mặc định. (Muốn giữ lại để dùng sau: hãy Tắt.)`, 'Xoá luật', () => {
            draft.rows = draft.rows.filter((r) => r.id !== b.dataset.del);
            draft.dirty = true;
            rerender();
          }),
        ),
      );
    },
  });
  root.querySelector('[data-new]')?.addEventListener('click', () => openEditor(null, rerender));
  root.querySelector('[data-discard]')?.addEventListener('click', () => {
    draft.rows = PAIR_RULES.map(clone);
    draft.dirty = false;
    rerender();
  });
  root.querySelector('[data-save]')?.addEventListener('click', async () => {
    try {
      await post('/__admin/breeding-pairs', { rows: draft.rows.map(({ note, ...r }) => (note ? { ...r, note } : r)) });
      draft.dirty = false;
      rememberMessage(`Đã lưu ${draft.rows.length} luật phối giống vào game (src/core/config/breedingPairs.ts).`);
    } catch (e) {
      state.message = { kind: 'error', text: (e as Error).message };
    }
    rerender();
  });
}

export const breedingDirty = () => draft.dirty;
