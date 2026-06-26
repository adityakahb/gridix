/**
 * Sort direction for a column.
 * - `'asc'`  — ascending
 * - `'desc'` — descending
 * - `'none'` — no active sort (initial / cleared state)
 */
export type SortDir = 'asc' | 'desc' | 'none';

/**
 * Data type used for sort comparisons and formatting.
 * - `'string'` — locale-aware case-insensitive string sort
 * - `'number'` — numeric sort (strips non-numeric characters before comparing)
 * - `'date'`   — ISO-8601 or parseable date string sort
 */
export type ColType = 'string' | 'number' | 'date';

/**
 * Row-selection interaction mode.
 * - `'single'` — at most one row selected at a time
 * - `'multi'`  — multiple rows selectable; adds a checkbox column with a select-all header
 * - `false`    — row selection disabled (default)
 */
export type RowSelectMode = 'single' | 'multi' | false;

/**
 * Export format produced by the Export button.
 * - `'csv'`  — downloads a `.csv` file
 * - `'json'` — downloads a `.json` file
 * - `'copy'` — copies tab-separated text to the clipboard
 */
export type ExportFormat = 'csv' | 'json' | 'copy';

/**
 * Built-in visual theme applied via `data-gridix-theme`.
 * All themes are implemented as CSS custom property overrides so any token can
 * be further customised per-component by overriding the `--gridix-*` CSS variables.
 */
export type GridixTheme = 'default' | 'minimal' | 'dark';

/**
 * Parsed definition for a single table column, derived from the `<th>` element
 * and its `data-gridix-col-*` attributes.
 */
export interface ColDef {
  /** Zero-based column index (matches position in the original `<thead>` row). */
  index: number;
  /** Column heading text extracted from `<th>` `textContent`. */
  label: string;
  /** Sort and comparison strategy for the column's values. */
  type: ColType;
  /** Whether the column can be sorted by clicking its header. */
  sortable: boolean;
  /** Whether the column's cells are matched during global and per-column search. */
  searchable: boolean;
  /** Whether the column is currently visible. Set to `false` via `data-gridix-col-visible`. */
  visible: boolean;
  /** Optional fixed width applied to the column (e.g. `"120px"`, `"10%"`). */
  width?: string;
  /** Extra CSS class appended to every cell in this column. */
  extraClass?: string;
  /** When `true` the column is excluded from CSV/JSON/copy exports. */
  noExport: boolean;
}

/**
 * Represents one column in the current multi-column sort stack.
 */
export interface SortState {
  /** Index of the sorted column (into `GridixOptions.cols`). */
  colIndex: number;
  /** Current sort direction for this column. */
  dir: SortDir;
}

/**
 * Pagination configuration sub-object.
 */
export interface PaginationOptions {
  /** Whether pagination is enabled. When `false` all rows are shown at once. */
  enabled: boolean;
  /** Number of rows shown per page. */
  pageLength: number;
  /** Available choices in the "Show N entries" drop-down. */
  pageLengthMenu: number[];
}

/**
 * Full resolved options passed to (or inferred by) `GridixTable`.
 * All fields have defaults defined in `DEFAULTS` inside `constants.ts`.
 */
export interface GridixOptions {
  /** Show the global search input. */
  search: boolean;
  /** Placeholder text for the global search input. */
  searchPlaceholder: string;
  /** Pagination settings. */
  pagination: PaginationOptions;
  /** Enable column sorting. */
  sort: boolean;
  /** Allow multi-column sort via Shift+click. */
  sortMulti: boolean;
  /** Show the column visibility toggle button. */
  colVisibility: boolean;
  /** Export formats to expose in the Export menu. Empty array hides the button. */
  export: ExportFormat[];
  /** Row selection mode. */
  rowSelect: RowSelectMode;
  /** Stick the `<thead>` to the top of its scroll container. */
  fixedHeader: boolean;
  /** Top offset (px) for the sticky header — useful when a site-wide nav bar is present. */
  fixedHeaderOffset: number;
  /** Show per-column search inputs below the header row. */
  colSearch: boolean;
  /** Message shown when no rows match the current filter / search. */
  emptyText: string;
  /** Visual theme to apply. */
  theme: GridixTheme;
}

/**
 * Mutable runtime state owned by `GridixTable`.
 * Updated by `render()` after every user interaction.
 */
export interface GridixState {
  /** All body rows in original DOM order. */
  rows: HTMLTableRowElement[];
  /** Rows visible after the current sort + filter have been applied. */
  filteredRows: HTMLTableRowElement[];
  /** Zero-based index of the currently displayed page. */
  currentPage: number;
  /** Active sort entries in priority order (index 0 = primary sort). */
  sortStack: SortState[];
  /** Current global search term. */
  searchQuery: string;
  /** Per-column search terms indexed by column position. */
  colSearchQueries: string[];
  /** Set of column indices that are currently hidden. */
  hiddenCols: Set<number>;
  /** Set of row indices (into `rows`) that are currently selected. */
  selectedRows: Set<number>;
}
