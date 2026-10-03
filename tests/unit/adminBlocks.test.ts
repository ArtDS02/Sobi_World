// Admin config writers (DECISIONS MU-1, MU-2): the shipped blocks are reproduced byte for byte, so a
// dashboard save without changes is a no-op diff.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GENETICS, MUTATIONS } from '../../src/core/config/breedingRules';
import { GENE_BONUSES } from '../../src/core/config/genePool';
import { SEASON_FX_TUNING } from '../../src/core/config/seasonFx';
import {
  geneBonusesBlock,
  geneticsBlock,
  mutationsBlock,
  replaceBlock,
  seasonFxBlock,
} from '../../scripts/admin/configBlocks';

const block = (file: string, name: string) => {
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const open = `// <admin:${name}>\n`;
  return text.slice(text.indexOf(open) + open.length, text.indexOf(`\n// </admin:${name}>`));
};

describe('admin config blocks (MU-1, MU-2)', () => {
  it('reproduce the shipped blocks exactly', () => {
    expect(geneticsBlock(GENETICS)).toBe(block('src/core/config/breedingRules.ts', 'genetics'));
    expect(mutationsBlock(MUTATIONS)).toBe(block('src/core/config/breedingRules.ts', 'mutations'));
    expect(geneBonusesBlock(GENE_BONUSES)).toBe(block('src/core/config/genePool.ts', 'geneBonuses'));
    expect(seasonFxBlock(SEASON_FX_TUNING)).toBe(block('src/core/config/seasonFx.ts', 'seasonFx'));
  });

  it('a tuned emitter is written as one line', () => {
    const text = seasonFxBlock({ enabled: true, density: 0.8, emitters: { winter_snow: { enabled: false, density: 0.5, spawnRate: 2 } } });
    expect(text).toContain('    winter_snow: { enabled: false, density: 0.5, spawnRate: 2 },');
    const src = readFileSync('src/core/config/seasonFx.ts', 'utf8');
    expect(replaceBlock(src, 'seasonFx', text)).toContain('density: 0.8,');
  });
});
