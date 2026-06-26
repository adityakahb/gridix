/**
 * Sort direction for a column.
 * - `'asc'`  — ascending
 * - `'desc'` — descending
 * - `'none'` — no active sort (initial / cleared state)
 */
type SortDir = 'asc' | 'desc' | 'none';
/**
 * Data type used for sort comparisons and formatting.
 * - `'string'` — locale-aware case-insensitive string sort
 * - `'number'` — numeric sort (strips non-numeric characters before comparing)
 * - `'date'`   — ISO-8601 or parseable date string sort
 */
type ColType = 'string' | 'number' | 'date';
/**
 * Row-selection interaction mode.
 * - `'single'` — at most one row selected at a time
 * - `'multi'`  — multiple rows selectable; adds a checkbox column with a select-all header
 * - `false`    — row selection disabled (default)
 */
type RowSelectMode = 'single' | 'multi' | false;
/**
 * Export format produced by the Export button.
 * - `'csv'`  — downloads a `.csv` file
 * - `'json'` — downloads a `.json` file
 * - `'copy'` — copies tab-separated text to the clipboard
 */
type ExportFormat = 'csv' | 'json' | 'copy';
/**
 * Built-in visual theme applied via `data-gridix-theme`.
 * All themes are implemented as CSS custom property overrides so any token can
 * be further customised per-component by overriding the `--gridix-*` CSS variables.
 */
type GridixTheme = 'default' | 'minimal' | 'dark';
/**
 * Parsed definition for a single table column, derived from the `<th>` element
 * and its `data-gridix-col-*` attributes.
 */
interface ColDef {
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
interface SortState {
    /** Index of the sorted column (into `GridixOptions.cols`). */
    colIndex: number;
    /** Current sort direction for this column. */
    dir: SortDir;
}
/**
 * Pagination configuration sub-object.
 */
interface PaginationOptions {
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
interface GridixOptions {
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
interface GridixState {
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

/**
 * Core Gridix table controller.
 *
 * Wraps a plain `<table>` element with sorting, filtering, pagination,
 * column-visibility toggling, row selection, keyboard navigation, and data
 * export — all configurable through `data-gridix-*` HTML attributes so that
 * AEM authors need write zero JavaScript.
 *
 * ### Lifecycle
 * 1. Construct: `new GridixTable(tableEl)` — reads attributes, builds DOM, runs first render.
 * 2. Interact: users click headers, type in the search box, etc.
 * 3. Destroy: call `.destroy()` to remove all DOM additions and event listeners.
 *
 * ### Events dispatched on the `<table>` element
 * | Event | `detail` |
 * |---|---|
 * | `gridix:sort` | `{ col: number, dir: SortDir }` |
 * | `gridix:page` | `{ page: number, total: number }` |
 * | `gridix:rowselect` | `{ rows: number[] }` |
 *
 * @example
 * ```ts
 * import { GridixTable } from 'gridix';
 * const table = document.querySelector('table')!;
 * const grid = new GridixTable(table);
 * grid.search('alice');
 * grid.goToPage(2);
 * ```
 */
declare class GridixTable {
    /** Semver version of the Gridix library. Useful for runtime diagnostics. */
    static readonly currentVersion = "1.0.0";
    private table;
    private opts;
    private cols;
    private state;
    private wrapper;
    private scrollEl;
    private toolbar;
    private footer;
    private headers;
    private cleanups;
    private shiftHeld;
    /**
     * Creates and initialises a new Gridix table.
     *
     * Options are resolved in priority order:
     * 1. `data-gridix-*` HTML attributes on `tableEl` (highest — AEM dialog fields).
     * 2. Programmatic `options` argument.
     * 3. `DEFAULTS` from `constants.ts` (lowest).
     *
     * @param tableEl - The `<table>` element to enhance.
     * @param options - Optional programmatic overrides (lower priority than HTML attributes).
     */
    constructor(tableEl: HTMLTableElement, options?: Partial<GridixOptions>);
    private build;
    private buildToolbar;
    private buildColVisBtn;
    private buildExportMenu;
    private buildHeaders;
    private triggerSort;
    private buildColSearchRow;
    private buildCheckboxCol;
    private applyFixedHeader;
    private bindKeyboard;
    private render;
    private renderPagination;
    private pageRange;
    /**
     * Applies a global search query and re-renders the table.
     *
     * @param query - The search string. Pass `""` to clear the filter.
     */
    search(query: string): void;
    /**
     * Navigates to a specific page and re-renders the table.
     *
     * @param page - Zero-based page index.
     */
    goToPage(page: number): void;
    /**
     * Programmatically sorts by a single column and re-renders.
     *
     * @param colIndex - Zero-based index of the column to sort.
     * @param dir - `'asc'`, `'desc'`, or `'none'` to clear.
     */
    sort(colIndex: number, dir: 'asc' | 'desc' | 'none'): void;
    /**
     * Makes a previously hidden column visible and re-renders.
     *
     * @param colIndex - Zero-based index of the column to show.
     */
    showCol(colIndex: number): void;
    /**
     * Hides a column from view and re-renders.
     *
     * @param colIndex - Zero-based index of the column to hide.
     */
    hideCol(colIndex: number): void;
    /**
     * Returns the zero-based indices of all currently selected rows.
     *
     * @returns Array of selected row indices, or an empty array when none are selected.
     */
    getSelectedRows(): number[];
    /**
     * Tears down the Gridix instance, removing all DOM additions and event
     * listeners and restoring the original `<table>` to its pre-init position.
     */
    destroy(): void;
}

/**
 * Scans the document for all `<table data-gridix>` elements that have not yet
 * been initialised and constructs a `GridixTable` for each one.
 *
 * A table is considered already initialised when it carries the
 * `gridix-initialized` CSS class (added by the `GridixTable` constructor).
 * This guard prevents double-initialisation when `autoInit` is called more
 * than once (e.g. if the CDN script is accidentally included twice).
 *
 * This function is the only exported symbol that carries a DOM side-effect.
 * It is called automatically by `src/cdn.ts` on `DOMContentLoaded` (or
 * immediately if the document is already interactive). The ESM / CJS build
 * (`src/index.ts`) re-exports it for consumers who prefer programmatic control
 * over when initialisation occurs.
 */
declare function autoInit(): void;

export { GridixTable as Gridix, autoInit };
export type { ColDef, ColType, ExportFormat, GridixOptions, GridixState, GridixTheme, RowSelectMode, SortDir };
