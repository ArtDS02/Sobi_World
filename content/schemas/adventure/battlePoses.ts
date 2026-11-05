// The key poses of a fighter (decision 042): `cb_<art>_<pose>` in the manifest; `idle` is the picture itself when it has none.
export const POSE_ART_VALUES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;

/**
 * The body gesture of a skill (decision 050 §skills): what the user's body does to make it — every rig plays it in its own way (a boar
 * shoots by tossing its head, an octopus by squeezing its mantle), clip `g_<gesture>`; a rig without that clip plays its `cast`.
 */
export const GESTURE_VALUES = ['shoot', 'breath', 'summon_ground', 'summon_sky', 'channel', 'brace', 'slam', 'charge', 'lash', 'roar'] as const;
export type Gesture = (typeof GESTURE_VALUES)[number];
