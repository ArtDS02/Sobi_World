// Minimal toast stack for GameEvents (spec §10.2).
import { el } from '../dom';

const TOAST_MS = 1400; // farm layout rework: short toasts, top centre
const MAX_TOASTS = 4;

export function createToaster(host: HTMLElement) {
  return (message: string) => {
    const toast = el('div', { class: 'c-toast', text: message, attrs: { role: 'status' } });
    host.append(toast);
    while (host.childElementCount > MAX_TOASTS) host.firstElementChild?.remove();
    globalThis.setTimeout(() => toast.remove(), TOAST_MS);
  };
}
