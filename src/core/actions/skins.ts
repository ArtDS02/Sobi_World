// buySkin / equipSkin (spec §8.13, D19). Skins are pure pictures: neither action touches any number
// but gold spent on the purchase. The skin catalogue comes from the manifest (DECISIONS C2).
import { levelFromXp } from '../config/levels';
import type { SkinDef } from '../config/skins';
import type { SkinRegistry } from '../assets/registry';
import { collectionCount, discoverSkin } from '../engine/collection';
import { changeGold } from '../engine/gold';
import type { ActionContext, ActionResult, Pig, SaveGame } from '../types';
import { ok, runAction } from './runAction';

/** Whether the skin's `unlock` condition (if any) holds for this save. */
export function skinUnlocked(state: SaveGame, skin: SkinDef): boolean {
  const u = skin.unlock;
  if (!u) return true;
  if (u.kind === 'LEVEL') return levelFromXp(state.player.xp) >= u.level;
  return collectionCount(state) >= u.count;
}

/** Whether `pig` may wear `skin` (allowedBreeds). */
export const skinFits = (skin: SkinDef, pig: Pig): boolean =>
  skin.allowedBreeds === 'ALL' || skin.allowedBreeds.includes(pig.breed);

export function buySkin(
  state: SaveGame,
  args: { skinId: string },
  ctx: ActionContext,
  skins: SkinRegistry,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const skin = skins.get(args.skinId);
    if (!skin) return { ok: false, error: 'INVALID_REQUEST' };
    if (s.player.ownedSkins.includes(skin.id)) return { ok: false, error: 'SKIN_ALREADY_OWNED' };
    if (skin.priceGold === null || s.player.gold < skin.priceGold) {
      return { ok: false, error: 'INSUFFICIENT_GOLD' };
    }
    if (!skinUnlocked(s, skin)) return { ok: false, error: 'LEVEL_TOO_LOW' };

    const paid = changeGold(s, -skin.priceGold, 'SKIN_PURCHASE', ctx, { refId: skin.id });
    if (!paid.ok) return paid;
    const owned: SaveGame = {
      ...paid.state,
      player: { ...paid.state.player, ownedSkins: [...paid.state.player.ownedSkins, skin.id] },
    };
    const found = discoverSkin(owned, skin.id, ctx);
    return ok(
      found.state,
      [{ type: 'SKIN_BOUGHT', skinId: skin.id, gold: -skin.priceGold }],
      found.events,
    );
  });
}

export function equipSkin(
  state: SaveGame,
  args: { pigId: string; skinId: string },
  ctx: ActionContext,
  skins: SkinRegistry,
): ActionResult {
  return runAction(state, ctx, (s) => {
    const pig = s.pigs.find((p) => p.id === args.pigId);
    if (!pig) return { ok: false, error: 'PIG_NOT_FOUND' };
    const skin = skins.get(args.skinId);
    if (!skin) return { ok: false, error: 'INVALID_REQUEST' };
    if (!s.player.ownedSkins.includes(skin.id)) return { ok: false, error: 'SKIN_NOT_OWNED' };
    if (!skinFits(skin, pig)) return { ok: false, error: 'SKIN_BREED_NOT_ALLOWED' };
    const next: SaveGame = {
      ...s,
      pigs: s.pigs.map((p) => (p.id === pig.id ? { ...p, skinId: skin.id } : p)),
    };
    return ok(next, [{ type: 'SKIN_EQUIPPED', pigId: pig.id, skinId: skin.id }]);
  });
}
