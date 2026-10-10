// Family tree (spec V2 §7): each newborn keeps a frozen copy of its ancestors, `lineageDepth` levels deep, so
// the tree survives parents being sold or dying.
import type { Gender } from '../../core/config/ids';
import type { Ancestor } from './types';

export interface LineageSource {
  name: string;
  breed: string;
  gender: Gender;
  generation?: number | undefined;
  traits?: readonly string[] | undefined;
  /** The parent's own tree (its mother and father), if it was bred. */
  lineage?: { mother?: Ancestor | undefined; father?: Ancestor | undefined } | undefined;
}

/** Cuts a tree to `depth` levels of ancestors (depth 0 keeps the node only). */
export function trimAncestor(a: Ancestor, depth: number): Ancestor {
  const { mother, father, ...self } = a;
  if (depth <= 0) return self;
  return {
    ...self,
    ...(mother ? { mother: trimAncestor(mother, depth - 1) } : {}),
    ...(father ? { father: trimAncestor(father, depth - 1) } : {}),
  };
}

/** The frozen ancestor record of a parent, with its own ancestors cut so the whole tree has `depth` levels. */
export function ancestorOf(p: LineageSource, depth: number): Ancestor {
  const node: Ancestor = {
    name: p.name,
    breed: p.breed,
    gender: p.gender,
    generation: p.generation ?? 1,
    ...(p.traits && p.traits.length > 0 ? { traits: [...p.traits] } : {}),
    ...(p.lineage?.mother ? { mother: p.lineage.mother } : {}),
    ...(p.lineage?.father ? { father: p.lineage.father } : {}),
  };
  return trimAncestor(node, depth - 1);
}

/** The tree of a child of `mother` and `father`. */
export const lineageFor = (
  mother: LineageSource,
  father: LineageSource,
  depth: number,
): { mother: Ancestor; father: Ancestor } => ({
  mother: ancestorOf(mother, depth),
  father: ancestorOf(father, depth),
});

/** Every ancestor of a tree, nearest first. */
export function flattenAncestors(tree: { mother?: Ancestor | undefined; father?: Ancestor | undefined }): Ancestor[] {
  const out: Ancestor[] = [];
  let level = [tree.mother, tree.father].filter((a): a is Ancestor => !!a);
  while (level.length > 0) {
    out.push(...level);
    level = level.flatMap((a) => [a.mother, a.father].filter((x): x is Ancestor => !!x));
  }
  return out;
}
