// Admin page "Số liệu": every number of the files that tune the world — time, health, valuation,
// quality, the farm's balance — as a labelled field. Only numbers can change; the server checks that
// and validates with the game's schema before writing. Times are shown as given (milliseconds or
// seconds, see the unit in the label).
import { esc } from './labels';
import { json, rememberMessage } from './store';

type Files = Record<string, unknown>;

const FILE_TITLE: Record<string, string> = {
  'shared/time.json': '🕒 Thời gian (buổi trong ngày, bước mô phỏng, trần offline)',
  'shared/health.json': '🩺 Sức khỏe (bệnh, nguy kịch, chết, ân hạn, bảo vệ người mới)',
  'shared/valuation.json': '💰 Giá trị (cân nặng, phạt bệnh, chợ theo ngày)',
  'shared/quality.json': '⭐ Chất lượng (ngưỡng tâm trạng, hệ số giá)',
  'shared/inventory.json': '🎒 Túi đồ chung',
  'farm/balance.json': '🐷 Cân bằng Nông trại',
  'garden/crops.json': '🌱 Cây trồng (giờ lớn, sản lượng)',
  'garden/balance.json': '🥕 Cân bằng Sobi Garden (ô đất, tưới, héo, công trình)',
  'shared/recipes.json': '⚙️ Recipe (nguyên liệu, thành phẩm, thời gian)',
  'shared/items.json': '📦 Vật phẩm (giá mua, giá bán, độ no)',
  'shared/progression.json': '📈 Cấp Sobi World (KN từng cấp) và Phát triển thế giới',
  'shared/bond.json': '💕 Thân thiết (vuốt ve, món yêu thích, tâm trạng món ăn vặt)',
  'shared/orders.json': '📋 Bảng đơn hàng (ô, thời gian, thưởng, vật phẩm được đặt)',
  'shared/goals.json': '🎯 Mục tiêu hằng ngày (mẫu, thưởng, bonus)',
  'shared/achievements.json': '🏆 Thành tựu (đích, Ngọc, KN)',
  'shared/codex.json': '📖 Codex (thưởng khám phá, mốc sưu tầm)',
  'farm/decor.json': '🌻 Trang trí (giá, cấp mở, vui vẻ, số chỗ đặt)',
  'shared/npcs.json': '💬 NPC hướng dẫn (lời của từng NPC; sửa được cả chữ)',
  'aquarium/fish.json': '🐟 Loài cá (giờ lớn, giá, độ hay cắn câu, vảy; sửa được cả tên và mô tả)',
  'aquarium/balance.json': '🪣 Cân bằng Sobi Aquarium (bể, nước, cá, cần câu, đẻ trứng)',
  'breeding/traits.json': '🧬 Tính trạng (hiệu ứng, trọng số; sửa được cả tên và mô tả)',
  'breeding/balance.json': '🍀 Lai giống nâng cao (di truyền, đột biến, vận may, phả hệ)',
  'breeding/rumors.json': '🗣️ Tin đồn của Nhà lai giống (câu mẫu; sửa được chữ)',
};

/** Files whose words can be edited as well (the server allows it for the same files). */
const TEXT_FILES = new Set(['shared/npcs.json', 'breeding/traits.json', 'breeding/rumors.json', 'aquarium/fish.json']);

/** Same rule as the server (scripts/admin/numbers.ts isWordPath). */
const isWordPath = (path: string): boolean =>
  /Vi$/.test(path) || /^(recipeTemplates|noNews|tips)\[\d+\]$/.test(path) || /^rarityWords\.[A-Z]+$/.test(path);

/** Friendly names by the last part(s) of a path; the rest show their key. */
const LABEL: Record<string, string> = {
  stepMs: 'Bước mô phỏng (ms)',
  'stepMs.online': 'Khi đang chơi (ms)',
  'stepMs.offline': 'Khi bù offline (ms)',
  offlineMaxMs: 'Bù offline tối đa (ms)',
  rewindToleranceMs: 'Dung sai giờ máy lùi (ms)',
  fromHour: 'Bắt đầu lúc (giờ)',
  'perHour.starving': 'Nguy cơ bệnh mỗi giờ khi đói 0 (0–1)',
  'perHour.dirty': 'Nguy cơ bệnh mỗi giờ khi bẩn (0–1)',
  'perHour.lowMood': 'Nguy cơ bệnh mỗi giờ khi tâm trạng thấp (0–1)',
  dirtyBelow: 'Bẩn khi sạch sẽ dưới',
  lowMoodBelow: 'Tâm trạng thấp khi dưới',
  criticalAfterMs: 'Bệnh bao lâu thì nguy kịch (ms)',
  deathAfterMs: 'Bệnh bao lâu thì chết (ms)',
  deathGraceMs: 'Ân hạn sau khi bù offline (ms)',
  newPlayerProtectionMs: 'Bảo vệ người mới, không bệnh (ms)',
  weightCap: 'Hệ số cân nặng tối đa',
  'up.count': 'Số nhóm hàng được giá mỗi ngày',
  'up.factor': 'Hệ số nhóm được giá',
  'down.count': 'Số nhóm hàng rớt giá mỗi ngày',
  'down.factor': 'Hệ số nhóm rớt giá',
  maxBond: 'Thân thiết tối đa (5 tim)',
  perHeart: 'Thân thiết mỗi tim',
  'pet.gain': 'Vuốt ve: thân thiết nhận được',
  'pet.perDay': 'Vuốt ve: số lần mỗi ngày mỗi heo',
  'favorite.gain': 'Món yêu thích: thân thiết nhận được',
  'favorite.hunger': 'Món yêu thích: độ no hồi lại',
  'care.gain': 'Cho thuốc khi bệnh: thân thiết nhận được',
  'moodBoost.hours': 'Món ăn vặt nâng tâm trạng bao nhiêu giờ',
  'petPurpose.perPet': 'Mỗi thú cưng cộng vui vẻ cho cả chuồng',
  'petPurpose.max': 'Cộng vui vẻ tối đa từ thú cưng',
  fromWorldDevelopment: 'Từ Phát triển thế giới',
  count: 'Số ô / số mục tiêu',
  spawnEveryMs: 'Bao lâu có một đơn mới (ms)',
  rewardMultiplier: 'Thưởng = giá trị vật phẩm x',
  'xp.coinsPerXp': 'Bao nhiêu Sobi Coin thưởng thì được 1 KN',
  'bonus.chance': 'Cơ hội kèm vật phẩm thưởng (0–1)',
  'bonus.quantity': 'Số vật phẩm thưởng kèm',
  rerollGems: 'Giá đổi đơn (Ngọc)',
  fromWorldLevel: 'Từ cấp Sobi World',
  max: 'Tối đa',
  min: 'Tối thiểu',
  coins: 'Thưởng Sobi Coin',
  'bonus.coins': 'Xong cả 3 mục tiêu: Sobi Coin',
  'bonus.xp': 'Xong cả 3 mục tiêu: KN',
  gems: 'Thưởng Ngọc',
  target: 'Đích cần đạt',
  entries: 'Số mục khám phá',
  spots: 'Số chỗ đặt được',
  unlockLevel: 'Cấp Sobi World để mua',
  happyBonus: 'Vui vẻ cộng cho cả chuồng',
  maxLevel: 'Cấp tối đa',
  'worldLevel.xp': 'KN cần cho cấp tiếp theo',
  'worldDevelopment.perWorldLevel': 'Phát triển thế giới: mỗi cấp được',
  'worldDevelopment.codexEntriesPerPoint': 'Phát triển thế giới: mỗi bao nhiêu mục Codex được 1',
  'worldDevelopment.perBuildingLv3': 'Phát triển thế giới: mỗi công trình Lv3',
  nameVi: 'Tên',
  greetingVi: 'Lời chào',
  titleVi: 'Tên chủ đề',
  textVi: 'Lời giải thích',
  'healthPenalty.perDay': 'Giảm giá mỗi ngày bệnh (0–1)',
  'healthPenalty.floor': 'Hệ số sức khỏe thấp nhất (0–1)',
  factor: 'Hệ số chợ',
  weight: 'Tỉ trọng (độ hay gặp)',
  HUNGER_PER_HOUR: 'Đói mất mỗi giờ',
  CLEAN_PER_HOUR: 'Sạch mất mỗi giờ',
  CLEAN_PER_PILE_PER_HOUR: 'Sạch mất thêm mỗi giờ cho mỗi đống phân',
  CLEAN_PILES_COUNTED: 'Số đống phân tối đa được tính',
  ENERGY_AWAKE_PER_HOUR: 'Năng lượng mất mỗi giờ khi thức',
  ENERGY_ASLEEP_PER_HOUR: 'Năng lượng hồi mỗi giờ khi ngủ',
  GROWTH_MIN_HUNGER: 'Chỉ lớn khi đói trên',
  POOP_INTERVAL_SEC: 'Bao lâu một đống phân (giây)',
  MANURE_MAX: 'Số đống phân tối đa trong chuồng',
  STAGE_YOUNG_AT: 'Heo choai từ (% lớn)',
  STAGE_ADULT_AT: 'Heo lớn (xuất chuồng được) từ (% lớn)',
  TROUGH_AUTO_FEED_AT: 'Máng tự cho ăn khi đói dưới',
  SICK_RECOVERY_SEC: 'Miễn bệnh sau khi uống thuốc (giây)',
  SICK_MAX_EPISODES_PER_DAY: 'Số lần bệnh tối đa mỗi ngày',
  growHours: 'Giờ lớn (khi đủ nước)',
  yield: 'Sản lượng mỗi lần thu',
  startPlots: 'Số ô đất ban đầu',
  'plotExpansions.plots': 'Mở lên tổng số ô',
  'plotExpansions.price': 'Giá mở ô',
  dryGrowthRate: 'Tốc độ lớn khi khô (0–1)',
  waterHours: 'Tưới có tác dụng bao nhiêu giờ',
  'fertilizer.timeFactor': 'Phân bón: hệ số thời gian (0,75 = nhanh 25%)',
  'fertilizer.bonusYield': 'Phân bón: thêm sản lượng',
  witherAfterHours: 'Chín bao lâu thì héo (giờ)',
  witherYieldFactor: 'Sản lượng khi héo (0–1)',
  'sprinkler.plots': 'Vòi tưới: số ô đầu được tưới',
  'sprinkler.price': 'Vòi tưới: giá cấp này',
  'mill.price': 'Giá xây Máy xay',
  'composter.price': 'Giá xây Thùng ủ',
  maxBatches: 'Số mẻ tối đa mỗi lần',
  'xp.plant': 'KN khi gieo',
  'xp.water': 'KN khi tưới',
  'xp.harvest': 'KN khi thu hoạch',
  'xp.craft': 'KN mỗi mẻ chế biến',
  'xp.fertilize': 'KN khi bón phân',
  'levels.xp': 'KN cần cho cấp tiếp theo',
  'levels.maxLevel': 'Cấp tối đa',
  durationMin: 'Thời gian một mẻ (phút)',
  priceGold: 'Giá mua (Sobi Coin)',
  sellGold: 'Giá bán (Sobi Coin)',
  hungerRestore: 'Độ no hồi lại',
  capacity: 'Sức chứa',
  cost: 'Giá nâng cấp',
  slots: 'Số ô',
  stack: 'Số lượng mỗi ô',
  // Sobi Aquarium (GĐ8)
  tankGold: 'Giá bán cá lớn trong bể (Sobi Coin)',
  catchWeight: 'Độ hay cắn câu (tỉ trọng; 0 = không câu được)',
  scaleHours: 'Bao nhiêu giờ rụng một vảy (khi lớn hẳn)',
  'start.feed': 'Thức ăn cá tặng khi mở khu',
  'levels.price': 'Giá nâng bể lên cấp này',
  'levels.waterFactor': 'Nước đục chậm hơn: giữ bao nhiêu phần (0–1)',
  'materials.item_scale': 'Vật liệu: vảy cá',
  'materials.item_pearl': 'Vật liệu: ngọc trai',
  'tank.waterPerHour': 'Nước mất độ trong mỗi giờ (cơ bản)',
  'tank.waterPerFishPerHour': 'Nước mất thêm mỗi giờ cho mỗi con cá',
  'tank.scalesPerSlot': 'Vảy chờ thu tối đa cho mỗi chỗ trong bể',
  'life.hungerPerHour': 'Cá đói mất mỗi giờ',
  'life.growthMinHunger': 'Cá chỉ lớn khi no trên',
  'life.stageYoungAt': 'Cá choai từ (% lớn)',
  'life.stageAdultAt': 'Cá lớn (bán được) từ (% lớn)',
  'life.caughtProgress': 'Cá câu được thả vào bể: đã lớn bao nhiêu (%)',
  'life.recoverHours': 'Miễn bệnh sau khi uống thuốc (giờ)',
  'life.sickMaxPerDay': 'Số lần bệnh tối đa mỗi ngày',
  'life.nameMax': 'Tên cá dài tối đa (ký tự)',
  'fishing.cooldownSec': 'Cần câu nghỉ giữa hai lần (giây)',
  'fishing.missBelow': 'Điểm giật cần dưới mức này thì cá tuột (0–1)',
  'fishing.scoreLuck': 'Điểm cao gặp cá hiếm hơn (hệ số)',
  'fishing.missCooldownShare': 'Cá tuột: chỉ nghỉ bấy nhiêu phần thời gian chờ (0–1)',
  'oyster.weight': 'Trai ngọc: độ hay gặp',
  'breeding.cooldownHours': 'Đôi cá nghỉ giữa hai lần đẻ (giờ)',
  'breeding.eggHours': 'Trứng nở sau (giờ)',
  'breeding.maxEggs': 'Số trứng tối đa trong bể',
  'breeding.minHunger': 'Cá phải no trên mức này mới đẻ',
  'breeding.feed': 'Thức ăn cá tốn mỗi lần đẻ',
  'sell.minShare': 'Cá vừa tới cỡ bán được: bán được bao nhiêu phần giá (0–1)',
  'xp.feed': 'KN khi cho cá ăn',
  'xp.clean': 'KN khi thay nước',
  'xp.catch': 'KN khi câu được',
  'xp.release': 'KN khi thả cá vào bể',
  'xp.pet': 'KN khi vuốt ve cá',
  'xp.sell': 'KN khi bán cá',
  'xp.breed': 'KN khi cho cá đẻ',
  'xp.treat': 'KN khi chữa cá',
  'xp.collect': 'KN khi thu vảy',
  'xp.upgrade': 'KN khi nâng bể',
  // Advanced breeding (GĐ7)
  maxTraits: 'Số tính trạng tối đa mỗi con (cả tính trạng ẩn)',
  inheritChance: 'Mỗi tính trạng của mỗi bố/mẹ truyền cho con (%)',
  newTraitChance: 'Cơ hội xuất hiện thêm một tính trạng thường mới (%)',
  hiddenChance: 'Cơ hội tính trạng hiếm bị ẩn (%)',
  'mutation.base': 'Đột biến cơ bản (%)',
  'mutation.epicShare': 'Trong đột biến, tỉ lệ ra tính trạng Sử thi (%)',
  'mutation.cap': 'Đột biến tối đa, dù có cộng thêm (%)',
  'pity.step': 'Vận may: cộng thêm sau mỗi lần trượt Rare+ (điểm %)',
  'pity.cap': 'Vận may tối đa (điểm %)',
  lineageDepth: 'Số đời tổ tiên giữ trong phả hệ',
  'rumors.perDay': 'Số tin đồn mỗi ngày (tin cuối là mẹo)',
  'effects.growth': 'Hiệu ứng: tốc độ lớn (x)',
  'effects.sellValue': 'Hiệu ứng: giá xuất chuồng (x)',
  'effects.bondGain': 'Hiệu ứng: thân thiết nhận được (x)',
  'effects.mutation': 'Hiệu ứng: cộng đột biến (điểm %)',
  descVi: 'Mô tả',
  recipeTemplates: 'Câu tin đồn công thức',
  noNews: 'Câu khi hết tin',
  tips: 'Mẹo',
};

interface Leaf {
  path: string;
  value: number | string;
  /** The id or name of the row the number belongs to (a crop, an item, a recipe). */
  owner: string;
}

function leaves(value: unknown, texts: boolean, path = '', owner = ''): Leaf[] {
  if (typeof value === 'number') return [{ path, value, owner }];
  if (texts && typeof value === 'string' && isWordPath(path)) return [{ path, value, owner }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, texts, `${path}[${i}]`, owner));
  if (value && typeof value === 'object') {
    const row = value as { id?: unknown; itemId?: unknown; nameVi?: unknown };
    const own = typeof row.id === 'string' ? row.id : typeof row.itemId === 'string' ? row.itemId : typeof row.nameVi === 'string' ? row.nameVi : owner;
    return Object.entries(value).flatMap(([k, v]) => leaves(v, texts, path ? `${path}.${k}` : k, own));
  }
  return [];
}

function labelOf(path: string): string {
  const index = (path.match(/\[\d+\]/g) ?? []).join('');
  const parts = path.replace(/\[\d+\]/g, '').split('.');
  for (let n = Math.min(2, parts.length); n >= 1; n--) {
    const hit = LABEL[parts.slice(-n).join('.')];
    if (hit) return index ? `${hit} ${index}` : hit;
  }
  return path;
}

/** `value` with the number at `path` replaced (a deep copy). */
function setAt(value: unknown, path: string, n: number | string): unknown {
  const copy = structuredClone(value) as Record<string, unknown>;
  const keys = path.split(/\.|\[|\]/).filter(Boolean);
  let at: Record<string, unknown> = copy;
  for (const k of keys.slice(0, -1)) at = at[k] as Record<string, unknown>;
  at[keys[keys.length - 1]!] = n;
  return copy;
}

const page = { files: null as Files | null, message: null as { kind: 'ok' | 'error'; text: string } | null };

export function renderNumbers(root: HTMLElement, apiOnline: boolean, rerender: () => void) {
  if (!page.files) {
    root.innerHTML = '<p class="loading">Đang tải số liệu…</p>';
    json<{ files: Files }>('/__admin/numbers').then(
      (r) => {
        page.files = r.files;
        rerender();
      },
      (e: unknown) => (root.innerHTML = `<p class="empty">Không tải được: ${esc((e as Error).message)}</p>`),
    );
    return;
  }
  const files = page.files;
  const msg = page.message ? `<div class="toast ${page.message.kind}"><pre>${esc(page.message.text)}</pre></div>` : '';
  root.innerHTML = `${msg}<p class="muted">Chỉ sửa được con số; server kiểm tra bằng đúng schema của game trước khi ghi vào <code>content/</code>. Game đọc ngay lần chạy sau.</p>
    ${Object.entries(files)
      .map(
        ([file, value]) => `<form class="panel tab-form" data-file="${esc(file)}"><h3>${esc(FILE_TITLE[file] ?? file)}</h3>
        <div class="form-grid">${leaves(value, TEXT_FILES.has(file))
          .map(
            (l) => `<label class="field${typeof l.value === 'string' ? ' span-2' : ''}"><span>${esc(l.owner ? `${l.owner}: ${labelOf(l.path)}` : labelOf(l.path))}</span>
              ${typeof l.value === 'string' ? `<textarea name="${esc(l.path)}" data-text="1" rows="2">${esc(l.value)}</textarea>` : `<input type="number" step="any" name="${esc(l.path)}" value="${l.value}" />`}<small class="muted">${esc(l.path)}</small></label>`,
          )
          .join('')}</div>
        <div class="form-actions"><button class="btn btn-primary" ${apiOnline ? '' : 'disabled title="Chạy npm run admin để lưu"'}>💾 Lưu ${esc(file)}</button></div></form>`,
      )
      .join('')}`;
  root.querySelectorAll<HTMLFormElement>('form[data-file]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const file = f.dataset.file!;
      let value: unknown = files[file];
      for (const input of f.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[name], textarea[name]')) {
        value = setAt(value, input.name, input instanceof HTMLTextAreaElement ? input.value : Number(input.value));
      }
      json('/__admin/numbers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file, value }) }).then(
        () => {
          files[file] = value;
          page.message = { kind: 'ok', text: `Đã lưu ${file}` };
          rememberMessage(`Đã lưu ${file}`);
          rerender();
        },
        (err: unknown) => {
          page.message = { kind: 'error', text: (err as Error).message };
          rerender();
        },
      );
    }),
  );
}
