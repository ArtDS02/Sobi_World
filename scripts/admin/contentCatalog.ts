// The content files the admin dashboard edits in "Nội dung game" (decision 036): every file of content/ with the
// schema that validates it, grouped by Area. Pure data shared by the dev API (scripts/admin/contentSave.ts) and the
// dashboard (tools/admin/contentPage.ts). Files with a page of their own (species, shop, breeding pairs, layouts,
// day / night, seasonal FX) are listed with that page instead: their extra rules (art, odds, placements) live there.

export type ContentGroup = 'world' | 'economy' | 'farm' | 'garden' | 'aquarium' | 'cloud' | 'adventure' | 'breeding' | 'live';

export const CONTENT_GROUPS: readonly (readonly [ContentGroup, string])[] = [
  ['world', '🌍 Thế giới chung'],
  ['economy', '🎒 Vật phẩm & kinh tế'],
  ['farm', '🐷 Sobi Farm'],
  ['garden', '🌱 Sobi Garden'],
  ['aquarium', '🐟 Sobi Aquarium'],
  ['cloud', '☁️ Sobi Cloud'],
  ['adventure', '⚔️ Sobi Adventure'],
  ['breeding', '🧬 Lai giống nâng cao'],
  ['live', '🎪 Thế giới sống'],
];

export interface ContentFileDef {
  file: string;
  group: ContentGroup;
  icon: string;
  title: string;
  hint: string;
  /** The schema module (Vite path) and its export; absent when `page` edits the file. */
  schemaPath?: string;
  exportName?: string;
  /** Dashboard route of the dedicated page that edits this file. */
  page?: string;
}

const s = (dir: string, name: string) => `/content/schemas/${dir}/${name}.ts`;
const def = (file: string, group: ContentGroup, icon: string, title: string, hint: string, schemaPath: string, exportName: string): ContentFileDef => ({
  file, group, icon, title, hint, schemaPath, exportName,
});
const page = (file: string, group: ContentGroup, icon: string, title: string, hint: string, route: string): ContentFileDef => ({
  file, group, icon, title, hint, page: route,
});

export const CONTENT_FILES: readonly ContentFileDef[] = [
  def('shared/time.json', 'world', '🕒', 'Thời gian', 'Buổi trong ngày, bước mô phỏng, trần bù offline', s('shared', 'time'), 'timeFileSchema'),
  def('shared/health.json', 'world', '🩺', 'Sức khỏe', 'Bệnh, nguy kịch, chết, ân hạn, bảo vệ người mới', s('shared', 'health'), 'healthFileSchema'),
  def('shared/progression.json', 'world', '📈', 'Cấp Sobi World', 'KN từng cấp, Phát triển thế giới', s('shared', 'progression'), 'progressionFileSchema'),
  def('shared/bond.json', 'world', '💕', 'Thân thiết', 'Vuốt ve, món yêu thích, món ăn vặt', s('shared', 'bond'), 'bondFileSchema'),
  def('shared/quality.json', 'world', '⭐', 'Chất lượng', 'Ngưỡng tâm trạng, hệ số giá', s('shared', 'quality'), 'qualityFileSchema'),
  def('shared/orders.json', 'world', '📋', 'Bảng đơn hàng', 'Ô, thời gian, thưởng, vật phẩm được đặt', s('shared', 'orders'), 'ordersFileSchema'),
  def('shared/goals.json', 'world', '🎯', 'Mục tiêu hằng ngày', 'Mẫu mục tiêu, thưởng, bonus', s('shared', 'goals'), 'goalsFileSchema'),
  def('shared/achievements.json', 'world', '🏆', 'Thành tựu', 'Đích, Ngọc, KN; tên hiển thị', s('shared', 'achievements'), 'achievementsFileSchema'),
  def('shared/codex.json', 'world', '📖', 'Codex', 'Thưởng khám phá, mốc sưu tầm', s('shared', 'codex'), 'codexFileSchema'),
  def('shared/daily.json', 'world', '🎁', 'Quà đăng nhập', 'Phần quà 7 ngày, KN', s('shared', 'daily'), 'dailyFileSchema'),
  def('shared/npcs.json', 'world', '💬', 'NPC', 'Lời chào, lời giải thích của từng NPC', s('shared', 'npcs'), 'npcsFileSchema'),
  def('shared/character.json', 'world', '🧒', 'Nhân vật', 'So & Bi: tốc độ, kích thước, khung hình', s('shared', 'character'), 'characterFileSchema'),
  page('shared/daynight.json', 'world', '🌗', 'Ngày / Đêm', 'Trang riêng: xem trước màu trời', '#/daynight'),
  page('plaza/layout.json', 'world', '🏛️', 'Bố cục Sảnh', 'Trang riêng: kéo thả trên cảnh', '#/layout'),

  def('shared/items.json', 'economy', '📦', 'Vật phẩm', 'Mọi vật phẩm của túi chung: loại, độ hiếm, giá, công dụng, tên', s('shared', 'items'), 'itemsFileSchema'),
  def('shared/recipes.json', 'economy', '⚙️', 'Công thức chế biến', 'Nguyên liệu, thành phẩm, thời gian (Máy xay, Thùng ủ, Vạc nấu)', s('shared', 'recipes'), 'recipesFileSchema'),
  def('shared/inventory.json', 'economy', '🎒', 'Túi đồ', 'Số ô, số lượng mỗi ô', s('shared', 'inventory'), 'inventoryFileSchema'),
  def('shared/valuation.json', 'economy', '💰', 'Giá trị', 'Cân nặng, phạt bệnh, chợ theo ngày', s('shared', 'valuation'), 'valuationFileSchema'),
  def('shared/tech.json', 'economy', '🔧', 'Công nghệ', 'Giá từng cấp, hiệu quả, tên, mô tả', s('shared', 'tech'), 'techFileSchema'),
  page('shared/shop.json', 'economy', '🛒', 'Cửa hàng Farm', 'Trang riêng: gói hàng, giá, thứ tự', '#/products'),

  def('farm/balance.json', 'farm', '🐷', 'Cân bằng Nông trại', 'Đói, sạch, năng lượng, lớn, phân, máng, chuồng', s('farm', 'balance'), 'farmBalanceFileSchema'),
  def('farm/decor.json', 'farm', '🌻', 'Trang trí', 'Giá, cấp mở, vui vẻ, chỗ đặt; tên hiển thị', s('farm', 'decor'), 'decorFileSchema'),
  def('farm/gifts.json', 'farm', '🎀', 'Hộp quà', 'Nhịp xuất hiện, giá trị quà', s('farm', 'gifts'), 'giftsFileSchema'),
  def('farm/behavior.json', 'farm', '💤', 'Hành vi heo', 'Nhu cầu, tự ăn, ngủ, đi lại', s('farm', 'behavior'), 'behaviorFileSchema'),
  def('farm/names.json', 'farm', '🏷️', 'Tên heo ngẫu nhiên', 'Danh sách tên đặt cho heo con', s('farm', 'names'), 'namesFileSchema'),
  def('farm/area.json', 'farm', '🚪', 'Khu Farm', 'Điều kiện mở, công trình, sản phẩm', '/content/schemas/area.ts', 'areaManifestSchema'),
  page('farm/species.json', 'farm', '🐖', 'Giống heo', 'Trang riêng: ảnh, độ hiếm, giá, chỉ số', '#/pigs'),
  page('farm/breeding.json', 'farm', '🧬', 'Phối giống heo', 'Trang riêng: luật cặp, di truyền, công thức', '#/breeding'),
  page('farm/layout.json', 'farm', '🗺️', 'Bố cục nông trại', 'Trang riêng: kéo thả trên cảnh', '#/layout'),
  page('farm/season-fx.json', 'farm', '🍂', 'Mùa & hiệu ứng', 'Trang riêng: hiệu ứng theo mùa', '#/seasons'),

  def('garden/crops.json', 'garden', '🌱', 'Cây trồng', 'Giờ lớn, sản lượng, tên', s('garden', 'crops'), 'cropsFileSchema'),
  def('garden/balance.json', 'garden', '🥕', 'Cân bằng Garden', 'Ô đất, khu, tưới, héo, công trình, cửa hàng', s('garden', 'balance'), 'gardenBalanceFileSchema'),
  def('garden/hybrids.json', 'garden', '🧪', 'Lai giống cây', 'Công thức lai, tỉ lệ, phí lab', s('shared', 'hybrids'), 'hybridsFileSchema'),
  def('garden/area.json', 'garden', '🚪', 'Khu Garden', 'Điều kiện mở, công trình, sản phẩm', '/content/schemas/area.ts', 'areaManifestSchema'),

  def('aquarium/fish.json', 'aquarium', '🐟', 'Loài cá', 'Giờ lớn, giá, độ hay cắn câu, vảy, tên, mô tả', s('aquarium', 'fish'), 'fishFileSchema'),
  def('aquarium/balance.json', 'aquarium', '🪣', 'Cân bằng Aquarium', 'Bể, nước, cá, cần câu, đẻ trứng, cửa hàng', s('aquarium', 'balance'), 'aquariumBalanceFileSchema'),
  def('aquarium/hybrids.json', 'aquarium', '🥚', 'Lai giống cá', 'Cặp cá đẻ trứng loài hiếm', s('shared', 'hybrids'), 'hybridsFileSchema'),
  def('aquarium/names.json', 'aquarium', '🏷️', 'Tên cá ngẫu nhiên', 'Danh sách tên đặt cho cá', s('aquarium', 'fish'), 'fishNamesFileSchema'),
  def('aquarium/area.json', 'aquarium', '🚪', 'Khu Aquarium', 'Điều kiện mở, công trình, sản phẩm', '/content/schemas/area.ts', 'areaManifestSchema'),

  def('cloud/flowers.json', 'cloud', '🌸', 'Hoa', 'Giờ lớn, sản lượng, tên', s('cloud', 'flowers'), 'flowersFileSchema'),
  def('cloud/balance.json', 'cloud', '☁️', 'Cân bằng Cloud', 'Ô hoa, tầng mây, suối, vạc nấu', s('cloud', 'balance'), 'cloudBalanceFileSchema'),
  def('cloud/hybrids.json', 'cloud', '🧪', 'Lai giống hoa', 'Công thức lai, tỉ lệ, phí lab', s('shared', 'hybrids'), 'hybridsFileSchema'),
  def('cloud/area.json', 'cloud', '🚪', 'Khu Cloud', 'Điều kiện mở, công trình, sản phẩm', '/content/schemas/area.ts', 'areaManifestSchema'),

  def('adventure/enemies.json', 'adventure', '👾', 'Kẻ địch', 'Chỉ số, hệ, kỹ năng, kháng, pha trùm, KN, rơi đồ', s('adventure', 'enemies'), 'enemiesFileSchema'),
  def('adventure/skills.json', 'adventure', '✨', 'Kỹ năng', 'Skill riêng, class, tuyệt kỹ, kẻ địch: sức mạnh, MP, hồi chiêu, hiệu ứng, nâng cấp', s('adventure', 'skills'), 'skillsFileSchema'),
  def('adventure/classes.json', 'adventure', '🛡️', 'Class & cây kỹ năng', 'Chỉ số gốc 4 class, node, SP, điều kiện mở', s('adventure', 'classes'), 'classesFileSchema'),
  def('adventure/lineages.json', 'adventure', '🐋', 'Dòng Guardian', '9 dòng, skill riêng, tuyệt kỹ, họ/loài → dòng + class', s('adventure', 'lineages'), 'lineagesFileSchema'),
  def('adventure/elements.json', 'adventure', '☯️', 'Nguyên tố & ma trận', '9 hệ, khắc / kháng, hệ số', s('adventure', 'rules'), 'elementsFileSchema'),
  def('adventure/statuses.json', 'adventure', '💫', 'Trạng thái', 'Thời gian, cộng dồn, sát thương theo lượt, miễn nhiễm', s('adventure', 'rules'), 'statusesFileSchema'),
  def('adventure/reactions.json', 'adventure', '⚡', 'Phản ứng nguyên tố', 'Điều kiện, hệ số, hiệu ứng phụ', s('adventure', 'rules'), 'reactionsFileSchema'),
  def('adventure/zones.json', 'adventure', '🌲', 'Vùng phiêu lưu', 'Khu của vùng, bảng loot, sự kiện nhỏ', s('adventure', 'zones'), 'zonesFileSchema'),
  def('adventure/maps.json', 'adventure', '🗺️', 'Bản đồ khu', 'Lưới ô, vật, quái, rương, cổng (vẽ trực quan ở trang Bản đồ khu)', s('adventure', 'maps'), 'mapsFileSchema'),
  def('adventure/props.json', 'adventure', '🌳', 'Vật trên bản đồ', 'Footprint (ô), ảnh, tỉ lệ vẽ', s('adventure', 'maps'), 'propsFileSchema'),
  def('adventure/equipment.json', 'adventure', '🗡️', 'Trang bị', 'Chỉ số, cấp, affinity hệ / trạng thái, kháng', s('adventure', 'equipment'), 'equipmentFileSchema'),
  def('adventure/engagement.json', 'adventure', '🌀', 'Nhịp chơi & Vết Nứt', 'Thắng nhanh, biến thể quái, Vết Nứt Umbraflux, cộng hưởng dòng, danh hiệu, câu nói, mẹo', s('adventure', 'engagement'), 'engagementFileSchema'),
  def('adventure/balance.json', 'adventure', '⚔️', 'Cân bằng Adventure', 'Luật đánh, MP, Nộ, SP, đền, năng lượng, bản đồ', s('adventure', 'balance'), 'adventureBalanceFileSchema'),
  def('adventure/area.json', 'adventure', '🚪', 'Khu Adventure', 'Điều kiện mở, công trình, sản phẩm', '/content/schemas/area.ts', 'areaManifestSchema'),

  def('breeding/traits.json', 'breeding', '🧬', 'Tính trạng', 'Hiệu ứng, trọng số, tên, mô tả', s('breeding', 'traits'), 'traitsFileSchema'),
  def('breeding/balance.json', 'breeding', '🍀', 'Luật lai nâng cao', 'Di truyền, đột biến, vận may, phả hệ', s('breeding', 'balance'), 'breedingBalanceFileSchema'),
  def('breeding/rumors.json', 'breeding', '🗣️', 'Tin đồn', 'Câu mẫu của Nhà lai giống', s('breeding', 'rumors'), 'rumorsFileSchema'),

  def('shared/weather.json', 'live', '🌦️', 'Thời tiết', 'Tần suất theo mùa, cầu vồng, mưa, sương', s('shared', 'weather'), 'weatherFileSchema'),
  def('shared/festivals.json', 'live', '🎪', 'Lễ hội', 'Chu kỳ, vé, cửa hàng lễ hội', s('shared', 'festivals'), 'festivalsFileSchema'),
  def('shared/merchant.json', 'live', '🐪', 'Thương nhân', 'Tần suất ghé, đơn đặc biệt, giá thu mua', s('shared', 'merchant'), 'merchantFileSchema'),
];

/** The files "Nội dung game" writes itself (the others go through their own page). */
export const EDITABLE_FILES = CONTENT_FILES.filter((f) => f.schemaPath && f.exportName);

export const contentDef = (file: string): ContentFileDef | undefined => CONTENT_FILES.find((f) => f.file === file);

/**
 * Names of a file's rows that live in the game's string tables (src/i18n), not in the content file: the dashboard
 * edits them beside the row and the API writes both languages (scripts/admin/i18nText.ts).
 */
export interface TextTable {
  /** The block of `vi` (and of the English table) holding one entry per row id. */
  block: string;
  /** The file's list of rows (each with an `id`). */
  rowsKey: string;
  /** Rows also have `<id>_desc` (a description). */
  desc: boolean;
  /** The English part file that holds the block. */
  enFile: string;
}

export const TEXT_TABLES: Readonly<Record<string, TextTable>> = {
  'shared/items.json': { block: 'shop', rowsKey: 'items', desc: true, enFile: 'src/i18n/en/partC.ts' },
  'farm/decor.json': { block: 'decor', rowsKey: 'decor', desc: false, enFile: 'src/i18n/en/partD.ts' },
  'shared/achievements.json': { block: 'achievements', rowsKey: 'achievements', desc: false, enFile: 'src/i18n/en/partD.ts' },
};

/** Row texts sent with a save: id → the four strings (empty description = none). */
export type RowTexts = Record<string, { vi: string; en: string; viDesc?: string; enDesc?: string }>;
