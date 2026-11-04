// How the turn bar moves from one step to the next (ANIM-081): a slot that moved up the line glides from where it was, a slot that was
// not there before pops in. The bar is drawn again at every step, so the motion is worked out from the keys of the last two orders.
// Pure; battleField.ts writes the result into the slots.

export interface SlotMotion {
  /** How many places it moved towards the head (0: stayed, or the bar was just drawn for the first time). */
  shift: number;
  /** It was not in the line before. */
  fresh: boolean;
}

/** The motion of each slot of `next` against `prev` (the order before). An empty `prev` is a bar drawn for the first time: nothing moves. */
export function slotMotions(prev: readonly string[], next: readonly string[]): SlotMotion[] {
  return next.map((key, i) => {
    if (prev.length === 0) return { shift: 0, fresh: false };
    const was = prev.indexOf(key);
    return was < 0 ? { shift: 0, fresh: true } : { shift: Math.max(0, was - i), fresh: false };
  });
}

/** Remembers the last two distinct orders: drawing the same order again keeps the motion of the step that produced it. */
export class OrderTracker {
  private cur = '';
  private curKeys: readonly string[] = [];
  private prevKeys: readonly string[] = [];

  /** The order the bar moved from, for the order `keys` it is drawn with now. */
  before(keys: readonly string[]): readonly string[] {
    const joined = keys.join('|');
    if (joined !== this.cur) {
      this.prevKeys = this.curKeys;
      this.curKeys = keys;
      this.cur = joined;
    }
    return this.prevKeys;
  }
}
