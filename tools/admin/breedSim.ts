// Admin "Mô phỏng lai" (GĐ7): breed one pair N times through the game's own rules (species odds, pity, trait
// inheritance, mutation) and read the rates. Nothing is saved; the numbers come from src/, so a draft of
// content/breeding/*.json edited under "Số liệu" is the first thing to try here after saving it.
import { BREED_IDS, BREEDS } from '../../src/areas/farm/logic/config/breeds';
import type { BreedId } from '../../src/areas/farm/logic/config/ids';
import { simulateBreeding, type SimResult } from '../../src/areas/farm/logic/breedingSim';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { BREEDING_RULES_DEFAULT, TRAITS } from '../../src/systems/breeding';
import { RARITY_LABEL, esc } from './labels';
import { state } from './store';

const BREEDABLE = BREED_IDS.filter((id) => BREEDS[id].breedable);
const nameOf = (id: string) => state.rows.find((r) => r.id === id)?.nameVi ?? BREEDS[id as BreedId]?.nameVi ?? id;

interface Form {
  a: BreedId;
  b: BreedId;
  samples: number;
  seed: number;
  pity: number;
  carryPity: boolean;
  boost: number;
  traitsA: string[];
  traitsB: string[];
  hiddenA: string;
  hiddenB: string;
  revealed: boolean;
}

const form: Form = {
  a: 'PIG_WHITE',
  b: 'PIG_BLACK',
  samples: 1000,
  seed: 2024,
  pity: 0,
  carryPity: true,
  boost: 0,
  traitsA: ['', '', ''],
  traitsB: ['', '', ''],
  hiddenA: '',
  hiddenB: '',
  revealed: true,
};

const pct = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString('vi-VN')}%`;

const speciesOptions = (cur: string) =>
  RARITY_VALUES.map((rar) => {
    const group = BREEDABLE.filter((id) => BREEDS[id].rarity === rar).sort((x, y) => nameOf(x).localeCompare(nameOf(y), 'vi'));
    if (!group.length) return '';
    return `<optgroup label="${esc(RARITY_LABEL[rar] ?? rar)}">${group.map((id) => `<option value="${id}"${id === cur ? ' selected' : ''}>${esc(nameOf(id))}</option>`).join('')}</optgroup>`;
  }).join('');

const traitOptions = (cur: string) =>
  `<option value="">— không —</option>${[...TRAITS.values()].map((t) => `<option value="${t.id}"${t.id === cur ? ' selected' : ''}>${esc(t.nameVi)} (${t.tier})</option>`).join('')}`;

const bars = (rows: { id: string; count: number; percent: number }[], label: (id: string) => string, limit = 12) =>
  `<ul class="odds">${rows.slice(0, limit).map((r) => `<li><span>${esc(label(r.id))}</span><span class="odds__bar"><i style="width:${Math.min(100, r.percent)}%"></i></span><b>${pct(r.percent)}</b> <span class="muted">${r.count}</span></li>`).join('')}</ul>${rows.length > limit ? `<p class="muted">… và ${rows.length - limit} mục khác</p>` : ''}`;

function resultHtml(r: SimResult): string {
  const cfg = BREEDING_RULES_DEFAULT;
  return `<div class="stat-row">
      <div><b>${pct(r.rarePercent)}</b><span class="muted"> ra heo Rare+ ${r.couldBeRare ? '' : '(cặp này không thể)'}</span></div>
      <div><b>${pct(r.mutationPercent)}</b><span class="muted"> đột biến (cấu hình gốc ${cfg.mutation.base}%)</span></div>
      <div><b>${pct(r.hiddenPercent)}</b><span class="muted"> có tính trạng ẩn</span></div>
      <div><b>${(Math.round(r.averageTraits * 100) / 100).toLocaleString('vi-VN')}</b><span class="muted"> tính trạng / con (tối đa ${cfg.maxTraits})</span></div>
      <div><b>${r.longestMiss}</b><span class="muted"> lần trượt Rare+ liên tiếp dài nhất · vận may cao nhất ${r.maxPity}%</span></div>
    </div>
    <h4>Giống con (${r.samples} lần)</h4>${bars(r.species, (id) => `${nameOf(id)} · ${RARITY_LABEL[BREEDS[id as BreedId].rarity] ?? ''}`)}
    <h4>Tính trạng</h4>${r.traits.length > 0 ? bars(r.traits, (id) => TRAITS.get(id)?.nameVi ?? id) : '<p class="muted">Không có.</p>'}`;
}

function run(): string {
  const traits = (list: string[], hidden: string) => ({ traits: list.filter(Boolean), ...(hidden ? { hiddenTrait: hidden } : {}), hiddenRevealed: form.revealed });
  const result = simulateBreeding({
    a: form.a,
    b: form.b,
    samples: form.samples,
    seed: form.seed,
    pity: form.pity,
    carryPity: form.carryPity,
    mutationBoost: form.boost,
    parentA: traits(form.traitsA, form.hiddenA),
    parentB: traits(form.traitsB, form.hiddenB),
  });
  return resultHtml(result);
}

export function renderBreedSim(root: HTMLElement) {
  const traitRow = (key: 'traitsA' | 'traitsB', hiddenKey: 'hiddenA' | 'hiddenB', who: string) =>
    `<div class="form-grid">${form[key].map((cur, i) => `<label class="field"><span>${who}: tính trạng ${i + 1}</span><select data-trait="${key}.${i}">${traitOptions(cur)}</select></label>`).join('')}
      <label class="field"><span>${who}: tính trạng ẩn</span><select data-hidden="${hiddenKey}">${traitOptions(form[hiddenKey])}</select></label></div>`;
  root.innerHTML = `<h3>Mô phỏng lai</h3>
    <p class="muted">Lai một cặp nhiều lần bằng đúng luật của game (tỉ lệ giống, vận may, di truyền tính trạng, đột biến). Cùng seed cho cùng kết quả. Không lưu gì.</p>
    <div class="form-grid">
      <label class="field"><span>Heo A</span><select data-a>${speciesOptions(form.a)}</select></label>
      <label class="field"><span>Heo B</span><select data-b>${speciesOptions(form.b)}</select></label>
      <label class="field"><span>Số lần lai</span><input type="number" min="1" max="100000" data-samples value="${form.samples}" /></label>
      <label class="field"><span>Random seed</span><input type="number" data-seed value="${form.seed}" /></label>
      <label class="field"><span>Vận may ban đầu (%)</span><input type="number" min="0" max="100" step="1" data-pity value="${form.pity}" /></label>
      <label class="field"><span>Cộng thêm đột biến (điểm %)</span><input type="number" min="0" max="50" step="1" data-boost value="${form.boost}" /></label>
      <label class="field"><span><input type="checkbox" data-carry ${form.carryPity ? 'checked' : ''} /> Vận may tích lũy qua các lần lai</span></label>
      <label class="field"><span><input type="checkbox" data-revealed ${form.revealed ? 'checked' : ''} /> Tính trạng ẩn của bố mẹ đã lộ (có tác dụng)</span></label>
    </div>
    ${traitRow('traitsA', 'hiddenA', 'Heo A')}${traitRow('traitsB', 'hiddenB', 'Heo B')}
    <div data-result>${run()}</div>`;
  const redo = () => {
    root.querySelector('[data-result]')!.innerHTML = run();
  };
  const num = (sel: string, min: number, max: number, set: (n: number) => void) =>
    root.querySelector<HTMLInputElement>(sel)!.addEventListener('change', (e) => {
      set(Math.max(min, Math.min(max, Number((e.target as HTMLInputElement).value) || 0)));
      redo();
    });
  root.querySelector<HTMLSelectElement>('[data-a]')!.addEventListener('change', (e) => { form.a = (e.target as HTMLSelectElement).value as BreedId; redo(); });
  root.querySelector<HTMLSelectElement>('[data-b]')!.addEventListener('change', (e) => { form.b = (e.target as HTMLSelectElement).value as BreedId; redo(); });
  num('[data-samples]', 1, 100_000, (n) => (form.samples = n));
  num('[data-seed]', 0, 2 ** 31, (n) => (form.seed = n));
  num('[data-pity]', 0, 100, (n) => (form.pity = n));
  num('[data-boost]', 0, 50, (n) => (form.boost = n));
  root.querySelector<HTMLInputElement>('[data-carry]')!.addEventListener('change', (e) => { form.carryPity = (e.target as HTMLInputElement).checked; redo(); });
  root.querySelector<HTMLInputElement>('[data-revealed]')!.addEventListener('change', (e) => { form.revealed = (e.target as HTMLInputElement).checked; redo(); });
  root.querySelectorAll<HTMLSelectElement>('[data-trait]').forEach((s) =>
    s.addEventListener('change', () => {
      const [key, i] = s.dataset.trait!.split('.') as ['traitsA' | 'traitsB', string];
      form[key][Number(i)] = s.value;
      redo();
    }),
  );
  root.querySelectorAll<HTMLSelectElement>('[data-hidden]').forEach((s) =>
    s.addEventListener('change', () => {
      form[s.dataset.hidden as 'hiddenA' | 'hiddenB'] = s.value;
      redo();
    }),
  );
}

