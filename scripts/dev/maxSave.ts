// npm run dev:max-save -- [out] [sandbox]: a test save with everything at its cap, for hands-on testing of the late game and the
// Adventure. It starts from dev:full-save's world (a bot played 45 days, every item x99, a full wallet) and adds: the top world
// level, one grown pig of every breed and one grown fish of every species (also in the Codex), every zone of the Adventure open
// with its portals lit, and every fighter at the top level with all its skill points and full energy.
// Writes `out` (default ./saves-export/sobi-world-max.json, a file the game's "Import save" accepts) and, with a second argument
// `sandbox`, also <%TEMP%\sobiworld-sandbox>\saves\save.json for `npm run dev:sandbox`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { DAY_MS } from '../../src/core/clock';
import { ITEMS } from '../../src/core/config/items';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { worldXp } from '../../src/core/progression/levels';
import { parseSave } from '../../src/core/save/migrate';
import type { WorldSave, WorldTransaction } from '../../src/core/save/world';
import { ADVENTURE_AREA_ID, AB, MAP_LIST, ZONE_LIST, identityOf } from '../../src/areas/adventure/logic/config/content';
import { newFighter } from '../../src/areas/adventure/logic/fighters';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { adventureStateSchema } from '../../src/areas/adventure/logic/state';
import { AQUARIUM_AREA_ID, FISH } from '../../src/areas/aquarium/logic/config/content';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import { aquariumStateSchema } from '../../src/areas/aquarium/logic/state';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { farmAreaSchema } from '../../src/areas/farm/logic/save/farmSchema';
import { FARM_AREA_ID, farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { simulateWeek } from '../economy/week';

const out = resolve(process.argv[2] ?? 'saves-export/sobi-world-max.json');
const toSandbox = process.argv[3] === 'sandbox';
const WALLET = { coins: 9_999_999, gems: 99_999, eventTokens: 99_999 };
const QTY = 99;

const now = Date.now();
const days = 45;
// The bot plays up to now, so opening the save has no long catch-up (and no hungry, sick pen) waiting.
const start = now - days * DAY_MS;
let world: WorldSave = simulateWeek(7, start, days, { forceAdventure: true }).world;

// ---- wallet and bag (as dev:full-save) ----
const items: Record<string, number> = { ...world.inventory.items };
for (const id of Object.keys(ITEMS)) items[id] = Math.max(items[id] ?? 0, QTY);
const grants: WorldTransaction[] = (Object.keys(WALLET) as (keyof typeof WALLET)[])
  .filter((c) => WALLET[c] > world.wallet[c])
  .map((c) => ({ id: `dev-grant-${c}-${now}`, at: now, currency: c, type: 'DEV_GRANT', amount: WALLET[c] - world.wallet[c], note: 'dev:max-save' }));
world = { ...world, wallet: { ...WALLET }, inventory: { items }, transactions: [...grants, ...world.transactions], settings: { ...world.settings, tutorialDone: true } };

// ---- top world level: the missing XP goes to the farm ----
const topXp = WORLD_LEVELS.xp[WORLD_LEVELS.maxLevel - 1] ?? 0;
const missingXp = Math.max(0, topXp - worldXp(world));
const farmXp = world.progression.areas[FARM_AREA_ID]?.xp ?? 0;
world = { ...world, progression: { ...world.progression, areas: { ...world.progression.areas, [FARM_AREA_ID]: { xp: farmXp + missingXp } } } };

// Fed, clean, rested and well: no illness record either.
const fit = <T extends object>(c: T): T => {
  const healed: Record<string, unknown> = { ...c, growthProgress: 100, hunger: 100, cleanliness: 100, energy: 100, isSick: false, illRisk: 0, poopProgress: 0 };
  for (const k of ['lastSickAt', 'sickDay', 'recoveringUntil']) delete healed[k];
  return healed as T;
};

// ---- one grown pig of every breed ----
const farm = farmOf(world);
const pigTemplate = farm.pigs[0];
if (!pigTemplate) throw new Error('the bot farm has no pig to copy');
const haveBreeds = new Set(farm.pigs.map((p) => p.breed));
const newPigs = Object.values(BREEDS)
  .filter((b) => b.enabled && !haveBreeds.has(b.id))
  .map((b, i) => ({
    ...pigTemplate,
    id: `dev-pig-${b.id}`,
    breed: b.id,
    name: b.nameVi.slice(0, 16).trim(),
    gender: i % 2 === 0 ? ('FEMALE' as const) : ('MALE' as const),
    growthProgress: 100,
    isSick: false,
    pregnancy: null,
    purpose: 'ADVENTURE' as const,
    createdAt: now - 30 * DAY_MS,
  }));
const pigs = [...farm.pigs, ...newPigs].map((p, slotIndex) => ({ ...fit(p), slotIndex }));
const trough = BALANCE.TROUGH_LEVELS.at(-1)!;
world = withFarm(world, {
  ...farm,
  pigs,
  manure: 0,
  trough: { ...farm.trough, level: BALANCE.TROUGH_LEVELS.length, capacity: trough.capacity, food: trough.capacity },
  player: { ...farm.player, unlockedSlots: Math.max(farm.player.unlockedSlots, pigs.length) },
});

// ---- one grown fish of every species ----
const aq = aquariumOf(world);
const fishTemplate = aq.fish[0];
if (!fishTemplate) throw new Error('the bot tank has no fish to copy');
const haveFish = new Set(aq.fish.map((f) => f.breed));
const newFish = Object.values(FISH)
  .filter((f) => !haveFish.has(f.id))
  .map((f, i) => ({
    ...fishTemplate,
    id: `dev-fish-${f.id}`,
    breed: f.id,
    name: f.nameVi.slice(0, 16).trim(),
    gender: i % 2 === 0 ? ('FEMALE' as const) : ('MALE' as const),
    growthProgress: 100,
    isSick: false,
    purpose: f.fighter ? ('ADVENTURE' as const) : fishTemplate.purpose,
    createdAt: now - 30 * DAY_MS,
  }));
world = withAquarium(world, { ...aq, tank: { ...aq.tank, level: 5, water: 100 }, fish: [...aq.fish, ...newFish].map((f) => ({ ...fit(f), lastFedAt: now })) });

// ---- Codex: every item, breed and fish discovered ----
const union = (kind: string, ids: string[]) => [...new Set([...(world.collection.discovered[kind] ?? []), ...ids])];
world = {
  ...world,
  collection: {
    ...world.collection,
    discovered: {
      ...world.collection.discovered,
      item: union('item', Object.keys(ITEMS)),
      breed: union('breed', Object.values(BREEDS).filter((b) => b.enabled).map((b) => b.id)),
      fish: union('fish', Object.keys(FISH)),
    },
  },
};

// ---- Adventure: every zone open, every fighter at the top level ----
const roster = [
  ...farmOf(world).pigs.map((p) => ({ key: `${FARM_AREA_ID}:${p.id}`, kind: 'pig' as const, speciesId: p.breed, family: BREEDS[p.breed].family })),
  ...aquariumOf(world)
    .fish.filter((f) => FISH[f.breed]?.fighter)
    .map((f) => ({ key: `${AQUARIUM_AREA_ID}:${f.id}`, kind: 'fish' as const, speciesId: f.breed, family: null })),
].filter((r) => identityOf(r));
const adv = adventureOf(world);
const top = AB.levels.maxLevel;
const fighters = Object.fromEntries(
  roster.map((r) => {
    const f = adv.fighters[r.key] ?? newFighter(now);
    return [r.key, { ...f, level: top, exp: 0, energy: AB.run.energyMax, energyAt: now, exhaustedUntil: null, sp: Math.max(f.sp, AB.sp.perLevel * (top - 1) + 40), rage: 0 }];
  }),
);
world = withAdventure(world, {
  ...adv,
  fighters,
  run: null,
  cleared: Object.fromEntries(ZONE_LIST.map((z) => [z.id, Math.max(1, adv.cleared[z.id] ?? 0)])),
  activePortals: [...new Set([...adv.activePortals, ...MAP_LIST.map((m) => m.id)])],
});

const json = JSON.stringify(world);
const check = parseSave(json, SAVE_CODEC);
if (!check.ok) {
  for (const [id, schema] of [[FARM_AREA_ID, farmAreaSchema], [AQUARIUM_AREA_ID, aquariumStateSchema], [ADVENTURE_AREA_ID, adventureStateSchema]] as const) {
    const r = schema.safeParse(world.areas[id]);
    if (!r.success) console.error(id, JSON.stringify(r.error.issues.slice(0, 5)));
  }
  throw new Error(`the save does not load: ${check.error}`);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, json);
console.log(`wrote ${out}: ${pigs.length} pigs, ${aquariumOf(world).fish.length} fish, ${Object.keys(fighters).length} fighters at level ${top}, Areas ${Object.keys(world.areas).join(', ')}`);
if (toSandbox) {
  const folder = process.env.SOBIWORLD_SANDBOX ?? join(tmpdir(), 'sobiworld-sandbox');
  mkdirSync(join(folder, 'saves'), { recursive: true });
  writeFileSync(join(folder, 'saves', 'save.json'), json);
  console.log(`wrote ${join(folder, 'saves', 'save.json')}`);
}
