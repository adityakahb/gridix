import type { ColDef, GridixOptions, GridixState, SortState, ExportFormat } from '../types';
import { CSS, DEFAULTS } from '../constants';
import { parseOptions, parseCols, parseRows } from '../utils/data-parser';
import { el, on, debounce } from '../utils/dom';
import { applyNaturalWidth } from '../utils/width-detector';
import { announce } from '../utils/announce';
import { sortRows, updateHeaderClasses, handleHeaderClick } from '../features/sorting';
import { filterRows, highlightCells } from '../features/filtering';
import { applyPagination, clampPage, dispatchPageEvent } from '../features/pagination';
import { applyColVisibility, getExportableCols } from '../features/col-visibility';
import { runExport } from '../features/export';
import { toggleRowSelect, selectAll, deselectAll } from '../features/row-select';
import { initKeyboardNav, refreshTabindex } from '../features/keyboard-nav';

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
export class GridixTable {
  /** Semver version of the Gridix library. Useful for runtime diagnostics. */
  static readonly currentVersion = '1.0.0';

  private table: HTMLTableElement;
  private opts: GridixOptions;
  private cols: ColDef[];
  private state: GridixState;
  private wrapper!: HTMLElement;
  private scrollEl!: HTMLElement;
  private toolbar!: HTMLElement;
  private footer!: HTMLElement;
  private headers: HTMLTableCellElement[] = [];
  private cleanups: Array<() => void> = [];
  private shiftHeld = false;

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
  constructor(tableEl: HTMLTableElement, options: Partial<GridixOptions> = {}) {
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

  private build(): void {
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
    const label =
      labelAttr ??
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

    this.table.parentNode!.insertBefore(this.wrapper, this.table);
    this.wrapper.appendChild(this.toolbar);
    this.scrollEl.appendChild(this.table);
    this.wrapper.appendChild(this.scrollEl);
    this.wrapper.appendChild(this.footer);

    this.buildToolbar();
    this.buildHeaders();

    if (this.opts.rowSelect) this.buildCheckboxCol();
    if (this.opts.colSearch) this.buildColSearchRow();

    applyColVisibility(this.table, this.state.hiddenCols, this.cols);

    const stopObserver = applyNaturalWidth(this.scrollEl, this.table);
    this.cleanups.push(stopObserver);

    if (this.opts.fixedHeader) this.applyFixedHeader();

    // Keyboard grid navigation
    const stopNav = initKeyboardNav(this.table);
    this.cleanups.push(stopNav);

    this.bindKeyboard();
    this.render();
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────

  private buildToolbar(): void {
    const left = el('div', { class: CSS.TOOLBAR_LEFT });
    const right = el('div', { class: CSS.TOOLBAR_RIGHT });

    if (this.opts.pagination.enabled) {
      const sel = el('select', {
        class: CSS.PAGE_LENGTH_SEL,
        'aria-label': 'Rows per page',
      }) as HTMLSelectElement;
      this.opts.pagination.pageLengthMenu.forEach(n => {
        const opt = el('option', { value: String(n) }, String(n)) as HTMLOptionElement;
        if (n === this.opts.pagination.pageLength) opt.selected = true;
        sel.appendChild(opt);
      });
      this.cleanups.push(
        on(sel, 'change', () => {
          this.opts.pagination.pageLength = parseInt(sel.value, 10);
          this.state.currentPage = 0;
          this.render();
        }),
      );
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
      }) as HTMLInputElement;
      const debouncedSearch = debounce((query: unknown) => {
        this.state.searchQuery = query as string;
        this.state.currentPage = 0;
        this.render();
      }, 200);
      this.cleanups.push(on(input, 'input', () => debouncedSearch(input.value)));
      right.appendChild(input);
    }

    if (this.opts.colVisibility) right.appendChild(this.buildColVisBtn());
    if (this.opts.export.length) right.appendChild(this.buildExportMenu());

    this.toolbar.appendChild(left);
    this.toolbar.appendChild(right);
  }

  private buildColVisBtn(): HTMLElement {
    const wrap = el('div', { class: 'gridix-col-vis-wrap' });
    const btnId = `gridix-col-vis-btn-${Math.random().toString(36).slice(2, 7)}`;
    const menuId = `gridix-col-vis-menu-${Math.random().toString(36).slice(2, 7)}`;

    const btn = el(
      'button',
      {
        id: btnId,
        class: CSS.COL_VIS_BTN,
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
        'aria-controls': menuId,
      },
      'Columns',
    ) as HTMLButtonElement;

    const dropdown = el('div', {
      id: menuId,
      class: CSS.COL_VIS_DROPDOWN,
      role: 'menu',
      'aria-labelledby': btnId,
    });
    dropdown.setAttribute('hidden', '');

    this.cols.forEach((col, i) => {
      const item = el('label', { class: 'gridix-col-vis-item', role: 'menuitemcheckbox' });
      const cb = el('input', { type: 'checkbox' }) as HTMLInputElement;
      cb.checked = !this.state.hiddenCols.has(i);
      cb.setAttribute('aria-label', col.label);
      cb.addEventListener('change', () => {
        if (cb.checked) this.showCol(i);
        else this.hideCol(i);
      });
      item.appendChild(cb);
      item.appendChild(document.createTextNode(` ${col.label}`));
      dropdown.appendChild(item);
    });

    const openMenu = (): void => {
      dropdown.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
      (dropdown.querySelector('input') as HTMLElement | null)?.focus();
    };
    const closeMenu = (): void => {
      dropdown.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    };

    this.cleanups.push(
      on(btn, 'click', e => {
        e.stopPropagation();
        dropdown.hasAttribute('hidden') ? openMenu() : closeMenu();
      }),
    );
    this.cleanups.push(
      on(dropdown, 'keydown', e => {
        if (e.key === 'Escape') {
          closeMenu();
          btn.focus();
        }
      }),
    );
    this.cleanups.push(on(document, 'click', () => closeMenu()));

    wrap.appendChild(btn);
    wrap.appendChild(dropdown);
    return wrap;
  }

  private buildExportMenu(): HTMLElement {
    const wrap = el('div', { class: 'gridix-export-wrap' });
    const btnId = `gridix-export-btn-${Math.random().toString(36).slice(2, 7)}`;
    const menuId = `gridix-export-menu-${Math.random().toString(36).slice(2, 7)}`;

    const btn = el(
      'button',
      {
        id: btnId,
        class: CSS.EXPORT_BTN,
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
        'aria-controls': menuId,
      },
      'Export',
    ) as HTMLButtonElement;

    const menu = el('div', {
      id: menuId,
      class: CSS.EXPORT_MENU,
      role: 'menu',
      'aria-labelledby': btnId,
    });
    menu.setAttribute('hidden', '');

    const labels: Record<ExportFormat, string> = {
      csv: 'CSV',
      json: 'JSON',
      copy: 'Copy to clipboard',
    };
    this.opts.export.forEach(fmt => {
      const item = el(
        'button',
        {
          type: 'button',
          class: 'gridix-export-item',
          role: 'menuitem',
        },
        labels[fmt],
      );
      item.addEventListener('click', () => {
        const exportableCols = getExportableCols(this.cols, this.state.hiddenCols);
        runExport(fmt, this.state.filteredRows, this.cols, exportableCols);
        closeMenu();
        announce(`Exported as ${labels[fmt]}`);
      });
      menu.appendChild(item);
    });

    const openMenu = (): void => {
      menu.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
      (menu.querySelector('button') as HTMLElement | null)?.focus();
    };
    const closeMenu = (): void => {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    };

    this.cleanups.push(
      on(btn, 'click', e => {
        e.stopPropagation();
        menu.hasAttribute('hidden') ? openMenu() : closeMenu();
      }),
    );
    this.cleanups.push(
      on(menu, 'keydown', e => {
        if (e.key === 'Escape') {
          closeMenu();
          btn.focus();
        }
      }),
    );
    this.cleanups.push(on(document, 'click', () => closeMenu()));

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  // ── Headers ──────────────────────────────────────────────────────────────

  private buildHeaders(): void {
    const headerRow = this.table.querySelector<HTMLTableRowElement>('thead tr');
    if (!headerRow) return;

    this.headers = Array.from(headerRow.cells) as HTMLTableCellElement[];

    this.headers.forEach((th, i) => {
      const col = this.cols[i];

      th.setAttribute('scope', 'col');
      th.setAttribute('role', 'columnheader');

      if (!col || !this.opts.sort || !col.sortable) return;

      th.classList.add(CSS.TH_SORTABLE);
      th.setAttribute('tabindex', '0');
      th.setAttribute('aria-sort', 'none');

      // Sort indicator — purely decorative
      const indicator = el('span', { class: 'gridix-sort-indicator', 'aria-hidden': 'true' });
      th.appendChild(indicator);

      // Touch-aware sort: only fire if pointer didn't drift (scroll guard)
      let touchStartX = 0;
      let touchStartY = 0;

      this.cleanups.push(
        on(
          th,
          'touchstart',
          e => {
            touchStartX = e.touches[0]?.clientX ?? 0;
            touchStartY = e.touches[0]?.clientY ?? 0;
          },
          { passive: true },
        ),
      );

      this.cleanups.push(
        on(th, 'touchend', e => {
          const dx = Math.abs((e.changedTouches[0]?.clientX ?? 0) - touchStartX);
          const dy = Math.abs((e.changedTouches[0]?.clientY ?? 0) - touchStartY);
          if (dx <= TOUCH_DRIFT && dy <= TOUCH_DRIFT) this.triggerSort(th, i);
        }),
      );

      this.cleanups.push(on(th, 'click', () => this.triggerSort(th, i)));

      this.cleanups.push(
        on(th, 'keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.triggerSort(th, i);
          }
        }),
      );
    });
  }

  private triggerSort(th: HTMLTableCellElement, colIndex: number): void {
    this.state.sortStack = handleHeaderClick(
      th,
      colIndex,
      this.opts.sortMulti,
      this.state.sortStack,
      this.shiftHeld,
      this.table,
    );
    updateHeaderClasses(this.headers, this.state.sortStack);

    const entry = this.state.sortStack.find(s => s.colIndex === colIndex);
    const colLabel = this.cols[colIndex]?.label ?? `Column ${colIndex + 1}`;
    if (entry && entry.dir !== 'none') {
      announce(`Table sorted by ${colLabel} ${entry.dir === 'asc' ? 'ascending' : 'descending'}`);
    } else {
      announce(`Sort removed from ${colLabel}`);
    }

    this.render();
    th.focus();
  }

  private buildColSearchRow(): void {
    const thead = this.table.querySelector('thead');
    if (!thead) return;

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
        }) as HTMLInputElement;
        searchRow.removeAttribute('aria-hidden');
        const debouncedColSearch = debounce((val: unknown) => {
          this.state.colSearchQueries[i] = val as string;
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

  private buildCheckboxCol(): void {
    const headerRow = this.table.querySelector<HTMLTableRowElement>('thead tr');
    if (headerRow) {
      const th = el('th', { class: CSS.CHECKBOX_COL, scope: 'col', role: 'columnheader' });
      if (this.opts.rowSelect === 'multi') {
        const allCb = el('input', {
          type: 'checkbox',
          'aria-label': 'Select all rows',
        }) as HTMLInputElement;
        allCb.addEventListener('change', () => {
          this.state.selectedRows = allCb.checked
            ? selectAll(this.state.rows, this.table)
            : deselectAll(this.state.rows, this.table);
          announce(
            allCb.checked ? `All ${this.state.rows.length} rows selected` : 'All rows deselected',
          );
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
      }) as HTMLInputElement;
      cb.addEventListener('change', () => {
        this.state.selectedRows = toggleRowSelect(
          row,
          i,
          this.state.selectedRows,
          this.opts.rowSelect,
          this.state.rows,
          this.table,
        );
        const count = this.state.selectedRows.size;
        announce(
          cb.checked
            ? `Row ${i + 1} selected. ${count} row${count !== 1 ? 's' : ''} selected total.`
            : `Row ${i + 1} deselected. ${count} row${count !== 1 ? 's' : ''} selected total.`,
        );
      });
      td.appendChild(cb);
      row.insertBefore(td, row.firstChild);
    });
  }

  // ── Fixed header ─────────────────────────────────────────────────────────

  private applyFixedHeader(): void {
    const thead = this.table.querySelector<HTMLElement>('thead');
    if (!thead) return;
    thead.style.position = 'sticky';
    thead.style.top = `${this.opts.fixedHeaderOffset}px`;
    thead.style.zIndex = '2';
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────

  private bindKeyboard(): void {
    const downHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Shift') this.shiftHeld = true;
    };
    const upHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Shift') this.shiftHeld = false;
    };
    document.addEventListener('keydown', downHandler);
    document.addEventListener('keyup', upHandler);
    this.cleanups.push(
      () => document.removeEventListener('keydown', downHandler),
      () => document.removeEventListener('keyup', upHandler),
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  private render(): void {
    const { rows, sortStack, searchQuery, colSearchQueries, hiddenCols } = this.state;

    const sorted = sortRows(rows, sortStack, this.cols);
    const filtered = filterRows(sorted, searchQuery, colSearchQueries, this.cols);
    this.state.filteredRows = filtered;

    const { pageLength, enabled: pagEnabled } = this.opts.pagination;
    if (pagEnabled) {
      this.state.currentPage = clampPage(this.state.currentPage, pageLength, filtered.length);
    }
    const { visible, window: pw } = applyPagination(
      filtered,
      pagEnabled ? this.state.currentPage : 0,
      pagEnabled ? pageLength : filtered.length,
    );

    const tbody = this.table.querySelector('tbody')!;

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
    } else {
      const startOffset = pagEnabled ? this.state.currentPage * pageLength : 0;
      const frag = document.createDocumentFragment();
      visible.forEach((r, i) => {
        r.style.display = '';
        // aria-rowindex lets ATs announce "row N of total" on paginated views
        if (pagEnabled) r.setAttribute('aria-rowindex', String(startOffset + i + 1));
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
      const msg =
        filtered.length === 0
          ? this.opts.emptyText
          : `${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'} found`;
      announce(msg);
    }

    updateHeaderClasses(this.headers, sortStack);
    refreshTabindex(this.table);
  }

  private renderPagination(totalPages: number, totalRows: number): void {
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

    const makeBtn = (
      label: string,
      ariaLabel: string,
      page: number,
      disabled: boolean,
      active = false,
    ): HTMLButtonElement => {
      const btn = el(
        'button',
        {
          class: CSS.PAGE_BTN,
          type: 'button',
          'aria-label': ariaLabel,
          ...(active ? { 'aria-current': 'page' } : {}),
        },
        label,
      ) as HTMLButtonElement;
      if (disabled) btn.disabled = true;
      if (active) btn.classList.add(CSS.PAGE_BTN_ACTIVE);
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

  private pageRange(current: number, total: number): number[] {
    const delta = 2;
    const pages: number[] = [];
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
  search(query: string): void {
    this.state.searchQuery = query;
    this.state.currentPage = 0;
    this.render();
  }

  /**
   * Navigates to a specific page and re-renders the table.
   *
   * @param page - Zero-based page index.
   */
  goToPage(page: number): void {
    this.state.currentPage = page;
    this.render();
  }

  /**
   * Programmatically sorts by a single column and re-renders.
   *
   * @param colIndex - Zero-based index of the column to sort.
   * @param dir - `'asc'`, `'desc'`, or `'none'` to clear.
   */
  sort(colIndex: number, dir: 'asc' | 'desc' | 'none'): void {
    this.state.sortStack =
      dir === 'none'
        ? this.state.sortStack.filter((s: SortState) => s.colIndex !== colIndex)
        : [{ colIndex, dir }];
    this.render();
  }

  /**
   * Makes a previously hidden column visible and re-renders.
   *
   * @param colIndex - Zero-based index of the column to show.
   */
  showCol(colIndex: number): void {
    this.state.hiddenCols.delete(colIndex);
    this.render();
    announce(`${this.cols[colIndex]?.label ?? 'Column'} shown`);
  }

  /**
   * Hides a column from view and re-renders.
   *
   * @param colIndex - Zero-based index of the column to hide.
   */
  hideCol(colIndex: number): void {
    this.state.hiddenCols.add(colIndex);
    this.render();
    announce(`${this.cols[colIndex]?.label ?? 'Column'} hidden`);
  }

  /**
   * Returns the zero-based indices of all currently selected rows.
   *
   * @returns Array of selected row indices, or an empty array when none are selected.
   */
  getSelectedRows(): number[] {
    return Array.from(this.state.selectedRows);
  }

  /**
   * Tears down the Gridix instance, removing all DOM additions and event
   * listeners and restoring the original `<table>` to its pre-init position.
   */
  destroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.table.classList.remove(CSS.TABLE, CSS.IS_INIT);
    this.wrapper.parentNode?.insertBefore(this.table, this.wrapper);
    this.wrapper.remove();
  }
}
