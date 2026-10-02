// Species data validation shared by the admin dashboard (live, in the browser) and its dev API
// (refuses to save on any error). Mirrors the config rules tests/unit/config.test.ts enforces, so a
// save that passes here keeps `npm run check` green. Pure: no fs, no DOM.
import type { SpeciesRowData } from './speciesText';

export type IssueLevel = 'error' | 'warn' | 'info';
export interface Issue {
  level: IssueLevel;
  speciesId: string | null; // null = not tied to one species (orphan files, rows)
  text: string;
}

/** The parts of a manifest `pigs[]` row the dashboard reads. */
export interface PigArtRow {
  id: string;
  nameVi: string;
  status: string;
  asset: string;
  sleepAsset?: string | null;
  wakeAsset?: string | null;
  tags?: string[];
}

export interface TierStats {
  sellGold: number;
  growthSec: number;
  pregnancySec: number | null;
  maxWeight: number;
  breedable: boolean;
}

export interface ValidateInput {
  rows: readonly SpeciesRowData[];
  pigs: readonly PigArtRow[]; // manifest pigs[]
  files: ReadonlySet<string>; // asset paths that exist, relative to public/assets ("pigs/base/x.png")
  savedIds: readonly string[]; // ids saves may hold: every one must stay (no delete, disable instead)
  rarities: readonly string[]; // low → high
  families: readonly string[];
  tiers: Readonly<Record<string, TierStats>>;
  maxLevel: number;
}

export const SPECIES_ID = /^PIG_[A-Z0-9_]+$/;
export const ART_ID = /^pig_[a-z0-9_]+$/;

/** Row stats after the rarity tier fills the gaps (same rule as `species()` in breeds.ts). */
export function effectiveStats(row: SpeciesRowData, tiers: ValidateInput['tiers']) {
  const t = tiers[row.rarity] ?? { sellGold: 0, growthSec: 0, pregnancySec: null, maxWeight: 0, breedable: false };
  return {
    buyGold: row.buyGold ?? null,
    unlockLevel: row.unlockLevel ?? 1,
    sellGold: row.sellGold ?? t.sellGold,
    growthSec: row.growthSec ?? t.growthSec,
    pregnancySec: row.pregnancySec === undefined ? t.pregnancySec : row.pregnancySec,
    maxWeight: row.maxWeight ?? t.maxWeight,
    breedable: row.breedable ?? t.breedable,
    enabled: row.enabled ?? true,
  };
}

export interface ArtState {
  manifest: PigArtRow | null;
  right: boolean; // the one drawn facing (production standard §2)
  left: boolean; // runtime flip of `right`
  sleep: boolean | null; // null = no sleep frame declared (optional, DECISIONS Q5)
  complete: boolean;
}

const fileOf = (artId: string) => `pigs/base/${artId}.png`;

/** Art coverage of one species: right-facing idle drawn, left by flip, front/back never produced. */
export function artState(artId: string, pigs: ValidateInput['pigs'], files: ValidateInput['files']): ArtState {
  const manifest = pigs.find((p) => p.id === artId) ?? null;
  // A file without its manifest row still previews (it is registered on save); only complete needs both.
  const right = manifest ? files.has(manifest.asset) : files.has(fileOf(artId));
  const sleep = manifest?.sleepAsset ? files.has(manifest.sleepAsset) : null;
  return { manifest, right, left: right, sleep, complete: !!manifest && right && sleep !== false };
}

function rowIssues(row: SpeciesRowData, input: ValidateInput, push: (l: IssueLevel, t: string) => void) {
  if (!SPECIES_ID.test(row.id)) push('error', `ID "${row.id}" phải dạng PIG_TEN_HEO`);
  if (!row.nameVi.trim()) push('error', 'Thiếu tên');
  if (!input.rarities.includes(row.rarity)) push('error', `Độ hiếm "${row.rarity}" không hợp lệ`);
  if (!input.families.includes(row.family)) push('error', `Nhóm "${row.family}" không hợp lệ`);
  if (!Number.isInteger(row.color) || row.color < 0 || row.color > 0xffffff) push('error', 'Màu không hợp lệ');
  const s = effectiveStats(row, input.tiers);
  const positive = { sellGold: s.sellGold, growthSec: s.growthSec, maxWeight: s.maxWeight };
  for (const [k, v] of Object.entries(positive)) {
    if (!(Number.isFinite(v) && v > 0)) push('error', `${k} phải > 0`);
  }
  if (s.buyGold !== null && !(s.buyGold > 0)) push('error', 'Giá mua phải > 0');
  if (s.buyGold !== null && s.buyGold >= s.sellGold) push('error', 'Giá mua phải thấp hơn giá bán');
  if (!Number.isInteger(s.unlockLevel) || s.unlockLevel < 1 || s.unlockLevel > input.maxLevel)
    push('error', `Cấp mở khoá phải 1–${input.maxLevel}`);
  const legendary = row.rarity === input.rarities[input.rarities.length - 1];
  if (s.breedable === legendary) push('error', legendary ? 'Heo LEGENDARY không được lai' : 'Chỉ LEGENDARY mới không lai được');
  if (s.breedable && !(s.pregnancySec !== null && s.pregnancySec > 0)) push('error', 'Heo lai được cần thời gian mang thai > 0');

  if (!ART_ID.test(row.artId)) push('error', `Art id "${row.artId}" phải dạng pig_ten`);
  const art = artState(row.artId, input.pigs, input.files);
  if (!art.manifest) {
    if (input.files.has(fileOf(row.artId))) push('warn', `Chưa có dòng manifest — sẽ tự thêm khi lưu`);
    else push('error', `Không có ảnh: ${fileOf(row.artId)}`);
  } else {
    if (!art.right) push('error', `Thiếu file: ${art.manifest.asset}`);
    if (art.sleep === false) push('error', `Thiếu file ngủ: ${art.manifest.sleepAsset}`);
  }
  if (!s.enabled) push('info', 'Đang tắt: không bán, không lai ra');
}

/** Every issue of the draft, errors first. */
export function validateSpecies(input: ValidateInput): Issue[] {
  const issues: Issue[] = [];
  const ids = new Map<string, number>();
  const arts = new Map<string, string>();
  for (const row of input.rows) {
    const push = (level: IssueLevel, text: string) => issues.push({ level, speciesId: row.id, text });
    ids.set(row.id, (ids.get(row.id) ?? 0) + 1);
    const other = arts.get(row.artId);
    if (other) push('error', `Trùng ảnh với ${other} (${row.artId})`);
    else arts.set(row.artId, row.id);
    rowIssues(row, input, push);
  }
  for (const [id, n] of ids) if (n > 1) issues.push({ level: 'error', speciesId: id, text: `Trùng ID (${n} dòng)` });
  for (const id of input.savedIds) {
    if (!ids.has(id)) issues.push({ level: 'error', speciesId: id, text: 'Không được xoá species (save cũ có thể đang giữ) — hãy tắt' });
  }
  rarityOrderIssues(input, issues);
  for (const p of input.pigs) {
    if (!arts.has(p.id)) issues.push({ level: 'info', speciesId: null, text: `Art ${p.id} (${p.nameVi}) chưa gán species nào` });
  }
  const declared = new Set(input.pigs.flatMap((p) => [p.asset, p.sleepAsset ?? '', p.wakeAsset ?? '']));
  for (const f of input.files) {
    if (f.startsWith('pigs/') && !declared.has(f)) issues.push({ level: 'warn', speciesId: null, text: `File chưa đăng ký manifest: ${f}` });
  }
  const order: Record<IssueLevel, number> = { error: 0, warn: 1, info: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

/** Rarer species must sell for more and grow longer (config.test "rarer species are worth more"). */
function rarityOrderIssues(input: ValidateInput, issues: Issue[]) {
  const rank = (r: string) => input.rarities.indexOf(r);
  const stats = input.rows.map((r) => ({ r, s: effectiveStats(r, input.tiers) }));
  for (const a of stats) {
    const higher = stats.filter((b) => rank(a.r.rarity) < rank(b.r.rarity));
    const sell = higher.find((b) => a.s.sellGold >= b.s.sellGold);
    const grow = higher.find((b) => a.s.growthSec >= b.s.growthSec);
    if (sell)
      issues.push({ level: 'error', speciesId: a.r.id, text: `Giá bán phải thấp hơn ${sell.r.id} (độ hiếm cao hơn)` });
    if (grow)
      issues.push({ level: 'error', speciesId: a.r.id, text: `Thời gian lớn phải ngắn hơn ${grow.r.id} (độ hiếm cao hơn)` });
  }
}
