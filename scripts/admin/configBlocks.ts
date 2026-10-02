// Source text of the admin-edited config blocks (DECISIONS AD-1): products.ts and breedingPairs.ts
// keep their data between `// <admin:NAME>` markers, one object literal per row, fixed key order,
// so a dashboard save produces a minimal diff. Pure string functions, unit-tested.
import type { ProductDef } from '../../src/core/config/products';
import type { PairRule } from '../../src/core/config/breedingPairs';

/** `source` with the block between the `name` markers replaced by `body`; throws without markers. */
export function replaceBlock(source: string, name: string, body: string): string {
  const open = `// <admin:${name}>`;
  const close = `// </admin:${name}>`;
  const start = source.indexOf(open);
  const end = source.indexOf(close);
  if (start < 0 || end < start) throw new Error(`thiếu marker <admin:${name}>`);
  return `${source.slice(0, start)}${open}\n${body}\n${source.slice(end)}`;
}

const q = (v: string) => JSON.stringify(v);

export function productRowText(p: ProductDef): string {
  return (
    `{ id: ${q(p.id)}, nameVi: ${q(p.nameVi)}, descVi: ${q(p.descVi)}, category: ${q(p.category)}, ` +
    `currency: ${q(p.currency)}, itemId: ${q(p.itemId)}, quantity: ${p.quantity}, priceGold: ${p.priceGold}, ` +
    `icon: ${q(p.icon)}, sortOrder: ${p.sortOrder}, active: ${p.active} }`
  );
}

export const productsBlock = (rows: readonly ProductDef[]) =>
  ['export const PRODUCTS: readonly ProductDef[] = [', ...rows.map((r) => `  ${productRowText(r)},`), '];'].join('\n');

export function pairRowText(r: PairRule): string {
  const outcomes = r.outcomes.map((o) => `{ breed: ${q(o.breed)}, percent: ${o.percent} }`).join(', ');
  const note = r.note ? `, note: ${q(r.note)}` : '';
  return (
    `{ id: ${q(r.id)}, parents: [${q(r.parents[0])}, ${q(r.parents[1])}], ` +
    `outcomes: [${outcomes}], active: ${r.active}${note} }`
  );
}

export const pairsBlock = (rows: readonly PairRule[]) =>
  ['export const PAIR_RULES: readonly PairRule[] = [', ...rows.map((r) => `  ${pairRowText(r)},`), '];'].join('\n');

/**
 * Manifest text with `layout.placements` replaced, in the file's own JSON style (2-space indent,
 * one key per line). Everything outside the array is kept byte for byte.
 */
export function replacePlacementsText(manifest: string, placements: readonly object[]): string {
  const key = '"placements": [';
  const start = manifest.indexOf(key, manifest.indexOf('"layout": {'));
  if (start < 0) throw new Error('manifest: layout.placements not found');
  let depth = 0;
  let end = -1;
  for (let i = start + key.length - 1; i < manifest.length; i++) {
    const c = manifest[i];
    if (c === '"') {
      i = manifest.indexOf('"', i + 1);
      while (manifest[i - 1] === '\\') i = manifest.indexOf('"', i + 1);
    } else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (end < 0) throw new Error('manifest: unterminated placements array');
  const body = JSON.stringify(placements, null, 2).replace(/\n/g, '\n    ');
  return `${manifest.slice(0, start)}"placements": ${body}${manifest.slice(end)}`;
}
