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
};

export const readNumbers = (): Record<string, unknown> =>
  Object.fromEntries(Object.keys(NUMBER_FILES).map((file) => [file, readContent(file)]));

/** Same shape and same non-number values; only numbers may differ. */
export function onlyNumbersDiffer(before: unknown, after: unknown, path = ''): string | null {
  if (typeof before === 'number') return typeof after === 'number' && Number.isFinite(after) ? null : `${path}: phải là số`;
  if (Array.isArray(before)) {
    if (!Array.isArray(after) || after.length !== before.length) return `${path}: không đổi số phần tử`;
    for (const [i, v] of before.entries()) {
      const bad = onlyNumbersDiffer(v, after[i], `${path}[${i}]`);
      if (bad) return bad;
    }
    return null;
  }
  if (before && typeof before === 'object') {
    if (!after || typeof after !== 'object' || Array.isArray(after)) return `${path}: sai kiểu`;
    const keys = Object.keys(before);
    if (Object.keys(after).length !== keys.length) return `${path}: không đổi danh sách khóa`;
    for (const k of keys) {
      const bad = onlyNumbersDiffer((before as Mod)[k], (after as Mod)[k], path ? `${path}.${k}` : k);
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
  const bad = onlyNumbersDiffer(readContent(body.file), body.value);
  if (bad) return { status: 400, body: { error: bad } };
  const problems = await writeContent(load, body.file, target.schemaPath, target.exportName, body.value);
  return problems.length > 0 ? { status: 400, body: { error: problems.join('\n') } } : { status: 200, body: { ok: true } };
}
