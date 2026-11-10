// The right-hand menu of an Area (decision 057, B1), as plain data: which entries an Area shows, in which order, under which
// name, and why an entry is off. Pure; the Area gives what each entry does and its reason, the component draws it
// (ui/components/sideMenu.ts).
import { AREA_HUD_ART } from '../../core/config/assetIds';
import { vi } from '../../i18n/vi';

export type SideMenuArea = 'farm' | 'garden' | 'aquarium' | 'cloud' | 'adventure' | 'plaza';
export type SideMenuKind = 'expand' | 'upgrade' | 'forge' | 'shop' | 'bag';

/**
 * What each place shows, in order. The plaza and the Adventure show no menu: the plaza is only doors (nothing to expand, upgrade
 * or buy there), and the Adventure camp already has its own Shop & Forge tab and bag in its camp bar, and no ground to expand.
 */
export const SIDE_MENU_KINDS: Readonly<Record<SideMenuArea, readonly SideMenuKind[]>> = {
  farm: ['expand', 'shop', 'bag'],
  garden: ['expand', 'upgrade', 'forge', 'shop', 'bag'],
  aquarium: ['expand', 'shop', 'bag'],
  cloud: ['expand', 'upgrade', 'forge', 'shop', 'bag'],
  adventure: [],
  plaza: [],
};

export interface SideMenuPart {
  /** Why it is off, null when it works. */
  reason: string | null;
  onClick: () => void;
  /** The Area's own picture for the entry (default: the shared HUD art). */
  icon?: string;
}

export interface SideMenuItem {
  id: SideMenuKind;
  icon: string;
  label: string;
  reason: string | null;
  onClick: () => void;
}

const ICONS: Readonly<Record<SideMenuKind, string>> = { expand: 'ui_btn_tier_up', upgrade: AREA_HUD_ART.star, forge: 'ui_icon_gem', shop: AREA_HUD_ART.shop, bag: AREA_HUD_ART.items };

/** Cloud and Garden open tiers / zones ("khu vực"); the Farm and the Aquarium add room for animals ("ô"). */
const labelOf = (area: SideMenuArea, kind: SideMenuKind): string => {
  const s = vi.sideMenu;
  if (kind === 'expand') return area === 'cloud' || area === 'garden' ? s.expandArea : s.expandPlots;
  return s[kind];
};

/** The entries of `area`: only its own kinds, in its order, and only those the Area wired. */
export function sideMenuItems(area: SideMenuArea, parts: Partial<Record<SideMenuKind, SideMenuPart>>): SideMenuItem[] {
  return SIDE_MENU_KINDS[area].flatMap((kind) => {
    const p = parts[kind];
    return p ? [{ id: kind, icon: p.icon ?? ICONS[kind], label: labelOf(area, kind), reason: p.reason, onClick: p.onClick }] : [];
  });
}

/** Why "Nâng cấp khu vực" is off before the dialog can say more: the tier / zone is not complete, or already at the top rank. */
export function upgradeReason(v: { plotsOwned: number; plotsPerGroup: number; group: number; atTop: boolean }): string | null {
  if (v.plotsOwned < (v.group + 1) * v.plotsPerGroup) return vi.sideMenu.upgradeNeedPlots;
  return v.atTop ? vi.sideMenu.upgradeMax : null;
}

/** Where the circle sits: percent of the overlay's height from its top (data, so the Admin can move it). */
export interface SideMenuPos {
  top: number;
}
export const SIDE_MENU_DEFAULT_POS: SideMenuPos = { top: 23 }; // under the notification bell at the smallest window (1024 × 640)
