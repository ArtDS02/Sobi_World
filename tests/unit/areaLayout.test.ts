// Decision 057, B5: where the fixed things of the Cloud, Garden and Aquarium scenes stand is content
// (content/<area>/layout.json), edited by drag and drop in the admin. Moving the numbers out of the code changed no position.
import { describe, expect, it } from 'vitest';
import aquariumRaw from '../../content/aquarium/layout.json';
import cloudRaw from '../../content/cloud/layout.json';
import gardenRaw from '../../content/garden/layout.json';
import { aquariumLayoutFileSchema, cloudLayoutFileSchema, gardenLayoutFileSchema, type AreaLayoutFile } from '../../content/schemas/shared/areaLayout';
import { CONTENT_FILES } from '../../scripts/admin/contentCatalog';
import { AQUARIUM_PLACES } from '../../src/areas/aquarium/scene/aquariumView';
import { CLOUD_FRAME, CLOUD_VIEW, plotCentre } from '../../src/areas/cloud/scene/cloudView';
import { GARDEN_FRAME, GARDEN_VIEW } from '../../src/areas/garden/scene/gardenView';
import { AQUARIUM_LAYOUT, CLOUD_LAYOUT, GARDEN_LAYOUT, need, spotsOf } from '../../src/core/config/areaLayout';
import { gridCells, moveSpot, nudgeSpot, OUTSIDE_PX, patchSpot, sameLayout, toDesign, withMenuTop } from '../../tools/admin/areaLayoutModel';

describe('the positions the game shipped with did not move', () => {
  it('Cloud', () => {
    expect(CLOUD_VIEW.field).toEqual({ x: 536, y: 288, stepX: 165, stepY: 118 });
    expect(CLOUD_VIEW.spring).toEqual({ x: 286, y: 372, scale: 0.9 });
    expect(CLOUD_VIEW.cauldron).toEqual({ x: 222, y: 662, scale: 0.82 });
    expect(CLOUD_VIEW.springLabel).toEqual({ x: 284, y: 440 });
    expect(CLOUD_VIEW.cauldronLabel).toEqual({ x: 340, y: 624 });
    expect(CLOUD_VIEW.title).toEqual({ x: 800, y: 680, width: 480, height: 183 });
    expect(CLOUD_VIEW.tierUp).toEqual({ x: 1074, y: 686 });
    expect(CLOUD_VIEW.tierDown).toEqual({ x: 526, y: 686 });
    expect(CLOUD_VIEW.bird).toMatchObject({ x: 1257, y: 118, size: 116 });
    expect(CLOUD_FRAME).toEqual({ x: 446, y: 218, width: 840, height: 376, depth: 7 });
    expect(plotCentre(6)).toEqual({ x: 536 + 165, y: 288 + 118 });
  });

  it('Garden', () => {
    expect(GARDEN_VIEW.field).toEqual({ x: 450, y: 287, stepX: 178, stepY: 93 });
    expect(GARDEN_VIEW.mill).toEqual({ x: 185, y: 364, scale: 1 });
    expect(GARDEN_VIEW.composter).toEqual({ x: 165, y: 615, scale: 1 });
    expect(GARDEN_VIEW.sprinkler).toEqual({ x: 1530, y: 380, scale: 1.2 });
    expect(GARDEN_FRAME).toEqual({ x: 350, y: 227, width: 1090, height: 400, depth: 7 });
  });

  it('Aquarium: five places, each with its props', () => {
    expect(AQUARIUM_PLACES).toHaveLength(5);
    expect(AQUARIUM_PLACES.map((p) => p.art)).toEqual(['bg_aquarium', 'bg_aquarium_t2', 'bg_aquarium_t3', 'bg_aquarium_t4', 'bg_aquarium_t5']);
    const first = AQUARIUM_PLACES[0]!;
    expect(first.eggs).toEqual({ x: 480, y: 578 });
    expect(first.scales).toEqual({ x: 1110, y: 598 });
    expect(first.shop).toEqual({ x: 1370, y: 735, art: 'bld_shop_aquarium' });
    expect(first.plaque).toEqual({ x: 800, y: 643 });
    expect(first.rod).toBeNull();
    expect(first.bite).toEqual({ x: 1585, y: 470, kind: 'ripple' });
    expect(first.dock).toEqual({ x: 1565, y: 380, width: 180, height: 260 });
    expect(AQUARIUM_PLACES[1]!.rod).toEqual({ x: 1520, y: 318, scale: 0.85 });
    expect(AQUARIUM_PLACES[1]!.bite).toBeNull();
    expect(AQUARIUM_PLACES[3]!.dock).toEqual({ x: 1540, y: 190, width: 190, height: 250 });
    const deep = AQUARIUM_PLACES[4]!;
    expect(deep.rod).toBeNull();
    expect(deep.bite).toEqual({ x: 1485, y: 238, kind: 'glow' });
    expect(deep.shop).toEqual({ x: 1340, y: 790, art: 'bld_shop_aquarium_sea' });
    expect(deep.water).toEqual({ left: 290, right: 1340, top: 245, bottom: 620 });
  });

  it('the right-hand menu sits where it did', () => {
    for (const layout of [CLOUD_LAYOUT, GARDEN_LAYOUT, AQUARIUM_LAYOUT]) expect(layout.sideMenu).toEqual({ top: 23 });
  });
});

describe('schema', () => {
  const clone = <T>(v: T): T => structuredClone(v);

  it('accepts the three files', () => {
    expect(cloudLayoutFileSchema.safeParse(cloudRaw).success).toBe(true);
    expect(gardenLayoutFileSchema.safeParse(gardenRaw).success).toBe(true);
    expect(aquariumLayoutFileSchema.safeParse(aquariumRaw).success).toBe(true);
  });

  it('refuses a missing spot, an unknown spot and a spot without the numbers it needs', () => {
    const missing = clone(cloudRaw) as { views: { spots: Record<string, unknown> }[] };
    delete missing.views[0]!.spots.spring;
    expect(cloudLayoutFileSchema.safeParse(missing).success).toBe(false);
    const unknown = clone(gardenRaw) as { views: { spots: Record<string, unknown> }[] };
    unknown.views[0]!.spots.well = { x: 1, y: 1 };
    expect(gardenLayoutFileSchema.safeParse(unknown).success).toBe(false);
    const noStep = clone(gardenRaw) as { views: { spots: Record<string, Record<string, number>> }[] };
    delete noStep.views[0]!.spots.field!.stepX;
    expect(gardenLayoutFileSchema.safeParse(noStep).success).toBe(false);
    const noBox = clone(aquariumRaw) as unknown as { views: { spots: Record<string, Record<string, number>> }[] };
    delete noBox.views[2]!.spots.dock!.height;
    expect(aquariumLayoutFileSchema.safeParse(noBox).success).toBe(false);
  });

  it('refuses values that would break a scene: a spot far away, a zero scale, a menu off the screen, two views with one id', () => {
    const far = clone(cloudRaw);
    far.views[0]!.spots.spring.x = 99_999;
    expect(cloudLayoutFileSchema.safeParse(far).success).toBe(false);
    const flat = clone(cloudRaw);
    flat.views[0]!.spots.spring.scale = 0;
    expect(cloudLayoutFileSchema.safeParse(flat).success).toBe(false);
    const menu = clone(gardenRaw);
    menu.sideMenu.top = 120;
    expect(gardenLayoutFileSchema.safeParse(menu).success).toBe(false);
    const twice = clone(aquariumRaw);
    twice.views[1]!.id = twice.views[0]!.id;
    expect(aquariumLayoutFileSchema.safeParse(twice).success).toBe(false);
  });

  it('the Aquarium file has a rod / bite spot exactly where the place uses one', () => {
    AQUARIUM_PLACES.forEach((place, i) => {
      const spots = spotsOf(AQUARIUM_LAYOUT, i);
      expect(spots.rod !== undefined, `level ${i + 1} rod`).toBe(place.rod !== null);
      expect(spots.bite !== undefined, `level ${i + 1} bite`).toBe(place.bite !== null);
    });
  });

  it('a view past the list reads the last one; a missing spot is an error, not a silent 0,0', () => {
    expect(spotsOf(AQUARIUM_LAYOUT, 99)).toBe(spotsOf(AQUARIUM_LAYOUT, 4));
    expect(() => need(spotsOf(CLOUD_LAYOUT), 'no_such_spot')).toThrow();
  });

  it('the admin lists the three files with their schema', () => {
    for (const area of ['cloud', 'garden', 'aquarium']) {
      const def = CONTENT_FILES.find((f) => f.file === `${area}/layout.json`);
      expect(def?.exportName).toBe(`${area}LayoutFileSchema`);
      expect(def?.schemaPath).toBe('/content/schemas/shared/areaLayout.ts');
    }
  });
});

describe('admin editing (pure)', () => {
  const file: AreaLayoutFile = CLOUD_LAYOUT;

  it('moves a spot, snapped, and leaves the others and the loaded value alone', () => {
    const next = moveSpot(file, 0, 'spring', 303.4, 377.6, 5);
    expect(next.views[0]!.spots.spring).toEqual({ x: 305, y: 380, scale: 0.9 });
    expect(next.views[0]!.spots.cauldron).toEqual(file.views[0]!.spots.cauldron);
    expect(file.views[0]!.spots.spring).toEqual({ x: 286, y: 372, scale: 0.9 });
    expect(sameLayout(next, file)).toBe(false);
    expect(cloudLayoutFileSchema.safeParse(next).success).toBe(true);
  });

  it('keeps a dragged spot near the frame', () => {
    const out = moveSpot(file, 0, 'bird', 99_999, -99_999).views[0]!.spots.bird!;
    expect(out.x).toBe(file.designSize.width + OUTSIDE_PX);
    expect(out.y).toBe(-OUTSIDE_PX);
    expect(cloudLayoutFileSchema.safeParse(moveSpot(file, 0, 'bird', 99_999, -99_999)).success).toBe(true);
  });

  it('ignores a spot or a view that does not exist', () => {
    expect(moveSpot(file, 0, 'nope', 1, 1)).toBe(file);
    expect(moveSpot(file, 7, 'spring', 1, 1)).toBe(file);
    expect(nudgeSpot(file, 0, 'nope', 1, 1)).toBe(file);
  });

  it('nudges by whole pixels', () => {
    expect(nudgeSpot(file, 0, 'title', -10, 1).views[0]!.spots.title).toEqual({ x: 790, y: 681 });
  });

  it('typed numbers: only fields the spot has, never NaN, sizes and scales stay positive', () => {
    expect(patchSpot(file, 0, 'spring', 'scale', 1.234).views[0]!.spots.spring!.scale).toBe(1.23);
    expect(patchSpot(file, 0, 'field', 'stepX', 170.4).views[0]!.spots.field!.stepX).toBe(170);
    expect(patchSpot(file, 0, 'spring', 'scale', 0)).toEqual(file);
    expect(patchSpot(file, 0, 'spring', 'scale', -2)).toEqual(file);
    expect(patchSpot(file, 0, 'spring', 'x', Number.NaN)).toBe(file);
    expect(patchSpot(file, 0, 'title', 'scale', 2)).toEqual(file);
    expect(patchSpot(file, 0, 'spring', 'x', -40.6).views[0]!.spots.spring!.x).toBe(-41);
  });

  it('the menu position stays on the screen', () => {
    expect(withMenuTop(file, 140).sideMenu.top).toBe(90);
    expect(withMenuTop(file, -3).sideMenu.top).toBe(0);
    expect(withMenuTop(file, 41.6).sideMenu.top).toBe(42);
    expect(withMenuTop(file, Number.NaN)).toBe(file);
  });

  it('grid cells match where the scene draws the plots', () => {
    const cells = gridCells(need(spotsOf(CLOUD_LAYOUT), 'field'), 5, 3);
    expect(cells).toHaveLength(15);
    cells.forEach((c, slot) => expect(c).toEqual(plotCentre(slot)));
  });

  it('turns a pointer position into design px whatever the size of the stage on screen', () => {
    expect(toDesign(file, { left: 100, top: 50, width: 800, height: 450 }, 500, 275)).toEqual({ x: 800, y: 450 });
  });
});
