import { describe, it, expect, beforeEach } from 'vitest';
import { initKeyboardNav, refreshTabindex } from '../src/features/keyboard-nav';

function makeGrid(rows = 3, cols = 3): HTMLTableElement {
  const table = document.createElement('table');
  table.setAttribute('role', 'grid');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (let c = 0; c < cols; c++) {
    const th = document.createElement('th');
    th.textContent = `H${c}`;
    th.setAttribute('tabindex', c === 0 ? '0' : '-1');
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.textContent = `R${r}C${c}`;
      td.setAttribute('tabindex', '-1');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  document.body.appendChild(table);
  return table;
}

function fireKey(el: Element, key: string, ctrlKey = false): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true }));
}

describe('initKeyboardNav', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns a cleanup function', () => {
    const table = makeGrid();
    const cleanup = initKeyboardNav(table);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('ArrowRight moves focus to next cell in row', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const firstTh = table.querySelector('th') as HTMLElement;
    firstTh.focus();
    fireKey(firstTh, 'ArrowRight');
    const ths = table.querySelectorAll('th');
    expect(document.activeElement).toBe(ths[1]);
  });

  it('ArrowLeft moves focus to previous cell', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const ths = table.querySelectorAll('th');
    (ths[1] as HTMLElement).focus();
    fireKey(ths[1], 'ArrowLeft');
    expect(document.activeElement).toBe(ths[0]);
  });

  it('ArrowDown moves to the same column in next row', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const firstTh = table.querySelector('th') as HTMLElement;
    firstTh.focus();
    fireKey(firstTh, 'ArrowDown');
    const firstBodyCell = table.querySelector('tbody tr td') as HTMLElement;
    expect(document.activeElement).toBe(firstBodyCell);
  });

  it('ArrowUp from first body row goes to header', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const firstBodyCell = table.querySelector('tbody tr td') as HTMLElement;
    firstBodyCell.focus();
    fireKey(firstBodyCell, 'ArrowUp');
    const firstTh = table.querySelector('th') as HTMLElement;
    expect(document.activeElement).toBe(firstTh);
  });

  it('Home moves to first cell in current row', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const ths = table.querySelectorAll('th');
    (ths[2] as HTMLElement).focus();
    fireKey(ths[2], 'Home');
    expect(document.activeElement).toBe(ths[0]);
  });

  it('End moves to last cell in current row', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const ths = table.querySelectorAll('th');
    (ths[0] as HTMLElement).focus();
    fireKey(ths[0], 'End');
    expect(document.activeElement).toBe(ths[ths.length - 1]);
  });

  it('Ctrl+Home moves to first cell in the entire grid', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const lastRow = table.querySelectorAll('tbody tr');
    const lastCell = lastRow[lastRow.length - 1].querySelectorAll('td');
    const lastTd = lastCell[lastCell.length - 1] as HTMLElement;
    lastTd.focus();
    fireKey(lastTd, 'Home', true);
    expect(document.activeElement).toBe(table.querySelector('th'));
  });

  it('Ctrl+End moves to last cell in the entire grid', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const firstTh = table.querySelector('th') as HTMLElement;
    firstTh.focus();
    fireKey(firstTh, 'End', true);
    const allRows = table.querySelectorAll('thead tr, tbody tr');
    const lastRow = allRows[allRows.length - 1];
    const lastCell = lastRow.querySelectorAll('th,td');
    expect(document.activeElement).toBe(lastCell[lastCell.length - 1]);
  });

  it('does not move past the last cell with ArrowRight', () => {
    const table = makeGrid(1, 2);
    initKeyboardNav(table);
    const ths = table.querySelectorAll('th');
    const lastTh = ths[ths.length - 1] as HTMLElement;
    lastTh.focus();
    fireKey(lastTh, 'ArrowRight');
    expect(document.activeElement).toBe(lastTh);
  });

  it('cleanup removes event listeners (no throw after cleanup)', () => {
    const table = makeGrid();
    const cleanup = initKeyboardNav(table);
    cleanup();
    const firstTh = table.querySelector('th') as HTMLElement;
    expect(() => fireKey(firstTh, 'ArrowRight')).not.toThrow();
  });

  it('PageDown moves focus 5 rows down', () => {
    const table = makeGrid(8, 3);
    initKeyboardNav(table);
    const firstTh = table.querySelector('th') as HTMLElement;
    firstTh.focus();
    fireKey(firstTh, 'PageDown');
    // row 0 (header) + 5 body rows = row index 5 in the cells array
    const bodyRows = table.querySelectorAll('tbody tr');
    const targetCell = bodyRows[4].querySelectorAll('td')[0] as HTMLElement;
    expect(document.activeElement).toBe(targetCell);
  });

  it('PageDown clamps at the last row', () => {
    const table = makeGrid(2, 3);
    initKeyboardNav(table);
    const firstTh = table.querySelector('th') as HTMLElement;
    firstTh.focus();
    fireKey(firstTh, 'PageDown');
    const lastBodyRow = table.querySelectorAll('tbody tr');
    const lastCell = lastBodyRow[lastBodyRow.length - 1].querySelectorAll('td')[0] as HTMLElement;
    expect(document.activeElement).toBe(lastCell);
  });

  it('PageUp moves focus 5 rows up', () => {
    const table = makeGrid(8, 3);
    initKeyboardNav(table);
    const bodyRows = table.querySelectorAll('tbody tr');
    const startCell = bodyRows[6].querySelectorAll('td')[0] as HTMLElement;
    startCell.focus();
    fireKey(startCell, 'PageUp');
    // 6 rows back in cells array (row index 7 in cells) → 5 up = row index 2 in cells = body row 1
    const targetCell = bodyRows[1].querySelectorAll('td')[0] as HTMLElement;
    expect(document.activeElement).toBe(targetCell);
  });

  it('PageUp clamps at the first row', () => {
    const table = makeGrid(3, 3);
    initKeyboardNav(table);
    const firstTh = table.querySelector('th') as HTMLElement;
    firstTh.focus();
    fireKey(firstTh, 'PageUp');
    // Already at row 0, should stay
    expect(document.activeElement).toBe(firstTh);
  });

  it('unhandled key does not move focus', () => {
    const table = makeGrid();
    initKeyboardNav(table);
    const firstTh = table.querySelector('th') as HTMLElement;
    firstTh.focus();
    fireKey(firstTh, 'Tab');
    expect(document.activeElement).toBe(firstTh);
  });
});

describe('refreshTabindex', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('assigns tabindex=0 to first cell when none has it', () => {
    const table = makeGrid(2, 2);
    table.querySelectorAll('th,td').forEach(c => c.setAttribute('tabindex', '-1'));
    refreshTabindex(table);
    expect(table.querySelector('th')?.getAttribute('tabindex')).toBe('0');
  });

  it('does not change tabindex when a cell already owns tabindex=0', () => {
    const table = makeGrid(2, 2);
    const cells = table.querySelectorAll('th,td');
    cells[2].setAttribute('tabindex', '0');
    refreshTabindex(table);
    expect(cells[2].getAttribute('tabindex')).toBe('0');
  });
});
