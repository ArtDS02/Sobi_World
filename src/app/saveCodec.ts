// The save codec of this build: how to read Sobi Farm saves, and the Areas that own a save slice.
import { legacyToWorld } from '../areas/farm/logic/save/legacy';
import { parseSave, type SaveCodec } from '../core/save/migrate';
import { defaultSettings } from '../core/save/world';
import { AREAS } from './areas';

export const SAVE_CODEC: SaveCodec = AREAS.codec(legacyToWorld, defaultSettings);

export const parseWorldSave = (json: string) => parseSave(json, SAVE_CODEC);
