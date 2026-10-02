// Breeding system page (DECISIONS BR-2): what the game actually runs — the rule numbers of
// breedingRules.ts, the named recipes with their real chance, the coverage audit and an odds
// explorer for any pair. Read-only: every number comes from src/core (no copy of the data).
import { BREEDING_RULES, MUTATIONS } from '../../src/core/config/breedingRules';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import type { BreedId } from '../../src/core/config/ids';
import { RARITY_VALUES, rarityRank } from '../../src/core/config/rarity';
import { breedingCoverage } from '../../src/core/engine/breedingCoverage';
import { breedingOutcomes, compatibility, rarityOdds } from '../../src/core/engine/breedingOdds';
import { RARITY_LABEL, esc, rarityBadge } from './labels';
import type { PigLook } from './breedMap';

const R = BREEDING_RULES;
const pct = (n: number) => `${Math.round(n * 10) / 10} %`;
const pair = { a: 'PIG_WHITE' as BreedId, b: 'PIG_BLACK' as BreedId };
let coverage: ReturnType<typeof breedingCoverage> | null = null;

/** Average child-rarity split of same-rarity parents (what "same rarity breeds true" means in numbers). */
function sameRarityStats() {
  return RARITY_VALUES.map((r) => {
    const ids = BREED_IDS.filter((id) => BREEDS[id].enabled && BREEDS[id].breedable && BREEDS[id].rarity === r);
    if (ids.length === 0) return { r, n: 0, same: 0, up: 0, down: 0 };
    const k = rarityRank(r);
    let same = 0, up = 0, down = 0, n = 0;
    for (const a of ids) for (const b of ids) {
      for (const [rank, p] of rarityOdds(a, b)) {
        if (rank === k) same += p;
        else if (rank > k) up += p;
        else down += p;
      }
      n++;
    }
    return { r, n: ids.length, same: same / n, up: up / n, down: down / n };
  });
}

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

function rulesHtml() {
  const S = R.RARITY_SAME, M = R.RARITY_MIXED, W = R.SPECIES;
  const stats = sameRarityStats().filter((s) => s.n > 0);
  return `<div class="rule-grid">
    <div class="panel"><h3>1 · Độ hiếm của con</h3>
      <p><b>Bố mẹ cùng độ hiếm:</b> tụt 1 bậc ${S.down} · giữ ${S.same} · lên 1 bậc ${S.up} · lên 2 bậc ${S.up2} (điểm tương đối).</p>
      <p><b>Khác độ hiếm:</b> bậc thấp ${M.low} · các bậc giữa ${M.between} · bậc cao ${M.high} · trên bậc cao ${M.above}.</p>
      <p>Phần "lên bậc" nhân ×${R.UP_SCALE.min}…×${R.UP_SCALE.max} theo độ hợp của cặp. Bậc không tồn tại bị bỏ, phần còn lại chia lại cho đủ 100 %.</p>
      <table class="table"><thead><tr><th>Bố mẹ cùng</th><th>Con cùng bậc</th><th>Lên bậc</th><th>Tụt bậc</th></tr></thead><tbody>
      ${stats.map((s) => `<tr><td>${rarityBadge(s.r)}</td><td><b>${pct(s.same)}</b></td><td>${pct(s.up)}</td><td>${pct(s.down)}</td></tr>`).join('')}
      </tbody></table><p class="muted">Cùng độ hiếm → con cùng bậc nhiều nhất nhưng không bao giờ 100 %; lên bậc vẫn có cơ hội (khám phá).</p></div>
    <div class="panel"><h3>2 · Loài của con (trong bậc đó)</h3>
      <p>Trọng số mỗi loài: là loài của bố/mẹ +${W.PARENT} · cùng nhóm +${W.FAMILY} · mỗi đặc điểm chung +${W.TRAIT} (tối đa ${W.TRAIT_CAP}) · nền ${W.BASE} cho mọi loài cùng bậc.</p>
      <p>Độ hợp cặp: nền ${R.COMPAT.base} · cùng nhóm +${R.COMPAT.sameFamily} · mỗi đặc điểm chung +${R.COMPAT.perSharedTrait} · lệch mỗi bậc −${R.COMPAT.perRarityGap} · có công thức +${R.COMPAT.recipe}.</p>
      <p>Sau đó <b>${MUTATIONS.length} công thức đột biến</b> cộng thêm điểm cho kết quả riêng; bảng ghi đè cặp (nếu bật) thay hẳn tỉ lệ của cặp đó.</p></div>
  </div>`;
}

function recipesHtml(look: PigLook) {
  return `<table class="table"><thead><tr><th>Bố / mẹ</th><th>Ra</th><th>Điểm cộng</th><th>Tỉ lệ thật</th></tr></thead><tbody>
    ${MUTATIONS.map((m) => {
      const real = breedingOutcomes(m.parents[0], m.parents[1])?.find((o) => o.breed === m.result)?.weight ?? 0;
      return `<tr><td>${esc(look.name(m.parents[0]))} × ${esc(look.name(m.parents[1]))}</td><td>${esc(look.name(m.result))} ${rarityBadge(BREEDS[m.result].rarity)}</td><td>+${m.weight}</td><td><b>${pct(real)}</b></td></tr>`;
    }).join('')}</tbody></table>`;
}

const parentOptions = (look: PigLook, cur: BreedId) =>
  RARITY_VALUES.map((r) => {
    const ids = BREED_IDS.filter((id) => BREEDS[id].enabled && BREEDS[id].breedable && BREEDS[id].rarity === r);
    return ids.length ? `<optgroup label="${esc(RARITY_LABEL[r] ?? r)}">${ids.map((id) => `<option value="${id}"${id === cur ? ' selected' : ''}>${esc(look.name(id))}</option>`).join('')}</optgroup>` : '';
  }).join('');

function oddsHtml(look: PigLook) {
  const out = breedingOutcomes(pair.a, pair.b) ?? [];
  const hearts = Math.round(compatibility(pair.a, pair.b) * 5);
  return `<p>Độ hợp: ${'♥'.repeat(hearts)}${'♡'.repeat(5 - hearts)} · ${out.length} kết quả có thể ra</p>
    <ul class="odds">${out.slice(0, 15).map((o) => `<li>${look.img(o.breed) ? `<img class="thumb" src="${esc(look.img(o.breed)!)}" alt="" loading="lazy" />` : ''}<span>${esc(look.name(o.breed))}</span>
      ${rarityBadge(BREEDS[o.breed].rarity)}<span class="odds__bar"><i style="width:${Math.min(100, o.weight)}%"></i></span><b>${pct(o.weight)}</b></li>`).join('')}</ul>
    ${out.length > 15 ? `<p class="muted">… và ${out.length - 15} loài khác, tổng ${pct(out.slice(15).reduce((s, o) => s + o.weight, 0))}</p>` : ''}`;
}

export function renderBreedRules(root: HTMLElement, look: PigLook) {
  root.innerHTML = `
    <h3>Kiểm tra dữ liệu lai</h3>${auditHtml()}
    <h3>Luật đang chạy trong game</h3>${rulesHtml()}
    <h3>Thử một cặp</h3>
    <div class="form-grid"><label class="field"><span>Heo A</span><select data-a>${parentOptions(look, pair.a)}</select></label>
      <label class="field"><span>Heo B</span><select data-b>${parentOptions(look, pair.b)}</select></label></div>
    <div data-odds>${oddsHtml(look)}</div>
    <h3>Công thức đột biến (${MUTATIONS.length})</h3>${recipesHtml(look)}`;
  const update = () => {
    pair.a = root.querySelector<HTMLSelectElement>('[data-a]')!.value as BreedId;
    pair.b = root.querySelector<HTMLSelectElement>('[data-b]')!.value as BreedId;
    root.querySelector('[data-odds]')!.innerHTML = oddsHtml(look);
  };
  root.querySelector('[data-a]')!.addEventListener('change', update);
  root.querySelector('[data-b]')!.addEventListener('change', update);
}
