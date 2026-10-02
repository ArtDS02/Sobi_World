// Shop products as the game reads them (DECISIONS AD-1): active rows, by sortOrder then table order.
import { PRODUCTS, type ProductDef } from '../config/products';

export function shopProducts(list: readonly ProductDef[] = PRODUCTS): ProductDef[] {
  return list
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.active)
    .sort((a, b) => a.p.sortOrder - b.p.sortOrder || a.i - b.i)
    .map(({ p }) => p);
}

export function productById(id: string, list: readonly ProductDef[] = PRODUCTS): ProductDef | undefined {
  return list.find((p) => p.id === id);
}
