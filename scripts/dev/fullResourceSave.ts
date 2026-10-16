// npm run dev:full-save -- [out] [qty] [days] [seed]: a late-game save (like dev:rich-save) with every item in the content
// catalogue at `qty` units and a full wallet, for hands-on testing. Writes `out` (default ./saves-export/sobi-world-full-resources.json),
// a file the game's "Import save" accepts. The bag may hold more slots than its size: the game loads it, but new items will not fit.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { DAY_MS } from '../../src/core/clock';
import { ITEMS } from '../../src/core/config/items';
import { parseSave } from '../../src/core/save/migrate';
import type { WorldTransaction } from '../../src/core/save/world';
import { simulateWeek } from '../economy/week';

const out = resolve(process.argv[2] ?? 'saves-export/sobi-world-full-resources.json');
const qty = Number(process.argv[3] ?? 99);
const days = Number(process.argv[4] ?? 45);
const seed = Number(process.argv[5] ?? 7);
const WALLET = { coins: 9_999_999, gems: 99_999, eventTokens: 99_999 };

const now = Date.now();
const start = Math.floor((now - days * DAY_MS) / DAY_MS) * DAY_MS;
const base = simulateWeek(seed, start, days, { forceAdventure: true }).world;

const items: Record<string, number> = { ...base.inventory.items };
for (const id of Object.keys(ITEMS)) items[id] = Math.max(items[id] ?? 0, qty);

// The wallet change is booked like any other, so the ledger still adds up.
const grants: WorldTransaction[] = (Object.keys(WALLET) as (keyof typeof WALLET)[])
  .filter((c) => WALLET[c] > base.wallet[c])
  .map((c) => ({ id: `dev-grant-${c}-${now}`, at: now, currency: c, type: 'DEV_GRANT', amount: WALLET[c] - base.wallet[c], note: 'dev:full-save' }));

const discoveredItems = new Set([...(base.collection.discovered.item ?? []), ...Object.keys(ITEMS)]);
const world = {
  ...base,
  wallet: { ...WALLET },
  inventory: { items },
  transactions: [...grants, ...base.transactions],
  collection: { ...base.collection, discovered: { ...base.collection.discovered, item: [...discoveredItems] } },
  settings: { ...base.settings, tutorialDone: true },
};

const json = JSON.stringify(world);
const check = parseSave(json, SAVE_CODEC);
if (!check.ok) throw new Error(`the save does not load: ${JSON.stringify(check)}`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, json);
console.log(`wrote ${out}: ${Object.keys(ITEMS).length} items x ${qty}, wallet ${JSON.stringify(WALLET)}, Areas ${Object.keys(world.areas).join(', ')}`);
