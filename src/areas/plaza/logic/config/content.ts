// The plaza's content files (content/plaza/*.json), validated once when first imported.
import layoutRaw from '../../../../../content/plaza/layout.json';
import { plazaLayoutSchema } from '../../../../../content/schemas/plaza/layout';
import { loadContent } from '../../../../core/content/load';

export const PLAZA_LAYOUT = loadContent('plaza/layout.json', plazaLayoutSchema, layoutRaw);
