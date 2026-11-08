// The seasonal pig show (D3): a pig enters once per season and is judged on its quality, rarity, traits, bond, generation,
// family tree and care, plus a small jitter from the injected rng. The score decides the place; places pay coins and
// festival tokens through the ledger (a Transaction each). Every number lives in content/farm/show.json.
import { DAY_MS } from '../../../core/clock';
import { postTransaction } from '../../../core/economy/ledger';
import { QUALITY_VALUES } from '../../../systems/quality/quality';
import { rarityRank } from '../../../core/config/rarity';
import { flattenAncestors } from '../../../systems/breeding';
import { BREEDS } from './config/breeds';
import { FARM_CONTENT } from './config/content';
import { changeGold } from './gold';
import { pigHearts } from './heredity';
import { pigQuality } from './pricing';
import type { ActionContext, ActionResult, FarmGame, Pig, Transaction } from './types';
import { ok, runAction } from './actions/runAction';

export const SHOW = FARM_CONTENT.show;

/** The season a moment belongs to: `seasonDays` days of local game time each. */
export const showSeason = (now: number, dayOffsetMs = 0): number => Math.floor(Math.floor((now + dayOffsetMs) / DAY_MS) / SHOW.seasonDays);

type Judged = Pick<Pig, 'breed' | 'growthProgress' | 'hunger' | 'cleanliness' | 'isSick'> &
  Partial<Pick<Pig, 'id' | 'bond' | 'energy' | 'moodAvg' | 'moodSec' | 'lastSickAt' | 'traits' | 'hiddenTrait' | 'generation' | 'lineage'>>;

export interface ShowScore {
  /** Without the jitter: what the pig brings. */
  base: number;
  /** The parts that make `base`, for the screen. */
  parts: { quality: number; rarity: number; traits: number; bond: number; generation: number; family: number; care: number };
}

/** What a pig brings to the show before the judges' jitter. Pure. */
export function showBase(pig: Judged): ShowScore {
  const J = SHOW.judges;
  const quality = QUALITY_VALUES.indexOf(pigQuality(pig)) * J.qualityPoints;
  const rarity = rarityRank(BREEDS[pig.breed].rarity) * J.rarityPoints;
  const traits = Math.min(J.traitCap, ((pig.traits?.length ?? 0) + (pig.hiddenTrait ? 1 : 0)) * J.traitPoints);
  const bond = pigHearts({ bond: pig.bond }) * J.bondPerHeart;
  const generation = Math.min(J.generationCap, Math.max(0, (pig.generation ?? 1) - 1) * J.generationPoints);
  const family = Math.min(J.lineageCap, (pig.lineage ? flattenAncestors(pig.lineage).length : 0) * J.lineagePoints);
  const care = ((Math.max(0, pig.hunger) + Math.max(0, pig.cleanliness)) / 200) * J.carePoints;
  const parts = { quality, rarity, traits, bond, generation, family, care };
  return { base: quality + rarity + traits + bond + generation + family + care, parts };
}

/** The place a score earns (1 = best) with its prize, or 0 with the participation prize. */
export function placeOf(score: number): { place: number; coins: number; tokens: number } {
  const hit = SHOW.places.find((p) => score >= p.minScore);
  return hit ? { place: hit.place, coins: hit.coins, tokens: hit.tokens } : { place: 0, ...SHOW.participation };
}

/** Festival tokens through the ledger: the farm holds `tokens` only while it has some (the lens mirrors the wallet). */
function changeTokens(state: FarmGame, amount: number, ctx: ActionContext, refId?: string): { ok: true; state: FarmGame } | { ok: false; error: 'INVALID_REQUEST' | 'INSUFFICIENT_GOLD' } {
  if (amount === 0) return { ok: true, state };
  const posted = postTransaction<Transaction>(state.tokens ?? 0, state.transactions, amount, { type: 'SHOW_REWARD', currency: 'eventTokens', ...(refId ? { refId } : {}) }, ctx);
  if (!posted.ok) return posted;
  return { ok: true, state: { ...state, tokens: posted.balance, transactions: posted.transactions } };
}

export function showEntered(state: Pick<FarmGame, 'showEntries'>, pigId: string, season: number): boolean {
  return state.showEntries?.season === season && state.showEntries.pigIds.includes(pigId);
}

/** Why a pig cannot enter now, or null. */
export function showError(state: FarmGame, pig: Pig | undefined, season: number): 'PIG_NOT_FOUND' | 'PIG_NOT_MATURE' | 'PIG_IS_SICK' | 'PIG_IS_PREGNANT' | 'ALREADY_CLAIMED' | null {
  if (!pig) return 'PIG_NOT_FOUND';
  if (pig.growthProgress < 100) return 'PIG_NOT_MATURE';
  if (pig.isSick) return 'PIG_IS_SICK';
  if (pig.pregnancy) return 'PIG_IS_PREGNANT';
  if (showEntered(state, pig.id, season)) return 'ALREADY_CLAIMED';
  return null;
}

export function enterShow(state: FarmGame, args: { pigId: string }, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    const season = showSeason(ctx.now, ctx.dayOffsetMs);
    const error = showError(s, pig, season);
    if (error || !pig) return { ok: false, error: error ?? 'PIG_NOT_FOUND' };
    const score = showBase(pig).base + ctx.rng.next() * SHOW.judges.jitter;
    const prize = placeOf(score);
    const paid = changeGold(s, prize.coins, 'SHOW_REWARD', ctx, { refId: pig.id });
    if (!paid.ok) return paid;
    const tokens = changeTokens(paid.state, prize.tokens, ctx, pig.id);
    if (!tokens.ok) return tokens;
    const entries = s.showEntries?.season === season ? s.showEntries.pigIds : [];
    const next: FarmGame = { ...tokens.state, showEntries: { season, pigIds: [...entries, pig.id] } };
    return ok(next, [{ type: 'SHOW_ENTERED', pigId: pig.id, name: pig.name, place: prize.place, score: Math.round(score), coins: prize.coins, tokens: prize.tokens }]);
  });
}
