// The Breeder's gossip (spec V2 §9): each game day a few hints about special recipes the player has not found,
// plus a tip. A hint names the parents only by a clue (their family and rarity) and the result only by rarity and
// theme, never by species, so it points without spelling the answer. Deterministic per day: it does not change
// when the game is reopened.
import { hashSeed } from '../../core/rng';

export interface RumorRecipe {
  parents: readonly [string, string];
  result: string;
}

/** How a species is talked about: `clue` for a parent ("heo Phổ thông họ Biển"), `rarity` and `theme` for the result. */
export interface RumorLook {
  clue: string;
  rarity: string;
  theme: string;
}

export interface RumorTexts {
  recipeTemplates: readonly string[];
  rarityWords: Readonly<Record<string, string>>;
  noNews: readonly string[];
  tips: readonly string[];
}

export interface RumorInput {
  /** Game day (the local day number the world uses). */
  day: number;
  recipes: readonly RumorRecipe[];
  /** The result species is already in the player's Codex: no point hinting at it. */
  isKnown: (breed: string) => boolean;
  look: (breed: string) => RumorLook;
  texts: RumorTexts;
  /** How many rumours today; the last one is a tip. */
  perDay: number;
}

export interface Rumor {
  kind: 'recipe' | 'tip' | 'none';
  text: string;
  /** The recipe the hint is about (never shown; for tests and the admin). */
  recipe?: RumorRecipe;
}

const fill = (template: string, values: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);

/** The rumours of game day `day`. */
export function rumorsOfDay(input: RumorInput): Rumor[] {
  const { day, texts } = input;
  const hints = Math.max(0, input.perDay - 1);
  // A stable order, so the day's pick does not depend on how the recipes are listed.
  const open = input.recipes
    .filter((r) => !input.isKnown(r.result))
    .map((r) => ({ r, key: `${[...r.parents].sort().join('+')}>${r.result}` }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const out: Rumor[] = [];
  const used = new Set<number>();
  for (let slot = 0; slot < hints; slot += 1) {
    const free = open.map((_, i) => i).filter((i) => !used.has(i));
    if (free.length === 0) {
      out.push({ kind: 'none', text: texts.noNews[hashSeed('rumor-none', day, slot) % texts.noNews.length]! });
      continue;
    }
    const index = free[hashSeed('rumor', day, slot) % free.length]!;
    used.add(index);
    const { r } = open[index]!;
    const result = input.look(r.result);
    const template = texts.recipeTemplates[hashSeed('rumor-template', day, slot) % texts.recipeTemplates.length]!;
    // Which parent is named first is part of the day's luck, not of the recipe.
    const swap = hashSeed('rumor-order', day, slot) % 2 === 1;
    const [pa, pb] = swap ? [r.parents[1], r.parents[0]] : [r.parents[0], r.parents[1]];
    out.push({
      kind: 'recipe',
      recipe: r,
      text: fill(template, {
        parentA: input.look(pa).clue,
        parentB: input.look(pb).clue,
        rarity: texts.rarityWords[result.rarity] ?? result.rarity,
        theme: result.theme,
      }),
    });
  }
  if (input.perDay > hints) {
    out.push({ kind: 'tip', text: texts.tips[hashSeed('rumor-tip', day) % texts.tips.length]! });
  }
  return out;
}
