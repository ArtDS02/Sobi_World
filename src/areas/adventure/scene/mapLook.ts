// How the player wants the Adventure maps drawn (settings.json, read live): the style, the quality and how many particles the effects setting allows.
import type { MapQuality, MapView } from '../../../core/settings/settings';

export interface MapLook {
  view: MapView;
  quality: MapQuality;
  /** The effects intensity of the save's settings. */
  effects: 'off' | 'light' | 'full';
}
