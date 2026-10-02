// Display labels and small view helpers of the admin dashboard (a dev tool: its Vietnamese text
// lives here, not in src/i18n, which is the game's).
import { effectiveStats, artState, type ArtState } from '../../scripts/admin/validate';
import type { SpeciesRowData } from '../../scripts/admin/speciesText';
import { RARITY_TIER } from '../../src/core/config/breeds';
import { state } from './store';

export const RARITY_LABEL: Record<string, string> = {
  COMMON: 'Thường',
  UNCOMMON: 'Khá hiếm',
  RARE: 'Hiếm',
  EPIC: 'Sử thi',
  LEGENDARY: 'Huyền thoại',
};

export const FAMILY_LABEL: Record<string, string> = {
  FARM: 'Nông trại',
  MEADOW: 'Đồng cỏ',
  WILD: 'Hoang dã',
  WATER: 'Dưới nước',
  HERO: 'Anh hùng',
  MYTHIC: 'Thần thoại',
  VIETNAM: 'Việt Nam',
  JOB: 'Nghề nghiệp',
  ADVENTURE: 'Phiêu lưu',
  SCIFI: 'Khoa học viễn tưởng',
  FANTASY: 'Kỳ ảo',
  HORROR: 'Kinh dị',
  FOOD: 'Đồ ăn',
  FUNNY: 'Vui nhộn',
};

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ESC[c]!);

export const gold = (n: number) => n.toLocaleString('vi-VN');
export function hours(sec: number | null) {
  if (sec === null) return '—';
  const h = sec / 3600;
  return h >= 1 ? `${+h.toFixed(1)} giờ` : `${Math.round(sec / 60)} phút`;
}
export const hexColor = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export const stats = (row: SpeciesRowData) => effectiveStats(row, RARITY_TIER);
export const art = (row: SpeciesRowData): ArtState => artState(row.artId, state.pigs, state.files);
export const isNew = (row: SpeciesRowData) => !!art(row).manifest?.tags?.includes('new');

/** Public URL of a manifest asset path, or of the art file a row points at. */
export const assetUrl = (path: string) => `/assets/${path}`;
export const rowImage = (row: SpeciesRowData) => assetUrl(art(row).manifest?.asset ?? `pigs/base/${row.artId}.png`);

export type RowStatus = 'ok' | 'warn' | 'error';
export function rowStatus(row: SpeciesRowData): RowStatus {
  const mine = state.issues.filter((i) => i.speciesId === row.id);
  if (mine.some((i) => i.level === 'error')) return 'error';
  if (mine.some((i) => i.level === 'warn') || !art(row).complete) return 'warn';
  return 'ok';
}
export const STATUS_LABEL: Record<RowStatus, string> = { ok: 'Đủ asset', warn: 'Cần xem', error: 'Lỗi' };

export const rarityBadge = (r: string) => `<span class="badge rarity-${r.toLowerCase()}">${esc(RARITY_LABEL[r] ?? r)}</span>`;
export const statusBadge = (s: RowStatus) => `<span class="badge status-${s}">${s === 'ok' ? '✓' : '⚠'} ${STATUS_LABEL[s]}</span>`;
