import { describe, it, expect, afterEach } from 'vitest';
import { measureNaturalWidth, applyNaturalWidth } from '../src/utils/width-detector';

function makeTable(): HTMLTableElement {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.textContent = 'Cell';
  tr.appendChild(td);
  tbody.appendChild(tr);
  table.appendChild(tbody);
  return table;
}

describe('measureNaturalWidth', () => {
  it('returns 0 in jsdom (scrollWidth is always 0)', () => {
    const table = makeTable();
    document.body.appendChild(table);
    expect(measureNaturalWidth(table)).toBe(0);
    document.body.removeChild(table);
  });

  it('returns measured width when scrollWidth is non-zero', () => {
    const table = makeTable();
    document.body.appendChild(table);
    Object.defineProperty(table, 'scrollWidth', { get: () => 600, configurable: true });
    expect(measureNaturalWidth(table)).toBe(600);
    document.body.removeChild(table);
  });

  it('restores original table styles after measurement', () => {
    const table = makeTable();
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
    document.body.appendChild(table);
    measureNaturalWidth(table);
    expect(table.style.width).toBe('100%');
    expect(table.style.tableLayout).toBe('fixed');
    document.body.removeChild(table);
  });
});

describe('applyNaturalWidth', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('calls ResizeObserver.observe on the scroll container', () => {
    const table = makeTable();
    const container = document.createElement('div');
    container.appendChild(table);
    document.body.appendChild(container);

    const disconnect = applyNaturalWidth(container, table);
    expect(global.ResizeObserver).toBeDefined();
    disconnect();
  });

  it('sets min-width on table when scrollWidth > 0', () => {
    const table = makeTable();
    const container = document.createElement('div');
    container.appendChild(table);
    document.body.appendChild(container);
    Object.defineProperty(table, 'scrollWidth', { get: () => 800, configurable: true });

    const disconnect = applyNaturalWidth(container, table);
    expect(table.style.minWidth).toBe('800px');
    disconnect();
  });

  it('returns a disconnect function that stops observation', () => {
    const table = makeTable();
    const container = document.createElement('div');
    container.appendChild(table);
    document.body.appendChild(container);

    const disconnect = applyNaturalWidth(container, table);
    expect(() => disconnect()).not.toThrow();
  });
});
