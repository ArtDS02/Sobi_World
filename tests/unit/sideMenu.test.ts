// Decision 057 (B1): the right-hand menu — which entries each Area shows, their names (vi + en), why an entry is off, the
// reduced-motion rule of its only animation, and the shop stalls being gone from the Cloud and Garden scenes.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLOUD_VIEW } from '../../src/areas/cloud/scene/cloudView';
import { GARDEN_VIEW } from '../../src/areas/garden/scene/gardenView';
import { SKIN_BUILDING_PARTS } from '../../src/core/config/plotSkins';
import { en } from '../../src/i18n/en';
import { vi } from '../../src/i18n/vi';
import { SIDE_MENU_DEFAULT_POS, SIDE_MENU_KINDS, sideMenuItems, upgradeReason, type SideMenuKind, type SideMenuPart } from '../../src/ui/world/sideMenuVm';

const all = (reason: string | null = null): Record<SideMenuKind, SideMenuPart> => {
  const part = (): SideMenuPart => ({ reason, onClick: () => {} });
  return { expand: part(), upgrade: part(), forge: part(), shop: part(), bag: part() };
};

describe('side menu: what each Area shows', () => {
  it('Cloud and Garden: expand the area, upgrade, forge, shop, bag — in that order', () => {
    for (const area of ['cloud', 'garden'] as const) {
      expect(sideMenuItems(area, all()).map((i) => i.id)).toEqual(['expand', 'upgrade', 'forge', 'shop', 'bag']);
      expect(sideMenuItems(area, all()).map((i) => i.label)).toEqual(['Mở rộng khu vực', 'Nâng cấp khu vực', 'Xưởng đúc khuông', 'Cửa hàng', 'Túi vật phẩm']);
    }
  });

  it('Farm and Aquarium: add room, shop, bag; the upgrade and the forge belong to Cloud and Garden only', () => {
    for (const area of ['farm', 'aquarium'] as const) {
      const items = sideMenuItems(area, all());
      expect(items.map((i) => i.id)).toEqual(['expand', 'shop', 'bag']);
      expect(items[0]!.label).toBe('Mở rộng ô');
    }
  });

  it('the plaza and the Adventure show no menu', () => {
    expect(SIDE_MENU_KINDS.plaza).toEqual([]);
    expect(SIDE_MENU_KINDS.adventure).toEqual([]);
    expect(sideMenuItems('plaza', all())).toEqual([]);
    expect(sideMenuItems('adventure', all())).toEqual([]);
  });

  it('an entry the Area did not wire is left out; an off entry carries its reason and its own icon', () => {
    const items = sideMenuItems('cloud', { shop: { reason: null, onClick: () => {} }, expand: { reason: 'Đã mở hết', onClick: () => {}, icon: 'ui_btn_tier_up' } });
    expect(items.map((i) => i.id)).toEqual(['expand', 'shop']);
    expect(items[0]).toMatchObject({ reason: 'Đã mở hết', icon: 'ui_btn_tier_up' });
    expect(items[1]).toMatchObject({ reason: null, icon: 'ui_btn_shop' });
  });

  it('every entry runs what the Area gave it', () => {
    const ran: string[] = [];
    const parts = Object.fromEntries((['expand', 'upgrade', 'forge', 'shop', 'bag'] as const).map((k) => [k, { reason: null, onClick: () => ran.push(k) }]));
    for (const i of sideMenuItems('garden', parts)) i.onClick();
    expect(ran).toEqual(['expand', 'upgrade', 'forge', 'shop', 'bag']);
  });
});

describe('side menu: why "Nâng cấp khu vực" is off', () => {
  it('needs every plot of the tier / zone, and stops at the top rank', () => {
    expect(upgradeReason({ plotsOwned: 14, plotsPerGroup: 15, group: 0, atTop: false })).toBe(vi.sideMenu.upgradeNeedPlots);
    expect(upgradeReason({ plotsOwned: 15, plotsPerGroup: 15, group: 0, atTop: false })).toBeNull();
    expect(upgradeReason({ plotsOwned: 15, plotsPerGroup: 15, group: 1, atTop: false })).toBe(vi.sideMenu.upgradeNeedPlots);
    expect(upgradeReason({ plotsOwned: 30, plotsPerGroup: 15, group: 1, atTop: true })).toBe(vi.sideMenu.upgradeMax);
  });
});

describe('side menu: strings, position and motion', () => {
  it('has every string in Vietnamese and in English', () => {
    const keys = Object.keys(vi.sideMenu).sort();
    expect(keys).toEqual(['bag', 'close', 'expandArea', 'expandPlots', 'forge', 'open', 'shop', 'slotsMax', 'title', 'upgrade', 'upgradeMax', 'upgradeNeedPlots']);
    const table = (en as unknown as { sideMenu: Record<string, string> }).sideMenu;
    expect(Object.keys(table).sort()).toEqual(keys);
    for (const k of keys) expect(table[k]!.length).toBeGreaterThan(0);
  });

  it('the default position is data: a percent of the height, inside the screen', () => {
    expect(SIDE_MENU_DEFAULT_POS.top).toBeGreaterThanOrEqual(0);
    expect(SIDE_MENU_DEFAULT_POS.top).toBeLessThanOrEqual(60);
  });

  it('"Giảm chuyển động" switches the drop animation off (also for the system preference)', () => {
    const css = readFileSync('src/styles/features/_sidemenu.scss', 'utf8');
    expect(css).toContain('.is-reduced-motion .c-sidemenu__panel.is-fresh { animation: none; }');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.c-sidemenu__panel\.is-fresh \{ animation: none; \}/);
  });
});

describe('the shop stalls left the Cloud and Garden scenes', () => {
  it('no stall position in the views and no stall among the buildings a skin re-themes', () => {
    expect('shop' in CLOUD_VIEW).toBe(false);
    expect('shopLabel' in CLOUD_VIEW).toBe(false);
    expect('shop' in GARDEN_VIEW).toBe(false);
    expect([...SKIN_BUILDING_PARTS.cloud, ...SKIN_BUILDING_PARTS.garden].some((id) => id.includes('shop'))).toBe(false);
  });
});
