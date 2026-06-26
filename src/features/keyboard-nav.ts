import { CSS } from '../constants';

/** Alias for a table cell element used throughout this module. */
type GridCell = HTMLTableCellElement;

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
function getCells(table: HTMLTableElement): GridCell[][] {
  const rows = Array.from(
    table.querySelectorAll<HTMLTableRowElement>(
      `thead tr:not(.${CSS.COL_SEARCH_ROW}), tbody tr:not(.${CSS.EMPTY_ROW})`,
    ),
  );
  return rows.map(row =>
    Array.from(row.cells).filter(cell => !cell.classList.contains(CSS.HIDDEN_COL)),
  );
}

/**
 * Gives `cell` the roving tabindex (`tabindex="0"`) and removes it from every
 * other cell, then moves keyboard focus to `cell`.
 *
 * @param cell - The cell to activate.
 * @param cells - Current 2-D cell grid (used to reset all other tabindices).
 */
function setActive(cell: GridCell, cells: GridCell[][]): void {
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
function findPosition(target: GridCell, cells: GridCell[][]): { row: number; col: number } | null {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < (cells[r]?.length ?? 0); c++) {
      if (cells[r]?.[c] === target) return { row: r, col: c };
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
export function initKeyboardNav(table: HTMLTableElement): () => void {
  const allCells = (): GridCell[][] => getCells(table);

  const initCells = allCells();
  initCells.flat().forEach((cell, i) => {
    cell.setAttribute('tabindex', i === 0 ? '0' : '-1');
  });

  const onKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'TD' && target.tagName !== 'TH') return;
    if (!table.contains(target)) return;

    const cells = allCells();
    const pos = findPosition(target as GridCell, cells);
    if (!pos) return;

    const { row, col } = pos;
    let next: GridCell | null = null;

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

  const onFocusIn = (e: FocusEvent): void => {
    const target = e.target as HTMLElement;
    if ((target.tagName !== 'TD' && target.tagName !== 'TH') || !table.contains(target)) return;
    const cells = allCells();
    cells.flat().forEach(c => c.setAttribute('tabindex', '-1'));
    target.setAttribute('tabindex', '0');
  };

  table.addEventListener('keydown', onKeyDown);
  table.addEventListener('focusin', onFocusIn);

  return (): void => {
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
export function refreshTabindex(table: HTMLTableElement): void {
  const cells = getCells(table);
  const hasOwner = cells.flat().some(c => c.getAttribute('tabindex') === '0');
  if (!hasOwner && cells[0]?.[0]) {
    cells.flat().forEach(c => c.setAttribute('tabindex', '-1'));
    cells[0][0].setAttribute('tabindex', '0');
  }
}
