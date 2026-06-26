import type { ColDef } from '../types';
import { CSS } from '../constants';

/**
 * Adds or removes the hidden-column CSS class on every cell in the table
 * (across `<thead>`, `<tbody>`, and `<tfoot>`) based on `hiddenCols` and each
 * column's `visible` flag.
 *
 * A cell is hidden when either:
 * - Its column index is present in `hiddenCols` (toggled at runtime via the
 *   column-visibility dropdown or the `hideCol` / `showCol` API), **or**
 * - The column's `ColDef.visible` is `false` (set initially via
 *   `data-gridix-col-visible="false"`).
 *
 * @param table - The `<table>` element to update.
 * @param hiddenCols - Set of zero-based column indices that are currently hidden.
 * @param cols - Column definitions (used to check `visible`).
 */
export function applyColVisibility(
  table: HTMLTableElement,
  hiddenCols: Set<number>,
  cols: ColDef[],
): void {
  const allRows = [
    ...Array.from(table.querySelectorAll<HTMLTableRowElement>('thead tr')),
    ...Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr')),
    ...Array.from(table.querySelectorAll<HTMLTableRowElement>('tfoot tr')),
  ];

  allRows.forEach(row => {
    Array.from(row.cells).forEach((cell, i) => {
      const shouldHide = hiddenCols.has(i) || !cols[i]?.visible;
      cell.classList.toggle(CSS.HIDDEN_COL, shouldHide);
    });
  });
}

/**
 * Returns the ordered list of column indices that should appear in exports.
 *
 * A column is excluded from exports when any of the following is true:
 * - `ColDef.noExport` is `true` (set via `data-gridix-col-no-export`).
 * - Its index is in `hiddenCols` (hidden at runtime).
 * - `ColDef.visible` is `false` (hidden from the initial configuration).
 *
 * @param cols - All column definitions.
 * @param hiddenCols - Set of currently hidden column indices.
 * @returns Ordered array of exportable column indices.
 */
export function getExportableCols(cols: ColDef[], hiddenCols: Set<number>): number[] {
  return cols
    .filter((col, i) => !col.noExport && !hiddenCols.has(i) && col.visible)
    .map(col => col.index);
}
