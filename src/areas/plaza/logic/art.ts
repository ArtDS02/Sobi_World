// Plaza art of batch world-01-scene (decision 024; delivered 2026-10-13). While a row is still a placeholder (a new
// row before its art arrives) the scene draws the placement's `fallback`, and the code-painted ground
// until bg_plaza arrives.
export const PLAZA_AREA_ICONS = ['adventure', 'garden', 'cloud', 'aquarium', 'farm'] as const;

/** An Area's short key (`sobi_garden` → `garden`): its dock order and its icon `ui_area_<key>`. */
export const areaKey = (areaId: string): string => areaId.replace(/^sobi_/, '');
export const areaIconId = (areaId: string): string => `ui_area_${areaKey(areaId)}`;

export const plazaArtIds = (): string[] => [
  'bg_plaza',
  ...['tree_round', 'tree_pine', 'bush', 'flowerbed', 'lamp', 'bench', 'planter', 'rock', 'sign'].map((s) => `prop_plaza_${s}`),
  'prop_world_logo',
  'prop_sobi_mascot',
  'ui_badge_level',
  ...PLAZA_AREA_ICONS.map((a) => `ui_area_${a}`),
  ...['hub', 'collection', 'menu', 'items'].map((h) => `ui_hud_${h}`),
];
