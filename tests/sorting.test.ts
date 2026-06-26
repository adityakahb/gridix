import { describe, it, expect } from 'vitest';
import { sortRows, nextDir, handleHeaderClick } from '../src/features/sorting';
import type { ColDef, SortState } from '../src/types';

function makeRows(values: string[][]): HTMLTableRowElement[] {
  return values.map(cells => {
    const tr = document.createElement('tr');
    cells.forEach(v => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    return tr;
  });
}

function makeCols(types: ColDef['type'][]): ColDef[] {
  return types.map((type, index) => ({
    index,
    label: `Col ${index}`,
    type,
    sortable: true,
    searchable: true,
    visible: true,
    noExport: false,
  }));
}

describe('nextDir', () => {
  it('cycles none → asc → desc → none', () => {
    expect(nextDir('none')).toBe('asc');
    expect(nextDir('asc')).toBe('desc');
    expect(nextDir('desc')).toBe('none');
  });
});

describe('sortRows', () => {
  it('returns rows unchanged when stack is empty', () => {
    const rows = makeRows([['B'], ['A'], ['C']]);
    expect(sortRows(rows, [], makeCols(['string']))).toEqual(rows);
  });

  it('sorts strings asc', () => {
    const rows = makeRows([['Banana'], ['Apple'], ['Cherry']]);
    const sorted = sortRows(rows, [{ colIndex: 0, dir: 'asc' }], makeCols(['string']));
    expect(sorted.map(r => r.cells[0].textContent)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('sorts strings desc', () => {
    const rows = makeRows([['Banana'], ['Apple'], ['Cherry']]);
    const sorted = sortRows(rows, [{ colIndex: 0, dir: 'desc' }], makeCols(['string']));
    expect(sorted.map(r => r.cells[0].textContent)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('sorts numbers correctly (not lexicographic)', () => {
    const rows = makeRows([['10'], ['2'], ['100']]);
    const sorted = sortRows(rows, [{ colIndex: 0, dir: 'asc' }], makeCols(['number']));
    expect(sorted.map(r => r.cells[0].textContent)).toEqual(['2', '10', '100']);
  });

  it('sorts numbers with currency prefix', () => {
    const rows = makeRows([['$10.00'], ['$2.50'], ['$100.00']]);
    const sorted = sortRows(rows, [{ colIndex: 0, dir: 'asc' }], makeCols(['number']));
    expect(sorted.map(r => r.cells[0].textContent)).toEqual(['$2.50', '$10.00', '$100.00']);
  });

  it('sorts dates asc', () => {
    const rows = makeRows([['2024-03-01'], ['2023-01-15'], ['2024-01-01']]);
    const sorted = sortRows(rows, [{ colIndex: 0, dir: 'asc' }], makeCols(['date']));
    expect(sorted.map(r => r.cells[0].textContent)).toEqual([
      '2023-01-15',
      '2024-01-01',
      '2024-03-01',
    ]);
  });

  it('does not mutate original array', () => {
    const rows = makeRows([['B'], ['A']]);
    const original = [...rows];
    sortRows(rows, [{ colIndex: 0, dir: 'asc' }], makeCols(['string']));
    expect(rows).toEqual(original);
  });

  it('skips stack entries with dir=none', () => {
    const rows = makeRows([['B'], ['A'], ['C']]);
    const sorted = sortRows(rows, [{ colIndex: 0, dir: 'none' }], makeCols(['string']));
    expect(sorted.map(r => r.cells[0].textContent)).toEqual(['B', 'A', 'C']);
  });

  it('multi-col sort: primary then secondary', () => {
    const rows = makeRows([
      ['A', '3'],
      ['B', '1'],
      ['A', '1'],
      ['B', '2'],
    ]);
    const cols = makeCols(['string', 'number']);
    const stack: SortState[] = [
      { colIndex: 0, dir: 'asc' },
      { colIndex: 1, dir: 'asc' },
    ];
    const sorted = sortRows(rows, stack, cols);
    expect(sorted.map(r => `${r.cells[0].textContent}${r.cells[1].textContent}`)).toEqual([
      'A1',
      'A3',
      'B1',
      'B2',
    ]);
  });
});

describe('handleHeaderClick', () => {
  const table = document.createElement('table');

  it('sets asc on first click', () => {
    const th = document.createElement('th');
    const stack = handleHeaderClick(th, 0, false, [], false, table);
    expect(stack).toEqual([{ colIndex: 0, dir: 'asc' }]);
  });

  it('removes entry when dir cycles to none', () => {
    const th = document.createElement('th');
    const stack = handleHeaderClick(th, 0, false, [{ colIndex: 0, dir: 'desc' }], false, table);
    expect(stack).toEqual([]);
  });

  it('replaces stack in single-sort mode', () => {
    const th = document.createElement('th');
    const initial: SortState[] = [{ colIndex: 1, dir: 'asc' }];
    const stack = handleHeaderClick(th, 0, false, initial, false, table);
    expect(stack).toHaveLength(1);
    expect(stack[0].colIndex).toBe(0);
  });

  it('appends to stack in multi-sort mode with shift', () => {
    const th = document.createElement('th');
    const initial: SortState[] = [{ colIndex: 0, dir: 'asc' }];
    const stack = handleHeaderClick(th, 1, true, initial, true, table);
    expect(stack).toHaveLength(2);
  });

  it('updates an existing entry direction in multi-sort mode with shift', () => {
    const th = document.createElement('th');
    // col 0 already sorted asc — shift+click advances it to desc
    const initial: SortState[] = [{ colIndex: 0, dir: 'asc' }];
    const stack = handleHeaderClick(th, 0, true, initial, true, table);
    expect(stack).toEqual([{ colIndex: 0, dir: 'desc' }]);
  });

  it('removes a column from multi-sort stack when its direction cycles to none', () => {
    const th = document.createElement('th');
    // col 0 is desc — shift+click cycles to none, removing it; col 1 remains
    const initial: SortState[] = [
      { colIndex: 0, dir: 'desc' },
      { colIndex: 1, dir: 'asc' },
    ];
    const stack = handleHeaderClick(th, 0, true, initial, true, table);
    expect(stack).toHaveLength(1);
    expect(stack[0].colIndex).toBe(1);
  });
});
