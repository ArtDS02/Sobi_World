// The Areas of this build, in registration order (the first open Area is where a new world starts).
// Adding an Area = one module in src/areas/<id>/ (copy src/areas/_template) + one line here.
import { farmArea } from '../areas/farm';
import { createAreaRegistry } from '../core/area-registry/registry';
import { WORLD_DEVELOPMENT } from '../core/config/progression';

export const AREAS = createAreaRegistry([farmArea], WORLD_DEVELOPMENT);
