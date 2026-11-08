// Redraw without jumping (admin plan step 2). Most pages rebuild their body with `root.innerHTML = …`; a rebuild drops
// the scroll of the page and of every inner scroll box (lists, tables, editors) and the focused field, which is the
// "jump" the owner saw on every click. `redraw(root, fn)` runs a rebuild while keeping: the window scroll, the scroll of
// inner containers (found again by their child-index path), the focused element with its caret / selection, and the
// height of `root` (so the browser does not clamp the scroll to the top while the page is empty for a moment).
// `installRedrawGuard()` applies it to every `innerHTML = …` made on an element inside the dashboard, so no page has to
// remember to call it.

interface Saved {
  win: { x: number; y: number };
  scrolls: { path: number[]; top: number; left: number }[];
  focus: { path: number[]; tag: string; start: number | null; end: number | null } | null;
}

/** Child-index path from `root` down to `el`; null when `el` is not inside `root`. */
export function pathTo(root: Element, el: Element): number[] | null {
  const path: number[] = [];
  for (let node: Element | null = el; node && node !== root; node = node.parentElement) {
    const parent: Element | null = node.parentElement;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.children, node));
  }
  return el === root || root.contains(el) ? path : null;
}

export function followPath(root: Element, path: readonly number[]): Element | null {
  let node: Element | undefined = root;
  for (const i of path) {
    node = node?.children[i];
    if (!node) return null;
  }
  return node ?? null;
}

function capture(root: Element): Saved {
  const doc = root.ownerDocument;
  const scrolls: Saved['scrolls'] = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if ((el.scrollTop > 0 || el.scrollLeft > 0) && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
      const path = pathTo(root, el);
      if (path) scrolls.push({ path, top: el.scrollTop, left: el.scrollLeft });
    }
  }
  const active = doc.activeElement;
  let focus: Saved['focus'] = null;
  if (active && active !== doc.body && root.contains(active)) {
    const path = pathTo(root, active);
    if (path) {
      const field = active as Partial<HTMLInputElement>;
      let start: number | null = null;
      let end: number | null = null;
      try {
        start = field.selectionStart ?? null;
        end = field.selectionEnd ?? null;
      } catch {
        /* checkboxes and buttons have no selection */
      }
      focus = { path, tag: active.tagName, start, end };
    }
  }
  const scroller = doc.scrollingElement;
  return { win: { x: scroller?.scrollLeft ?? 0, y: scroller?.scrollTop ?? 0 }, scrolls, focus };
}

function restore(root: Element, saved: Saved) {
  const doc = root.ownerDocument;
  for (const s of saved.scrolls) {
    const el = followPath(root, s.path);
    if (el) {
      el.scrollTop = s.top;
      el.scrollLeft = s.left;
    }
  }
  const scroller = doc.scrollingElement;
  if (scroller && (scroller.scrollTop !== saved.win.y || scroller.scrollLeft !== saved.win.x)) scroller.scrollTo(saved.win.x, saved.win.y);
  const f = saved.focus;
  if (f) {
    const el = followPath(root, f.path);
    if (el && el.tagName === f.tag && doc.activeElement !== el) {
      (el as HTMLElement).focus({ preventScroll: true });
      try {
        if (f.start !== null && f.end !== null) (el as HTMLInputElement).setSelectionRange(f.start, f.end);
      } catch {
        /* not a text field */
      }
    }
  }
}

/** Runs `fn` (which rebuilds the content of `root`) and puts scroll positions and focus back. */
export function redraw(root: Element, fn: () => void): void {
  const saved = capture(root);
  const box = root as HTMLElement;
  const oldMin = box.style?.minHeight ?? '';
  if (box.style) box.style.minHeight = `${box.offsetHeight}px`;
  // A page that shrinks (a filter, a collapsed block) must not pull the scroll up either: its content box only grows until
  // the page changes (the shell builds a fresh box then).
  const page = (root as HTMLElement).closest?.<HTMLElement>('.content');
  if (page) page.style.minHeight = `${Math.max(parseFloat(page.style.minHeight) || 0, page.offsetHeight)}px`;
  try {
    fn();
  } finally {
    restore(root, saved);
    const win = root.ownerDocument.defaultView;
    // Layout (images, fonts, a page that fills in a moment later) may settle after this task: restore once more.
    win?.requestAnimationFrame(() => {
      restore(root, saved);
      if (box.style && box !== page) box.style.minHeight = oldMin; // the page box keeps its ratchet
    });
  }
}

let installed = false;

/** Makes every `el.innerHTML = …` inside `scope` go through `redraw`. Idempotent. */
export function installRedrawGuard(scope: Element): void {
  if (installed) return;
  installed = true;
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (!desc?.set || !desc.get) return;
  const { get, set } = desc;
  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: true,
    enumerable: desc.enumerable ?? false,
    get,
    set(this: Element, value: string) {
      // Only live content of the dashboard is worth guarding; detached fragments and scratch nodes are rebuilt freely.
      if (this.isConnected && (this === scope || scope.contains(this)) && this.childNodes.length > 0) {
        redraw(this, () => set.call(this, value));
      } else set.call(this, value);
    },
  });
}
