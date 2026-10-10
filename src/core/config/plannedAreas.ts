// Areas of the roadmap whose code is not written yet (content/<area>/area.json with `planned`): the plaza
// shows their doors closed, with the conditions to open them (spec §3.1). Moves out of here into
// src/app/areas.ts when the Area is built.
import adventureRaw from '../../../content/adventure/area.json';
import { areaManifestSchema, type AreaManifest } from '../../../content/schemas/area';
import { loadContent } from '../content/load';

export const PLANNED_AREAS: readonly AreaManifest[] = [
  loadContent('adventure/area.json', areaManifestSchema, adventureRaw),
];
