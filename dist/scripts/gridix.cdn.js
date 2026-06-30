/*! Gridix v1.0.0 | MIT License | https://github.com/gridix */
var Gridix = (function (exports) {
    'use strict';

    /**
     * `data-gridix-*` HTML attribute name strings.
     *
     * These are the only strings AEM dialog authors interact with.
     * Centralising them here means a rename is a single-file change.
     */
    const ATTR = {
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
    };
    /**
     * Default `GridixOptions` applied when an attribute is absent.
     * Every table-level attribute is optional; missing ones fall back to these values.
     */
    const DEFAULTS = {
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
    const CSS = {
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
    };

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
    function parseBool(val, fallback) {
        if (val === null)
            return fallback;
        return val !== 'false';
    }
    /**
     * Parses a nullable comma-separated attribute string into an array of `T`.
     *
     * @param val - Raw attribute value, or `null` / `""` if absent.
     * @param fallback - Array to return when the attribute is empty or absent.
     */
    function parseList(val, fallback) {
        if (!val)
            return fallback;
        return val.split(',').map(s => s.trim());
    }
    /**
     * Parses a nullable comma-separated numeric string into a `number[]`.
     * Non-numeric tokens are silently dropped.
     *
     * @param val - Raw attribute value, or `null` / `""` if absent.
     * @param fallback - Array to return when the attribute is empty or absent.
     */
    function parseNumList(val, fallback) {
        if (!val)
            return fallback;
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
    function parseOptions(table) {
        const g = (attr) => table.getAttribute(attr);
        const pageLengthMenu = parseNumList(g(ATTR.PAGE_LENGTH_MENU), DEFAULTS.pagination.pageLengthMenu);
        return {
            search: parseBool(g(ATTR.SEARCH), DEFAULTS.search),
            searchPlaceholder: g(ATTR.SEARCH_PLACEHOLDER) ?? DEFAULTS.searchPlaceholder,
            pagination: {
                enabled: parseBool(g(ATTR.PAGINATION), DEFAULTS.pagination.enabled),
                pageLength: g(ATTR.PAGE_LENGTH)
                    ? parseInt(g(ATTR.PAGE_LENGTH), 10)
                    : DEFAULTS.pagination.pageLength,
                pageLengthMenu,
            },
            sort: parseBool(g(ATTR.SORT), DEFAULTS.sort),
            sortMulti: parseBool(g(ATTR.SORT_MULTI), DEFAULTS.sortMulti),
            colVisibility: parseBool(g(ATTR.COL_VISIBILITY), DEFAULTS.colVisibility),
            export: parseList(g(ATTR.EXPORT), DEFAULTS.export),
            rowSelect: g(ATTR.ROW_SELECT) ?? DEFAULTS.rowSelect,
            fixedHeader: parseBool(g(ATTR.FIXED_HEADER), DEFAULTS.fixedHeader),
            // Clamp to [0, 1000] px — guards against NaN and absurdly large values from
            // malformed AEM dialog input while still supporting any realistic nav-bar height.
            fixedHeaderOffset: (() => {
                const raw = g(ATTR.FIXED_HEADER_OFFSET);
                if (!raw)
                    return DEFAULTS.fixedHeaderOffset;
                const parsed = parseInt(raw, 10);
                return isNaN(parsed) ? DEFAULTS.fixedHeaderOffset : Math.max(0, Math.min(parsed, 1000));
            })(),
            colSearch: parseBool(g(ATTR.COL_SEARCH), DEFAULTS.colSearch),
            emptyText: g(ATTR.EMPTY_TEXT) ?? DEFAULTS.emptyText,
            theme: g(ATTR.THEME) ?? DEFAULTS.theme,
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
    function parseCols(table) {
        const headers = Array.from(table.querySelectorAll('thead tr:first-child th, thead tr:first-child td'));
        return headers.map((th, index) => ({
            index,
            label: th.textContent?.trim() ?? `Col ${index + 1}`,
            type: th.getAttribute(ATTR.COL_TYPE) ?? 'string',
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
    function parseRows(table) {
        return Array.from(table.querySelectorAll('tbody tr'));
    }

    /**
     * Creates an HTML element with optional attributes and text content.
     *
     * @param tag - Tag name (key of `HTMLElementTagNameMap`).
     * @param attrs - Attribute name/value pairs to set on the element.
     * @param text - Optional `textContent` to set.
     * @returns The newly created element, typed to the specific tag.
     */
    function el(tag, attrs = {}, text) {
        const node = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            node.setAttribute(k, v);
        }
        if (text !== undefined)
            node.textContent = text;
        return node;
    }
    /**
     * Adds an event listener and returns a teardown function that removes it.
     *
     * @param target - The element (or `document`) to attach the listener to.
     * @param event - Event name from `HTMLElementEventMap`.
     * @param handler - Callback invoked on each event.
     * @param options - Optional `AddEventListenerOptions` (e.g. `{ passive: true }`).
     * @returns A zero-argument function that removes the listener when called.
     */
    function on(target, event, handler, options) {
        target.addEventListener(event, handler, options);
        return () => target.removeEventListener(event, handler, options);
    }
    /**
     * Dispatches a bubbling `CustomEvent` with an optional `detail` payload.
     *
     * @param target - Element from which the event bubbles.
     * @param name - Event name (e.g. `"gridix:sort"`).
     * @param detail - Arbitrary payload available as `event.detail`.
     */
    function dispatch(target, name, detail) {
        target.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
    /**
     * Returns a debounced version of `fn` that delays execution until `ms`
     * milliseconds have elapsed since the last call.
     *
     * Rapid successive calls reset the timer; the wrapped function fires only once
     * after the caller goes quiet.
     *
     * @param fn - The function to debounce.
     * @param ms - Quiescent period in milliseconds.
     * @returns A debounced function with the same signature as `fn`.
     */
    function debounce(fn, ms) {
        let timer;
        return ((...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        });
    }
    /**
     * Escapes all RegExp special characters in `str` so the result can be used
     * safely inside `new RegExp(...)` without unintended pattern behaviour.
     *
     * @param str - The literal string to escape.
     * @returns A string with all regex metacharacters backslash-escaped.
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Measures the natural (content-driven) width of a table by temporarily
     * switching it to `width: auto; table-layout: auto`, reading `scrollWidth`,
     * then restoring all original inline styles.
     *
     * This delegates the minimum content width calculation to the browser's own
     * layout engine rather than summing column widths manually.
     *
     * @param table - The `<table>` element to measure.
     * @returns The natural pixel width, or `0` if the layout engine returns nothing.
     */
    function measureNaturalWidth(table) {
        const prevWidth = table.style.width;
        const prevLayout = table.style.tableLayout;
        const prevMinWidth = table.style.minWidth;
        table.style.width = 'auto';
        table.style.tableLayout = 'auto';
        table.style.minWidth = '0';
        const natural = table.scrollWidth;
        table.style.width = prevWidth;
        table.style.tableLayout = prevLayout;
        table.style.minWidth = prevMinWidth;
        return natural || 0;
    }
    /**
     * Applies `measureNaturalWidth` as the `min-width` of the scroll container,
     * then installs a `ResizeObserver` that re-measures whenever the scroll
     * container changes size (e.g. when the browser window is resized or the
     * column count changes).
     *
     * @param scrollContainer - The scrollable wrapper `<div>` around the table.
     * @param table - The `<table>` element to measure.
     * @returns A teardown function that disconnects the `ResizeObserver`.
     */
    function applyNaturalWidth(scrollContainer, table) {
        const update = () => {
            const width = measureNaturalWidth(table);
            if (width > 0) {
                table.style.minWidth = `${width}px`;
            }
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(scrollContainer);
        return () => ro.disconnect();
    }

    /**
     * Singleton `aria-live="polite"` region used for screen-reader announcements.
     *
     * The region is created the first time `announce()` is called and then reused.
     * If the element is removed from the DOM (e.g. via `document.body.innerHTML = ''`
     * in tests) it is recreated transparently on the next call.
     */
    let region = null;
    /**
     * Returns the singleton live region, creating and appending it to `<body>` if
     * it does not yet exist or has been removed from the DOM.
     */
    function getRegion() {
        if (!region || !document.body.contains(region)) {
            region = document.createElement('div');
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            region.className = 'gridix-sr-only';
            document.body.appendChild(region);
        }
        return region;
    }
    /**
     * Announces a message to assistive technologies via the `aria-live="polite"`
     * singleton region.
     *
     * The region is cleared first so that repeating identical messages are always
     * re-announced. The actual text is set inside `requestAnimationFrame` to give
     * the browser time to register the DOM mutation before applying the new value.
     *
     * @param message - The plain-text string to announce.
     */
    function announce(message) {
        const el = getRegion();
        // Clear then set to ensure re-announcement of identical messages
        el.textContent = '';
        // Small delay lets the DOM mutation register before the new text is set
        requestAnimationFrame(() => {
            el.textContent = message;
        });
    }

    /**
     * Returns the trimmed `textContent` of the cell at `colIndex` in `row`,
     * or an empty string if the cell is absent.
     */
    function cellText(row, colIndex) {
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
    function compareValues(a, b, type) {
        if (type === 'number') {
            const na = parseFloat(a.replace(/[^0-9.\-]/g, ''));
            const nb = parseFloat(b.replace(/[^0-9.\-]/g, ''));
            if (!isNaN(na) && !isNaN(nb))
                return na - nb;
        }
        if (type === 'date') {
            const da = Date.parse(a);
            const db = Date.parse(b);
            if (!isNaN(da) && !isNaN(db))
                return da - db;
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
    function sortRows(rows, stack, cols) {
        if (!stack.length)
            return rows;
        return [...rows].sort((a, b) => {
            for (const { colIndex, dir } of stack) {
                if (dir === 'none')
                    continue;
                const colDef = cols[colIndex];
                const va = cellText(a, colIndex);
                const vb = cellText(b, colIndex);
                const cmp = compareValues(va, vb, colDef?.type ?? 'string');
                if (cmp !== 0)
                    return dir === 'asc' ? cmp : -cmp;
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
    function nextDir(current) {
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
    function updateHeaderClasses(headers, stack) {
        headers.forEach((th, i) => {
            th.classList.remove(CSS.TH_ASC, CSS.TH_DESC);
            const entry = stack.find(s => s.colIndex === i);
            if (entry?.dir === 'asc') {
                th.classList.add(CSS.TH_ASC);
                th.setAttribute('aria-sort', 'ascending');
            }
            else if (entry?.dir === 'desc') {
                th.classList.add(CSS.TH_DESC);
                th.setAttribute('aria-sort', 'descending');
            }
            else if (th.classList.contains(CSS.TH_SORTABLE)) {
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
    function handleHeaderClick(th, colIndex, multiSort, stack, shiftHeld, tableEl) {
        const existing = stack.find(s => s.colIndex === colIndex);
        const dir = nextDir(existing?.dir ?? 'none');
        let next;
        if (multiSort && shiftHeld) {
            if (existing) {
                next =
                    dir === 'none'
                        ? stack.filter(s => s.colIndex !== colIndex)
                        : stack.map(s => (s.colIndex === colIndex ? { colIndex, dir } : s));
            }
            else {
                next = [...stack, { colIndex, dir }];
            }
        }
        else {
            next = dir === 'none' ? [] : [{ colIndex, dir }];
        }
        dispatch(tableEl, 'gridix:sort', { col: colIndex, dir });
        return next;
    }

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
    function appendHighlightedNodes(container, text, re) {
        let lastIndex = 0;
        let match;
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
                if (re.lastIndex > text.length)
                    break;
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
    function matchesGlobalSearch(row, query, cols) {
        if (!query)
            return true;
        const re = new RegExp(escapeRegex(query), 'i');
        return cols.some((col, i) => {
            if (!col.searchable || !col.visible)
                return false;
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
    function matchesColSearch(row, queries, cols) {
        return queries.every((q, i) => {
            if (!q)
                return true;
            if (!cols[i]?.visible)
                return true;
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
    function filterRows(rows, globalQuery, colQueries, cols) {
        return rows.filter(row => matchesGlobalSearch(row, globalQuery, cols) && matchesColSearch(row, colQueries, cols));
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
    function highlightCells(rows, query, cols) {
        const re = query ? new RegExp(escapeRegex(query), 'gi') : null;
        rows.forEach(row => {
            cols.forEach((col, i) => {
                const cell = row.cells[i];
                if (!cell || !col.searchable)
                    return;
                // Persist original plain-text on the first highlight so restore always works
                const original = cell.getAttribute('data-gridix-original') ?? cell.textContent ?? '';
                cell.setAttribute('data-gridix-original', original);
                if (re) {
                    // Clear and repopulate using safe DOM methods (never innerHTML)
                    cell.textContent = '';
                    appendHighlightedNodes(cell, original, re);
                }
                else {
                    cell.textContent = original;
                }
            });
        });
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
    function calcPageWindow(page, pageLength, totalRows) {
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
    function applyPagination(rows, page, pageLength) {
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
    function clampPage(page, pageLength, totalRows) {
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
    function dispatchPageEvent(tableEl, page, total) {
        dispatch(tableEl, 'gridix:page', { page, total });
    }

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
    function applyColVisibility(table, hiddenCols, cols) {
        const allRows = [
            ...Array.from(table.querySelectorAll('thead tr')),
            ...Array.from(table.querySelectorAll('tbody tr')),
            ...Array.from(table.querySelectorAll('tfoot tr')),
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
    function getExportableCols(cols, hiddenCols) {
        return cols
            .filter((col, i) => !col.noExport && !hiddenCols.has(i) && col.visible)
            .map(col => col.index);
    }

    /**
     * Guards a single cell value against **CSV formula injection** (a.k.a. CSV
     * injection / DDE injection).
     *
     * Spreadsheet applications (Excel, Google Sheets, LibreOffice Calc) interpret
     * cells whose first character is `=`, `+`, `-`, `@`, `\t`, or `\r` as
     * formulas. A malicious actor who can influence table cell content could craft
     * a value that executes arbitrary code or exfiltrates data when the CSV is
     * opened.
     *
     * This function prefixes such values with a single apostrophe `'`, which all
     * major spreadsheet applications treat as a "force literal string" prefix.
     *
     * References:
     * - OWASP: https://owasp.org/www-community/attacks/CSV_Injection
     * - RFC 4180 §2 (does not address formula prefixes; this is a defensive addition)
     *
     * @param value - Raw, unquoted cell string.
     * @returns The value unchanged if safe, or prefixed with `'` when it starts
     *   with a formula-injection character.
     */
    function sanitizeCsvValue(value) {
        return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    }
    /**
     * Returns the exportable text for a single cell, preferring the
     * `data-gridix-original` attribute (which stores the pre-highlight raw value)
     * over `textContent`. Falls back to an empty string when the cell is absent.
     *
     * @param row - The row containing the cell.
     * @param colIndex - Zero-based column index.
     */
    function getCellText(row, colIndex) {
        const cell = row.cells[colIndex];
        return cell?.getAttribute('data-gridix-original') ?? cell?.textContent?.trim() ?? '';
    }
    /**
     * Builds the 2-D cell-value matrix for the given exportable columns.
     *
     * @param rows - Filtered (and sorted) rows to export.
     * @param cols - All column definitions (used indirectly via `getCellText`).
     * @param exportableCols - Ordered list of column indices to include.
     * @returns Row-major array of string cell values.
     */
    function buildRows(rows, cols, exportableCols) {
        return rows.map(row => exportableCols.map(i => getCellText(row, i)));
    }
    /**
     * Builds the header row for the export by looking up each exportable column's
     * label. Falls back to `"Col N"` (1-based) when the column definition is
     * missing.
     *
     * @param cols - All column definitions.
     * @param exportableCols - Ordered list of column indices to include.
     * @returns Array of header label strings.
     */
    function buildHeaders(cols, exportableCols) {
        return exportableCols.map(i => cols[i]?.label ?? `Col ${i + 1}`);
    }
    /**
     * Exports the visible rows as a RFC-4180 CSV file and triggers a browser
     * download.
     *
     * All values are double-quoted; embedded double-quotes are escaped by doubling
     * them (`"Say ""hi"""`). Lines are separated by `\r\n` per the RFC.
     *
     * Cell values are also passed through {@link sanitizeCsvValue} to prevent
     * formula injection when the file is opened in a spreadsheet application.
     *
     * @param rows - Filtered rows to export.
     * @param cols - All column definitions.
     * @param exportableCols - Ordered column indices to include.
     * @param filename - Target filename for the download (default `gridix-export.csv`).
     */
    function exportCsv(rows, cols, exportableCols, filename = 'gridix-export.csv') {
        const headers = buildHeaders(cols, exportableCols);
        const data = buildRows(rows, cols, exportableCols);
        /** RFC-4180 field encoding + formula-injection guard. */
        const escape = (v) => {
            const safe = sanitizeCsvValue(v);
            return `"${safe.replace(/"/g, '""')}"`;
        };
        const csv = [headers, ...data].map(r => r.map(escape).join(',')).join('\r\n');
        download(csv, filename, 'text/csv;charset=utf-8;');
    }
    /**
     * Exports the visible rows as a pretty-printed JSON array and triggers a
     * browser download. Each element is an object keyed by column label.
     *
     * @param rows - Filtered rows to export.
     * @param cols - All column definitions.
     * @param exportableCols - Ordered column indices to include.
     * @param filename - Target filename for the download (default `gridix-export.json`).
     */
    function exportJson(rows, cols, exportableCols, filename = 'gridix-export.json') {
        const headers = buildHeaders(cols, exportableCols);
        const data = buildRows(rows, cols, exportableCols).map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = row[i] ?? '';
            });
            return obj;
        });
        download(JSON.stringify(data, null, 2), filename, 'application/json');
    }
    /**
     * Copies the visible rows as tab-separated text (with a header row) to the
     * system clipboard via the Clipboard API.
     *
     * Rows are separated by `\n`; columns within a row are separated by `\t`.
     * Cell values are passed through {@link sanitizeCsvValue} to prevent formula
     * injection when the text is pasted into a spreadsheet application.
     *
     * @param rows - Filtered rows to copy.
     * @param cols - All column definitions.
     * @param exportableCols - Ordered column indices to include.
     */
    function copyToClipboard(rows, cols, exportableCols) {
        const headers = buildHeaders(cols, exportableCols);
        const data = buildRows(rows, cols, exportableCols);
        const text = [headers, ...data].map(r => r.map(sanitizeCsvValue).join('\t')).join('\n');
        navigator.clipboard?.writeText(text);
    }
    /**
     * Routes an export action to the appropriate export function based on `format`.
     *
     * @param format - One of `'csv'`, `'json'`, or `'copy'`.
     * @param rows - Filtered rows to export.
     * @param cols - All column definitions.
     * @param exportableCols - Ordered column indices to include.
     */
    function runExport(format, rows, cols, exportableCols) {
        if (format === 'csv')
            exportCsv(rows, cols, exportableCols);
        if (format === 'json')
            exportJson(rows, cols, exportableCols);
        if (format === 'copy')
            copyToClipboard(rows, cols, exportableCols);
    }
    /**
     * Creates a temporary object URL from `content`, triggers a programmatic
     * anchor click to start the file download, then revokes the URL.
     *
     * @param content - File content as a string.
     * @param filename - Suggested download filename.
     * @param mime - MIME type for the `Blob`.
     */
    function download(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

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
    function toggleRowSelect(row, rowIndex, selected, mode, allRows, tableEl) {
        if (!mode)
            return selected;
        const next = new Set(selected);
        if (mode === 'single') {
            if (next.has(rowIndex)) {
                next.delete(rowIndex);
            }
            else {
                next.clear();
                next.add(rowIndex);
            }
        }
        else {
            if (next.has(rowIndex))
                next.delete(rowIndex);
            else
                next.add(rowIndex);
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
    function syncRowClasses(rows, selected) {
        rows.forEach((row, i) => {
            const isSelected = selected.has(i);
            row.classList.toggle(CSS.ROW_SELECTED, isSelected);
            row.setAttribute('aria-selected', String(isSelected));
            const cb = row.querySelector(`.${CSS.CHECKBOX_COL} input`);
            if (cb)
                cb.checked = isSelected;
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
    function selectAll(rows, tableEl) {
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
    function deselectAll(rows, tableEl) {
        const next = new Set();
        syncRowClasses(rows, next);
        dispatch(tableEl, 'gridix:rowselect', { rows: [] });
        return next;
    }

    /**
     * Builds a 2-D array of all visible, focusable cells in the table.
     *
     * Excludes:
     * - The per-column search row (`.gridix-col-search-row`)
     * - The empty-state row (`.gridix-empty-row`)
     * - Cells belonging to a hidden column (`.gridix-col--hidden`)
     *
     * The structure is `cells[rowIndex][colIndex]`, matching the logical grid
     * used by the ARIA `role="grid"` keyboard interaction pattern.
     *
     * @param table - The `<table>` element to scan.
     * @returns 2-D array of visible cells.
     */
    function getCells(table) {
        const rows = Array.from(table.querySelectorAll(`thead tr:not(.${CSS.COL_SEARCH_ROW}), tbody tr:not(.${CSS.EMPTY_ROW})`));
        return rows.map(row => Array.from(row.cells).filter(cell => !cell.classList.contains(CSS.HIDDEN_COL)));
    }
    /**
     * Gives `cell` the roving tabindex (`tabindex="0"`) and removes it from every
     * other cell, then moves keyboard focus to `cell`.
     *
     * @param cell - The cell to activate.
     * @param cells - Current 2-D cell grid (used to reset all other tabindices).
     */
    function setActive(cell, cells) {
        cells.flat().forEach(c => c.setAttribute('tabindex', '-1'));
        cell.setAttribute('tabindex', '0');
        cell.focus();
    }
    /**
     * Returns the `{ row, col }` position of `target` within the 2-D `cells`
     * grid, or `null` if `target` is not found.
     *
     * @param target - The cell to locate.
     * @param cells - 2-D grid returned by `getCells`.
     */
    function findPosition(target, cells) {
        for (let r = 0; r < cells.length; r++) {
            for (let c = 0; c < (cells[r]?.length ?? 0); c++) {
                if (cells[r]?.[c] === target)
                    return { row: r, col: c };
            }
        }
        return null;
    }
    /**
     * Installs the ARIA `role="grid"` roving-tabindex keyboard navigation on a
     * table.
     *
     * Supported keys (per the ARIA grid pattern):
     * - **ArrowRight / ArrowLeft** — move one cell horizontally.
     * - **ArrowDown / ArrowUp** — move one cell vertically.
     * - **Home** — first cell in the current row; `Ctrl+Home` → first cell overall.
     * - **End** — last cell in the current row; `Ctrl+End` → last cell overall.
     * - **PageDown** — jump 5 rows down (clamps at last row).
     * - **PageUp** — jump 5 rows up (clamps at first row).
     *
     * @param table - The `<table>` element to attach navigation to.
     * @returns A teardown function that removes both event listeners.
     */
    function initKeyboardNav(table) {
        const allCells = () => getCells(table);
        const initCells = allCells();
        initCells.flat().forEach((cell, i) => {
            cell.setAttribute('tabindex', i === 0 ? '0' : '-1');
        });
        const onKeyDown = (e) => {
            const target = e.target;
            if (target.tagName !== 'TD' && target.tagName !== 'TH')
                return;
            if (!table.contains(target))
                return;
            const cells = allCells();
            const pos = findPosition(target, cells);
            if (!pos)
                return;
            const { row, col } = pos;
            let next = null;
            switch (e.key) {
                case 'ArrowRight':
                    next = cells[row]?.[col + 1] ?? null;
                    break;
                case 'ArrowLeft':
                    next = cells[row]?.[col - 1] ?? null;
                    break;
                case 'ArrowDown':
                    next = cells[row + 1]?.[col] ?? cells[row + 1]?.[(cells[row + 1]?.length ?? 1) - 1] ?? null;
                    break;
                case 'ArrowUp':
                    next = cells[row - 1]?.[col] ?? cells[row - 1]?.[(cells[row - 1]?.length ?? 1) - 1] ?? null;
                    break;
                case 'Home':
                    next = e.ctrlKey ? (cells[0]?.[0] ?? null) : (cells[row]?.[0] ?? null);
                    break;
                case 'End':
                    next = e.ctrlKey
                        ? (cells[cells.length - 1]?.[(cells[cells.length - 1]?.length ?? 1) - 1] ?? null)
                        : (cells[row]?.[(cells[row]?.length ?? 1) - 1] ?? null);
                    break;
                case 'PageDown': {
                    const lastRow = cells.length - 1;
                    next = cells[Math.min(row + 5, lastRow)]?.[col] ?? null;
                    break;
                }
                case 'PageUp':
                    next = cells[Math.max(row - 5, 0)]?.[col] ?? null;
                    break;
                default:
                    return;
            }
            if (next) {
                e.preventDefault();
                setActive(next, cells);
            }
        };
        const onFocusIn = (e) => {
            const target = e.target;
            if ((target.tagName !== 'TD' && target.tagName !== 'TH') || !table.contains(target))
                return;
            const cells = allCells();
            cells.flat().forEach(c => c.setAttribute('tabindex', '-1'));
            target.setAttribute('tabindex', '0');
        };
        table.addEventListener('keydown', onKeyDown);
        table.addEventListener('focusin', onFocusIn);
        return () => {
            table.removeEventListener('keydown', onKeyDown);
            table.removeEventListener('focusin', onFocusIn);
        };
    }
    /**
     * Ensures that after a re-render at least one cell retains `tabindex="0"`.
     *
     * After pagination or filtering the DOM rows change; if the previously focused
     * cell has been hidden or removed, `getCells` will no longer contain a cell
     * with `tabindex="0"`. This function detects that situation and promotes the
     * first visible cell.
     *
     * Must be called at the end of every `render()` cycle.
     *
     * @param table - The `<table>` element to inspect.
     */
    function refreshTabindex(table) {
        const cells = getCells(table);
        const hasOwner = cells.flat().some(c => c.getAttribute('tabindex') === '0');
        if (!hasOwner && cells[0]?.[0]) {
            cells.flat().forEach(c => c.setAttribute('tabindex', '-1'));
            cells[0][0].setAttribute('tabindex', '0');
        }
    }

    /** Drift threshold (px) to distinguish a tap from a scroll on touch devices. */
    const TOUCH_DRIFT = 4;
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
    class GridixTable {
        /** Semver version of the Gridix library. Useful for runtime diagnostics. */
        static currentVersion = '1.0.0';
        table;
        opts;
        cols;
        state;
        wrapper;
        scrollEl;
        toolbar;
        footer;
        headers = [];
        cleanups = [];
        shiftHeld = false;
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
        constructor(tableEl, options = {}) {
            this.table = tableEl;
            this.opts = {
                ...DEFAULTS,
                ...options,
                pagination: { ...DEFAULTS.pagination, ...options.pagination },
            };
            // Data-attribute options from AEM always override programmatic defaults
            const attrOpts = parseOptions(tableEl);
            this.opts = {
                ...this.opts,
                ...attrOpts,
                pagination: { ...this.opts.pagination, ...attrOpts.pagination },
            };
            this.cols = parseCols(tableEl);
            const rows = parseRows(tableEl);
            this.state = {
                rows,
                filteredRows: [...rows],
                currentPage: 0,
                sortStack: [],
                searchQuery: '',
                colSearchQueries: new Array(this.cols.length).fill(''),
                hiddenCols: new Set(this.cols.filter(c => !c.visible).map(c => c.index)),
                selectedRows: new Set(),
            };
            this.build();
        }
        // ── Build ────────────────────────────────────────────────────────────────
        build() {
            this.table.classList.add(CSS.TABLE, CSS.IS_INIT);
            this.table.setAttribute('data-gridix-theme', this.opts.theme);
            // ARIA grid role
            this.table.setAttribute('role', 'grid');
            if (this.opts.rowSelect) {
                this.table.setAttribute('aria-multiselectable', String(this.opts.rowSelect === 'multi'));
            }
            // Derive accessible label: caption > data attr > preceding heading
            const caption = this.table.querySelector('caption');
            const labelAttr = this.table.getAttribute('data-gridix-label');
            const prevHeading = this.table.previousElementSibling;
            const label = labelAttr ??
                caption?.textContent?.trim() ??
                (prevHeading?.matches('h1,h2,h3,h4,h5,h6') ? prevHeading.textContent?.trim() : null) ??
                'Data table';
            this.table.setAttribute('aria-label', label);
            this.wrapper = el('div', { class: CSS.WRAPPER, 'data-gridix-theme': this.opts.theme });
            this.scrollEl = el('div', { class: CSS.SCROLL, tabindex: '-1' });
            this.toolbar = el('div', {
                class: CSS.TOOLBAR,
                role: 'toolbar',
                'aria-label': `${label} controls`,
            });
            this.footer = el('div', { class: CSS.FOOTER });
            this.table.parentNode.insertBefore(this.wrapper, this.table);
            this.wrapper.appendChild(this.toolbar);
            this.scrollEl.appendChild(this.table);
            this.wrapper.appendChild(this.scrollEl);
            this.wrapper.appendChild(this.footer);
            this.buildToolbar();
            this.buildHeaders();
            if (this.opts.rowSelect)
                this.buildCheckboxCol();
            if (this.opts.colSearch)
                this.buildColSearchRow();
            applyColVisibility(this.table, this.state.hiddenCols, this.cols);
            const stopObserver = applyNaturalWidth(this.scrollEl, this.table);
            this.cleanups.push(stopObserver);
            if (this.opts.fixedHeader)
                this.applyFixedHeader();
            // Keyboard grid navigation
            const stopNav = initKeyboardNav(this.table);
            this.cleanups.push(stopNav);
            this.bindKeyboard();
            this.render();
        }
        // ── Toolbar ──────────────────────────────────────────────────────────────
        buildToolbar() {
            const left = el('div', { class: CSS.TOOLBAR_LEFT });
            const right = el('div', { class: CSS.TOOLBAR_RIGHT });
            if (this.opts.pagination.enabled) {
                const sel = el('select', {
                    class: CSS.PAGE_LENGTH_SEL,
                    'aria-label': 'Rows per page',
                });
                this.opts.pagination.pageLengthMenu.forEach(n => {
                    const opt = el('option', { value: String(n) }, String(n));
                    if (n === this.opts.pagination.pageLength)
                        opt.selected = true;
                    sel.appendChild(opt);
                });
                this.cleanups.push(on(sel, 'change', () => {
                    this.opts.pagination.pageLength = parseInt(sel.value, 10);
                    this.state.currentPage = 0;
                    this.render();
                }));
                const label = el('label', { class: 'gridix-page-length-label' });
                label.textContent = 'Show ';
                label.appendChild(sel);
                label.appendChild(document.createTextNode(' entries'));
                left.appendChild(label);
            }
            if (this.opts.search) {
                const inputId = `gridix-search-${Math.random().toString(36).slice(2, 7)}`;
                const input = el('input', {
                    type: 'search',
                    id: inputId,
                    class: CSS.SEARCH_INPUT,
                    placeholder: this.opts.searchPlaceholder,
                    'aria-label': 'Search table',
                    autocomplete: 'off',
                });
                const debouncedSearch = debounce((query) => {
                    this.state.searchQuery = query;
                    this.state.currentPage = 0;
                    this.render();
                }, 200);
                this.cleanups.push(on(input, 'input', () => debouncedSearch(input.value)));
                right.appendChild(input);
            }
            if (this.opts.colVisibility)
                right.appendChild(this.buildColVisBtn());
            if (this.opts.export.length)
                right.appendChild(this.buildExportMenu());
            this.toolbar.appendChild(left);
            this.toolbar.appendChild(right);
        }
        buildColVisBtn() {
            const wrap = el('div', { class: 'gridix-col-vis-wrap' });
            const btnId = `gridix-col-vis-btn-${Math.random().toString(36).slice(2, 7)}`;
            const menuId = `gridix-col-vis-menu-${Math.random().toString(36).slice(2, 7)}`;
            const btn = el('button', {
                id: btnId,
                class: CSS.COL_VIS_BTN,
                type: 'button',
                'aria-haspopup': 'menu',
                'aria-expanded': 'false',
                'aria-controls': menuId,
            }, 'Columns');
            const dropdown = el('div', {
                id: menuId,
                class: CSS.COL_VIS_DROPDOWN,
                role: 'menu',
                'aria-labelledby': btnId,
            });
            dropdown.setAttribute('hidden', '');
            this.cols.forEach((col, i) => {
                const item = el('label', { class: 'gridix-col-vis-item', role: 'menuitemcheckbox' });
                const cb = el('input', { type: 'checkbox' });
                cb.checked = !this.state.hiddenCols.has(i);
                cb.setAttribute('aria-label', col.label);
                cb.addEventListener('change', () => {
                    if (cb.checked)
                        this.showCol(i);
                    else
                        this.hideCol(i);
                });
                item.appendChild(cb);
                item.appendChild(document.createTextNode(` ${col.label}`));
                dropdown.appendChild(item);
            });
            const openMenu = () => {
                dropdown.removeAttribute('hidden');
                btn.setAttribute('aria-expanded', 'true');
                dropdown.querySelector('input')?.focus();
            };
            const closeMenu = () => {
                dropdown.setAttribute('hidden', '');
                btn.setAttribute('aria-expanded', 'false');
            };
            this.cleanups.push(on(btn, 'click', e => {
                e.stopPropagation();
                dropdown.hasAttribute('hidden') ? openMenu() : closeMenu();
            }));
            this.cleanups.push(on(dropdown, 'keydown', e => {
                if (e.key === 'Escape') {
                    closeMenu();
                    btn.focus();
                }
            }));
            this.cleanups.push(on(document, 'click', () => closeMenu()));
            wrap.appendChild(btn);
            wrap.appendChild(dropdown);
            return wrap;
        }
        buildExportMenu() {
            const wrap = el('div', { class: 'gridix-export-wrap' });
            const btnId = `gridix-export-btn-${Math.random().toString(36).slice(2, 7)}`;
            const menuId = `gridix-export-menu-${Math.random().toString(36).slice(2, 7)}`;
            const btn = el('button', {
                id: btnId,
                class: CSS.EXPORT_BTN,
                type: 'button',
                'aria-haspopup': 'menu',
                'aria-expanded': 'false',
                'aria-controls': menuId,
            }, 'Export');
            const menu = el('div', {
                id: menuId,
                class: CSS.EXPORT_MENU,
                role: 'menu',
                'aria-labelledby': btnId,
            });
            menu.setAttribute('hidden', '');
            const labels = {
                csv: 'CSV',
                json: 'JSON',
                copy: 'Copy to clipboard',
            };
            this.opts.export.forEach(fmt => {
                const item = el('button', {
                    type: 'button',
                    class: 'gridix-export-item',
                    role: 'menuitem',
                }, labels[fmt]);
                item.addEventListener('click', () => {
                    const exportableCols = getExportableCols(this.cols, this.state.hiddenCols);
                    runExport(fmt, this.state.filteredRows, this.cols, exportableCols);
                    closeMenu();
                    announce(`Exported as ${labels[fmt]}`);
                });
                menu.appendChild(item);
            });
            const openMenu = () => {
                menu.removeAttribute('hidden');
                btn.setAttribute('aria-expanded', 'true');
                menu.querySelector('button')?.focus();
            };
            const closeMenu = () => {
                menu.setAttribute('hidden', '');
                btn.setAttribute('aria-expanded', 'false');
            };
            this.cleanups.push(on(btn, 'click', e => {
                e.stopPropagation();
                menu.hasAttribute('hidden') ? openMenu() : closeMenu();
            }));
            this.cleanups.push(on(menu, 'keydown', e => {
                if (e.key === 'Escape') {
                    closeMenu();
                    btn.focus();
                }
            }));
            this.cleanups.push(on(document, 'click', () => closeMenu()));
            wrap.appendChild(btn);
            wrap.appendChild(menu);
            return wrap;
        }
        // ── Headers ──────────────────────────────────────────────────────────────
        buildHeaders() {
            const headerRow = this.table.querySelector('thead tr');
            if (!headerRow)
                return;
            this.headers = Array.from(headerRow.cells);
            this.headers.forEach((th, i) => {
                const col = this.cols[i];
                th.setAttribute('scope', 'col');
                th.setAttribute('role', 'columnheader');
                if (!col || !this.opts.sort || !col.sortable)
                    return;
                th.classList.add(CSS.TH_SORTABLE);
                th.setAttribute('tabindex', '0');
                th.setAttribute('aria-sort', 'none');
                // Sort indicator — purely decorative
                const indicator = el('span', { class: 'gridix-sort-indicator', 'aria-hidden': 'true' });
                th.appendChild(indicator);
                // Touch-aware sort: only fire if pointer didn't drift (scroll guard)
                let touchStartX = 0;
                let touchStartY = 0;
                this.cleanups.push(on(th, 'touchstart', e => {
                    touchStartX = e.touches[0]?.clientX ?? 0;
                    touchStartY = e.touches[0]?.clientY ?? 0;
                }, { passive: true }));
                this.cleanups.push(on(th, 'touchend', e => {
                    const dx = Math.abs((e.changedTouches[0]?.clientX ?? 0) - touchStartX);
                    const dy = Math.abs((e.changedTouches[0]?.clientY ?? 0) - touchStartY);
                    if (dx <= TOUCH_DRIFT && dy <= TOUCH_DRIFT)
                        this.triggerSort(th, i);
                }));
                this.cleanups.push(on(th, 'click', () => this.triggerSort(th, i)));
                this.cleanups.push(on(th, 'keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.triggerSort(th, i);
                    }
                }));
            });
        }
        triggerSort(th, colIndex) {
            this.state.sortStack = handleHeaderClick(th, colIndex, this.opts.sortMulti, this.state.sortStack, this.shiftHeld, this.table);
            updateHeaderClasses(this.headers, this.state.sortStack);
            const entry = this.state.sortStack.find(s => s.colIndex === colIndex);
            const colLabel = this.cols[colIndex]?.label ?? `Column ${colIndex + 1}`;
            if (entry && entry.dir !== 'none') {
                announce(`Table sorted by ${colLabel} ${entry.dir === 'asc' ? 'ascending' : 'descending'}`);
            }
            else {
                announce(`Sort removed from ${colLabel}`);
            }
            this.render();
            th.focus();
        }
        buildColSearchRow() {
            const thead = this.table.querySelector('thead');
            if (!thead)
                return;
            const searchRow = el('tr', { class: CSS.COL_SEARCH_ROW, 'aria-hidden': 'true' });
            this.cols.forEach((col, i) => {
                const td = el('td');
                if (col.searchable && col.visible) {
                    const input = el('input', {
                        type: 'search',
                        class: CSS.COL_SEARCH_INPUT,
                        placeholder: col.label,
                        'aria-label': `Filter by ${col.label}`,
                        autocomplete: 'off',
                    });
                    searchRow.removeAttribute('aria-hidden');
                    const debouncedColSearch = debounce((val) => {
                        this.state.colSearchQueries[i] = val;
                        this.state.currentPage = 0;
                        this.render();
                    }, 200);
                    input.addEventListener('input', () => debouncedColSearch(input.value));
                    td.appendChild(input);
                }
                searchRow.appendChild(td);
            });
            thead.appendChild(searchRow);
        }
        buildCheckboxCol() {
            const headerRow = this.table.querySelector('thead tr');
            if (headerRow) {
                const th = el('th', { class: CSS.CHECKBOX_COL, scope: 'col', role: 'columnheader' });
                if (this.opts.rowSelect === 'multi') {
                    const allCb = el('input', {
                        type: 'checkbox',
                        'aria-label': 'Select all rows',
                    });
                    allCb.addEventListener('change', () => {
                        this.state.selectedRows = allCb.checked
                            ? selectAll(this.state.rows, this.table)
                            : deselectAll(this.state.rows, this.table);
                        announce(allCb.checked ? `All ${this.state.rows.length} rows selected` : 'All rows deselected');
                    });
                    th.appendChild(allCb);
                }
                headerRow.insertBefore(th, headerRow.firstChild);
            }
            this.state.rows.forEach((row, i) => {
                row.setAttribute('role', 'row');
                row.setAttribute('aria-selected', 'false');
                const td = el('td', { class: CSS.CHECKBOX_COL, role: 'gridcell' });
                const cb = el('input', {
                    type: 'checkbox',
                    'aria-label': `Select row ${i + 1}`,
                });
                cb.addEventListener('change', () => {
                    this.state.selectedRows = toggleRowSelect(row, i, this.state.selectedRows, this.opts.rowSelect, this.state.rows, this.table);
                    const count = this.state.selectedRows.size;
                    announce(cb.checked
                        ? `Row ${i + 1} selected. ${count} row${count !== 1 ? 's' : ''} selected total.`
                        : `Row ${i + 1} deselected. ${count} row${count !== 1 ? 's' : ''} selected total.`);
                });
                td.appendChild(cb);
                row.insertBefore(td, row.firstChild);
            });
        }
        // ── Fixed header ─────────────────────────────────────────────────────────
        applyFixedHeader() {
            const thead = this.table.querySelector('thead');
            if (!thead)
                return;
            thead.style.position = 'sticky';
            thead.style.top = `${this.opts.fixedHeaderOffset}px`;
            thead.style.zIndex = '2';
        }
        // ── Keyboard ─────────────────────────────────────────────────────────────
        bindKeyboard() {
            const downHandler = (e) => {
                if (e.key === 'Shift')
                    this.shiftHeld = true;
            };
            const upHandler = (e) => {
                if (e.key === 'Shift')
                    this.shiftHeld = false;
            };
            document.addEventListener('keydown', downHandler);
            document.addEventListener('keyup', upHandler);
            this.cleanups.push(() => document.removeEventListener('keydown', downHandler), () => document.removeEventListener('keyup', upHandler));
        }
        // ── Render ───────────────────────────────────────────────────────────────
        render() {
            const { rows, sortStack, searchQuery, colSearchQueries, hiddenCols } = this.state;
            const sorted = sortRows(rows, sortStack, this.cols);
            const filtered = filterRows(sorted, searchQuery, colSearchQueries, this.cols);
            this.state.filteredRows = filtered;
            const { pageLength, enabled: pagEnabled } = this.opts.pagination;
            if (pagEnabled) {
                this.state.currentPage = clampPage(this.state.currentPage, pageLength, filtered.length);
            }
            const { visible, window: pw } = applyPagination(filtered, pagEnabled ? this.state.currentPage : 0, pagEnabled ? pageLength : filtered.length);
            const tbody = this.table.querySelector('tbody');
            tbody.querySelector(`.${CSS.EMPTY_ROW}`)?.remove();
            rows.forEach(r => {
                r.style.display = 'none';
            });
            if (visible.length === 0) {
                const emptyRow = el('tr', { class: CSS.EMPTY_ROW, 'aria-live': 'polite' });
                const emptyCell = el('td', {
                    colspan: String(this.cols.length + (this.opts.rowSelect ? 1 : 0)),
                    role: 'gridcell',
                });
                emptyCell.textContent = this.opts.emptyText;
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
                announce(this.opts.emptyText);
            }
            else {
                const startOffset = pagEnabled ? this.state.currentPage * pageLength : 0;
                const frag = document.createDocumentFragment();
                visible.forEach((r, i) => {
                    r.style.display = '';
                    // aria-rowindex lets ATs announce "row N of total" on paginated views
                    if (pagEnabled)
                        r.setAttribute('aria-rowindex', String(startOffset + i + 1));
                    frag.appendChild(r);
                });
                tbody.appendChild(frag);
            }
            if (this.opts.search && searchQuery) {
                highlightCells(visible, searchQuery, this.cols);
            }
            applyColVisibility(this.table, hiddenCols, this.cols);
            this.table.setAttribute('aria-rowcount', String(filtered.length));
            if (pagEnabled) {
                this.renderPagination(pw.totalPages, filtered.length);
                dispatchPageEvent(this.table, this.state.currentPage, filtered.length);
            }
            if (searchQuery || colSearchQueries.some(q => q)) {
                const msg = filtered.length === 0
                    ? this.opts.emptyText
                    : `${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'} found`;
                announce(msg);
            }
            updateHeaderClasses(this.headers, sortStack);
            refreshTabindex(this.table);
        }
        renderPagination(totalPages, totalRows) {
            this.footer.innerHTML = '';
            const { pageLength } = this.opts.pagination;
            const start = this.state.currentPage * pageLength + 1;
            const end = Math.min((this.state.currentPage + 1) * pageLength, totalRows);
            const info = el('span', {
                class: CSS.PAGE_INFO,
                'aria-live': 'polite',
                'aria-atomic': 'true',
            });
            info.textContent =
                totalRows === 0 ? 'No entries' : `Showing ${start}–${end} of ${totalRows} entries`;
            this.footer.appendChild(info);
            const nav = el('nav', {
                class: CSS.PAGINATION,
                'aria-label': `${this.table.getAttribute('aria-label') ?? 'Table'} pagination`,
            });
            const makeBtn = (label, ariaLabel, page, disabled, active = false) => {
                const btn = el('button', {
                    class: CSS.PAGE_BTN,
                    type: 'button',
                    'aria-label': ariaLabel,
                    ...(active ? { 'aria-current': 'page' } : {}),
                }, label);
                if (disabled)
                    btn.disabled = true;
                if (active)
                    btn.classList.add(CSS.PAGE_BTN_ACTIVE);
                if (!disabled) {
                    btn.addEventListener('click', () => {
                        this.state.currentPage = page;
                        this.render();
                        this.scrollEl.focus();
                        announce(`Page ${page + 1} of ${totalPages}`);
                    });
                }
                return btn;
            };
            const cur = this.state.currentPage;
            const last = totalPages - 1;
            nav.appendChild(makeBtn('«', 'First page', 0, cur === 0));
            nav.appendChild(makeBtn('‹', 'Previous page', cur - 1, cur === 0));
            this.pageRange(cur, totalPages).forEach(p => {
                nav.appendChild(makeBtn(String(p + 1), `Page ${p + 1}`, p, false, p === cur));
            });
            nav.appendChild(makeBtn('›', 'Next page', cur + 1, cur >= last));
            nav.appendChild(makeBtn('»', 'Last page', last, cur >= last));
            this.footer.appendChild(nav);
        }
        pageRange(current, total) {
            const delta = 2;
            const pages = [];
            for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                pages.push(i);
            }
            return pages;
        }
        // ── Public API ───────────────────────────────────────────────────────────
        /**
         * Applies a global search query and re-renders the table.
         *
         * @param query - The search string. Pass `""` to clear the filter.
         */
        search(query) {
            this.state.searchQuery = query;
            this.state.currentPage = 0;
            this.render();
        }
        /**
         * Navigates to a specific page and re-renders the table.
         *
         * @param page - Zero-based page index.
         */
        goToPage(page) {
            this.state.currentPage = page;
            this.render();
        }
        /**
         * Programmatically sorts by a single column and re-renders.
         *
         * @param colIndex - Zero-based index of the column to sort.
         * @param dir - `'asc'`, `'desc'`, or `'none'` to clear.
         */
        sort(colIndex, dir) {
            this.state.sortStack =
                dir === 'none'
                    ? this.state.sortStack.filter((s) => s.colIndex !== colIndex)
                    : [{ colIndex, dir }];
            this.render();
        }
        /**
         * Makes a previously hidden column visible and re-renders.
         *
         * @param colIndex - Zero-based index of the column to show.
         */
        showCol(colIndex) {
            this.state.hiddenCols.delete(colIndex);
            this.render();
            announce(`${this.cols[colIndex]?.label ?? 'Column'} shown`);
        }
        /**
         * Hides a column from view and re-renders.
         *
         * @param colIndex - Zero-based index of the column to hide.
         */
        hideCol(colIndex) {
            this.state.hiddenCols.add(colIndex);
            this.render();
            announce(`${this.cols[colIndex]?.label ?? 'Column'} hidden`);
        }
        /**
         * Returns the zero-based indices of all currently selected rows.
         *
         * @returns Array of selected row indices, or an empty array when none are selected.
         */
        getSelectedRows() {
            return Array.from(this.state.selectedRows);
        }
        /**
         * Tears down the Gridix instance, removing all DOM additions and event
         * listeners and restoring the original `<table>` to its pre-init position.
         */
        destroy() {
            this.cleanups.forEach(fn => fn());
            this.cleanups = [];
            this.table.classList.remove(CSS.TABLE, CSS.IS_INIT);
            this.wrapper.parentNode?.insertBefore(this.table, this.wrapper);
            this.wrapper.remove();
        }
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
    function autoInit() {
        const tables = document.querySelectorAll(`table[${ATTR.INIT}]`);
        tables.forEach(table => {
            if (!table.classList.contains('gridix-initialized')) {
                new GridixTable(table);
            }
        });
    }

    /**
     * Gridix CDN entry point — **do not import this in a bundler**.
     *
     * This file re-exports everything from `src/index.ts` **and** runs an
     * auto-initialisation side effect that scans for `[data-gridix]` tables as
     * soon as the DOM is ready.
     *
     * The side effect is isolated here so that importing the ESM build
     * (`src/index.ts`) from a bundler never triggers double-initialisation.
     *
     * Rollup compiles this entry into `dist/scripts/gridix.cdn.min.js` (IIFE
     * format), which sets a `window.Gridix` global and calls `autoInit()`
     * automatically.
     *
     * @module gridix/cdn
     */
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoInit);
        }
        else {
            // DOM already parsed — run immediately (e.g. script tag at bottom of <body>)
            autoInit();
        }
    }

    exports.Gridix = GridixTable;
    exports.autoInit = autoInit;

    return exports;

})({});
//# sourceMappingURL=gridix.cdn.js.map
