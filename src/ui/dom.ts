// Tiny element builder for the framework-free DOM UI.

type Child = Node | string | null | undefined | false;
type Props = {
  class?: string;
  text?: string;
  attrs?: Record<string, string>;
  data?: Record<string, string>;
  on?: Partial<Record<keyof HTMLElementEventMap, (e: Event) => void>>;
};

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [k, v] of Object.entries(props.attrs ?? {})) node.setAttribute(k, v);
  for (const [k, v] of Object.entries(props.data ?? {})) node.dataset[k] = v;
  for (const [type, fn] of Object.entries(props.on ?? {})) if (fn) node.addEventListener(type, fn);
  for (const c of children) if (c) node.append(c);
  return node;
}

/** The node `patch` last put in each host and the markup it was built with (before anything on screen touched it). */
const drawn = new WeakMap<HTMLElement, { node: Element; markup: string }>();

/**
 * Replace children only when the markup changed, so a click is never lost to a 1 s re-render. The new markup is compared with the
 * markup the shown node was built with, not with the live node: inline styles or classes written later by an animation loop (the
 * Adventure's battle stage tweens the fighters every frame) must not make every redraw look like a change.
 */
export function patch(host: HTMLElement, next: HTMLElement | null) {
  const prev = host.firstElementChild;
  if (next === null) {
    drawn.delete(host);
    if (prev) host.replaceChildren();
    return;
  }
  const markup = next.outerHTML;
  const last = drawn.get(host);
  if (prev && (last && last.node === prev ? last.markup : prev.outerHTML) === markup) return;
  host.replaceChildren(next);
  drawn.set(host, { node: next, markup });
}
