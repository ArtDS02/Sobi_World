// The bot in the living world (GĐ12): it claims the festival gift, spends its Event Tokens on what is worth most, and delivers the
// merchant's special orders whenever the bag allows. The weather needs no routine: it acts on the crops and the rod by itself.
// Prints what the festivals and the merchant add to the pace, in coins' worth, so a balance edit shows its effect. Imports only src/.
import { GOALS } from '../../src/app/goals';
import { FESTIVAL_RULES } from '../../src/core/config/live';
import { DAY_MS } from '../../src/core/clock';
import { ITEMS } from '../../src/core/config/items';
import { liveFestival, shopOf } from '../../src/core/live/festival';
import type { Bot } from './week';

export interface LiveStats {
  tokensEarned: number;
  tokensSpent: number;
  /** Days of play on which a festival ran, and gifts claimed. */
  festivalDays: number;
  gifts: number;
  /** What the festival shop gave, in coins' worth (the items' sale price, else their shop price), and how many of each shop entry. */
  boughtWorth: number;
  bought: Record<string, number>;
  merchantDelivered: number;
  merchantCoins: number;
}

export const newLiveStats = (): LiveStats => ({ tokensEarned: 0, tokensSpent: 0, festivalDays: 0, gifts: 0, boughtWorth: 0, bought: {}, merchantDelivered: 0, merchantCoins: 0 });

const worth = (entry: ReturnType<typeof shopOf>[number]): number =>
  entry.reward.kind === 'item' ? entry.reward.quantity * (ITEMS[entry.reward.itemId as keyof typeof ITEMS]?.sellGold ?? ITEMS[entry.reward.itemId as keyof typeof ITEMS]?.priceGold ?? 0) : 0;

export function liveRoutine(b: Bot) {
  const day = Math.floor(b.now / DAY_MS);
  const fest = liveFestival(day, b.world.live.dev.festival, FESTIVAL_RULES);
  if (fest) {
    if (b.act('festival', GOALS.claimFestivalGift())) b.live.gifts += 1;
    // Best value per token first (the gems are left to the player).
    const stock = shopOf(fest, FESTIVAL_RULES)
      .filter((s) => s.reward.kind === 'item')
      .sort((x, y) => worth(y) / y.cost - worth(x) / x.cost);
    for (const entry of stock) {
      while (b.world.wallet.eventTokens >= entry.cost && b.act('festival shop', GOALS.buyFestivalItem(entry.id))) {
        b.live.bought[entry.id] = (b.live.bought[entry.id] ?? 0) + 1;
        b.live.boughtWorth += worth(entry);
      }
    }
  }
  const m = b.world.live.merchant;
  if (m.present && m.day === day) {
    m.offers.forEach((offer, i) => {
      if (m.done[i]) return;
      if (b.act('merchant', GOALS.deliverMerchant(i))) {
        b.live.merchantDelivered += 1;
        b.live.merchantCoins += offer.coins;
      }
    });
  }
}
