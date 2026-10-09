// Breeding system page (DECISIONS BR-2, MU-1): what the game actually runs and where it is tuned —
// coverage audit, the random-genetics percents, gene-pool bonuses and the special recipes (all
// editable here, saved into content/farm/breeding.json by the dev API), plus an odds explorer
// with a seeded sampler. Every number shown comes from src/core (draft edits preview through the
// same engine functions; no copy of the rules lives here).
import { GENETICS, MUTATIONS, type GeneticsBuckets, type GeneticsRules, type Mutation } from '../../src/areas/farm/logic/config/breedingRules';
import { BREED_IDS, BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { GENE_BONUSES, THEME_RELATIONS, type GeneBonuses } from '../../src/areas/farm/logic/config/genePool';
import type { BreedId } from '../../src/areas/farm/logic/config/ids';
import { RARITY_VALUES, rarityRank } from '../../src/core/config/rarity';
import { weightedPick } from '../../src/areas/farm/logic/breeding';
import { breedingCoverage } from '../../src/areas/farm/logic/breedingCoverage';
import {
  breedingLayer,
  breedingOutcomes,
  compatibility,
  geneticsBuckets,
  geneticsIssues,
  recipeIssues,
  type BreedingData,
} from '../../src/areas/farm/logic/breedingOdds';
import { mulberry32 } from '../../src/core/rng';
import { RARITY_LABEL, esc, rarityBadge } from './labels';
import type { PigLook } from './breedMap';
import { post, rememberMessage, state } from './store';

type Case = 'sameRarity' | 'differentRarity' | 'adjacentRarity';
const CASES: readonly (readonly [Case, string, readonly (keyof GeneticsBuckets)[]])[] = [
  ['sameRarity', 'Cùng độ hiếm', ['parentTypeChance', 'sameRarityTypeChance', 'higherRarityChance']],
  ['differentRarity', 'Khác độ hiếm (có bậc giữa)', ['parentTypeChance', 'middleRarityChance', 'higherRarityChance']],
  ['adjacentRarity', 'Độ hiếm kề nhau', ['parentTypeChance', 'sameRarityTypeChance', 'higherRarityChance']],
];
const FIELD_LABEL: Record<Case, Record<keyof GeneticsBuckets, string>> = {
  sameRarity: { parentTypeChance: 'Loài bố / mẹ', sameRarityTypeChance: 'Loài khác cùng bậc', middleRarityChance: '', higherRarityChance: 'Lên 1 bậc' },
  differentRarity: { parentTypeChance: 'Loài bố / mẹ', sameRarityTypeChance: '', middleRarityChance: 'Bậc ở giữa', higherRarityChance: 'Loài khác bậc cao' },
  adjacentRarity: { parentTypeChance: 'Loài bố / mẹ', sameRarityTypeChance: 'Loài khác của 2 bậc', middleRarityChance: '', higherRarityChance: 'Loài khác bậc cao' },
};
const BONUS_LABEL: Record<keyof GeneBonuses, string> = {
  base: 'Nền mỗi loài',
  sameTheme: 'Cùng theme (nhóm)',
  relatedTheme: 'Theme liên quan',
  perGeneTag: 'Mỗi gene tag chung',
  geneTagCap: 'Tối đa số tag',
};

const cloneGenetics = (g: GeneticsRules): GeneticsRules => JSON.parse(JSON.stringify(g)) as GeneticsRules;
const draft = {
  genetics: cloneGenetics(GENETICS),
  bonuses: { ...GENE_BONUSES } as GeneBonuses,
  recipes: MUTATIONS.map((m) => ({ ...m, parents: [...m.parents] as [BreedId, BreedId] })) as Mutation[],
  dirty: false,
};
const data = (): BreedingData => ({ genetics: draft.genetics, mutations: draft.recipes, genes: { bonuses: draft.bonuses } });

const pct = (n: number) => `${Math.round(n * 10) / 10} %`;
const pair = { a: 'PIG_WHITE' as BreedId, b: 'PIG_BLACK' as BreedId, seed: 12345, samples: 1000 };
let coverage: ReturnType<typeof breedingCoverage> | null = null;
const live = BREED_IDS.filter((id) => BREEDS[id].enabled);
const BREEDABLE = live.filter((id) => BREEDS[id].breedable);

const issuesOf = () => [...geneticsIssues(draft.genetics), ...recipeIssues(draft.recipes)];

function auditHtml() {
  const c = (coverage ??= breedingCoverage());
  const row = (label: string, value: string | number, ok: boolean) =>
    `<tr><td>${label}</td><td><b>${value}</b></td><td>${ok ? '<span class="badge status-ok">✓</span>' : '<span class="badge status-error">✕</span>'}</td></tr>`;
  return `<table class="table"><tbody>
    ${row('Loài heo (đang bật)', c.total, true)}
    ${row('Lai ra được từ một cặp', `${c.breedable} / ${c.total}`, c.breedable === c.total)}
    ${row('Có được từ heo cửa hàng (mua hoặc lai)', `${c.obtainable} / ${c.total}`, c.obtainable === c.total)}
    ${row('Heo không thể lai ra (orphan)', c.orphans.length ? c.orphans.join(', ') : 0, c.orphans.length === 0)}
    ${row(`Đường tốt nhất quá yếu (&lt; 0,2 %)`, c.weak.length ? c.weak.join(', ') : 0, c.weak.length === 0)}
    ${row('Luật sai / trùng', c.invalidRules.length + c.duplicateRules.length, c.invalidRules.length + c.duplicateRules.length === 0)}
    ${row('Lỗi xác suất (tổng ≠ 100 %)', c.probabilityErrors.length, c.probabilityErrors.length === 0)}
    ${row('Số đường lai (cặp → con, tỉ lệ &gt; 0)', c.routes.toLocaleString('vi'), true)}
  </tbody></table>`;
}

/** Average split of same-rarity pairs (with the draft): parent species / other same tier / one up. */
function sameRarityStats() {
  return RARITY_VALUES.map((r) => {
    const ids = BREEDABLE.filter((id) => BREEDS[id].rarity === r);
    const k = rarityRank(r);
    let parent = 0, same = 0, up = 0, n = 0;
    for (const a of ids) for (const b of ids) {
      for (const o of breedingOutcomes(a, b, [], data()) ?? []) {
        if (o.breed === a || o.breed === b) parent += o.weight;
        else if (rarityRank(BREEDS[o.breed].rarity) === k) same += o.weight;
        else up += o.weight;
      }
      n++;
    }
    return { r, n: ids.length, parent: parent / Math.max(1, n), same: same / Math.max(1, n), up: up / Math.max(1, n) };
  }).filter((s) => s.n > 0);
}

function geneticsHtml() {
  const g = draft.genetics;
  const rows = CASES.map(([k, label, fields]) => {
    const sum = fields.reduce((s, f) => s + g[k][f], 0);
    const ok = Math.abs(sum - 100) <= 0.01;
    return `<tr><th>${label}</th>${fields.map((f, i) => `<td><label class="field"><span>${i + 1}. ${FIELD_LABEL[k][f]}</span>
      <input type="number" min="0" max="100" step="0.5" data-gen="${k}.${f}" value="${g[k][f]}" /></label></td>`).join('')}
      <td><span class="badge ${ok ? 'status-ok' : 'status-error'}">${sum} %</span></td></tr>`;
  }).join('');
  const bonuses = (Object.keys(BONUS_LABEL) as (keyof GeneBonuses)[]).map((k) =>
    `<label class="field"><span>${BONUS_LABEL[k]}</span><input type="number" min="0" step="1" data-bonus="${k}" value="${draft.bonuses[k]}" /></label>`).join('');
  const stats = sameRarityStats();
  return `<div class="panel"><h3>Random Genetics — xác suất theo độ hiếm</h3>
    <p class="muted">Thứ tự: <b>bảng ghi đè cặp</b> → <b>công thức đặc biệt</b> (lấy đúng % của nó trước) → <b>random genetics</b> chia phần còn lại.
      Ưu tiên 1 ≥ 2 ≥ 3, mỗi dòng tổng = 100 %. Nhóm không có loài (vd. bậc trên cùng) bị bỏ, phần còn lại chia lại. Không bao giờ nhảy quá 1 bậc.</p>
    <table class="table"><tbody>${rows}</tbody></table>
    <div class="form-grid">
      <label class="field"><span>Lên bậc × độ hợp: min</span><input type="number" min="0.01" step="0.05" data-scale="min" value="${g.compatScale.min}" /></label>
      <label class="field"><span>max</span><input type="number" min="0.01" step="0.05" data-scale="max" value="${g.compatScale.max}" /></label>
    </div>
    <p class="muted">Thứ tự độ hiếm (nguồn: core/config/rarity.ts): ${RARITY_VALUES.map((r) => rarityBadge(r)).join(' → ')}</p>
    <table class="table"><thead><tr><th>Bố mẹ cùng</th><th>Ra loài bố/mẹ</th><th>Loài khác cùng bậc</th><th>Lên 1 bậc</th></tr></thead><tbody>
      ${stats.map((s) => `<tr><td>${rarityBadge(s.r)}</td><td><b>${pct(s.parent)}</b></td><td>${pct(s.same)}</td><td>${pct(s.up)}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="panel"><h3>Gene Pool — chọn loài trong một nhóm</h3>
      <p class="muted">Theme = nhóm (family) của loài, gene tags = đặc điểm (speciesTraits.ts). Chỉ là điểm cộng, không bắt buộc; loài không có tag vẫn lai bình thường.</p>
      <div class="form-grid">${bonuses}</div>
      <p class="muted">Theme liên quan: ${THEME_RELATIONS.map(([x, y]) => `${x} ↔ ${y}`).join(' · ')}</p></div>`;
}

const options = (look: PigLook, ids: readonly BreedId[], cur: BreedId) =>
  RARITY_VALUES.map((r) => {
    const group = ids.filter((id) => BREEDS[id].rarity === r);
    return group.length ? `<optgroup label="${esc(RARITY_LABEL[r] ?? r)}">${group.map((id) => `<option value="${id}"${id === cur ? ' selected' : ''}>${esc(look.name(id))}</option>`).join('')}</optgroup>` : '';
  }).join('');

function recipesHtml(look: PigLook) {
  return `<table class="table"><thead><tr><th>Heo A</th><th>Heo B</th><th>Ra</th><th>% công thức</th><th>Tỉ lệ thật</th><th></th></tr></thead><tbody>
    ${draft.recipes.map((m, i) => {
      const real = breedingOutcomes(m.parents[0], m.parents[1], [], data())?.find((o) => o.breed === m.result)?.weight ?? 0;
      return `<tr>
        <td><select data-rec="${i}.a">${options(look, BREEDABLE, m.parents[0])}</select></td>
        <td><select data-rec="${i}.b">${options(look, BREEDABLE, m.parents[1])}</select></td>
        <td><select data-rec="${i}.result">${options(look, live, m.result)}</select> ${rarityBadge(BREEDS[m.result].rarity)}</td>
        <td><input type="number" min="0.1" max="100" step="0.5" data-rec="${i}.weight" value="${m.weight}" /></td>
        <td><b>${pct(real)}</b></td>
        <td><button type="button" class="icon-btn" data-rec-del="${i}" aria-label="Xoá công thức">✕</button></td></tr>`;
    }).join('')}</tbody></table>
    <button type="button" class="btn btn-small" data-rec-add>＋ Thêm công thức</button>`;
}

const LAYER_LABEL = { pair: 'bảng ghi đè cặp', recipe: 'công thức đặc biệt + random genetics', genetics: 'random genetics' } as const;
const BUCKET_LABEL = { parent: 'Loài bố / mẹ', sameRarity: 'Loài khác cùng bậc', middle: 'Bậc ở giữa', higher: 'Bậc cao / lên bậc' } as const;

function oddsHtml(look: PigLook) {
  const out = breedingOutcomes(pair.a, pair.b, undefined, data()) ?? [];
  const hearts = Math.round(compatibility(pair.a, pair.b, draft.recipes) * 5);
  const buckets = geneticsBuckets(pair.a, pair.b, data());
  // Seeded sampler: the same seed always draws the same children (bug reproduction, MU-1).
  const rng = mulberry32(pair.seed);
  const counts = new Map<BreedId, number>();
  for (let i = 0; i < pair.samples; i++) {
    const id = weightedPick(rng, out);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return `<p>Độ hợp: ${'♥'.repeat(hearts)}${'♡'.repeat(5 - hearts)} · tầng quyết định: <b>${LAYER_LABEL[breedingLayer(pair.a, pair.b, undefined, data())]}</b> · ${out.length} kết quả</p>
    <p class="muted">Random genetics: ${buckets.map((b) => `${BUCKET_LABEL[b.kind]} ${pct(b.percent)} (${b.species.length} loài)`).join(' · ')}</p>
    <ul class="odds">${out.slice(0, 15).map((o) => `<li>${look.img(o.breed) ? `<img class="thumb" src="${esc(look.img(o.breed)!)}" alt="" loading="lazy" />` : ''}<span>${esc(look.name(o.breed))}</span>
      ${rarityBadge(BREEDS[o.breed].rarity)}<span class="odds__bar"><i style="width:${Math.min(100, o.weight)}%"></i></span><b>${pct(o.weight)}</b>
      <span class="muted">seed: ${counts.get(o.breed) ?? 0}/${pair.samples}</span></li>`).join('')}</ul>
    ${out.length > 15 ? `<p class="muted">… và ${out.length - 15} loài khác, tổng ${pct(out.slice(15).reduce((s, o) => s + o.weight, 0))}</p>` : ''}`;
}

export function renderBreedRules(root: HTMLElement, look: PigLook) {
  const issues = issuesOf();
  root.innerHTML = `
    <h3>Kiểm tra dữ liệu lai</h3>${auditHtml()}
    <div class="dn__buttons">
      <button type="button" class="btn btn-primary" data-save ${draft.dirty && issues.length === 0 ? '' : 'disabled'}>💾 Lưu luật vào game</button>
      <button type="button" class="btn btn-small" data-reset ${draft.dirty ? '' : 'disabled'}>↺ Bỏ thay đổi</button>
      ${draft.dirty ? '<span class="badge status-warn">Có thay đổi chưa lưu — bảng tỉ lệ dưới đã tính theo bản nháp</span>' : ''}
    </div>
    <ul class="issues">${issues.map((x) => `<li class="issue error">${esc(x)}</li>`).join('')}</ul>
    <div class="rule-grid">${geneticsHtml()}</div>
    <h3>Thử một cặp</h3>
    <div class="form-grid"><label class="field"><span>Heo A</span><select data-a>${options(look, BREEDABLE, pair.a)}</select></label>
      <label class="field"><span>Heo B</span><select data-b>${options(look, BREEDABLE, pair.b)}</select></label>
      <label class="field"><span>Random seed</span><input type="number" data-seed value="${pair.seed}" /></label>
      <label class="field"><span>Số lần thử</span><input type="number" min="1" max="100000" data-samples value="${pair.samples}" /></label></div>
    <div data-odds>${oddsHtml(look)}</div>
    <h3>Công thức đặc biệt (${draft.recipes.length})</h3>
    <p class="muted">Ưu tiên cao nhất sau bảng ghi đè: kết quả nhận đúng % này, random genetics không lấn được. Sơ đồ phả hệ vẽ đúng các công thức này.</p>
    ${recipesHtml(look)}`;
  const redraw = () => renderBreedRules(root, look);
  const touch = () => {
    draft.dirty = true;
    redraw();
  };
  root.querySelectorAll<HTMLInputElement>('[data-gen]').forEach((el) =>
    el.addEventListener('change', () => {
      const [k, f] = el.dataset.gen!.split('.') as [Case, keyof GeneticsBuckets];
      draft.genetics[k][f] = Number(el.value);
      touch();
    }),
  );
  root.querySelectorAll<HTMLInputElement>('[data-scale]').forEach((el) =>
    el.addEventListener('change', () => {
      draft.genetics.compatScale[el.dataset.scale as 'min' | 'max'] = Number(el.value);
      touch();
    }),
  );
  root.querySelectorAll<HTMLInputElement>('[data-bonus]').forEach((el) =>
    el.addEventListener('change', () => {
      draft.bonuses[el.dataset.bonus as keyof GeneBonuses] = Number(el.value);
      touch();
    }),
  );
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-rec]').forEach((el) =>
    el.addEventListener('change', () => {
      const [i, f] = el.dataset.rec!.split('.') as [string, 'a' | 'b' | 'result' | 'weight'];
      const m = draft.recipes[Number(i)]!;
      const parents = [...m.parents] as [BreedId, BreedId];
      if (f === 'a') parents[0] = el.value as BreedId;
      if (f === 'b') parents[1] = el.value as BreedId;
      draft.recipes[Number(i)] = {
        parents,
        result: f === 'result' ? (el.value as BreedId) : m.result,
        weight: f === 'weight' ? Number(el.value) : m.weight,
      };
      touch();
    }),
  );
  root.querySelectorAll<HTMLElement>('[data-rec-del]').forEach((el) =>
    el.addEventListener('click', () => {
      draft.recipes.splice(Number(el.dataset.recDel), 1);
      touch();
    }),
  );
  root.querySelector('[data-rec-add]')!.addEventListener('click', () => {
    draft.recipes.push({ parents: [BREEDABLE[0]!, BREEDABLE[1]!], result: BREEDABLE[2]!, weight: 5 });
    touch();
  });
  root.querySelector('[data-reset]')!.addEventListener('click', () => {
    draft.genetics = cloneGenetics(GENETICS);
    draft.bonuses = { ...GENE_BONUSES };
    draft.recipes = MUTATIONS.map((m) => ({ ...m, parents: [...m.parents] as [BreedId, BreedId] }));
    draft.dirty = false;
    redraw();
  });
  root.querySelector('[data-save]')!.addEventListener('click', async () => {
    try {
      await post('/__admin/breeding-genetics', { genetics: draft.genetics, mutations: draft.recipes, geneBonuses: draft.bonuses });
      draft.dirty = false;
      coverage = null;
      rememberMessage(`Đã lưu random genetics, gene pool và ${draft.recipes.length} công thức đặc biệt vào game.`);
    } catch (e) {
      state.message = { kind: 'error', text: (e as Error).message };
    }
    redraw();
  });
  const update = () => {
    pair.a = root.querySelector<HTMLSelectElement>('[data-a]')!.value as BreedId;
    pair.b = root.querySelector<HTMLSelectElement>('[data-b]')!.value as BreedId;
    pair.seed = Number(root.querySelector<HTMLInputElement>('[data-seed]')!.value) || 0;
    pair.samples = Math.max(1, Math.min(100000, Number(root.querySelector<HTMLInputElement>('[data-samples]')!.value) || 1));
    root.querySelector('[data-odds]')!.innerHTML = oddsHtml(look);
  };
  for (const sel of ['[data-a]', '[data-b]', '[data-seed]', '[data-samples]'])
    root.querySelector(sel)!.addEventListener('change', update);
}
