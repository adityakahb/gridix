import { ATTR, DEFAULTS } from '../constants';
import type {
  ColDef,
  ColType,
  GridixOptions,
  ExportFormat,
  RowSelectMode,
  GridixTheme,
} from '../types';

/**
 * Parses a nullable string attribute as a boolean.
 *
 * - `null` (attribute absent) → `fallback`
 * - `"false"` → `false`
 * - Any other value (e.g. `"true"`, `""`) → `true`
 *
 * @param val - Raw attribute value from `getAttribute()`, or `null` if absent.
 * @param fallback - Value to return when the attribute is not present.
 */
function parseBool(val: string | null, fallback: boolean): boolean {
  if (val === null) return fallback;
  return val !== 'false';
}

/**
 * Parses a nullable comma-separated attribute string into an array of `T`.
 *
 * @param val - Raw attribute value, or `null` / `""` if absent.
 * @param fallback - Array to return when the attribute is empty or absent.
 */
function parseList<T extends string>(val: string | null, fallback: T[]): T[] {
  if (!val) return fallback;
  return val.split(',').map(s => s.trim() as T);
}

/**
 * Parses a nullable comma-separated numeric string into a `number[]`.
 * Non-numeric tokens are silently dropped.
 *
 * @param val - Raw attribute value, or `null` / `""` if absent.
 * @param fallback - Array to return when the attribute is empty or absent.
 */
function parseNumList(val: string | null, fallback: number[]): number[] {
  if (!val) return fallback;
  return val
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));
}

/**
 * Reads all `data-gridix-*` attributes from a `<table>` element and returns a
 * fully resolved `GridixOptions` object.
 *
 * Missing attributes fall back to the values in `DEFAULTS`. AEM dialog fields
 * write these attributes at page-save time; no JavaScript from the author side
 * is required.
 *
 * @param table - The `<table>` element to parse attributes from.
 * @returns Resolved options derived from the element's data attributes.
 */
export function parseOptions(table: HTMLTableElement): GridixOptions {
  const g = (attr: string): string | null => table.getAttribute(attr);
  const pageLengthMenu = parseNumList(g(ATTR.PAGE_LENGTH_MENU), DEFAULTS.pagination.pageLengthMenu);

  return {
    search: parseBool(g(ATTR.SEARCH), DEFAULTS.search),
    searchPlaceholder: g(ATTR.SEARCH_PLACEHOLDER) ?? DEFAULTS.searchPlaceholder,
    pagination: {
      enabled: parseBool(g(ATTR.PAGINATION), DEFAULTS.pagination.enabled),
      pageLength: g(ATTR.PAGE_LENGTH)
        ? parseInt(g(ATTR.PAGE_LENGTH)!, 10)
        : DEFAULTS.pagination.pageLength,
      pageLengthMenu,
    },
    sort: parseBool(g(ATTR.SORT), DEFAULTS.sort),
    sortMulti: parseBool(g(ATTR.SORT_MULTI), DEFAULTS.sortMulti),
    colVisibility: parseBool(g(ATTR.COL_VISIBILITY), DEFAULTS.colVisibility),
    export: parseList<ExportFormat>(g(ATTR.EXPORT), DEFAULTS.export),
    rowSelect: (g(ATTR.ROW_SELECT) as RowSelectMode) ?? DEFAULTS.rowSelect,
    fixedHeader: parseBool(g(ATTR.FIXED_HEADER), DEFAULTS.fixedHeader),
    // Clamp to [0, 1000] px — guards against NaN and absurdly large values from
    // malformed AEM dialog input while still supporting any realistic nav-bar height.
    fixedHeaderOffset: (() => {
      const raw = g(ATTR.FIXED_HEADER_OFFSET);
      if (!raw) return DEFAULTS.fixedHeaderOffset;
      const parsed = parseInt(raw, 10);
      return isNaN(parsed) ? DEFAULTS.fixedHeaderOffset : Math.max(0, Math.min(parsed, 1000));
    })(),
    colSearch: parseBool(g(ATTR.COL_SEARCH), DEFAULTS.colSearch),
    emptyText: g(ATTR.EMPTY_TEXT) ?? DEFAULTS.emptyText,
    theme: (g(ATTR.THEME) as GridixTheme) ?? DEFAULTS.theme,
  };
}

/**
 * Reads the first `<thead>` row of a table and returns a `ColDef` for each
 * `<th>` / `<td>` cell, merging `data-gridix-col-*` attribute values with
 * sensible defaults.
 *
 * @param table - The `<table>` element whose header row to parse.
 * @returns Ordered array of column definitions (index 0 = leftmost column).
 */
export function parseCols(table: HTMLTableElement): ColDef[] {
  const headers = Array.from(
    table.querySelectorAll<HTMLTableCellElement>(
      'thead tr:first-child th, thead tr:first-child td',
    ),
  );
  return headers.map((th, index) => ({
    index,
    label: th.textContent?.trim() ?? `Col ${index + 1}`,
    type: (th.getAttribute(ATTR.COL_TYPE) as ColType) ?? 'string',
    sortable: parseBool(th.getAttribute(ATTR.COL_SORTABLE), true),
    searchable: parseBool(th.getAttribute(ATTR.COL_SEARCHABLE), true),
    visible: parseBool(th.getAttribute(ATTR.COL_VISIBLE), true),
    width: th.getAttribute(ATTR.COL_WIDTH) ?? undefined,
    extraClass: th.getAttribute(ATTR.COL_CLASS) ?? undefined,
    noExport: th.hasAttribute(ATTR.COL_NO_EXPORT),
  }));
}

/**
 * Returns all `<tbody>` rows of a table as an ordered array.
 *
 * The returned array preserves DOM order and is used as the authoritative
 * source of truth for `GridixState.rows`.
 *
 * @param table - The `<table>` element to query.
 * @returns Array of `<tr>` elements from the table body.
 */
export function parseRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'));
}
