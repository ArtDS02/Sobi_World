// The Adventure Shop, the Forge and the experience books (adventure-big-update-1 §17), and the tree's graph layout (§16): buying pays
// through the ledger and fills the bag, the Forge takes every input or nothing, a book levels a fighter up with its SP, never in a
// battle and never past the cap; the core nodes of a tree stand between the branches they lead to.
import { describe, expect, it } from 'vitest';
import { buyWorkshopItem, forge, missingFor, useTome } from '../../src/areas/adventure/logic/actions/workshop';
import { AB, LEVEL_RULES, TREES, WORKSHOP } from '../../src/areas/adventure/logic/config/content';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { treeLayout } from '../../src/areas/adventure/ui/sheetTree';
import { forgeVm, tomesVm, workshopShopVm } from '../../src/areas/adventure/ui/workshopVm';
import { T0, adventureWorld, ctxAt, err, ok, squad, strong } from './adventureKit';
import { newFighter } from '../../src/areas/adventure/logic/fighters';

const key = squad[0]!.key;

describe('the Adventure Shop', () => {
  it('sells a line for its price, through the ledger, into the bag; refuses an unknown line or a short wallet', () => {
    const line = WORKSHOP.shop[0]!;
    const w0 = adventureWorld();
    const w = ok(buyWorkshopItem(w0, { itemId: line.itemId, count: 3 }, ctxAt(T0)));
    expect(w.wallet.coins).toBe(w0.wallet.coins - line.price * 3);
    expect(w.inventory.items[line.itemId]).toBe(3);
    expect(err(buyWorkshopItem(w0, { itemId: 'item_corn', count: 1 }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    const poor = { ...w0, wallet: { ...w0.wallet, coins: 0 } };
    expect(err(buyWorkshopItem(poor, { itemId: line.itemId, count: 1 }, ctxAt(T0)))).toBe('INSUFFICIENT_GOLD');
    expect(workshopShopVm(poor, T0)[0]!.buys[0]!.reason).toBeTruthy();
  });
});

describe('the Forge', () => {
  it('takes every input and gives the outputs at once; with one input short it makes nothing and says what is missing', () => {
    const r = WORKSHOP.recipes[0]!;
    const bag = Object.fromEntries(Object.entries(r.inputs).map(([id, n]) => [id, (n ?? 0) * 2]));
    const w0 = adventureWorld(bag);
    const w = ok(forge(w0, { recipeId: r.id, times: 2 }, ctxAt(T0)));
    for (const id of Object.keys(r.inputs)) expect(w.inventory.items[id] ?? 0).toBe(0);
    for (const [id, n] of Object.entries(r.outputs)) expect(w.inventory.items[id]).toBe((n ?? 0) * 2);
    const [first] = Object.keys(r.inputs);
    const short = adventureWorld({ ...bag, [first!]: 0 });
    expect(err(forge(short, { recipeId: r.id, times: 1 }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(Object.keys(missingFor(short, r.id))).toEqual([first]);
    expect(forgeVm(short, T0)[0]!.make.reason).toBeTruthy();
    expect(forgeVm(w0, T0)[0]!.makeMany?.times).toBe(2);
  });
});

describe('experience books', () => {
  it('a book gives its experience with the level-ups and their SP; not past the cap, not in a battle', () => {
    const tome = WORKSHOP.tomes[WORKSHOP.tomes.length - 1]!;
    let w = strong(adventureWorld({ [tome.itemId]: 2 }), 1);
    w = ok(useTome(w, { key, itemId: tome.itemId, count: 2, roster: squad }, ctxAt(T0)));
    const f = adventureOf(w).fighters[key]!;
    expect(f.level).toBeGreaterThan(1);
    expect(f.sp).toBe((f.level - 1) * AB.sp.perLevel);
    expect(w.inventory.items[tome.itemId] ?? 0).toBe(0);
    const capped = strong(adventureWorld({ [tome.itemId]: 1 }), LEVEL_RULES.maxLevel);
    expect(err(useTome(capped, { key, itemId: tome.itemId, count: 1, roster: squad }, ctxAt(T0)))).toBe('NOTHING_TO_DO');
    expect(err(useTome(w, { key, itemId: 'item_corn', count: 1, roster: squad }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    const fresh = adventureWorld({ [tome.itemId]: 1 });
    const a = adventureOf(fresh);
    const battling = withAdventure(fresh, { ...a, fighters: { [key]: newFighter(T0) }, run: { phase: 'battle' } as never });
    expect(err(useTome(battling, { key, itemId: tome.itemId, count: 1, roster: squad }, ctxAt(T0)))).toBe('IN_BATTLE');
    expect(tomesVm(adventureWorld({ [tome.itemId]: 3 }), key, squad, T0)[0]!.useMany?.count).toBe(3);
  });
});

describe('the tree graph', () => {
  it('every node gets a row by tier and a place in it; a core node leading left stands left of one leading right', () => {
    for (const nodes of Object.values(TREES)) {
      const at = treeLayout(nodes);
      expect(at.size).toBe(nodes.length);
      for (const n of nodes) expect(at.get(n.id)!.x).toBeGreaterThan(0);
    }
    const tanker = treeLayout(TREES.tanker);
    expect(tanker.get('node_tk_hold_fast')!.x).toBeLessThan(tanker.get('node_tk_taunt')!.x);
  });
});
