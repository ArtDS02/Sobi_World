import { describe, expect, it } from 'vitest';
import { OrderTracker, slotMotions } from '../../src/areas/adventure/ui/turnBarMotion';

describe('turn bar motion (ANIM-081)', () => {
  it('nothing moves the first time the bar is drawn', () => {
    expect(slotMotions([], ['a:c', 'b:c'])).toEqual([{ shift: 0, fresh: false }, { shift: 0, fresh: false }]);
  });
  it('the slots after the one that left glide up the line, a new one pops in', () => {
    const m = slotMotions(['a:c', 'b:c', 'c:c'], ['b:c', 'c:c', 'a:n']);
    expect(m[0]).toEqual({ shift: 1, fresh: false });
    expect(m[1]).toEqual({ shift: 1, fresh: false });
    expect(m[2]).toEqual({ shift: 0, fresh: true });
  });
  it('a slot never glides backwards', () => {
    expect(slotMotions(['a:c', 'b:c'], ['b:c', 'a:c'])[1]!.shift).toBe(0);
  });
  it('drawing the same order again keeps the motion of its step', () => {
    const t = new OrderTracker();
    t.before(['a', 'b']);
    expect(t.before(['b', 'c'])).toEqual(['a', 'b']);
    expect(t.before(['b', 'c'])).toEqual(['a', 'b']);
  });
});
