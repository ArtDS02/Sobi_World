// content/<area>/layout.json — where the fixed things of an Area's scene stand (decision 057, B5): the plot field, the buildings,
// the signs, the fishing spot. Design px on the Area's 1600 x 900 frame. Presentation only: nothing here changes a rule or a number
// of the game. Moved by drag and drop in the admin ("Bố cục khu"); the art, the depths and the motion stay in the scene's code.
import { z } from 'zod';

const px = z.number().finite().min(-2000).max(4000);
const size = z.number().finite().positive().max(4000);

export const layoutSpotSchema = z.strictObject({
  x: px,
  y: px,
  /** Drawing scale of the thing standing there. */
  scale: z.number().finite().positive().max(5).optional(),
  /** A grid (the plot field): the step between two cells; x / y is the centre of the first cell. */
  stepX: size.optional(),
  stepY: size.optional(),
  /** A click box: its size; x / y is its centre. */
  width: size.optional(),
  height: size.optional(),
});

export type LayoutSpot = z.infer<typeof layoutSpotSchema>;
type Extra = 'scale' | 'stepX' | 'stepY' | 'width' | 'height';

/** The spots a view of an Area must have, each with the extra fields it needs. */
export type SpotSpec = Readonly<Record<string, readonly Extra[]>>;

function areaLayoutSchema(required: SpotSpec, optional: SpotSpec = {}) {
  const known: SpotSpec = { ...required, ...optional };
  return z
    .strictObject({
      designSize: z.strictObject({ width: size, height: size }),
      /** The right-hand HUD menu (decision 057, B1): how far from the top of the screen its circle sits, in percent. */
      sideMenu: z.strictObject({ top: z.number().finite().min(0).max(90) }),
      /** One entry per screen of the Area: the Cloud and the Garden have one, the Aquarium one per tank level. */
      views: z.array(z.strictObject({ id: z.string().regex(/^[a-z][a-z0-9_]*$/), spots: z.record(z.string(), layoutSpotSchema) })).min(1),
    })
    .superRefine((f, ctx) => {
      const seen = new Set<string>();
      f.views.forEach((view, i) => {
        if (seen.has(view.id)) ctx.addIssue({ code: 'custom', message: `views[${i}]: duplicate id ${view.id}` });
        seen.add(view.id);
        for (const key of Object.keys(required)) if (!view.spots[key]) ctx.addIssue({ code: 'custom', message: `views[${i}] (${view.id}): missing spot "${key}"` });
        for (const [key, spot] of Object.entries(view.spots)) {
          const extras = known[key];
          if (!extras) {
            ctx.addIssue({ code: 'custom', message: `views[${i}] (${view.id}): unknown spot "${key}"` });
            continue;
          }
          for (const extra of extras) if (spot[extra] === undefined) ctx.addIssue({ code: 'custom', message: `views[${i}] (${view.id}): spot "${key}" needs ${extra}` });
        }
      });
    });
}

export const CLOUD_SPOTS = { field: ['stepX', 'stepY'], spring: ['scale'], cauldron: ['scale'], springLabel: [], cauldronLabel: [], title: [], tierUp: [], tierDown: [], bird: [] } as const satisfies SpotSpec;
export const GARDEN_SPOTS = { field: ['stepX', 'stepY'], mill: ['scale'], composter: ['scale'], sprinkler: ['scale'] } as const satisfies SpotSpec;
export const AQUARIUM_SPOTS = { eggs: [], scales: [], shop: [], plaque: [], dock: ['width', 'height'] } as const satisfies SpotSpec;
/** Only where the place has them (a rod that is not painted in the backdrop, a bite mark of its own). */
export const AQUARIUM_OPTIONAL_SPOTS = { rod: ['scale'], bite: [] } as const satisfies SpotSpec;

export const cloudLayoutFileSchema = areaLayoutSchema(CLOUD_SPOTS);
export const gardenLayoutFileSchema = areaLayoutSchema(GARDEN_SPOTS);
export const aquariumLayoutFileSchema = areaLayoutSchema(AQUARIUM_SPOTS, AQUARIUM_OPTIONAL_SPOTS);

export type AreaLayoutFile = z.infer<typeof cloudLayoutFileSchema>;
