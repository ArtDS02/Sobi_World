// Sobi Adventure V2 (decision 037): the content and its cross-references, who fights as what (Guardian line, class, elements), stats,
// the class skill tree (SP, prerequisites, upgrades, loadout), the temple, the camp (equipment, starter, formations, leader), the save
// (v1 → v2 migration), and the links to the world.
import { describe, expect, it } from 'vitest';
import { parseWorldSave } from '../../src/app/saveCodec';
import { adventureArea } from '../../src/areas/adventure';
import { claimStarter, collectLoot, equipItem, starterGift, unequipSlotOf } from '../../src/areas/adventure/logic/actions/camp';
import { changeClass, resetTree, saveFormation, setLeader, setLoadout, stepNode, useScroll } from '../../src/areas/adventure/logic/actions/growth';
import { adventureArtIds } from '../../src/areas/adventure/logic/art';
import { AB, CLASSES, ELEMENT_LIST, LINEAGE_LIST, SKILL_LIST, STATUS_LIST, TREES, ZONE_LIST, contentProblems, identityOf } from '../../src/areas/adventure/logic/config/content';
import { fighterSkills, fighterStats, newFighter, whyNotReady } from '../../src/areas/adventure/logic/fighters';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { ADVENTURE_MIGRATIONS, adventureStateSchema } from '../../src/areas/adventure/logic/state';
import { classLoadout, nodeLevel, spSpent, whyNotStep } from '../../src/areas/adventure/logic/tree';
import type { AdventureEvent } from '../../src/areas/adventure/logic/events';
import { adventureEventsToWorld } from '../../src/areas/adventure/logic/worldEvents';
import type { CreatureGift } from '../../src/core/area-registry/registry';
import { ELEMENTS, STATUS_IDS } from '../../src/systems/combat/types';
import { ELEMENT_VALUES, STATUS_VALUES } from '../../content/schemas/adventure/combat';
import { T0, adventureWorld, ctxAt, entry, err, ok, squad, strong } from './adventureKit';

const roster = squad;
const knight = entry('a');

describe('content (decision 037)', () => {
  it('has no broken reference; nine elements, every status, the four classes with a tree, nine lines of four Unique skills', () => {
    expect(contentProblems()).toEqual([]);
    expect(ELEMENT_LIST.map((e) => e.id).sort()).toEqual([...ELEMENTS].sort());
    expect([...ELEMENT_VALUES].sort()).toEqual([...ELEMENTS].sort());
    expect([...STATUS_VALUES].sort()).toEqual([...STATUS_IDS].sort());
    expect(STATUS_LIST).toHaveLength(STATUS_IDS.length);
    expect(Object.keys(CLASSES)).toHaveLength(4);
    for (const c of Object.keys(CLASSES)) expect(TREES[c as keyof typeof TREES].length).toBeGreaterThanOrEqual(8);
    expect(LINEAGE_LIST).toHaveLength(9);
    expect(LINEAGE_LIST.every((l) => l.unique.length === 4)).toBe(true);
    expect(SKILL_LIST.filter((s) => s.type === 'ultimate').length).toBeGreaterThanOrEqual(9);
  });

  it('no poison or wind element; Void is neutral to all; three zones of three areas', () => {
    expect(ELEMENTS as readonly string[]).not.toContain('POISON');
    expect(ELEMENTS as readonly string[]).not.toContain('WIND');
    for (const z of ZONE_LIST) expect(z.maps).toHaveLength(3);
  });

  it('a pig fights as its family line and class, a species overrides, only listed fish fight', () => {
    expect(identityOf(knight)).toMatchObject({ classId: 'striker', element: 'METAL' });
    expect(identityOf(entry('x', { speciesId: 'PIG_WHITE', family: 'FARM' }))).toMatchObject({ classId: 'tanker', element: 'NATURE' });
    expect(identityOf(entry('x', { speciesId: 'PIG_PHOENIX', family: 'MYTHIC' }))).toMatchObject({ element: 'FIRE', element2: 'LIGHT', ultimate: 'skill_ult_phoenix' });
    expect(identityOf({ kind: 'fish', speciesId: 'fish_betta', family: null })).toMatchObject({ element: 'FIRE' });
    expect(identityOf({ kind: 'fish', speciesId: 'fish_goldfish', family: null })).toBeUndefined();
    expect(adventureArtIds().length).toBeGreaterThan(40);
  });
});

describe('fighters', () => {
  const id = identityOf(knight)!;
  it('stats come from the class, grow with level; rarity adds at most 20%', () => {
    const f = newFighter(T0);
    expect(fighterStats(f, knight, id).atk).toBe(CLASSES.striker.stats.atk);
    expect(fighterStats({ ...f, level: 11 }, knight, id).atk).toBe(CLASSES.striker.stats.atk * 2);
    const legend = fighterStats(f, entry('x', { rarity: 'LEGENDARY' }), id).hp;
    expect(legend / CLASSES.striker.stats.hp).toBeLessThanOrEqual(1.2001);
  });
  it('two Unique skills at level 1, a third at 10, a fourth at 20, then the class loadout (the starter node is open)', () => {
    const f = newFighter(T0);
    expect(fighterSkills(f, id).map((s) => s.id)).toEqual(['skill_tg_steel_slash', 'skill_tg_bronze_wall', 'skill_cl_power_strike']);
    expect(fighterSkills({ ...f, level: 20 }, id)).toHaveLength(5);
  });
  it('a fighter must be grown, set to Adventure, well, rested and charged', () => {
    expect(whyNotReady(knight, undefined, T0)).toBeNull();
    expect(whyNotReady(entry('x', { purpose: 'SHIP' }), undefined, T0)).toBe('NOT_A_FIGHTER');
    expect(whyNotReady(entry('x', { sick: true }), undefined, T0)).toBe('FIGHTER_SICK');
    expect(whyNotReady(knight, { ...newFighter(T0), energy: 0 }, T0)).toBe('NO_ADVENTURE_ENERGY');
  });
});

describe('the class skill tree (§7)', () => {
  const withSp = (sp: number, level = 10) => strong(adventureWorld(), level, { sp });
  it('opens a node with SP once its prerequisites are reached, upgrades it, refuses past the top', () => {
    let w = withSp(30);
    const f0 = adventureOf(w).fighters[knight.key]!;
    expect(whyNotStep(f0, 'striker', 'node_st_combo')).toBeNull();
    expect(whyNotStep(f0, 'striker', 'node_st_finisher')).toBe('NODE_LOCKED');
    expect(whyNotStep(f0, 'striker', 'node_tk_taunt')).toBe('NODE_UNKNOWN');
    w = ok(stepNode(w, { key: knight.key, nodeId: 'node_st_combo', roster }, ctxAt(T0)));
    w = ok(stepNode(w, { key: knight.key, nodeId: 'node_st_power_strike', roster }, ctxAt(T0)));
    const f = adventureOf(w).fighters[knight.key]!;
    expect(f.sp).toBe(30 - 4 - 1);
    expect(nodeLevel(f, TREES.striker.find((n) => n.id === 'node_st_power_strike')!)).toBe(2);
    expect(whyNotStep(f, 'striker', 'node_st_finisher')).toBeNull();
    expect(spSpent(f, 'striker')).toBe(5);
    expect(err(stepNode(withSp(0), { key: knight.key, nodeId: 'node_st_aim', roster }, ctxAt(T0)))).toBe('NOT_ENOUGH_SP');
  });
  it('carries up to three opened class skills; a closed one is refused', () => {
    let w = withSp(30);
    w = ok(stepNode(w, { key: knight.key, nodeId: 'node_st_aim', roster }, ctxAt(T0)));
    w = ok(setLoadout(w, { key: knight.key, skills: ['skill_cl_aim'], roster }, ctxAt(T0)));
    expect(classLoadout(adventureOf(w).fighters[knight.key]!, 'striker').map((s) => s.id)).toEqual(['skill_cl_aim']);
    expect(err(setLoadout(w, { key: knight.key, skills: ['skill_cl_combo'], roster }, ctxAt(T0)))).toBe('LOADOUT_INVALID');
  });
  it('the temple: changing class gives every SP back for coins; the first tree reset is free; a scroll gives SP', () => {
    let w = withSp(10);
    w = ok(stepNode(w, { key: knight.key, nodeId: 'node_st_combo', roster }, ctxAt(T0)));
    const coins = w.wallet.coins;
    w = ok(changeClass(w, { key: knight.key, classId: 'tanker', roster }, ctxAt(T0)));
    expect(adventureOf(w).fighters[knight.key]).toMatchObject({ classId: 'tanker', sp: 10, tree: {} });
    expect(w.wallet.coins).toBe(coins - AB.temple.classChangePerLevel * 10);
    expect(err(changeClass(w, { key: knight.key, classId: 'tanker', roster }, ctxAt(T0)))).toBe('SAME_CLASS');
    w = ok(stepNode(w, { key: knight.key, nodeId: 'node_tk_hold_fast', roster }, ctxAt(T0)));
    const before = w.wallet.coins;
    w = ok(resetTree(w, { key: knight.key, roster }, ctxAt(T0)));
    expect(w.wallet.coins).toBe(before);
    expect(adventureOf(w).fighters[knight.key]!.sp).toBe(10);
    w = { ...w, inventory: { items: { item_skill_scroll: 1 } } };
    w = ok(useScroll(w, { key: knight.key, roster }, ctxAt(T0)));
    expect(adventureOf(w).fighters[knight.key]!.sp).toBe(10 + AB.sp.scroll);
  });
});

describe('the camp', () => {
  it('equipment needs its level; the old piece goes back to the bag', () => {
    let w = strong(adventureWorld({ item_equip_flame_blade: 1, item_equip_iron_sword: 1 }), 5);
    expect(err(equipItem(w, { key: knight.key, itemId: 'item_equip_flame_blade' }, ctxAt(T0)))).toBe('LEVEL_TOO_LOW');
    w = ok(equipItem(w, { key: knight.key, itemId: 'item_equip_iron_sword' }, ctxAt(T0)));
    expect(w.inventory.items.item_equip_iron_sword ?? 0).toBe(1); // the iron sword it wore came back
    w = ok(unequipSlotOf(w, { key: knight.key, slot: 'weapon' }, ctxAt(T0)));
    expect(adventureOf(w).fighters[knight.key]!.loadout.weapon).toBeUndefined();
  });
  it('the starter pig once; formations and the leader are kept', () => {
    const gifts: CreatureGift[] = [];
    let w = adventureWorld();
    w = ok(claimStarter(w, { give: (ww, g) => (gifts.push(g), { ok: true, state: ww }) }, ctxAt(T0)));
    expect(gifts).toEqual([starterGift()]);
    expect(err(claimStarter(w, { give: (ww) => ({ ok: true, state: ww }) }, ctxAt(T0)))).toBe('STARTER_CLAIMED');
    w = ok(saveFormation(w, { index: 1, keys: [knight.key] }, ctxAt(T0)));
    w = ok(setLeader(w, { leader: 'bi' }, ctxAt(T0)));
    expect(adventureOf(w).formations[1]!.keys).toEqual([knight.key]);
    expect(adventureOf(w).leader).toBe('bi');
    expect(err(collectLoot(w, ctxAt(T0)))).toBe('NOTHING_TO_COLLECT');
  });
});

describe('the save (v2)', () => {
  it('opens at world level 8 and development 16; the slice survives the codec', () => {
    expect(adventureArea.manifest.unlock).toMatchObject({ worldLevel: 8, worldDevelopment: 16 });
    const w = adventureWorld();
    const back = parseWorldSave(JSON.stringify(w));
    expect(back.ok && back.save).toEqual(w);
  });
  it('migrates a v1 slice: levels kept with their SP, a trip in progress closed with its loot and energy back, cleared zones light their portals', () => {
    const v1 = {
      version: 1,
      fighters: { k: { level: 6, exp: 10, loadout: {}, energy: 40, energyAt: T0, exhaustedUntil: null } },
      run: { zoneId: 'zone_forest', phase: 'map', loot: { item_forest_herb: 3 }, team: [{ key: 'k' }] },
      pending: {},
      starterClaimed: true,
      cleared: { zone_forest: 2 },
      battlesWon: 5,
      runsCleared: 2,
      runsLost: 0,
      lastTickedAt: T0,
    };
    const v2 = ADVENTURE_MIGRATIONS[1]!(v1 as never) as Record<string, unknown>;
    const a = adventureStateSchema.parse(v2);
    expect(a.fighters.k).toMatchObject({ level: 6, sp: 10, energy: 40 + AB.run.energyCost, classId: null });
    expect(a.run).toBeNull();
    expect(a.pending).toEqual({ item_forest_herb: 3 });
    expect(a.activePortals).toEqual(['map_forest_edge', 'map_forest_deep', 'map_forest_heart']);
  });
});

describe('links to the world', () => {
  it('tells the world about wins, finished trips, coins, levels and the loot taken', () => {
    const events: AdventureEvent[] = [
      { type: 'ADVENTURE_BATTLE_WON', zoneId: 'zone_forest', boss: false, elite: false, enemies: 2, exp: 10, coins: 12 },
      { type: 'ADVENTURE_RUN_ENDED', zoneId: 'zone_forest', result: 'win' },
      { type: 'ADVENTURE_LOOT_COLLECTED', items: { item_forest_herb: 2 }, left: 0 },
      { type: 'ADVENTURE_ITEM_USED', itemId: 'item_skill_scroll' },
    ];
    const out = adventureEventsToWorld(events);
    expect(out.map((e) => e.type)).toEqual(['battle.won', 'currency.changed', 'adventure.finished', 'item.added', 'item.removed']);
  });
  it('the slice of a fresh world is valid', () => {
    expect(withAdventure(adventureWorld(), adventureOf(adventureWorld())).areas.sobi_adventure).toBeTruthy();
  });
});
