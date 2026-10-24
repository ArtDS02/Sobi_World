// The "no dead resource" audit (spec V2 §13 rule 2, GĐ11 step 6): every item of the bag and what can be done with it, read from
// the content files only. An item with fewer than two kinds of use is a dead resource: the test in tests/scripts fails on it.
import { readFileSync } from 'node:fs';
import { ITEM_IDS, ITEMS } from '../../src/core/config/items';
import type { ItemId } from '../../src/core/config/ids';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- content files are read untyped; the game validates them at start
const json = (file: string): any => JSON.parse(readFileSync(`content/${file}`, 'utf8'));

/** Every item id found as a key of an object stored under `prop` anywhere in a JSON value. */
function idsUnder(value: unknown, props: readonly string[], into: Set<string>, under = false): void {
  if (Array.isArray(value)) value.forEach((v) => idsUnder(v, props, into, under));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (under && /^(item_|FOOD_|MEDICINE_)/.test(k)) into.add(k);
      idsUnder(v, props, into, under || props.includes(k));
    }
  }
}

/** Uses that live in code, not in content (each has its own unit test): the trough takes the basic food, the Aquarium's medicine cures fish. */
const CODE_USES: Partial<Record<string, readonly UseKind[]>> = { FOOD_BASIC: ['trough'], MEDICINE_COMMON: ['fishCure'] };

export type UseKind = 'sell' | 'feed' | 'cure' | 'mood' | 'mutation' | 'plant' | 'recipe' | 'order' | 'upgrade' | 'technology' | 'equip' | 'battle' | 'ration' | 'hatch' | 'tank' | 'trough' | 'fishCure' | 'cross' | 'skill' | 'tome' | 'forge';

export function itemUses(): Record<ItemId, UseKind[]> {
  const uses = Object.fromEntries(ITEM_IDS.map((id) => [id, new Set<UseKind>()])) as Record<ItemId, Set<UseKind>>;
  const mark = (id: string, kind: UseKind) => uses[id as ItemId]?.add(kind);

  for (const id of ITEM_IDS) {
    const i = ITEMS[id];
    if (i.sellGold !== undefined) mark(id, 'sell');
    if (i.hungerRestore > 0) mark(id, 'feed');
    if (i.curesSickness) mark(id, 'cure');
    if ((i.moodBoost ?? 0) > 0) mark(id, 'mood');
    if ((i.mutationBoost ?? 0) > 0) mark(id, 'mutation');
    if (i.hatchRarity) mark(id, 'hatch');
  }
  for (const [id, kinds] of Object.entries(CODE_USES)) for (const k of kinds ?? []) mark(id, k);
  for (const c of json('garden/crops.json').crops) mark(c.seedItem, 'plant');
  for (const f of json('cloud/flowers.json').flowers) mark(f.seedItem, 'plant');
  for (const f of json('aquarium/fish.json').fish) mark(f.item, 'tank');
  // Crossing (decision 035): a parent's harvest goes into the Garden / Cloud lab; a parent fish breeds a rarer one.
  const produceOf = new Map<string, string>([
    ...json('garden/crops.json').crops.map((c: { id: string; produceItem: string }) => [c.id, c.produceItem] as const),
    ...json('cloud/flowers.json').flowers.map((c: { id: string; produceItem: string }) => [c.id, c.produceItem] as const),
    ...json('aquarium/fish.json').fish.map((c: { id: string; item: string }) => [c.id, c.item] as const),
  ]);
  for (const file of ['garden/hybrids.json', 'cloud/hybrids.json', 'aquarium/hybrids.json']) {
    for (const r of json(file).recipes) for (const p of r.parents) mark(produceOf.get(p) ?? p, 'cross');
  }
  for (const r of json('shared/recipes.json').recipes) for (const id of Object.keys(r.inputs)) mark(id, 'recipe');
  for (const r of json('shared/orders.json').requests) mark(r.itemId, 'order');
  for (const e of json('adventure/equipment.json').equipment) mark(e.id, 'equip');
  const adv = json('adventure/balance.json');
  for (const b of adv.battleItems) mark(b.itemId, 'battle');
  for (const p of adv.prep) mark(p.itemId, 'ration');
  // A Skill Scroll gives SP to a companion (decision 037, growth.ts useScroll).
  if (adv.sp.scroll > 0) mark('item_skill_scroll', 'skill');
  // The workshop (adventure-big-update-1 §17): books give experience; the Forge turns materials into books and potions.
  const workshop = json('adventure/workshop.json');
  for (const t of workshop.tomes) mark(t.itemId, 'tome');
  for (const r of workshop.recipes) for (const id of Object.keys(r.inputs)) mark(id, 'forge');
  const upgrades = new Set<string>();
  for (const f of ['garden/balance.json', 'aquarium/balance.json', 'cloud/balance.json', 'farm/balance.json']) idsUnder(json(f), ['materials'], upgrades);
  for (const id of upgrades) mark(id, 'upgrade');
  const tech = new Set<string>();
  idsUnder(json('shared/tech.json'), ['items'], tech);
  for (const id of tech) mark(id, 'technology');
  return Object.fromEntries(ITEM_IDS.map((id) => [id, [...uses[id]]])) as Record<ItemId, UseKind[]>;
}

if (/scripts[\\/]audit[\\/]itemUses\.ts$/.test(process.argv[1] ?? '')) {
  const all = itemUses();
  const rows = ITEM_IDS.map((id) => ({ id, category: ITEMS[id].category, uses: all[id] })).sort((a, b) => a.uses.length - b.uses.length);
  for (const r of rows) console.log(`${String(r.uses.length).padStart(2)}  ${r.id.padEnd(28)} ${r.category.padEnd(9)} ${r.uses.join(', ')}`);
  const dead = rows.filter((r) => r.uses.length < 2);
  console.log(`\n${rows.length} items, ${dead.length} with fewer than two uses${dead.length ? `: ${dead.map((d) => d.id).join(', ')}` : ''}`);
  process.exitCode = dead.length ? 1 : 0;
}
