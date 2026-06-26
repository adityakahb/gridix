import { describe, it, expect } from 'vitest';
import { applyColVisibility, getExportableCols } from '../src/features/col-visibility';
import type { ColDef } from '../src/types';

function makeTable(cols: number, rows: number): HTMLTableElement {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (let i = 0; i < cols; i++) {
    const th = document.createElement('th');
    th.textContent = `Col ${i}`;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.textContent = `R${r}C${c}`;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

function makeCols(n: number): ColDef[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    label: `Col ${i}`,
    type: 'string' as const,
    sortable: true,
    searchable: true,
    visible: true,
    noExport: false,
  }));
}

describe('applyColVisibility', () => {
  it('adds hidden class to hidden cols', () => {
    const table = makeTable(3, 2);
    const cols = makeCols(3);
    applyColVisibility(table, new Set([1]), cols);
    const headerRow = table.querySelector('thead tr')!;
    expect(headerRow.cells[0].classList.contains('gridix-col--hidden')).toBe(false);
    expect(headerRow.cells[1].classList.contains('gridix-col--hidden')).toBe(true);
    expect(headerRow.cells[2].classList.contains('gridix-col--hidden')).toBe(false);
  });

  it('hides cols with visible=false', () => {
    const table = makeTable(2, 1);
    const cols = makeCols(2);
    cols[0].visible = false;
    applyColVisibility(table, new Set(), cols);
    const headerRow = table.querySelector('thead tr')!;
    expect(headerRow.cells[0].classList.contains('gridix-col--hidden')).toBe(true);
  });

  it('applies to both thead and tbody rows', () => {
    const table = makeTable(3, 3);
    const cols = makeCols(3);
    applyColVisibility(table, new Set([2]), cols);
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      expect((row as HTMLTableRowElement).cells[2].classList.contains('gridix-col--hidden')).toBe(
        true,
      );
    });
  });
});

describe('getExportableCols', () => {
  it('excludes hidden cols', () => {
    const cols = makeCols(4);
    expect(getExportableCols(cols, new Set([1, 3]))).toEqual([0, 2]);
  });

  it('excludes noExport cols', () => {
    const cols = makeCols(3);
    cols[2].noExport = true;
    expect(getExportableCols(cols, new Set())).toEqual([0, 1]);
  });

  it('excludes invisible cols', () => {
    const cols = makeCols(3);
    cols[1].visible = false;
    expect(getExportableCols(cols, new Set())).toEqual([0, 2]);
  });
});
