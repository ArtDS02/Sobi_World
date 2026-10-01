// Skins and collection view-models (spec §6.6, §8.13, §8.15). The skin catalogue and thumbnails
// come from the manifest registry (DECISIONS C2); buttons dry-run the real actions for reasons.
import { buySkin, equipSkin, skinFits, skinUnlocked } from '../core/actions/skins';
import type { AssetRegistry } from '../core/assets/registry';
import { BREEDS } from '../core/config/breeds';
import { BREED_ID_VALUES } from '../core/config/ids';
import type { SkinDef } from '../core/config/skins';
import type { Pig, SaveGame } from '../core/types';
import { formatInt, t } from '../i18n/format';
import { vi } from '../i18n/vi';
import type { BoundAction } from '../store/gameStore';
import { probe, reasonFor, type ActionVm } from './actionsVm';

export interface SkinCardVm {
  id: string;
  name: string;
  /** Thumbnail URL from the manifest, or null when the row has no file. */
  thumb: string | null;
  price: string;
  button: ActionVm;
}

function lockText(skin: SkinDef): string {
  const u = skin.unlock;
  if (!u) return vi.error.LEVEL_TOO_LOW;
  return u.kind === 'LEVEL'
    ? t(vi.shop.slotLocked, { level: u.level })
    : t(vi.shop.collectionLocked, { count: u.count });
}

/** Shop skins tab: every skin with a price (§6.6), owned ones marked. */
export function shopSkins(save: SaveGame, now: number, assets: AssetRegistry): SkinCardVm[] {
  return assets.skins.forSale().map((skin) => {
    const run: BoundAction = (s, c) => buySkin(s, { skinId: skin.id }, c, assets.skins);
    const error = probe(save, run, now);
    const owned = save.player.ownedSkins.includes(skin.id);
    // The unlock gate reads better than "not enough gold" when both fail.
    const reason = owned
      ? vi.shop.owned
      : !skinUnlocked(save, skin)
        ? lockText(skin)
        : error
          ? reasonFor(error)
          : null;
    return {
      id: skin.id,
      name: skin.nameVi,
      thumb: assets.url(skin.id),
      price: t(vi.hud.gold, { amount: formatInt(skin.priceGold ?? 0) }),
      button: { label: vi.action.buy, reason, run },
    };
  });
}

/** Wardrobe for one pig: owned skins its breed may wear; the current one is shown as worn. */
export function pigSkins(save: SaveGame, pig: Pig, assets: AssetRegistry): SkinCardVm[] {
  return save.player.ownedSkins
    .map((id) => assets.skins.get(id))
    .filter((skin): skin is SkinDef => !!skin && skinFits(skin, pig))
    .map((skin) => {
      const worn = pig.skinId === skin.id;
      return {
        id: skin.id,
        name: skin.nameVi,
        thumb: assets.url(skin.id),
        price: '',
        button: {
          label: worn ? vi.action.equipped : vi.action.equip,
          reason: worn ? vi.action.equipped : null,
          run: (s, c) => equipSkin(s, { pigId: pig.id, skinId: skin.id }, c, assets.skins),
        },
      };
    });
}

export interface BookEntryVm {
  id: string;
  /** Real name when discovered, vi.collection.undiscovered otherwise (silhouette). */
  name: string;
  thumb: string | null;
  found: boolean;
}

export interface CollectionVm {
  breeds: BookEntryVm[];
  skins: BookEntryVm[];
  breedProgress: string;
  skinProgress: string;
}

export function collectionVm(save: SaveGame, assets: AssetRegistry | null): CollectionVm {
  const { discoveredBreeds, discoveredSkins } = save.collection;
  const entry = (id: string, name: string, found: boolean): BookEntryVm => ({
    id,
    name: found ? name : vi.collection.undiscovered,
    thumb: assets?.url(id) ?? null,
    found,
  });
  const breeds = BREED_ID_VALUES.map((b) =>
    entry(BREEDS[b].defaultSkin, BREEDS[b].nameVi, discoveredBreeds.includes(b)),
  );
  // A discovered breed's default skin counts too: saves from before R07B never recorded it.
  const defaults = new Set(discoveredBreeds.map((b) => BREEDS[b].defaultSkin));
  const skins = (assets?.skins.all() ?? []).map((s) =>
    entry(s.id, s.nameVi, discoveredSkins.includes(s.id) || defaults.has(s.id)),
  );
  const progress = (list: BookEntryVm[]) =>
    t(vi.collection.progress, { found: list.filter((e) => e.found).length, total: list.length });
  return { breeds, skins, breedProgress: progress(breeds), skinProgress: progress(skins) };
}
