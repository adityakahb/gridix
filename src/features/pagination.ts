import { dispatch } from '../utils/dom';

/**
 * The computed page window returned by `calcPageWindow`.
 */
export interface PageWindow {
  /** Zero-based index of the first visible row on the current page. */
  start: number;
  /** Zero-based index one past the last visible row (exclusive). */
  end: number;
  /** Total number of pages given `pageLength` and `totalRows`. */
  totalPages: number;
}

/**
 * Computes the slice boundaries and total page count for a given page.
 *
 * The returned `start` and `end` are safe to pass directly to `Array.slice`.
 * `page` is clamped to `[0, totalPages - 1]` so out-of-bounds values never
 * produce an empty slice when rows exist.
 *
 * @param page - Zero-based requested page index.
 * @param pageLength - Number of rows per page.
 * @param totalRows - Total number of rows to paginate.
 * @returns `{ start, end, totalPages }`.
 */
export function calcPageWindow(page: number, pageLength: number, totalRows: number): PageWindow {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageLength));
  const clampedPage = Math.min(Math.max(0, page), totalPages - 1);
  const start = clampedPage * pageLength;
  const end = Math.min(start + pageLength, totalRows);
  return { start, end, totalPages };
}

/**
 * Slices `rows` to the rows that should be visible on the requested page.
 *
 * @param rows - The filtered (and sorted) row set to paginate.
 * @param page - Zero-based page index.
 * @param pageLength - Number of rows per page.
 * @returns `{ visible }` — the page slice — and `{ window }` — the computed
 *   boundaries and total page count.
 */
export function applyPagination(
  rows: HTMLTableRowElement[],
  page: number,
  pageLength: number,
): { visible: HTMLTableRowElement[]; window: PageWindow } {
  const window = calcPageWindow(page, pageLength, rows.length);
  const visible = rows.slice(window.start, window.end);
  return { visible, window };
}

/**
 * Clamps `page` so it never exceeds the last valid page index.
 *
 * Used after a filter operation that may have reduced the total row count,
 * which could otherwise leave `currentPage` pointing past the last page.
 *
 * @param page - Current page index.
 * @param pageLength - Rows per page.
 * @param totalRows - Total number of (filtered) rows.
 * @returns A valid page index in `[0, totalPages - 1]`.
 */
export function clampPage(page: number, pageLength: number, totalRows: number): number {
  const { totalPages } = calcPageWindow(page, pageLength, totalRows);
  return Math.min(Math.max(0, page), totalPages - 1);
}

/**
 * Dispatches the `gridix:page` custom event on the table element.
 *
 * Fired after every page navigation so host applications can react to page
 * changes (e.g. scroll the page to the top of the table).
 *
 * @param tableEl - The `<table>` element to dispatch the event from.
 * @param page - Zero-based index of the newly visible page.
 * @param total - Total number of (filtered) rows across all pages.
 */
export function dispatchPageEvent(tableEl: HTMLTableElement, page: number, total: number): void {
  dispatch(tableEl, 'gridix:page', { page, total });
}
