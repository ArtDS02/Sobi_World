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

/** Replace children only when the markup changed, so a click is never lost to a 1 s re-render. */
export function patch(host: HTMLElement, next: HTMLElement | null) {
  const prev = host.firstElementChild;
  if (next === null) {
    if (prev) host.replaceChildren();
    return;
  }
  if (prev && prev.outerHTML === next.outerHTML) return;
  host.replaceChildren(next);
}
