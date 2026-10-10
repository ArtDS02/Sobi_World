// Areas of the roadmap whose code is not written yet (content/<area>/area.json with `planned`): the plaza
// shows their doors closed, with the conditions to open them (spec §3.1). Moves out of here into
// src/app/areas.ts when the Area is built. Every Area of the roadmap is built since GĐ10; the list stays for the next one.
import type { AreaManifest } from '../../../content/schemas/area';

export const PLANNED_AREAS: readonly AreaManifest[] = [];
