// Import rules of ARCHITECTURE.md §3, checked on fake trees and on the real config.
import { describe, expect, it } from 'vitest';
import { findViolations, importsOf, type SourceFile } from '../../scripts/guard/architecture.mjs';
import cfg from '../../scripts/guard/config.mjs';

const file = (path: string, ...imports: string[]): SourceFile => ({
  path,
  source: imports.map((spec) => `import { x } from '${spec}';`).join('\n'),
});
const rules = (files: SourceFile[]) => findViolations(files, cfg).map((v) => `${v.rule} ${v.file}`);

describe('architecture guard', () => {
  it('reads static, re-export and dynamic imports', () => {
    const src = "import a from './a';\nexport { b } from \"../b\";\nconst c = await import('./c');";
    expect(importsOf(src)).toEqual(['./a', '../b', './c']);
  });

  it('allows the dependency direction app → areas → systems → core', () => {
    expect(
      rules([
        file('src/app/main.ts', '../areas/farm/index', '../ui/dom', '../platform/index'),
        file('src/areas/farm/logic/simulate.ts', '../../../systems/creature/needs', '../../../core/rng'),
        file('src/systems/creature/needs.ts', '../../core/rng'),
      ]),
    ).toEqual([]);
  });

  it('rejects core importing upward', () => {
    expect(
      rules([
        file('src/core/save/migrate.ts', '../../systems/creature/types'),
        file('src/core/rng.ts', '../areas/farm/index'),
        file('src/core/clock.ts', '../ui/dom'),
      ]),
    ).toEqual(['layer src/core/save/migrate.ts', 'layer src/core/rng.ts', 'layer src/core/clock.ts']);
  });

  it('rejects systems importing an Area', () => {
    expect(rules([file('src/systems/valuation/price.ts', '../../areas/farm/logic/trough')])).toEqual([
      'layer src/systems/valuation/price.ts',
    ]);
  });

  it('rejects an Area importing another Area, the template included', () => {
    expect(
      rules([
        file('src/areas/garden/logic/plants.ts', '../../farm/logic/trough'),
        file('src/areas/farm/index.ts', '../_template/index'),
        file('src/areas/farm/scene/MainFarmScene.ts', '../logic/trough'),
      ]),
    ).toEqual(['layer src/areas/garden/logic/plants.ts', 'layer src/areas/farm/index.ts']);
  });

  it('keeps core, systems and Area logic free of clocks, randomness and the DOM', () => {
    const impure = (path: string) => ({ path, source: 'const t = Date.now();\nconst r = Math.random();' });
    const found = findViolations(
      [impure('src/core/a.ts'), impure('src/systems/b.ts'), impure('src/areas/farm/logic/c.ts'), impure('src/areas/farm/scene/d.ts')],
      cfg,
    ).map((v) => v.file);
    expect(found).toEqual([
      'src/core/a.ts:1', 'src/core/a.ts:2', 'src/systems/b.ts:1', 'src/systems/b.ts:2',
      'src/areas/farm/logic/c.ts:1', 'src/areas/farm/logic/c.ts:2',
    ]);
  });

  it('ignores rules named in comments', () => {
    expect(findViolations([{ path: 'src/core/a.ts', source: '// never call Date.now() here' }], cfg)).toEqual([]);
  });
});
