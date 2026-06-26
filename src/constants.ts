import type { GridixOptions } from './types';

/**
 * `data-gridix-*` HTML attribute name strings.
 *
 * These are the only strings AEM dialog authors interact with.
 * Centralising them here means a rename is a single-file change.
 */
export const ATTR = {
  // ── Table-level attributes (on <table>) ────────────────────────────────
  /** Marks the table for auto-initialisation by the CDN build. */
  INIT: 'data-gridix',
  /** Enable (`"true"`) or disable global search. */
  SEARCH: 'data-gridix-search',
  /** Placeholder text for the global search input. */
  SEARCH_PLACEHOLDER: 'data-gridix-search-placeholder',
  /** Enable (`"true"`) or disable pagination. */
  PAGINATION: 'data-gridix-pagination',
  /** Rows per page (integer string). */
  PAGE_LENGTH: 'data-gridix-page-length',
  /** Comma-separated list of page-length options, e.g. `"10,25,50,100"`. */
  PAGE_LENGTH_MENU: 'data-gridix-page-length-menu',
  /** Enable column sorting. */
  SORT: 'data-gridix-sort',
  /** Allow multi-column sort via Shift+click. */
  SORT_MULTI: 'data-gridix-sort-multi',
  /** Show the column visibility toggle button. */
  COL_VISIBILITY: 'data-gridix-col-visibility',
  /** Comma-separated export formats: `"csv,json,copy"`. */
  EXPORT: 'data-gridix-export',
  /** Row selection mode: `"single"` or `"multi"`. */
  ROW_SELECT: 'data-gridix-row-select',
  /** Stick the `<thead>` row to the top of the scroll container. */
  FIXED_HEADER: 'data-gridix-fixed-header',
  /** Top offset (px) for the sticky header, e.g. `"60"`. */
  FIXED_HEADER_OFFSET: 'data-gridix-fixed-header-offset',
  /** Show per-column filter inputs below the header row. */
  COL_SEARCH: 'data-gridix-col-search',
  /** Custom message shown when no rows match. */
  EMPTY_TEXT: 'data-gridix-empty-text',
  /** Visual theme: `"default"`, `"minimal"`, or `"dark"`. */
  THEME: 'data-gridix-theme',

  // ── Column-level attributes (on <th>) ──────────────────────────────────
  /** Column data type: `"string"`, `"number"`, or `"date"`. */
  COL_TYPE: 'data-gridix-col-type',
  /** Set to `"false"` to prevent this column from being sorted. */
  COL_SORTABLE: 'data-gridix-col-sortable',
  /** Set to `"false"` to exclude this column from search matching. */
  COL_SEARCHABLE: 'data-gridix-col-searchable',
  /** Set to `"false"` to initially hide this column. */
  COL_VISIBLE: 'data-gridix-col-visible',
  /** Fixed column width (CSS value, e.g. `"120px"`). */
  COL_WIDTH: 'data-gridix-col-width',
  /** Extra CSS class appended to every cell in this column. */
  COL_CLASS: 'data-gridix-col-class',
  /** Set to `"true"` to exclude this column from exports. */
  COL_NO_EXPORT: 'data-gridix-col-no-export',
} as const;

/**
 * Default `GridixOptions` applied when an attribute is absent.
 * Every table-level attribute is optional; missing ones fall back to these values.
 */
export const DEFAULTS: GridixOptions = {
  search: true,
  searchPlaceholder: 'Search…',
  pagination: {
    enabled: true,
    pageLength: 10,
    pageLengthMenu: [10, 25, 50, 100],
  },
  sort: true,
  sortMulti: false,
  colVisibility: false,
  export: [],
  rowSelect: false,
  fixedHeader: false,
  fixedHeaderOffset: 0,
  colSearch: false,
  emptyText: 'No matching records found.',
  theme: 'default',
};

/**
 * CSS class name strings used throughout the plugin.
 *
 * Centralising these means a rename needs only one matching change here.
 */
export const CSS = {
  /** Outer `<div>` that wraps the table, toolbar, and footer. */
  WRAPPER: 'gridix-wrapper',
  /** Horizontally scrollable container that wraps the `<table>`. */
  SCROLL: 'gridix-scroll',
  /** Class added to the `<table>` element itself. */
  TABLE: 'gridix-table',
  /** Toolbar `<div>` above the table containing search, buttons, and page-length. */
  TOOLBAR: 'gridix-toolbar',
  /** Left section of the toolbar (page-length select). */
  TOOLBAR_LEFT: 'gridix-toolbar-left',
  /** Right section of the toolbar (search, col-vis, export). */
  TOOLBAR_RIGHT: 'gridix-toolbar-right',
  /** Global search `<input>`. */
  SEARCH_INPUT: 'gridix-search-input',
  /** Column-visibility toggle `<button>`. */
  COL_VIS_BTN: 'gridix-col-vis-btn',
  /** Column-visibility dropdown `<div>`. */
  COL_VIS_DROPDOWN: 'gridix-col-vis-dropdown',
  /** Export `<button>`. */
  EXPORT_BTN: 'gridix-export-btn',
  /** Export menu `<div>`. */
  EXPORT_MENU: 'gridix-export-menu',
  /** Footer `<div>` containing page info and pagination controls. */
  FOOTER: 'gridix-footer',
  /** `<nav>` element containing page buttons. */
  PAGINATION: 'gridix-pagination',
  /** Individual page `<button>`. */
  PAGE_BTN: 'gridix-page-btn',
  /** Modifier applied to the currently active page button. */
  PAGE_BTN_ACTIVE: 'gridix-page-btn--active',
  /** Page-length `<select>` element. */
  PAGE_LENGTH_SEL: 'gridix-page-length-select',
  /** Page info `<span>` ("Showing 1–10 of 50 entries"). */
  PAGE_INFO: 'gridix-page-info',
  /** Applied to sortable `<th>` elements. */
  TH_SORTABLE: 'gridix-th--sortable',
  /** Applied to a `<th>` when sorted ascending. */
  TH_ASC: 'gridix-th--asc',
  /** Applied to a `<th>` when sorted descending. */
  TH_DESC: 'gridix-th--desc',
  /** Per-column search `<tr>` injected below the header row. */
  COL_SEARCH_ROW: 'gridix-col-search-row',
  /** Individual per-column filter `<input>`. */
  COL_SEARCH_INPUT: 'gridix-col-search-input',
  /** `<tr>` shown when no rows match the current filter. */
  EMPTY_ROW: 'gridix-empty-row',
  /** `<mark>` element wrapping search-term matches. */
  HIGHLIGHT: 'gridix-highlight',
  /** Applied to a `<tr>` when it is selected. */
  ROW_SELECTED: 'gridix-row--selected',
  /** Applied to checkbox `<th>` / `<td>` cells. */
  CHECKBOX_COL: 'gridix-checkbox-col',
  /** Applied to cells that belong to a hidden column. */
  HIDDEN_COL: 'gridix-col--hidden',
  /** Applied to the `<table>` once `GridixTable` has been constructed. */
  IS_INIT: 'gridix-initialized',
} as const;
