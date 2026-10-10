// A fish's favourite food (spec V2 §7): one crop of the Garden, fixed for its life by its id (the Bond pool).
import { BOND } from '../../../core/config/bond';
import { favoriteOf } from '../../../systems/bond/bond';
import type { Fish } from './state';

export const fishFavorite = (f: Pick<Fish, 'id'>): string => favoriteOf(f.id, BOND);
