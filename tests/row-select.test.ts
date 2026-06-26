import { describe, it, expect, beforeEach } from 'vitest';
import {
  toggleRowSelect,
  syncRowClasses,
  selectAll,
  deselectAll,
} from '../src/features/row-select';
import { CSS } from '../src/constants';

function makeSetup(count = 3): { table: HTMLTableElement; rows: HTMLTableRowElement[] } {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  const rows: HTMLTableRowElement[] = [];
  for (let i = 0; i < count; i++) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = `Row ${i}`;
    tr.appendChild(td);
    tr.setAttribute('aria-selected', 'false');
    tbody.appendChild(tr);
    rows.push(tr);
  }
  table.appendChild(tbody);
  document.body.appendChild(table);
  return { table, rows };
}

describe('toggleRowSelect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('selects an unselected row in single mode', () => {
    const { table, rows } = makeSetup();
    const next = toggleRowSelect(rows[0], 0, new Set(), 'single', rows, table);
    expect(next.has(0)).toBe(true);
  });

  it('deselects an already-selected row in single mode', () => {
    const { table, rows } = makeSetup();
    const next = toggleRowSelect(rows[0], 0, new Set([0]), 'single', rows, table);
    expect(next.has(0)).toBe(false);
  });

  it('clears the previous selection when a new row is selected in single mode', () => {
    const { table, rows } = makeSetup();
    const next = toggleRowSelect(rows[1], 1, new Set([0]), 'single', rows, table);
    expect(next.has(0)).toBe(false);
    expect(next.has(1)).toBe(true);
  });

  it('adds to the existing selection in multi mode', () => {
    const { table, rows } = makeSetup();
    const next = toggleRowSelect(rows[1], 1, new Set([0]), 'multi', rows, table);
    expect(next.has(0)).toBe(true);
    expect(next.has(1)).toBe(true);
  });

  it('removes a row from selection in multi mode', () => {
    const { table, rows } = makeSetup();
    const next = toggleRowSelect(rows[0], 0, new Set([0, 1]), 'multi', rows, table);
    expect(next.has(0)).toBe(false);
    expect(next.has(1)).toBe(true);
  });

  it('returns the original set unchanged when mode is falsy', () => {
    const { table, rows } = makeSetup();
    const selected = new Set([0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = toggleRowSelect(rows[0], 0, selected, '' as any, rows, table);
    expect(next).toBe(selected);
  });

  it('dispatches gridix:rowselect with selected indices', () => {
    const { table, rows } = makeSetup();
    const events: CustomEvent[] = [];
    table.addEventListener('gridix:rowselect', e => events.push(e as CustomEvent));
    toggleRowSelect(rows[0], 0, new Set(), 'multi', rows, table);
    expect(events).toHaveLength(1);
    expect(events[0].detail.rows).toContain(0);
  });
});

describe('syncRowClasses', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('sets selected class and aria-selected=true on selected rows', () => {
    const { rows } = makeSetup(3);
    syncRowClasses(rows, new Set([0, 2]));
    expect(rows[0].classList.contains(CSS.ROW_SELECTED)).toBe(true);
    expect(rows[0].getAttribute('aria-selected')).toBe('true');
    expect(rows[1].classList.contains(CSS.ROW_SELECTED)).toBe(false);
    expect(rows[1].getAttribute('aria-selected')).toBe('false');
    expect(rows[2].classList.contains(CSS.ROW_SELECTED)).toBe(true);
  });

  it('checks the row checkbox when row is selected', () => {
    const { rows } = makeSetup(1);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const td = document.createElement('td');
    td.className = CSS.CHECKBOX_COL;
    td.appendChild(cb);
    rows[0].insertBefore(td, rows[0].firstChild);
    syncRowClasses(rows, new Set([0]));
    expect(cb.checked).toBe(true);
  });

  it('unchecks the row checkbox when row is deselected', () => {
    const { rows } = makeSetup(1);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    const td = document.createElement('td');
    td.className = CSS.CHECKBOX_COL;
    td.appendChild(cb);
    rows[0].insertBefore(td, rows[0].firstChild);
    syncRowClasses(rows, new Set());
    expect(cb.checked).toBe(false);
  });
});

describe('selectAll', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns a set containing all row indices', () => {
    const { table, rows } = makeSetup(4);
    const next = selectAll(rows, table);
    expect(next.size).toBe(4);
    for (let i = 0; i < 4; i++) expect(next.has(i)).toBe(true);
  });

  it('dispatches gridix:rowselect with all indices', () => {
    const { table, rows } = makeSetup(3);
    const events: CustomEvent[] = [];
    table.addEventListener('gridix:rowselect', e => events.push(e as CustomEvent));
    selectAll(rows, table);
    expect(events[0].detail.rows).toEqual([0, 1, 2]);
  });

  it('applies selected class to every row', () => {
    const { table, rows } = makeSetup(3);
    selectAll(rows, table);
    rows.forEach(r => expect(r.classList.contains(CSS.ROW_SELECTED)).toBe(true));
  });
});

describe('deselectAll', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns an empty set', () => {
    const { table, rows } = makeSetup(3);
    const next = deselectAll(rows, table);
    expect(next.size).toBe(0);
  });

  it('dispatches gridix:rowselect with an empty rows array', () => {
    const { table, rows } = makeSetup(3);
    const events: CustomEvent[] = [];
    table.addEventListener('gridix:rowselect', e => events.push(e as CustomEvent));
    deselectAll(rows, table);
    expect(events[0].detail.rows).toEqual([]);
  });

  it('removes selected class from all rows', () => {
    const { table, rows } = makeSetup(3);
    selectAll(rows, table);
    deselectAll(rows, table);
    rows.forEach(r => expect(r.classList.contains(CSS.ROW_SELECTED)).toBe(false));
  });
});
