// The Areas of this build, in registration order (the first open Area is where a new world starts).
// Adding an Area = one module in src/areas/<id>/ (copy src/areas/_template) + one line here (and its
// planned manifest moves out of core/config/plannedAreas.ts).
import { aquariumArea } from '../areas/aquarium';
import { farmArea } from '../areas/farm';
import { gardenArea } from '../areas/garden';
import { createAreaRegistry } from '../core/area-registry/registry';
import { PROGRESSION } from '../core/config/progression';
import { PLANNED_AREAS } from '../core/config/plannedAreas';
import { TIME } from '../core/config/time';

export const AREAS = createAreaRegistry([farmArea, gardenArea, aquariumArea], PROGRESSION, TIME, PLANNED_AREAS);
