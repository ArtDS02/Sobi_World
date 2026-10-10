// Template of an Area module (ARCHITECTURE §5 Area Contract). To start a new Area: copy this folder
// to src/areas/<id>/, put its manifest in content/<id>/area.json (schema: content/schemas/area.ts),
// rename the types, register the module in src/app/areas.ts. See README.md.
import type { AreaManifest, AreaModule } from '../../core/area-registry/registry';
import type { EventBase, WorldEvent } from '../../core/events';
import type { WorldSave } from '../../core/save/world';
import { simulateTemplate, type TemplateEvent } from './logic/simulate';
import { initialState, TEMPLATE_MIGRATIONS, TEMPLATE_STATE_VERSION, templateStateSchema, type TemplateState } from './logic/state';

export function createTemplateArea(manifest: AreaManifest): AreaModule {
  const id = manifest.id;
  const slice = (world: WorldSave) => world.areas[id] as TemplateState;
  const isOwn = (e: EventBase): e is TemplateEvent => e.type === 'TEMPLATE_HARVESTED';

  return {
    manifest,
    save: { schema: templateStateSchema, migrations: TEMPLATE_MIGRATIONS, version: TEMPLATE_STATE_VERSION },
    init: (world, ctx) => ({ ...world, areas: { ...world.areas, [id]: initialState(ctx.now) } }),
    simulate(world, now) {
      const r = simulateTemplate(slice(world), now);
      return { state: { ...world, areas: { ...world.areas, [id]: r.state } }, events: r.events };
    },
    simulatedAt: (world) => slice(world).lastTickedAt,
    rebase: (world, to) => ({ ...world, areas: { ...world.areas, [id]: { ...slice(world), lastTickedAt: to } } }),
    toWorldEvents: (events): WorldEvent[] =>
      events.filter(isOwn).map((e) => ({ type: 'crop.harvested', area: id, plotId: 'template', cropId: 'template', quantity: e.count })),
    getSummary: (events) => {
      const count = events.filter(isOwn).reduce((n, e) => n + e.count, 0);
      return count > 0 ? [{ key: 'summary.template.harvests', params: { count } }] : [];
    },
  };
}
