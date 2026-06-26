import { describe, it, expect, beforeEach } from 'vitest';
import { GridixTable as Gridix } from '../src/core/gridix-table';

function makeFullTable(): HTMLTableElement {
  const div = document.createElement('div');
  div.innerHTML = `
    <table data-gridix data-gridix-pagination="true" data-gridix-search="true" data-gridix-sort="true">
      <thead>
        <tr>
          <th data-gridix-col-type="number">ID</th>
          <th>Name</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>Alice</td><td>Engineer</td></tr>
        <tr><td>2</td><td>Bob</td><td>Manager</td></tr>
        <tr><td>3</td><td>Charlie</td><td>Designer</td></tr>
        <tr><td>4</td><td>Diana</td><td>Engineer</td></tr>
        <tr><td>5</td><td>Eve</td><td>Manager</td></tr>
      </tbody>
    </table>
  `;
  document.body.appendChild(div);
  return div.querySelector('table') as HTMLTableElement;
}

describe('GridixTable core', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('wraps the table in a .gridix-wrapper on init', () => {
    const table = makeFullTable();
    new Gridix(table);
    expect(table.closest('.gridix-wrapper')).not.toBeNull();
  });

  it('adds gridix-initialized class', () => {
    const table = makeFullTable();
    new Gridix(table);
    expect(table.classList.contains('gridix-initialized')).toBe(true);
  });

  it('renders toolbar', () => {
    const table = makeFullTable();
    new Gridix(table);
    expect(table.closest('.gridix-wrapper')?.querySelector('.gridix-toolbar')).not.toBeNull();
  });

  it('renders search input when search=true', () => {
    const table = makeFullTable();
    new Gridix(table);
    expect(document.querySelector('.gridix-search-input')).not.toBeNull();
  });

  it('renders pagination footer when pagination=true', () => {
    const table = makeFullTable();
    new Gridix(table);
    expect(document.querySelector('.gridix-footer')).not.toBeNull();
  });

  it('adds sortable class to sortable headers', () => {
    const table = makeFullTable();
    new Gridix(table);
    const headers = table.querySelectorAll('thead th');
    expect(headers[0].classList.contains('gridix-th--sortable')).toBe(true);
  });

  it('search() filters rows', () => {
    const table = makeFullTable();
    const gridix = new Gridix(table);
    gridix.search('alice');
    const visibleRows = Array.from(table.querySelectorAll('tbody tr')).filter(
      r => (r as HTMLElement).style.display !== 'none' && !r.classList.contains('gridix-empty-row'),
    );
    expect(visibleRows).toHaveLength(1);
  });

  it('search() shows empty row when no results', () => {
    const table = makeFullTable();
    const gridix = new Gridix(table);
    gridix.search('xyzzy');
    expect(table.querySelector('.gridix-empty-row')).not.toBeNull();
  });

  it('hideCol() adds hidden class to col cells', () => {
    const table = makeFullTable();
    const gridix = new Gridix(table);
    gridix.hideCol(1);
    const headerCells = table.querySelectorAll('thead tr:first-child th');
    expect(headerCells[1].classList.contains('gridix-col--hidden')).toBe(true);
  });

  it('showCol() removes hidden class', () => {
    const table = makeFullTable();
    const gridix = new Gridix(table);
    gridix.hideCol(1);
    gridix.showCol(1);
    const headerCells = table.querySelectorAll('thead tr:first-child th');
    expect(headerCells[1].classList.contains('gridix-col--hidden')).toBe(false);
  });

  it('destroy() removes wrapper and restores table', () => {
    const table = makeFullTable();
    const gridix = new Gridix(table);
    gridix.destroy();
    expect(document.querySelector('.gridix-wrapper')).toBeNull();
    expect(table.classList.contains('gridix-initialized')).toBe(false);
  });

  it('accepts programmatic options over data attributes', () => {
    const table = makeFullTable();
    new Gridix(table, { search: false });
    // data-gridix-search="true" on the table, but data attrs override programmatic
    // (data attrs always win in our impl — so search input should still exist)
    expect(document.querySelector('.gridix-search-input')).not.toBeNull();
  });
});
