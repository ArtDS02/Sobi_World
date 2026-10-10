// What the balance bot does in Sobi Aquarium (GĐ8): a casual player casts the rod a few times a session, puts what bites
// into the tank while there is room (the rest is sold), keeps the fish fed and the water clear, cures the ill, sells the
// fully grown, and upgrades the tank when it can pay (coins and the scales/pearls the tank gave). It does not breed:
// eggs are an extra the report leaves out, so the pace it shows is the floor. Imports only src/.
import { cleanTank, feedFish, treatFish } from '../../src/areas/aquarium/logic/actions/care';
import { castLine, releaseFish } from '../../src/areas/aquarium/logic/actions/fishing';
import { collectScales, sellCatch, sellFish, upgradeTank } from '../../src/areas/aquarium/logic/actions/trade';
import { AB, FISH, FISH_LIST } from '../../src/areas/aquarium/logic/config/content';
import { tankFree } from '../../src/areas/aquarium/logic/derived';
import { aquariumOf, hasAquarium } from '../../src/areas/aquarium/logic/save/lens';
import { buyProduct } from '../../src/areas/farm/logic/actions/buyProduct';
import { liftFarmAction } from '../../src/areas/farm/logic/world';
import type { Bot } from './week';

/** Casts per session: a person fishing a few minutes between other chores. */
export const CASTS_PER_SESSION = 6;
/** How well the bot times the mini-game: between this and 1 (a casual player is neither perfect nor hopeless). */
const SKILL_FLOOR = 0.35;

export function aquariumRoutine(b: Bot) {
  if (!hasAquarium(b.world)) return;
  const a = () => aquariumOf(b.world);
  // The rod first: the cooldown runs while the rest of the session goes on.
  for (let i = 0; i < CASTS_PER_SESSION; i += 1) {
    const score = SKILL_FLOOR + b.rng.next() * (1 - SKILL_FLOOR);
    if (b.act('fishing (rod)', (w, c) => castLine(w, { score }, c))) b.casts += 1;
    b.advance(b.now + AB.fishing.cooldownSec * 1000 + 10_000);
  }
  b.act('aquarium', (w, c) => collectScales(w, {}, c));
  // What bit: into the tank while there is room, the rest sold.
  for (const f of FISH_LIST) {
    while (b.bag(f.item) > 0 && tankFree(a()) > 0) if (!b.act('aquarium', (w, c) => releaseFish(w, { itemId: f.item }, c))) break;
    const left = b.bag(f.item);
    if (left > 0) b.act('fish sold (caught)', (w, c) => sellCatch(w, { itemId: f.item, quantity: left }, c));
  }
  // Pearls are kept for the upgrades; nothing else of the bag is sold here.
  // Care: the ill, the water, the hungry.
  for (const fish of a().fish.filter((x) => x.isSick)) {
    if (b.bag('MEDICINE_COMMON') < 1 && b.coins() >= 100) b.act('medicine', liftFarmAction((s, c) => buyProduct(s, { productId: 'MEDICINE_COMMON', count: 1 }, c)));
    b.act('cures', (w, c) => treatFish(w, { fishId: fish.id }, c));
  }
  if (a().tank.water < 70) b.act('aquarium', (w, c) => cleanTank(w, {}, c));
  const hungry = a().fish.filter((f) => f.hunger < 70).map((f) => f.id);
  if (hungry.length > 0) b.act('aquarium', (w, c) => feedFish(w, { fishIds: hungry }, c));
  // The fully grown stay (they shed scales) until the tank is full; then the cheapest grown one makes room for the next catch.
  while (tankFree(a()) === 0) {
    const grown = a()
      .fish.filter((x) => x.growthProgress >= 100)
      .sort((x, y) => (FISH[x.breed]?.tankGold ?? 0) - (FISH[y.breed]?.tankGold ?? 0));
    if (grown.length === 0 || !b.act('fish sold (raised)', (w, c) => sellFish(w, { fishId: grown[0]!.id }, c))) break;
    b.fishSold += 1;
  }
  while (b.act('tank upgrade', (w, c) => upgradeTank(w, {}, c))) {
    /* as many as it can afford */
  }
}
