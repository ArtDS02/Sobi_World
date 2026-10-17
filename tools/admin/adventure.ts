// Admin "Mô phỏng trận" (decision 037): a party of Guardian lines and classes at a level and a tier of gear walks a zone N times — every
// group of its three areas, the springs, the guardians and the boss — through the game's own battle rules with the AI choosing. The
// page reads the win rate, how far the trips get, the battles' length, the skills used and the reactions. Nothing is saved; the numbers
// are edited under "Nội dung game" (content/adventure/*.json) and tried here right after.
import { simulateRuns, GEAR_TIERS, type GearTier, type SimResult } from '../../src/areas/adventure/logic/battleSim';
import { CLASS_LIST, LINEAGE_LIST, MAPS, PREP_ITEMS, REACTIONS, SKILLS, ZONE_LIST, ZONES, type ClassId, type LineageId } from '../../src/areas/adventure/logic/config/content';
import type { ItemId } from '../../src/core/config/ids';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { vi } from '../../src/i18n/vi';
import { RARITY_LABEL, esc } from './labels';

interface Form {
  zoneId: string;
  level: number;
  gear: GearTier;
  prep: string[];
  team: { lineage: LineageId; classId: ClassId; rarity: string; hearts: number }[];
  samples: number;
  seed: number;
}

const form: Form = {
  zoneId: ZONE_LIST[0]!.id,
  level: 5,
  gear: 'common',
  prep: [],
  team: [
    { lineage: 'thiet_giap', classId: 'tanker', rarity: 'COMMON', hearts: 0 },
    { lineage: 'hoa_giai', classId: 'striker', rarity: 'COMMON', hearts: 0 },
    { lineage: 'nam_hai', classId: 'support', rarity: 'COMMON', hearts: 0 },
  ],
  samples: 60,
  seed: 2024,
};

const GEAR_LABEL: Record<GearTier, string> = { none: 'Không trang bị', common: 'Trang bị thường', uncommon: 'Trang bị khá', rare: 'Trang bị hiếm', epic: 'Trang bị sử thi (Tàn Tích)' };
const pct = (n: number) => `${n.toLocaleString('vi-VN')}%`;

function resultHtml(r: SimResult): string {
  const zone = ZONES[form.zoneId]!;
  const top = Object.entries(r.skillUse).sort((a, b) => b[1] - a[1]).slice(0, 12);
  return `<div class="stat-row">
      <div><b>${pct(r.winPercent)}</b><span class="muted"> hạ trùm vùng trong ${r.samples} chuyến</span></div>
      <div><b>${r.averageRounds.toLocaleString('vi-VN')}</b><span class="muted"> vòng mỗi trận (mục tiêu 4–7)</span></div>
      <div><b>${r.averageBattles.toLocaleString('vi-VN')}</b><span class="muted"> trận mỗi chuyến</span></div>
      <div><b>${pct(r.averageHpLeft)}</b><span class="muted"> máu còn lại khi thắng</span></div>
    </div>
    <h4>Đi tới khu</h4>
    <ul class="odds">${zone.maps
      .map((m, i) => `<li><span>${i + 1}. ${esc(MAPS[m]!.nameVi)}</span><span class="odds__bar"><i style="width:${Math.min(100, r.reachedPercent[i] ?? 0)}%"></i></span><b>${pct(r.reachedPercent[i] ?? 0)}</b></li>`)
      .join('')}<li><span>Trùm</span><span class="odds__bar"><i style="width:${Math.min(100, r.bossPercent)}%"></i></span><b>${pct(r.bossPercent)}</b></li></ul>
    <h4>Kỹ năng dùng nhiều nhất (lần / chuyến)</h4>
    <p>${top.map(([id, n]) => `${esc(SKILLS[id]?.nameVi ?? id)}: ${n}`).join(' · ') || '—'}</p>
    <h4>Phản ứng nguyên tố (lần / chuyến)</h4>
    <p>${Object.entries(r.reactions).map(([id, n]) => `${esc(REACTIONS[id]?.nameVi ?? id)}: ${n}`).join(' · ') || '—'}</p>`;
}

const run = () => resultHtml(simulateRuns({ zoneId: form.zoneId, level: form.level, team: form.team, gear: form.gear, prep: form.prep, samples: form.samples, seed: form.seed }));

export function renderAdventure(root: HTMLElement) {
  const options = <T extends string>(list: readonly { id: T; nameVi: string }[], cur: string) => list.map((x) => `<option value="${x.id}"${x.id === cur ? ' selected' : ''}>${esc(x.nameVi)}</option>`).join('');
  const rarityOptions = (cur: string) => RARITY_VALUES.map((r) => `<option value="${r}"${r === cur ? ' selected' : ''}>${esc(RARITY_LABEL[r] ?? r)}</option>`).join('');
  root.innerHTML = `<h3>Mô phỏng trận (Sobi Adventure)</h3>
    <p class="muted">Một đội đi trọn ba khu của một vùng nhiều lần bằng đúng luật đánh của game (đánh mọi nhóm, uống suối khi yếu, hạ kẻ canh khu rồi trùm); cùng seed cho cùng kết quả. Cây kỹ năng tự mở theo SP của cấp. Không lưu gì.</p>
    <div class="form-grid">
      <label class="field"><span>Vùng</span><select data-zone>${options(ZONE_LIST, form.zoneId)}</select></label>
      <label class="field"><span>Cấp của cả đội</span><input type="number" min="1" max="30" data-level value="${form.level}" /></label>
      <label class="field"><span>Trang bị</span><select data-gear>${GEAR_TIERS.map((g) => `<option value="${g}"${g === form.gear ? ' selected' : ''}>${esc(GEAR_LABEL[g])}</option>`).join('')}</select></label>
      ${Object.values(PREP_ITEMS).map((p) => `<label class="field"><span>Mang ${esc(vi.shop[p.itemId as ItemId] ?? p.itemId)}</span><input type="checkbox" data-prep="${p.itemId}"${form.prep.includes(p.itemId) ? ' checked' : ''} /></label>`).join('')}
      <label class="field"><span>Số chuyến</span><input type="number" min="1" max="2000" data-samples value="${form.samples}" /></label>
      <label class="field"><span>Random seed</span><input type="number" data-seed value="${form.seed}" /></label>
    </div>
    <div class="form-grid">${form.team
      .map((m, i) => `<label class="field"><span>Bạn ${i + 1}: dòng</span><select data-line="${i}">${options(LINEAGE_LIST, m.lineage)}</select></label>
        <label class="field"><span>Bạn ${i + 1}: class</span><select data-class="${i}">${options(CLASS_LIST, m.classId)}</select></label>
        <label class="field"><span>Bạn ${i + 1}: độ hiếm</span><select data-rarity="${i}">${rarityOptions(m.rarity)}</select></label>
        <label class="field"><span>Bạn ${i + 1}: tim (0–5)</span><input type="number" min="0" max="5" data-hearts="${i}" value="${m.hearts}" /></label>`)
      .join('')}</div>
    <div data-result>${run()}</div>`;
  const redo = () => {
    root.querySelector('[data-result]')!.innerHTML = run();
  };
  const num = (sel: string, min: number, max: number, set: (n: number) => void) =>
    root.querySelector<HTMLInputElement>(sel)!.addEventListener('change', (e) => {
      set(Math.max(min, Math.min(max, Number((e.target as HTMLInputElement).value) || 0)));
      redo();
    });
  const pick = (sel: string, set: (v: string) => void) =>
    root.querySelector<HTMLSelectElement>(sel)!.addEventListener('change', (e) => {
      set((e.target as HTMLSelectElement).value);
      redo();
    });
  pick('[data-zone]', (v) => (form.zoneId = v));
  pick('[data-gear]', (v) => (form.gear = v as GearTier));
  root.querySelectorAll<HTMLInputElement>('[data-prep]').forEach((box) =>
    box.addEventListener('change', () => {
      form.prep = [...root.querySelectorAll<HTMLInputElement>('[data-prep]')].filter((b) => b.checked).map((b) => b.dataset.prep!);
      redo();
    }),
  );
  num('[data-level]', 1, 30, (n) => (form.level = n));
  num('[data-samples]', 1, 2000, (n) => (form.samples = n));
  num('[data-seed]', 0, 2 ** 31, (n) => (form.seed = n));
  form.team.forEach((m, i) => {
    pick(`[data-line="${i}"]`, (v) => (m.lineage = v as LineageId));
    pick(`[data-class="${i}"]`, (v) => (m.classId = v as ClassId));
    pick(`[data-rarity="${i}"]`, (v) => (m.rarity = v));
    num(`[data-hearts="${i}"]`, 0, 5, (n) => (m.hearts = n));
  });
}
