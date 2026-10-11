// The technologies (content/shared/tech.json, GĐ11).
import { CONTENT } from './content';

export const TECH_LIST = CONTENT.tech.techs;
export const TECHS: Readonly<Record<string, (typeof TECH_LIST)[number]>> = Object.fromEntries(TECH_LIST.map((t) => [t.id, t]));

import type { WorldSave } from '../save/world';
import { recipeLocked, techValue, type TechEffectId } from '../tech/tech';

/** What the world's bought technologies give now. */
export const techBonus = (world: Pick<WorldSave, 'progression'>, effect: TechEffectId): number => techValue(world, effect, TECH_LIST);
export { recipeLocked };
