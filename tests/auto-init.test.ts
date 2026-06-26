import { describe, it, expect, beforeEach } from 'vitest';
import { autoInit } from '../src/core/auto-init';

function makeTable(hasAttr = true): HTMLTableElement {
  const table = document.createElement('table');
  if (hasAttr) table.setAttribute('data-gridix', '');

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['Name', 'Role'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const br = document.createElement('tr');
  ['Alice', 'Engineer'].forEach(text => {
    const td = document.createElement('td');
    td.textContent = text;
    br.appendChild(td);
  });
  tbody.appendChild(br);
  table.appendChild(tbody);
  document.body.appendChild(table);
  return table;
}

describe('autoInit', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('initialises tables that have the [data-gridix] attribute', () => {
    const table = makeTable(true);
    autoInit();
    expect(table.classList.contains('gridix-initialized')).toBe(true);
  });

  it('leaves tables without [data-gridix] untouched', () => {
    const table = makeTable(false);
    autoInit();
    expect(table.classList.contains('gridix-initialized')).toBe(false);
  });

  it('does not re-initialise a table already marked gridix-initialized', () => {
    const table = makeTable(true);
    table.classList.add('gridix-initialized');
    autoInit();
    // A second init would produce a second toolbar — there should be none
    expect(document.querySelectorAll('.gridix-toolbar').length).toBe(0);
  });

  it('initialises every matching table in one call', () => {
    makeTable(true);
    makeTable(true);
    autoInit();
    expect(document.querySelectorAll('table.gridix-initialized').length).toBe(2);
  });
});
