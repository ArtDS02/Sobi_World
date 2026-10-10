// What the Codex says about a species (GĐ7): a found one tells its family, signature trait and favourite food;
// one not found yet gives a clue (rarity and family), never the recipe.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { TRAITS } from '../../../systems/breeding';
import { BREEDS } from './config/breeds';
import type { BreedId } from './config/ids';

export function codexTexts(id: BreedId): { hint: string; detail: string } {
  const def = BREEDS[id];
  const rarity = vi.rarity[def.rarity];
  const family = vi.family[def.family];
  const parts = [`${rarity} · ${t(vi.codex.family, { family })}`];
  if (def.signatureTrait) parts.push(t(vi.codex.signature, { trait: TRAITS.get(def.signatureTrait)?.nameVi ?? def.signatureTrait }));
  if (def.favorite) parts.push(t(vi.bond.favorite, { item: vi.shop[def.favorite] }));
  return { hint: t(vi.codex.hintUnknown, { rarity, family }), detail: parts.join(' · ') };
}
