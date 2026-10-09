// content/farm/names.json — names given to bought and newborn pigs (picked with the injected rng).
import { z } from 'zod';

export const namesFileSchema = z.strictObject({ pigNames: z.array(z.string().min(1).max(16)).min(1) });
