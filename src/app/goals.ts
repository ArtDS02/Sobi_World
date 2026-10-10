// The world's goals wired to the Areas of this build: what they add to the Codex and to the 'ALL' achievements
// (core/goals/api.ts). The item kind of the Codex is the world's own: every item of the shared bag.
import { itemArtId } from '../core/config/assetIds';
import { ITEM_IDS, ITEMS } from '../core/config/items';
import type { CodexKind } from '../core/collection/codex';
import { createGoals } from '../core/goals/api';
import { vi } from '../i18n/vi';
import { AREAS } from './areas';

const itemKind = (): CodexKind => ({
  id: 'item',
  name: vi.codex.kinds.item,
  entries: ITEM_IDS.map((id) => ({ id, name: vi.shop[id], artId: itemArtId(id), rarity: ITEMS[id].rarity })),
});

export const GOALS = createGoals({
  codexKinds: () => [...AREAS.codexKinds(), itemKind()],
  extraTotals: () => AREAS.extraTotals(),
});
