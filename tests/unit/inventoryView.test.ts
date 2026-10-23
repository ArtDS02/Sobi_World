import { describe, expect, it } from 'vitest';
import { ITEMS, ITEM_IDS } from '../../src/core/config/items';
import { ITEM_AREA_VALUES } from '../../content/schemas/vocab';
import { defaultInventoryView, foldText, inventoryVm } from '../../src/areas/farm/ui/screens/inventoryVm';

const bag = { FOOD_BASIC: 5, item_carrot: 120, item_seed_corn: 3, item_fish_goldfish: 2, item_equip_wood_sword: 1, item_flower_rainbow_rose: 9 };

describe('the bag view (decision 038)', () => {
  it('every item belongs to an Area, and every Area has items', () => {
    for (const id of ITEM_IDS) expect(ITEM_AREA_VALUES).toContain(ITEMS[id].area);
    for (const area of ITEM_AREA_VALUES) expect(ITEM_IDS.some((id) => ITEMS[id].area === area)).toBe(true);
  });

  it('the Area tab keeps only its items; the staples stay at hand on the farm tab', () => {
    const farm = inventoryVm(bag, defaultInventoryView('sobi_farm'));
    expect(farm.items).toEqual(['FOOD_BASIC', 'MEDICINE_COMMON']);
    expect(inventoryVm(bag, defaultInventoryView('sobi_garden')).items.sort()).toEqual(['item_carrot', 'item_seed_corn']);
    const all = inventoryVm(bag, defaultInventoryView());
    expect(all.totalKinds).toBe(6);
    expect(all.totalUnits).toBe(140);
    expect(all.areas.find((a) => a.id === 'sobi_garden')?.kinds).toBe(2);
    expect(all.areas.find((a) => a.id === 'all')?.active).toBe(true);
  });

  it('chips list only the categories of the tab; a chip the tab lacks falls back to all', () => {
    const garden = inventoryVm(bag, defaultInventoryView('sobi_garden'));
    expect(garden.categories.map((c) => c.id)).toEqual(['all', 'SEED', 'CROP']);
    const seeds = inventoryVm(bag, { ...defaultInventoryView('sobi_garden'), category: 'SEED' });
    expect(seeds.items).toEqual(['item_seed_corn']);
    const gone = inventoryVm(bag, { ...defaultInventoryView('sobi_garden'), category: 'FISH' });
    expect(gone.items).toHaveLength(2);
    expect(gone.categories.find((c) => c.active)?.id).toBe('all');
  });

  it('search ignores case and Vietnamese marks; sorts by count or rarity', () => {
    expect(foldText('  Cá VÀNG Đỏ ')).toBe('ca vang do');
    const q = inventoryVm(bag, { ...defaultInventoryView(), query: 'ca vang' });
    expect(q.items).toEqual(['item_fish_goldfish']);
    const byQty = inventoryVm(bag, { ...defaultInventoryView(), sort: 'qty' });
    expect(byQty.items[0]).toBe('item_carrot');
    const byRarity = inventoryVm(bag, { ...defaultInventoryView(), sort: 'rarity' }).items.map((id) => ITEMS[id].rarity);
    const rank = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
    expect([...byRarity].sort((a, b) => rank.indexOf(b) - rank.indexOf(a))).toEqual(byRarity);
  });

  it('an Area with nothing is empty, not merely filtered', () => {
    const empty = inventoryVm({}, defaultInventoryView('sobi_adventure'));
    expect(empty.items).toEqual([]);
    expect(empty.areaEmpty).toBe(true);
  });
});
