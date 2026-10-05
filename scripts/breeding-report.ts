// Breeding coverage report (DECISIONS PS-2): every species, its routes and the rule checks.
// Usage: npm run breeding:report [-- --all]   (exit 1 when the data is not clean)
import { BREEDS } from '../src/areas/farm/logic/config/breeds';
import { RARITY_VALUES } from '../src/core/config/rarity';
import { breedingCoverage, WEAK_ROUTE_PERCENT } from '../src/areas/farm/logic/breedingCoverage';

const c = breedingCoverage();
const all = process.argv.includes('--all');
const pct = (n: number) => `${n.toFixed(2)}%`;
const lines = [
  'BREEDING COVERAGE',
  '',
  `Total Pig Types: ${c.total}`,
  `Breedable Pig Types (can be a child): ${c.breedable} / ${c.total}`,
  `Pig Types With At Least 1 Breeding Path: ${c.breedable} / ${c.total}`,
  `Obtainable from the shop start (bought or bred): ${c.obtainable} / ${c.total}`,
  `Parent species (LEGENDARY cannot breed, D10): ${c.parents}`,
  `Breeding Paths (pair → child, chance > 0): ${c.routes}`,
  '',
  ...RARITY_VALUES.map((r) => `${r[0]}${r.slice(1).toLowerCase()}: ${c.byRarity[r]}`),
  '',
  `Orphan Pigs: ${c.orphans.length}${c.orphans.length ? ` (${c.orphans.join(', ')})` : ''}`,
  `Weak best route (< ${WEAK_ROUTE_PERCENT}%): ${c.weak.length}${c.weak.length ? ` (${c.weak.join(', ')})` : ''}`,
  `Invalid Rules: ${c.invalidRules.length}`,
  ...c.invalidRules.map((r) => `  - ${r}`),
  `Duplicate Rules: ${c.duplicateRules.length}`,
  ...c.duplicateRules.map((r) => `  - ${r}`),
  `Probability Errors: ${c.probabilityErrors.length}`,
  ...c.probabilityErrors.slice(0, 20).map((r) => `  - ${r}`),
];
if (all) {
  lines.push('', 'Pig ID | Rarity | Family | Shop | Depth | Pairs | Best route');
  for (const [id, s] of Object.entries(c.species)) {
    const d = BREEDS[id as keyof typeof BREEDS];
    const best = s.best ? `${s.best.a} × ${s.best.b} ${pct(s.best.percent)}` : '—';
    lines.push(
      `${id} | ${d.rarity} | ${d.family} | ${s.shop ? 'yes' : '—'} | ${s.depth ?? '∞'} | ${s.pairs} | ${best}`,
    );
  }
}
console.log(lines.join('\n'));
const clean =
  c.orphans.length +
    c.invalidRules.length +
    c.duplicateRules.length +
    c.probabilityErrors.length ===
    0 && c.breedable === c.total;
console.log(`\nRESULT: ${clean ? 'PASS' : 'FAIL'}`);
process.exitCode = clean ? 0 : 1;
