import type { RowSelectMode } from '../types';
import { CSS } from '../constants';
import { dispatch } from '../utils/dom';

/**
 * Toggles the selection state of a single row and returns the updated selected
 * set.
 *
 * - `'single'` mode: deselects any previously selected row before selecting
 *   the new one; clicking an already-selected row deselects it.
 * - `'multi'` mode: adds the row to the set if absent, removes it if present.
 * - `false` mode: returns the original set unchanged.
 *
 * Also calls `syncRowClasses` and dispatches the `gridix:rowselect` event.
 *
 * @param row - The `<tr>` element that was clicked / toggled.
 * @param rowIndex - Zero-based index of `row` in `allRows`.
 * @param selected - Current set of selected row indices.
 * @param mode - Row-selection mode.
 * @param allRows - All body rows (needed to sync classes across all rows).
 * @param tableEl - The `<table>` element used for event dispatch.
 * @returns A new `Set<number>` reflecting the updated selection.
 */
export function toggleRowSelect(
  row: HTMLTableRowElement,
  rowIndex: number,
  selected: Set<number>,
  mode: RowSelectMode,
  allRows: HTMLTableRowElement[],
  tableEl: HTMLTableElement,
): Set<number> {
  if (!mode) return selected;

  const next = new Set(selected);

  if (mode === 'single') {
    if (next.has(rowIndex)) {
      next.delete(rowIndex);
    } else {
      next.clear();
      next.add(rowIndex);
    }
  } else {
    if (next.has(rowIndex)) next.delete(rowIndex);
    else next.add(rowIndex);
  }

  syncRowClasses(allRows, next);
  dispatch(tableEl, 'gridix:rowselect', { rows: Array.from(next) });
  return next;
}

/**
 * Applies or removes the selected CSS class and `aria-selected` attribute on
 * every row, and ticks or unticks the row's checkbox (if present).
 *
 * Called after every selection change so the visual state stays in sync with
 * `GridixState.selectedRows`.
 *
 * @param rows - All body rows in original DOM order.
 * @param selected - Set of currently selected row indices.
 */
export function syncRowClasses(rows: HTMLTableRowElement[], selected: Set<number>): void {
  rows.forEach((row, i) => {
    const isSelected = selected.has(i);
    row.classList.toggle(CSS.ROW_SELECTED, isSelected);
    row.setAttribute('aria-selected', String(isSelected));
    const cb = row.querySelector<HTMLInputElement>(`.${CSS.CHECKBOX_COL} input`);
    if (cb) cb.checked = isSelected;
  });
}

/**
 * Selects all rows and returns the resulting set of all row indices.
 *
 * Also calls `syncRowClasses` and dispatches `gridix:rowselect`.
 *
 * @param rows - All body rows.
 * @param tableEl - The `<table>` element used for event dispatch.
 * @returns A `Set<number>` containing every valid row index.
 */
export function selectAll(rows: HTMLTableRowElement[], tableEl: HTMLTableElement): Set<number> {
  const next = new Set(rows.map((_, i) => i));
  syncRowClasses(rows, next);
  dispatch(tableEl, 'gridix:rowselect', { rows: Array.from(next) });
  return next;
}

/**
 * Deselects all rows and returns an empty set.
 *
 * Also calls `syncRowClasses` and dispatches `gridix:rowselect` with an empty
 * rows array.
 *
 * @param rows - All body rows (needed to clear CSS classes).
 * @param tableEl - The `<table>` element used for event dispatch.
 * @returns An empty `Set<number>`.
 */
export function deselectAll(rows: HTMLTableRowElement[], tableEl: HTMLTableElement): Set<number> {
  const next = new Set<number>();
  syncRowClasses(rows, next);
  dispatch(tableEl, 'gridix:rowselect', { rows: [] });
  return next;
}
