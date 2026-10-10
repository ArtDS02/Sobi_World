// Admin "Mô phỏng trận" (GĐ10): a party of fighting styles at a level and a tier of gear plays a zone N times through the
// game's own battle rules, with the AI choosing, and the page reads the win rate and how far the runs get. Nothing is saved;
// the enemies, skills, zones and loot are edited under "Số liệu" (content/adventure/*.json) and tried here right after.
import { simulateRuns, GEAR_TIERS, type GearTier, type SimResult } from '../../src/areas/adventure/logic/battleSim';
import { ARCHETYPE_LIST, ZONE_LIST, ZONES } from '../../src/areas/adventure/logic/config/content';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { RARITY_LABEL, esc } from './labels';

interface Form {
  zoneId: string;
  level: number;
  gear: GearTier;
  team: { archetypeId: string; rarity: string; hearts: number }[];
  samples: number;
  seed: number;
}

const form: Form = {
  zoneId: ZONE_LIST[0]!.id,
  level: 5,
  gear: 'none',
  team: [
    { archetypeId: 'bruiser', rarity: 'COMMON', hearts: 0 },
    { archetypeId: 'guardian', rarity: 'COMMON', hearts: 0 },
    { archetypeId: 'mystic', rarity: 'COMMON', hearts: 0 },
  ],
  samples: 100,
  seed: 2024,
};

const GEAR_LABEL: Record<GearTier, string> = { none: 'Không trang bị', common: 'Trang bị thường', uncommon: 'Trang bị khá', rare: 'Trang bị hiếm' };
const pct = (n: number) => `${n.toLocaleString('vi-VN')}%`;

function resultHtml(r: SimResult): string {
  const zone = ZONES[form.zoneId]!;
  return `<div class="stat-row">
      <div><b>${pct(r.winPercent)}</b><span class="muted"> thắng cả vùng (hạ trùm) trong ${r.samples} lượt</span></div>
      <div><b>${r.averageRounds.toLocaleString('vi-VN')}</b><span class="muted"> vòng mỗi trận đánh (trận quá dài làm người chơi chán)</span></div>
      <div><b>${pct(r.averageHpLeft)}</b><span class="muted"> máu còn lại của đội khi thắng</span></div>
    </div>
    <h4>Đi tới điểm dừng</h4>
    <ul class="odds">${zone.nodes
      .map((n, i) => `<li><span>${i + 1}. ${esc(({ battle: 'Trận đánh', chest: 'Rương', event: 'Sự kiện', boss: 'Trùm' } as const)[n.type])}</span><span class="odds__bar"><i style="width:${Math.min(100, r.reachedPercent[i] ?? 0)}%"></i></span><b>${pct(r.reachedPercent[i] ?? 0)}</b></li>`)
      .join('')}</ul>`;
}

function run(): string {
  return resultHtml(simulateRuns({ zoneId: form.zoneId, level: form.level, team: form.team, gear: form.gear, samples: form.samples, seed: form.seed }));
}

export function renderAdventure(root: HTMLElement) {
  const archetypeOptions = (cur: string) => ARCHETYPE_LIST.map((a) => `<option value="${a.id}"${a.id === cur ? ' selected' : ''}>${esc(a.nameVi)} (${a.element})</option>`).join('');
  const rarityOptions = (cur: string) => RARITY_VALUES.map((r) => `<option value="${r}"${r === cur ? ' selected' : ''}>${esc(RARITY_LABEL[r] ?? r)}</option>`).join('');
  root.innerHTML = `<h3>Mô phỏng trận (Sobi Adventure)</h3>
    <p class="muted">Một đội chơi trọn một vùng nhiều lần bằng đúng luật đánh của game; cùng seed cho cùng kết quả. Dùng để xem tỉ lệ thắng sau khi sửa kẻ địch, kỹ năng, vùng ở "Số liệu". Không lưu gì.</p>
    <div class="form-grid">
      <label class="field"><span>Vùng</span><select data-zone>${ZONE_LIST.map((z) => `<option value="${z.id}"${z.id === form.zoneId ? ' selected' : ''}>${esc(z.nameVi)}</option>`).join('')}</select></label>
      <label class="field"><span>Cấp của cả đội</span><input type="number" min="1" max="30" data-level value="${form.level}" /></label>
      <label class="field"><span>Trang bị</span><select data-gear>${GEAR_TIERS.map((g) => `<option value="${g}"${g === form.gear ? ' selected' : ''}>${esc(GEAR_LABEL[g])}</option>`).join('')}</select></label>
      <label class="field"><span>Số lượt chơi</span><input type="number" min="1" max="5000" data-samples value="${form.samples}" /></label>
      <label class="field"><span>Random seed</span><input type="number" data-seed value="${form.seed}" /></label>
    </div>
    <div class="form-grid">${form.team
      .map((m, i) => `<label class="field"><span>Bạn ${i + 1}: kiểu đánh</span><select data-style="${i}">${archetypeOptions(m.archetypeId)}</select></label>
        <label class="field"><span>Bạn ${i + 1}: độ hiếm</span><select data-rarity="${i}">${rarityOptions(m.rarity)}</select></label>
        <label class="field"><span>Bạn ${i + 1}: tim thân thiết (0–5)</span><input type="number" min="0" max="5" data-hearts="${i}" value="${m.hearts}" /></label>`)
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
  root.querySelector<HTMLSelectElement>('[data-zone]')!.addEventListener('change', (e) => { form.zoneId = (e.target as HTMLSelectElement).value; redo(); });
  root.querySelector<HTMLSelectElement>('[data-gear]')!.addEventListener('change', (e) => { form.gear = (e.target as HTMLSelectElement).value as GearTier; redo(); });
  num('[data-level]', 1, 30, (n) => (form.level = n));
  num('[data-samples]', 1, 5000, (n) => (form.samples = n));
  num('[data-seed]', 0, 2 ** 31, (n) => (form.seed = n));
  form.team.forEach((m, i) => {
    root.querySelector<HTMLSelectElement>(`[data-style="${i}"]`)!.addEventListener('change', (e) => { m.archetypeId = (e.target as HTMLSelectElement).value; redo(); });
    root.querySelector<HTMLSelectElement>(`[data-rarity="${i}"]`)!.addEventListener('change', (e) => { m.rarity = (e.target as HTMLSelectElement).value; redo(); });
    num(`[data-hearts="${i}"]`, 0, 5, (n) => (m.hearts = n));
  });
}
