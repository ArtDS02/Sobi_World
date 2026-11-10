// What the plot skin forge shows (decision 056), as plain data shared by the Cloud and the Garden: one card per skin for the shop
// grid (owned / forgeable / locked with the hint of how to open it) with a "pay coins" and a "pay Gems" button that dry-run the
// real action, and the strip that dresses the tier / zone on screen. Pure.
import type { ErrorCode } from '../../core/config/errors';
import type { ItemId } from '../../core/config/ids';
import { PLOT_SKIN_RULES, skinArtId } from '../../core/config/plotSkins';
import { WORLD_LEVELS } from '../../core/config/progression';
import { shownSkin, SKIN_AUTO_MODES, type SkinAutoMode, type SkinMoment } from '../../core/plots/skinAuto';
import { skinStatus, type SkinDef } from '../../core/plots/skins';
import type { WorldSave } from '../../core/save/world';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import type { ShopLineVm } from '../components/shopGrid';

const nameOf = (id: string): string => vi.plotSkin.names[id as keyof typeof vi.plotSkin.names] ?? id;
const hintOf = (id: string): string => vi.plotSkin.hints[id as keyof typeof vi.plotSkin.hints] ?? '';
const itemName = (id: string): string => vi.shop[id as ItemId] ?? id;

/** "20 Thảo mộc rừng, 10 Nanh thú…". */
const materialsText = (skin: SkinDef): string =>
  Object.entries(skin.materials)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([id, n]) => `${formatInt(n ?? 0)} ${itemName(id)}`)
    .join(', ');

export type ForgeProbe = (skinId: string, pay: 'coins' | 'gems') => ErrorCode | null;

/** Why a pay button is off (null = it works), from what a dry run of the action answered. */
function reasonOf(world: WorldSave, skin: SkinDef, pay: 'coins' | 'gems', answer: ErrorCode | null, status: string): string | null {
  if (status === 'owned') return vi.plotSkin.owned;
  if (status === 'locked') return hintOf(skin.id);
  if (answer === null) return null;
  const lacksMaterials = Object.entries(skin.materials).some(([id, n]) => (world.inventory.items[id] ?? 0) < (n ?? 0));
  if (lacksMaterials) return vi.plotSkin.noMaterials;
  if (answer === 'INSUFFICIENT_GOLD') return pay === 'gems' ? vi.plotSkin.noGems : vi.error.INSUFFICIENT_GOLD;
  return vi.error[answer];
}

/** The cards of the forge, one per skin. Buy count 1 = pay coins, 2 = pay Gems (the grid's count slot carries the choice). */
export function skinCardsVm(world: WorldSave, probe: ForgeProbe): ShopLineVm[] {
  return PLOT_SKIN_RULES.skins.map((skin) => {
    const status = skinStatus(world, skin, WORLD_LEVELS);
    const answers = { coins: probe(skin.id, 'coins'), gems: probe(skin.id, 'gems') };
    return {
      itemId: skin.id,
      name: nameOf(skin.id),
      kind: 'skin',
      line: status === 'owned' ? vi.plotSkin.owned : status === 'locked' ? hintOf(skin.id) : t(vi.plotSkin.needs, { items: materialsText(skin) }),
      art: skinArtId(skin.id, 'cloud'),
      each: t(vi.plotSkin.each, { coins: formatInt(skin.coins), gems: formatInt(skin.gems) }),
      owned: status === 'owned' ? vi.plotSkin.ownedTag : '',
      buys: [
        { count: 1, label: vi.plotSkin.payCoins, price: formatInt(skin.coins), reason: reasonOf(world, skin, 'coins', answers.coins, status) },
        { count: 2, label: vi.plotSkin.payGems, price: formatInt(skin.gems), reason: reasonOf(world, skin, 'gems', answers.gems, status), icon: 'gem' },
      ],
    };
  });
}

export interface SkinChipVm {
  /** null = the plain look. */
  skinId: string | null;
  name: string;
  active: boolean;
}

/** The strip that dresses the group on screen: "Mặc định" and every skin the player owns. */
export function skinStripVm(world: WorldSave, wearing: string | null): SkinChipVm[] {
  return [
    { skinId: null, name: vi.plotSkin.plain, active: wearing === null },
    ...world.cosmetics.plotSkins.map((id) => ({ skinId: id, name: nameOf(id), active: wearing === id })),
  ];
}

export interface SkinAutoChipVm {
  /** null = off: the group wears the skin chosen in the strip. */
  mode: SkinAutoMode | null;
  name: string;
  active: boolean;
}

export interface SkinAutoVm {
  chips: SkinAutoChipVm[];
  /** With a mode on: what the group shows at this moment ("Đang hiện: Đêm Trăng"); null when off. */
  showing: string | null;
}

/** The "change by itself" row (decision 057, B7): off / by time of day / by season, and what the group shows right now. */
export function skinAutoVm(world: WorldSave, wearing: string | null, mode: SkinAutoMode | null, moment: SkinMoment): SkinAutoVm {
  const shown = shownSkin(wearing, mode, moment, world.cosmetics.plotSkins);
  return {
    chips: [
      { mode: null, name: vi.plotSkin.auto.off, active: mode === null },
      ...SKIN_AUTO_MODES.map((m) => ({ mode: m, name: vi.plotSkin.auto[m], active: mode === m })),
    ],
    showing: mode ? t(vi.plotSkin.auto.showing, { name: shown ? nameOf(shown) : vi.plotSkin.plain }) : null,
  };
}
