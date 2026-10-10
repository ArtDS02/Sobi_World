// What the balance bot does in Sobi Cloud (GĐ9): a casual player takes the spring's water, picks what bloomed, waters and
// replants (a rare rose, a night lily, the rest common flowers), brews healing and mood potions, keeps a few for the pigs
// and fish, sells the spare, and spends on plots, the cauldron and the spring when it can pay. It does not use flowers for
// breeding: that is an extra the report leaves out. Imports only src/.
import { useFishPotion } from '../../src/areas/aquarium/logic/actions/care';
import { aquariumOf, hasAquarium } from '../../src/areas/aquarium/logic/save/lens';
import { buildCauldron, buyPlots, collectBrew, collectWater, startBrew, upgradeSpring } from '../../src/areas/cloud/logic/actions/buildings';
import { harvestFlowers, plantFlowers, waterPlots } from '../../src/areas/cloud/logic/actions/plants';
import { cloudOf, hasCloud } from '../../src/areas/cloud/logic/save/lens';
import { sellItem } from '../../src/areas/farm/logic/actions/sellItem';
import { usePotion } from '../../src/areas/farm/logic/actions/usePotion';
import { liftFarmAction } from '../../src/areas/farm/logic/world';
import type { Bot } from './week';

const RESERVE = 400;
const FLOWERS_KEPT = 12;
const POTIONS_KEPT = 4;

export function cloudRoutine(b: Bot) {
  if (!hasCloud(b.world)) return;
  const c = () => cloudOf(b.world);
  b.act('cloud water', (w, ctx) => collectWater(w, ctx));
  b.act('cloud flowers', (w, ctx) => harvestFlowers(w, {}, ctx));
  b.act('cloud potions', (w, ctx) => collectBrew(w, ctx));
  // Building and growth, whenever the money is there.
  if (!c().cauldron.built && b.coins() >= RESERVE + 700) b.act('cloud building', (w, ctx) => buildCauldron(w, ctx));
  while (b.coins() >= RESERVE + 1500 && b.act('cloud building', (w, ctx) => buyPlots(w, ctx))) {
    /* plots */
  }
  if (b.coins() >= RESERVE + 2500) b.act('cloud building', (w, ctx) => upgradeSpring(w, ctx));
  // Replant: one rose, one night lily, the rest common flowers.
  const empty = c().plots.flatMap((p, i) => (p.cropId === null ? [i] : []));
  const plant = (flowerId: string, plots: number[]) => plots.length > 0 && b.act('cloud seeds', (w, ctx) => plantFlowers(w, { flowerId, plots }, ctx));
  plant('flower_rainbow_rose', empty.slice(0, 1));
  plant('flower_moon_lily', empty.slice(1, 2));
  const common = empty.slice(2);
  plant('flower_cloud_daisy', common.filter((_, i) => i % 2 === 0));
  plant('flower_dandelion', common.filter((_, i) => i % 2 === 1));
  // Potions: healing from roses, mood from the common flowers (or the lily).
  if (c().cauldron.built && c().cauldron.job === null) {
    const healing = Math.min(b.bag('item_flower_rainbow_rose'), b.bag('item_pure_water'), 3);
    if (healing >= 1 && b.bag('item_potion_healing') < POTIONS_KEPT) b.act('cloud brewing', (w, ctx) => startBrew(w, { recipeId: 'recipe_potion_healing', batches: healing }, ctx));
    else {
      const mood = Math.min(Math.floor(b.bag('item_flower_cloud_daisy') / 2), b.bag('item_flower_dandelion'), b.bag('item_pure_water'), 3);
      if (mood >= 1) b.act('cloud brewing', (w, ctx) => startBrew(w, { recipeId: 'recipe_potion_mood', batches: mood }, ctx));
    }
  }
  // What water is left after the potions goes to the flowers.
  b.act('cloud water', (w, ctx) => waterPlots(w, {}, ctx));
  // The ill get a healing potion when the bag has one.
  for (const p of b.farm().pigs.filter((x) => x.isSick)) {
    if (b.bag('item_potion_healing') > 0) b.act('cures', liftFarmAction((s, ctx) => usePotion(s, { pigId: p.id, itemId: 'item_potion_healing' }, ctx)));
  }
  if (hasAquarium(b.world)) {
    for (const f of aquariumOf(b.world).fish.filter((x) => x.isSick)) {
      if (b.bag('item_potion_healing') > 0) b.act('cures', (w, ctx) => useFishPotion(w, { fishId: f.id, itemId: 'item_potion_healing' }, ctx));
    }
  }
  // What the bot does not keep is sold.
  for (const id of ['item_flower_cloud_daisy', 'item_flower_dandelion', 'item_flower_moon_lily', 'item_flower_star_orchid', 'item_flower_dream_bell', 'item_pure_water'] as const) {
    const spare = b.bag(id) - FLOWERS_KEPT;
    if (spare > 0) b.act('cloud sold', liftFarmAction((s, ctx) => sellItem(s, { itemId: id, quantity: spare }, ctx)));
  }
  for (const id of ['item_potion_healing', 'item_potion_mood'] as const) {
    const spare = b.bag(id) - POTIONS_KEPT;
    if (spare > 0) b.act('cloud sold', liftFarmAction((s, ctx) => sellItem(s, { itemId: id, quantity: spare }, ctx)));
  }
}
