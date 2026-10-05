// The save codec of this build: how to read Sobi Farm saves and which Areas own a save slice.
import { farmSaveSpec, newFarmWorld } from '../areas/farm/logic/save/farmSave';
import { legacyToWorld } from '../areas/farm/logic/save/legacy';
import { FARM_AREA_ID } from '../areas/farm/logic/save/lens';
import { parseSave, type SaveCodec } from '../core/save/migrate';

export const SAVE_CODEC: SaveCodec = {
  legacy: legacyToWorld,
  areas: { [FARM_AREA_ID]: farmSaveSpec },
  newWorld: newFarmWorld,
};

export const parseWorldSave = (json: string) => parseSave(json, SAVE_CODEC);
