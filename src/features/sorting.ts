import type { ColDef, SortDir, SortState } from '../types';
import { CSS } from '../constants';
import { dispatch } from '../utils/dom';

/**
 * Returns the trimmed `textContent` of the cell at `colIndex` in `row`,
 * or an empty string if the cell is absent.
 */
function cellText(row: HTMLTableRowElement, colIndex: number): string {
  return row.cells[colIndex]?.textContent?.trim() ?? '';
}

/**
 * Compares two cell-value strings according to the column's `type`.
 *
 * - `'number'` — strips non-numeric characters and compares as floats.
 * - `'date'`   — parses via `Date.parse()` and compares timestamps.
 * - `'string'` — locale-aware case-insensitive `localeCompare`.
 *
 * Falls back to `localeCompare` when numeric or date parsing fails.
 *
 * @param a - Left-hand cell text.
 * @param b - Right-hand cell text.
 * @param type - Column data type.
 * @returns Negative if `a < b`, positive if `a > b`, 0 if equal.
 */
function compareValues(a: string, b: string, type: ColDef['type']): number {
  if (type === 'number') {
    const na = parseFloat(a.replace(/[^0-9.\-]/g, ''));
    const nb = parseFloat(b.replace(/[^0-9.\-]/g, ''));
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
  }
  if (type === 'date') {
    const da = Date.parse(a);
    const db = Date.parse(b);
    if (!isNaN(da) && !isNaN(db)) return da - db;
  }
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/**
 * Returns a sorted copy of `rows` according to the multi-column `stack`.
 *
 * Columns are compared in priority order (index 0 = primary sort). When all
 * levels are equal the rows retain their original relative order. When the
 * stack is empty the original array is returned unchanged (no copy).
 *
 * @param rows - All body rows in their current order.
 * @param stack - Active sort entries, primary first.
 * @param cols - Column definitions used to look up `type`.
 * @returns A new array of rows in sorted order, or the original if unsorted.
 */
export function sortRows(
  rows: HTMLTableRowElement[],
  stack: SortState[],
  cols: ColDef[],
): HTMLTableRowElement[] {
  if (!stack.length) return rows;

  return [...rows].sort((a, b) => {
    for (const { colIndex, dir } of stack) {
      if (dir === 'none') continue;
      const colDef = cols[colIndex];
      const va = cellText(a, colIndex);
      const vb = cellText(b, colIndex);
      const cmp = compareValues(va, vb, colDef?.type ?? 'string');
      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

/**
 * Advances `current` through the three-state sort cycle:
 * `'none'` → `'asc'` → `'desc'` → `'none'`.
 *
 * @param current - The current sort direction.
 * @returns The next direction in the cycle.
 */
export function nextDir(current: SortDir): SortDir {
  return current === 'none' ? 'asc' : current === 'asc' ? 'desc' : 'none';
}

/**
 * Removes the ascending/descending CSS class from every header and reapplies
 * them based on the current sort stack.  Also sets `aria-sort` on all sortable
 * headers (`"ascending"`, `"descending"`, or `"none"`).
 *
 * @param headers - Ordered array of `<th>` elements (data columns only,
 *   without the checkbox column if row-select is enabled).
 * @param stack - Active sort state; may be empty.
 */
export function updateHeaderClasses(headers: HTMLTableCellElement[], stack: SortState[]): void {
  headers.forEach((th, i) => {
    th.classList.remove(CSS.TH_ASC, CSS.TH_DESC);
    const entry = stack.find(s => s.colIndex === i);
    if (entry?.dir === 'asc') {
      th.classList.add(CSS.TH_ASC);
      th.setAttribute('aria-sort', 'ascending');
    } else if (entry?.dir === 'desc') {
      th.classList.add(CSS.TH_DESC);
      th.setAttribute('aria-sort', 'descending');
    } else if (th.classList.contains(CSS.TH_SORTABLE)) {
      th.setAttribute('aria-sort', 'none');
    }
  });
}

/**
 * Processes a header click (or keyboard activation) and returns the updated
 * sort stack.
 *
 * In single-sort mode the entire stack is replaced with the one clicked column.
 * In multi-sort mode (Shift held) the clicked column is added, updated, or
 * removed within the existing stack. Direction cycles via `nextDir()`.
 *
 * Also dispatches the `gridix:sort` custom event on `tableEl`.
 *
 * @param th - The `<th>` element that was activated.
 * @param colIndex - Zero-based index of the clicked column.
 * @param multiSort - Whether multi-column sort is enabled.
 * @param stack - Current sort stack before this interaction.
 * @param shiftHeld - Whether the Shift key was held during the click.
 * @param tableEl - The `<table>` element (used for event dispatch).
 * @returns The new sort stack to apply.
 */
export function handleHeaderClick(
  th: HTMLTableCellElement,
  colIndex: number,
  multiSort: boolean,
  stack: SortState[],
  shiftHeld: boolean,
  tableEl: HTMLTableElement,
): SortState[] {
  const existing = stack.find(s => s.colIndex === colIndex);
  const dir = nextDir(existing?.dir ?? 'none');

  let next: SortState[];
  if (multiSort && shiftHeld) {
    if (existing) {
      next =
        dir === 'none'
          ? stack.filter(s => s.colIndex !== colIndex)
          : stack.map(s => (s.colIndex === colIndex ? { colIndex, dir } : s));
    } else {
      next = [...stack, { colIndex, dir }];
    }
  } else {
    next = dir === 'none' ? [] : [{ colIndex, dir }];
  }

  dispatch(tableEl, 'gridix:sort', { col: colIndex, dir });
  return next;
}
