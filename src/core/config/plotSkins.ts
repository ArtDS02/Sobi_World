// The plot skins (content/shared/plotSkins.json, decision 056) under their game names.
import { CONTENT } from './content';

export const PLOT_SKIN_RULES = CONTENT.plotSkins;
export const PLOT_SKINS = PLOT_SKIN_RULES.skins;

export type SkinLook = 'cloud' | 'soil' | 'soil_wet';

/** The art id of a skin's plot bed (a manifest prop; a placeholder until the art is made). */
export const skinArtId = (skinId: string, look: SkinLook): string => `skin_${skinId}_${look}`;

/** Every skin art id the scenes may draw. */
export const SKIN_ART_IDS: readonly string[] = PLOT_SKINS.flatMap((s) => (['cloud', 'soil', 'soil_wet'] as const).map((look) => skinArtId(s.id, look)));

export interface SkinTheme {
  backdrop: number;
  scenery: number;
  frame: number;
  particles: 'petal' | 'firefly' | 'both' | 'none';
}

const THEMES: Readonly<Record<string, SkinTheme>> = Object.fromEntries(PLOT_SKINS.map((s) => [s.id, s.theme]));

/** The mood of the skin a tier / zone wears; null = the plain look (the scene keeps its own tint and colours). */
export const skinTheme = (skinId: string | null | undefined): SkinTheme | null => (skinId ? (THEMES[skinId] ?? null) : null);
