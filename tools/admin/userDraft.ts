// The open save's draft for the user editor's tabs (decision 036): one edit at a time through worldEdits.apply (a
// refused edit shows its reason and changes nothing), or in place by a generic form (touched), and the box of the
// problems the game would refuse.
import { esc } from './labels';
import { state } from './store';
import { users } from './users';
import { apply, saveProblems, type Edit } from './worldEdits';

const AREA_ICON: Record<string, string> = { sobi_farm: '🐷', sobi_garden: '🌱', sobi_aquarium: '🐟', sobi_cloud: '☁️', sobi_adventure: '⚔️' };
export const areaIcon = (id: string) => AREA_ICON[id] ?? '🏝️';

/** Applies one edit to the open draft (refused edits show their reason and change nothing). */
export function edit(e: Edit, rerender: () => void) {
  const o = users.open!;
  try {
    o.draft = apply(o.draft, e);
    o.edits.push(e);
    o.dirty = true;
    state.message = null;
  } catch (x) {
    state.message = { kind: 'error', text: `Không áp dụng được:\n${(x as Error).message}` };
  }
  rerender();
}

/** Marks the draft changed without a redraw (a generic form edited in place); refreshes the problems box later. */
let problemsTimer = 0;
export function touched(root: HTMLElement) {
  const o = users.open!;
  if (!o.dirty) {
    o.dirty = true;
    root.querySelector('[data-dirty-badge]')?.removeAttribute('hidden');
    root.querySelector('[data-undo]')?.removeAttribute('hidden');
  }
  clearTimeout(problemsTimer);
  problemsTimer = window.setTimeout(() => showProblems(root), 350);
}

function showProblems(root: HTMLElement) {
  const o = users.open;
  if (!o) return;
  const problems = saveProblems(o.draft);
  const box = root.querySelector<HTMLElement>('[data-problems]');
  if (box) box.innerHTML = problemsHtml(problems);
  const save = root.querySelector<HTMLButtonElement>('[data-save]');
  if (save) save.disabled = !o.dirty || problems.length > 0;
}

export const problemsHtml = (problems: readonly string[]) =>
  problems.length
    ? `<div class="issues-box"><b>⚠ Game sẽ từ chối save này — sửa trước khi lưu:</b><ul>${problems.slice(0, 10).map((p) => `<li>${esc(p)}</li>`).join('')}${problems.length > 10 ? `<li>… và ${problems.length - 10} lỗi nữa</li>` : ''}</ul></div>`
    : '';

