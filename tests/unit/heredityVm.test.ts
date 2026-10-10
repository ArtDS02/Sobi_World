// GĐ7 view-models: trait chips, family tree, the Breeder's rumours, Codex clues, the hidden-trait reveal.
import { describe, expect, it } from 'vitest';
import { petPig } from '../../src/areas/farm/logic/actions/petPig';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { codexTexts } from '../../src/areas/farm/logic/codexText';
import { revealEvents } from '../../src/areas/farm/logic/heredity';
import { breederVm, breedingExtras, pedigreeVm, traitChips } from '../../src/areas/farm/ui/heredityVm';
import { toastText } from '../../src/areas/farm/scene/feedback/toastText';
import { npcAt, npcOf } from '../../src/core/config/goals';
import { BOND } from '../../src/core/config/bond';
import { vi } from '../../src/i18n/vi';
import { ctx, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const DAY = 86_400_000;

describe('trait chips', () => {
  it('shows visible traits with effects, and a hidden one as a lock until 5 hearts', () => {
    const closed = traitChips(makePig({ traits: ['trait_plump'], hiddenTrait: 'trait_golden_hoof', bond: 60 }));
    expect(closed.map((c) => c.name)).toEqual(['Mập mạp', '???']);
    expect(closed[0]!.effects).toContain('x1,1');
    expect(closed[1]!.hidden).toBe('locked');
    expect(closed[1]!.id).toBeNull(); // the real trait is not even in the view-model
    const open = traitChips(makePig({ traits: ['trait_plump'], hiddenTrait: 'trait_golden_hoof', bond: BOND.maxBond }));
    expect(open[1]).toMatchObject({ name: 'Móng vàng', hidden: 'open' });
  });

  it('a pig with none has no chips', () => {
    expect(traitChips(makePig())).toEqual([]);
  });
});

describe('hidden trait reveal', () => {
  it('reaches 5 hearts exactly once and only when there is a hidden trait', () => {
    const before = makePig({ id: 'p', hiddenTrait: 'trait_golden_hoof', bond: 98 });
    const after = { ...before, bond: 100 };
    expect(revealEvents(before, after)).toEqual([{ type: 'PIG_TRAIT_REVEALED', pigId: 'p', traitId: 'trait_golden_hoof' }]);
    expect(revealEvents(after, { ...after, bond: 100 })).toEqual([]);
    expect(revealEvents({ ...before, hiddenTrait: undefined }, { ...after, hiddenTrait: undefined })).toEqual([]);
  });

  it('petting a pig 2 points short of 5 hearts opens its hidden trait, with a toast', () => {
    const pig = makePig({ id: 'p', name: 'Mơ', hiddenTrait: 'trait_golden_hoof', bond: 97 });
    const s = farm([pig]);
    const r = expectOk(petPig(s, { pigId: 'p' }, ctx(0)));
    const ev = r.events.find((e) => e.type === 'PIG_TRAIT_REVEALED');
    expect(ev).toBeDefined();
    expect(toastText(ev!, r.state, s)).toContain('Móng vàng');
  });
});

describe('family tree', () => {
  it('lists the ancestors level by level, naming unknown species rather than hiding them', () => {
    const vm = pedigreeVm({
      name: 'Con',
      breed: 'PIG_WHITE',
      gender: 'MALE',
      generation: 3,
      traits: ['trait_sweet'],
      lineage: {
        mother: { name: 'Mẹ', breed: 'PIG_WHITE', gender: 'FEMALE', generation: 2, mother: { name: 'Bà', breed: 'PIG_GONE', gender: 'FEMALE', generation: 1 } },
        father: { name: 'Bố', breed: 'PIG_BLACK', gender: 'MALE', generation: 1 },
      },
    });
    expect(vm.self.name).toBe('Con');
    expect(vm.levels.map((l) => l.title)).toEqual(['Bố mẹ', 'Ông bà']);
    expect(vm.levels[0]!.ancestors.map((a) => a.name)).toEqual(['Mẹ', 'Bố']);
    expect(vm.levels[1]!.ancestors[0]).toMatchObject({ name: 'Bà', breedName: 'PIG_GONE', known: false });
    expect(vm.empty).toBeNull();
  });

  it('a first-generation pig says it has no parents on record', () => {
    expect(pedigreeVm(makePig({ name: 'Đầu' })).empty).toContain('Đầu');
  });
});

describe('breeding dialog extras', () => {
  it('shows the mutation chance of the pair (with trait boosts) and the saved pity', () => {
    const a = makePig({ id: 'a', traits: ['trait_lucky_star'], gender: 'FEMALE' });
    const b = makePig({ id: 'b', gender: 'MALE' });
    expect(breedingExtras(farm([a, b]), a, b).mutation).toContain('5');
    expect(breedingExtras(farm([a, b]), a, b).pity).toBeNull();
    expect(breedingExtras(farm([a, b], { breedingPity: 6 }), a, b).pity).toContain('6');
  });
});

describe("the Breeder's rumours", () => {
  const save = farm([]);
  const vm = (day: number, known: string[] = []) =>
    breederVm({ ...save, collection: { discoveredBreeds: known as never[] } }, day * DAY + 3_600_000, 0);

  it('is a station NPC, not the Farm guide', () => {
    expect(npcAt('breeding')?.nameVi).toBeTruthy();
    expect(npcOf('sobi_farm')?.station).toBeUndefined();
  });

  it('gives a hint and a tip, the same all day and different across days', () => {
    expect(vm(20_000)).toEqual(vm(20_000));
    expect(vm(20_000).rumors.map((r) => r.kind)).toEqual(['recipe', 'tip']);
    const hints = new Set(Array.from({ length: 60 }, (_, d) => vm(20_000 + d).rumors[0]!.text));
    expect(hints.size).toBeGreaterThan(5);
  });

  it('points without naming: no species name appears in a hint', () => {
    const names = Object.values(BREEDS).map((b) => b.nameVi);
    for (let d = 0; d < 80; d += 1) {
      const text = vm(20_000 + d).rumors[0]!.text;
      for (const n of names) expect(text, `${n} in "${text}"`).not.toContain(n);
    }
  });

  it('stops hinting at a recipe whose result the player already has', () => {
    const every = Object.keys(BREEDS);
    expect(vm(20_000, every).rumors[0]!.kind).toBe('none');
    const hinted = new Set(Array.from({ length: 60 }, (_, d) => vm(20_000 + d, ['PIG_MUSHROOM']).rumors[0]!.recipe?.result));
    expect(hinted.has('PIG_MUSHROOM')).toBe(false);
  });
});

describe('Codex clues', () => {
  it('an undiscovered species gives rarity and family, a found one adds trait and favourite', () => {
    const t = codexTexts('PIG_CRYSTAL');
    expect(t.hint).toContain(vi.rarity.EPIC);
    expect(t.hint).not.toContain(BREEDS.PIG_CRYSTAL.nameVi);
    expect(t.detail).toContain('Móng vàng');
    expect(vi.codex.undiscovered).toBe('???');
  });
});
