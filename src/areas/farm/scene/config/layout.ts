// The farm's scene layout (content/farm/layout.json, edited in the admin layout editor).
import type { FarmLayout } from '../../../../../content/schemas/farm/layout';
import { FARM_CONTENT } from '../../logic/config/content';

export { FARM_ACTIONS, type FarmAction, type FarmLayout, type Placement } from '../../../../../content/schemas/farm/layout';

export const FARM_LAYOUT: FarmLayout = FARM_CONTENT.layout;
