import type { ColDef } from '../types';
import { CSS } from '../constants';
import { escapeRegex } from '../utils/dom';

/**
 * Inserts `<mark class="gridix-highlight">` elements around every occurrence
 * of `query` in `text`, appending all resulting nodes to `container`.
 *
 * Uses the DOM API exclusively — no `innerHTML` — so angle brackets and other
 * HTML-special characters in cell text are rendered as literal characters and
 * cannot be exploited for XSS.
 *
 * @param container - The element to receive the new child nodes (should be
 *   cleared before calling).
 * @param text - The plain-text string to annotate.
 * @param re - Case-insensitive global regex that matches the search term.
 */
function appendHighlightedNodes(container: HTMLElement, text: string, re: RegExp): void {
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // re.lastIndex may be non-zero if reused; reset to be safe
  re.lastIndex = 0;

  while ((match = re.exec(text)) !== null) {
    // Plain text that precedes this match
    if (match.index > lastIndex) {
      container.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    // Highlighted match — textContent is always safe (never parsed as HTML)
    const mark = document.createElement('mark');
    mark.className = CSS.HIGHLIGHT;
    mark.textContent = match[0];
    container.appendChild(mark);

    lastIndex = re.lastIndex;

    // Guard against infinite loops on zero-length matches
    if (match[0].length === 0) {
      re.lastIndex++;
      if (re.lastIndex > text.length) break;
    }
  }

  // Remaining text after the last match
  if (lastIndex < text.length) {
    container.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

/**
 * Returns `true` when `row` matches the global search `query` in at least one
 * searchable, visible column. Returns `true` unconditionally when `query` is
 * empty. Matching is case-insensitive.
 *
 * @param row - The table row to test.
 * @param query - The global search string (may be empty).
 * @param cols - Column definitions; only `searchable` and `visible` columns are
 *   checked.
 */
export function matchesGlobalSearch(
  row: HTMLTableRowElement,
  query: string,
  cols: ColDef[],
): boolean {
  if (!query) return true;
  const re = new RegExp(escapeRegex(query), 'i');
  return cols.some((col, i) => {
    if (!col.searchable || !col.visible) return false;
    return re.test(row.cells[i]?.textContent?.trim() ?? '');
  });
}

/**
 * Returns `true` when every non-empty per-column query in `queries` matches
 * the corresponding cell in `row`. A missing query for a column is treated as
 * matching. Hidden columns are skipped.
 *
 * @param row - The table row to test.
 * @param queries - Per-column search strings (index-aligned with `cols`).
 * @param cols - Column definitions used to check visibility.
 */
export function matchesColSearch(
  row: HTMLTableRowElement,
  queries: string[],
  cols: ColDef[],
): boolean {
  return queries.every((q, i) => {
    if (!q) return true;
    if (!cols[i]?.visible) return true;
    const re = new RegExp(escapeRegex(q), 'i');
    return re.test(row.cells[i]?.textContent?.trim() ?? '');
  });
}

/**
 * Filters `rows` by applying both global search and per-column search, returning
 * only the rows that satisfy both predicates.
 *
 * @param rows - Full set of body rows (after sorting).
 * @param globalQuery - Global search string.
 * @param colQueries - Per-column search strings.
 * @param cols - Column definitions.
 * @returns Filtered subset of `rows` in original order.
 */
export function filterRows(
  rows: HTMLTableRowElement[],
  globalQuery: string,
  colQueries: string[],
  cols: ColDef[],
): HTMLTableRowElement[] {
  return rows.filter(
    row => matchesGlobalSearch(row, globalQuery, cols) && matchesColSearch(row, colQueries, cols),
  );
}

/**
 * Highlights matching text in each searchable cell by wrapping occurrences in
 * `<mark class="gridix-highlight">` elements.
 *
 * When `query` is empty the cell is restored to its plain-text content (stored
 * in the `data-gridix-original` attribute). The first call that modifies a cell
 * stores its original text in that attribute so subsequent calls always restore
 * the pre-highlight value.
 *
 * **XSS safety:** Cell content is injected exclusively via DOM text nodes and
 * `textContent`. No `innerHTML` is used, so angle brackets and other
 * HTML-special characters in cell text cannot be used for script injection.
 *
 * @param rows - Rows whose cells should be highlighted.
 * @param query - The search term to highlight (empty string clears highlights).
 * @param cols - Column definitions; non-searchable columns are skipped.
 */
export function highlightCells(rows: HTMLTableRowElement[], query: string, cols: ColDef[]): void {
  const re = query ? new RegExp(escapeRegex(query), 'gi') : null;

  rows.forEach(row => {
    cols.forEach((col, i) => {
      const cell = row.cells[i];
      if (!cell || !col.searchable) return;

      // Persist original plain-text on the first highlight so restore always works
      const original = cell.getAttribute('data-gridix-original') ?? cell.textContent ?? '';
      cell.setAttribute('data-gridix-original', original);

      if (re) {
        // Clear and repopulate using safe DOM methods (never innerHTML)
        cell.textContent = '';
        appendHighlightedNodes(cell, original, re);
      } else {
        cell.textContent = original;
      }
    });
  });
}
