// Admin "Số liệu": the numbers of the content files that tune the world (time, health, valuation,
// quality, the farm's balance, the Garden). The dashboard edits numbers only — it sends the whole file back and the
// server refuses any change that is not a number, then validates it with the game's own schema
// (content/schemas) before writing, in the stable layout of scripts/content/format.ts.
import { readContent, writeContent } from './contentFiles';

type Mod = Record<string, unknown>;
type Result = { status: number; body: unknown };

/** The editable files: the content path, and the schema that validates it. */
export const NUMBER_FILES: Record<string, { schemaPath: string; exportName: string }> = {
  'shared/time.json': { schemaPath: '/content/schemas/shared/time.ts', exportName: 'timeFileSchema' },
  'shared/health.json': { schemaPath: '/content/schemas/shared/health.ts', exportName: 'healthFileSchema' },
  'shared/valuation.json': { schemaPath: '/content/schemas/shared/valuation.ts', exportName: 'valuationFileSchema' },
  'shared/quality.json': { schemaPath: '/content/schemas/shared/quality.ts', exportName: 'qualityFileSchema' },
  'shared/inventory.json': { schemaPath: '/content/schemas/shared/inventory.ts', exportName: 'inventoryFileSchema' },
  'farm/balance.json': { schemaPath: '/content/schemas/farm/balance.ts', exportName: 'farmBalanceFileSchema' },
  // Sobi Garden (GĐ5): the plants, the workshops and sprinkler, the recipes, the prices of the items.
  'garden/crops.json': { schemaPath: '/content/schemas/garden/crops.ts', exportName: 'cropsFileSchema' },
  'garden/balance.json': { schemaPath: '/content/schemas/garden/balance.ts', exportName: 'gardenBalanceFileSchema' },
  'shared/recipes.json': { schemaPath: '/content/schemas/shared/recipes.ts', exportName: 'recipesFileSchema' },
  'shared/items.json': { schemaPath: '/content/schemas/shared/items.ts', exportName: 'itemsFileSchema' },
  // Engagement (GĐ6): the world level, bond, the Order Board, the daily goals, achievements, the Codex, decorations, the NPCs' words.
  'shared/progression.json': { schemaPath: '/content/schemas/shared/progression.ts', exportName: 'progressionFileSchema' },
  'shared/bond.json': { schemaPath: '/content/schemas/shared/bond.ts', exportName: 'bondFileSchema' },
  'shared/orders.json': { schemaPath: '/content/schemas/shared/orders.ts', exportName: 'ordersFileSchema' },
  'shared/goals.json': { schemaPath: '/content/schemas/shared/goals.ts', exportName: 'goalsFileSchema' },
  'shared/achievements.json': { schemaPath: '/content/schemas/shared/achievements.ts', exportName: 'achievementsFileSchema' },
  'shared/codex.json': { schemaPath: '/content/schemas/shared/codex.ts', exportName: 'codexFileSchema' },
  'farm/decor.json': { schemaPath: '/content/schemas/farm/decor.ts', exportName: 'decorFileSchema' },
  'shared/npcs.json': { schemaPath: '/content/schemas/shared/npcs.ts', exportName: 'npcsFileSchema' },
  // Sobi Aquarium (GĐ8): the fish (growth, prices, how often they bite, names and descriptions), the tank, the rod, the eggs.
  'aquarium/fish.json': { schemaPath: '/content/schemas/aquarium/fish.ts', exportName: 'fishFileSchema' },
  'aquarium/balance.json': { schemaPath: '/content/schemas/aquarium/balance.ts', exportName: 'aquariumBalanceFileSchema' },
  // Advanced breeding (GĐ7): the traits (effects, weights), the rules (inheritance, mutation, pity), the Breeder's gossip.
  'breeding/traits.json': { schemaPath: '/content/schemas/breeding/traits.ts', exportName: 'traitsFileSchema' },
  'breeding/balance.json': { schemaPath: '/content/schemas/breeding/balance.ts', exportName: 'breedingBalanceFileSchema' },
  'breeding/rumors.json': { schemaPath: '/content/schemas/breeding/rumors.ts', exportName: 'rumorsFileSchema' },
};

/** Files whose words (the strings ending in `Vi`) can be edited as well as their numbers: the NPCs' lines. */
export const TEXT_FILES: readonly string[] = ['shared/npcs.json', 'breeding/traits.json', 'breeding/rumors.json', 'aquarium/fish.json'];

/** A path that holds words the dashboard may edit: keys ending in `Vi`, and the rumour sentences. */
export const isWordPath = (path: string): boolean =>
  /Vi$/.test(path) || /^(recipeTemplates|noNews|tips)\[\d+\]$/.test(path) || /^rarityWords\.[A-Z]+$/.test(path);

export const readNumbers = (): Record<string, unknown> =>
  Object.fromEntries(Object.keys(NUMBER_FILES).map((file) => [file, readContent(file)]));

/** Same shape and same non-number values; only numbers may differ (and, with `texts`, the words of keys ending in `Vi`). */
export function onlyNumbersDiffer(before: unknown, after: unknown, path = '', texts = false): string | null {
  if (typeof before === 'number') return typeof after === 'number' && Number.isFinite(after) ? null : `${path}: phải là số`;
  if (texts && typeof before === 'string' && isWordPath(path)) return typeof after === 'string' && after.trim().length > 0 ? null : `${path}: không để trống`;
  if (Array.isArray(before)) {
    if (!Array.isArray(after) || after.length !== before.length) return `${path}: không đổi số phần tử`;
    for (const [i, v] of before.entries()) {
      const bad = onlyNumbersDiffer(v, after[i], `${path}[${i}]`, texts);
      if (bad) return bad;
    }
    return null;
  }
  if (before && typeof before === 'object') {
    if (!after || typeof after !== 'object' || Array.isArray(after)) return `${path}: sai kiểu`;
    const keys = Object.keys(before);
    if (Object.keys(after).length !== keys.length) return `${path}: không đổi danh sách khóa`;
    for (const k of keys) {
      const bad = onlyNumbersDiffer((before as Mod)[k], (after as Mod)[k], path ? `${path}.${k}` : k, texts);
      if (bad) return bad;
    }
    return null;
  }
  return before === after ? null : `${path}: chỉ sửa được số`;
}

export async function saveNumbers(
  body: { file: string; value: unknown },
  load: (p: string) => Promise<Mod>,
): Promise<Result> {
  const target = Object.hasOwn(NUMBER_FILES, body.file) ? NUMBER_FILES[body.file] : undefined;
  if (!target) return { status: 400, body: { error: `không sửa được file ${body.file}` } };
  const bad = onlyNumbersDiffer(readContent(body.file), body.value, '', TEXT_FILES.includes(body.file));
  if (bad) return { status: 400, body: { error: bad } };
  const problems = await writeContent(load, body.file, target.schemaPath, target.exportName, body.value);
  return problems.length > 0 ? { status: 400, body: { error: problems.join('\n') } } : { status: 200, body: { ok: true } };
}
