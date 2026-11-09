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

/**
 * Skins whose own backdrop picture exists (batches cloud-08 / garden-07): `bg_cloud_<skin>` and `bg_garden_<skin>`. A tier / zone
 * wearing one of them shows that picture; any other skin keeps the plain backdrop tinted by the skin's mood. Add a skin id here when
 * its two backdrops are delivered (and registered in the manifest).
 */
export const SKIN_BACKDROP_READY: readonly string[] = [];

export type BackdropArea = 'cloud' | 'garden';

/** The backdrop art id of a skin in an Area, or null when it has none yet. */
export const skinBackdropArt = (skinId: string | null | undefined, area: BackdropArea): string | null => (skinId && SKIN_BACKDROP_READY.includes(skinId) ? `bg_${area}_${skinId}` : null);

/** Every skin backdrop id the scenes may load (delivered ones only). */
export const SKIN_BACKDROP_IDS = (area: BackdropArea): string[] => SKIN_BACKDROP_READY.map((id) => `bg_${area}_${id}`);
