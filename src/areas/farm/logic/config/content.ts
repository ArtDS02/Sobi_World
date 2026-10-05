// The farm's content files (content/farm/*.json), validated once when first imported (ARCHITECTURE
// §8, core/content). The config modules next to this one expose them under their game names
// (BALANCE, BREEDS, PIG_LIFE…).
import farmBalanceRaw from '../../../../../content/farm/balance.json';
import areaRaw from '../../../../../content/farm/area.json';
import behaviorRaw from '../../../../../content/farm/behavior.json';
import breedingRaw from '../../../../../content/farm/breeding.json';
import decorRaw from '../../../../../content/farm/decor.json';
import giftsRaw from '../../../../../content/farm/gifts.json';
import layoutRaw from '../../../../../content/farm/layout.json';
import namesRaw from '../../../../../content/farm/names.json';
import seasonFxRaw from '../../../../../content/farm/season-fx.json';
import speciesRaw from '../../../../../content/farm/species.json';
import { areaManifestSchema } from '../../../../../content/schemas/area';
import { farmBalanceFileSchema } from '../../../../../content/schemas/farm/balance';
import { behaviorFileSchema } from '../../../../../content/schemas/farm/behavior';
import { breedingFileSchema } from '../../../../../content/schemas/farm/breeding';
import { decorFileSchema } from '../../../../../content/schemas/farm/decor';
import { giftsFileSchema } from '../../../../../content/schemas/farm/gifts';
import { layoutFileSchema } from '../../../../../content/schemas/farm/layout';
import { namesFileSchema } from '../../../../../content/schemas/farm/names';
import { seasonFxFileSchema } from '../../../../../content/schemas/farm/seasonFx';
import { speciesFileSchema } from '../../../../../content/schemas/farm/species';
import { loadContent } from '../../../../core/content/load';

export const FARM_CONTENT = {
  area: loadContent('farm/area.json', areaManifestSchema, areaRaw),
  farmBalance: loadContent('farm/balance.json', farmBalanceFileSchema, farmBalanceRaw),
  species: loadContent('farm/species.json', speciesFileSchema, speciesRaw),
  breeding: loadContent('farm/breeding.json', breedingFileSchema, breedingRaw),
  gifts: loadContent('farm/gifts.json', giftsFileSchema, giftsRaw),
  decor: loadContent('farm/decor.json', decorFileSchema, decorRaw),
  names: loadContent('farm/names.json', namesFileSchema, namesRaw),
  behavior: loadContent('farm/behavior.json', behaviorFileSchema, behaviorRaw),
  seasonFx: loadContent('farm/season-fx.json', seasonFxFileSchema, seasonFxRaw),
  layout: loadContent('farm/layout.json', layoutFileSchema, layoutRaw),
};
