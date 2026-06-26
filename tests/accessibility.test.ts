import { describe, it, expect, beforeEach } from 'vitest';
import { GridixTable as Gridix } from '../src/core/gridix-table';
import { CSS } from '../src/constants';

function makeTable(extra = ''): HTMLTableElement {
  const div = document.createElement('div');
  div.innerHTML = `
    <table data-gridix data-gridix-sort="true" data-gridix-pagination="true"
           data-gridix-page-length="3" data-gridix-row-select="multi"
           data-gridix-col-visibility="true" ${extra}>
      <thead><tr>
        <th data-gridix-col-type="number">ID</th>
        <th>Name</th>
        <th data-gridix-col-sortable="false">Notes</th>
      </tr></thead>
      <tbody>
        <tr><td>1</td><td>Alice</td><td>note a</td></tr>
        <tr><td>2</td><td>Bob</td><td>note b</td></tr>
        <tr><td>3</td><td>Charlie</td><td>note c</td></tr>
        <tr><td>4</td><td>Diana</td><td>note d</td></tr>
      </tbody>
    </table>`;
  document.body.appendChild(div);
  return div.querySelector('table') as HTMLTableElement;
}

describe('ARIA roles and attributes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('sets role="grid" on the table', () => {
    const t = makeTable();
    new Gridix(t);
    expect(t.getAttribute('role')).toBe('grid');
  });

  it('sets aria-multiselectable="true" for multi row-select', () => {
    const t = makeTable();
    new Gridix(t);
    expect(t.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('sets aria-label on the table', () => {
    const t = makeTable();
    new Gridix(t);
    expect(t.hasAttribute('aria-label')).toBe(true);
  });

  it('sets scope="col" on all <th> elements', () => {
    const t = makeTable();
    new Gridix(t);
    const headers = t.querySelectorAll('thead tr:first-child th');
    headers.forEach(th => {
      expect(th.getAttribute('scope')).toBe('col');
    });
  });

  it('sets aria-sort="none" on sortable headers initially', () => {
    const t = makeTable();
    new Gridix(t);
    const sortableHeaders = t.querySelectorAll('.gridix-th--sortable');
    sortableHeaders.forEach(th => {
      expect(th.getAttribute('aria-sort')).toBe('none');
    });
  });

  it('does not set aria-sort on non-sortable headers', () => {
    const t = makeTable();
    new Gridix(t);
    // "Notes" column has data-gridix-col-sortable="false"
    const headers = t.querySelectorAll('thead tr:first-child th');
    const notesHeader = headers[headers.length - 1];
    expect(notesHeader.classList.contains('gridix-th--sortable')).toBe(false);
    expect(notesHeader.getAttribute('aria-sort')).toBeNull();
  });

  it('updates aria-sort to ascending on sort', () => {
    const t = makeTable();
    const gridix = new Gridix(t);
    gridix.sort(0, 'asc');
    // Use the first sortable header (skip any prepended checkbox column)
    const th = t.querySelector(`.${CSS.TH_SORTABLE}`) as HTMLElement;
    expect(th.getAttribute('aria-sort')).toBe('ascending');
  });

  it('updates aria-sort to descending on second sort', () => {
    const t = makeTable();
    const gridix = new Gridix(t);
    gridix.sort(0, 'desc');
    const th = t.querySelector(`.${CSS.TH_SORTABLE}`) as HTMLElement;
    expect(th.getAttribute('aria-sort')).toBe('descending');
  });

  it('resets aria-sort to none when sort is removed', () => {
    const t = makeTable();
    const gridix = new Gridix(t);
    gridix.sort(0, 'asc');
    gridix.sort(0, 'none');
    const th = t.querySelector(`.${CSS.TH_SORTABLE}`) as HTMLElement;
    expect(th.getAttribute('aria-sort')).toBe('none');
  });

  it('sets aria-selected="false" on rows initially when row-select is on', () => {
    const t = makeTable();
    new Gridix(t);
    const rows = t.querySelectorAll('tbody tr:not(.gridix-empty-row)');
    rows.forEach(row => {
      expect(row.getAttribute('aria-selected')).toBe('false');
    });
  });

  it('sets aria-rowcount on table after render', () => {
    const t = makeTable();
    new Gridix(t);
    expect(t.hasAttribute('aria-rowcount')).toBe(true);
    expect(Number(t.getAttribute('aria-rowcount'))).toBe(4);
  });

  it('aria-rowcount updates after search filter', () => {
    const t = makeTable();
    const gridix = new Gridix(t);
    gridix.search('alice');
    expect(Number(t.getAttribute('aria-rowcount'))).toBe(1);
  });

  it('sets aria-expanded="false" on col-vis button initially', () => {
    const t = makeTable();
    new Gridix(t);
    const btn = document.querySelector('.gridix-col-vis-btn') as HTMLElement;
    expect(btn?.getAttribute('aria-expanded')).toBe('false');
  });

  it('pagination buttons have descriptive aria-label', () => {
    const t = makeTable();
    new Gridix(t);
    const btns = document.querySelectorAll('.gridix-page-btn');
    const labels = Array.from(btns).map(b => b.getAttribute('aria-label'));
    expect(labels).toContain('First page');
    expect(labels).toContain('Previous page');
    expect(labels).toContain('Next page');
    expect(labels).toContain('Last page');
  });

  it('active page button has aria-current="page"', () => {
    const t = makeTable();
    new Gridix(t);
    const activeBtn = document.querySelector('.gridix-page-btn--active');
    expect(activeBtn?.getAttribute('aria-current')).toBe('page');
  });

  it('toolbar has role="toolbar"', () => {
    const t = makeTable();
    new Gridix(t);
    const toolbar = document.querySelector('.gridix-toolbar');
    expect(toolbar?.getAttribute('role')).toBe('toolbar');
  });

  it('sort indicator spans have aria-hidden="true"', () => {
    const t = makeTable();
    new Gridix(t);
    const indicators = t.querySelectorAll('.gridix-sort-indicator');
    indicators.forEach(span => {
      expect(span.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('col-vis button uses aria-haspopup="menu"', () => {
    const t = makeTable();
    new Gridix(t);
    const btn = document.querySelector('.gridix-col-vis-btn') as HTMLElement;
    expect(btn?.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('export button uses aria-haspopup="menu"', () => {
    const t = makeTable('data-gridix-export="csv,json"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-export-btn') as HTMLElement;
    expect(btn?.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('sets aria-rowindex on visible rows when pagination is active', () => {
    const t = makeTable(); // page-length=3, 4 rows total
    new Gridix(t);
    const visibleRows = Array.from(
      t.querySelectorAll<HTMLTableRowElement>(`tbody tr:not(.${CSS.EMPTY_ROW})`),
    ).filter(r => r.style.display !== 'none');
    // Page 0: rows at positions 1, 2, 3
    visibleRows.forEach((row, i) => {
      expect(row.getAttribute('aria-rowindex')).toBe(String(i + 1));
    });
  });

  it('aria-rowindex reflects current page offset', () => {
    const t = makeTable(); // page-length=3, 4 rows
    const gridix = new Gridix(t);
    gridix.goToPage(1); // page 1: rows 4
    const visibleRows = Array.from(
      t.querySelectorAll<HTMLTableRowElement>(`tbody tr:not(.${CSS.EMPTY_ROW})`),
    ).filter(r => r.style.display !== 'none');
    expect(visibleRows[0]?.getAttribute('aria-rowindex')).toBe('4');
  });

  it('col-vis menu has role="menu"', () => {
    const t = makeTable();
    new Gridix(t);
    const menu = document.querySelector('.gridix-col-vis-dropdown') as HTMLElement;
    expect(menu?.getAttribute('role')).toBe('menu');
  });

  it('export menu has role="menu"', () => {
    const t = makeTable('data-gridix-export="csv"');
    new Gridix(t);
    const menu = document.querySelector('.gridix-export-menu') as HTMLElement;
    expect(menu?.getAttribute('role')).toBe('menu');
  });
});
