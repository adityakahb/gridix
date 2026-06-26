import { describe, it, expect } from 'vitest';
import { parseOptions, parseCols, parseRows } from '../src/utils/data-parser';

function makeTable(html: string): HTMLTableElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.querySelector('table') as HTMLTableElement;
}

describe('parseOptions', () => {
  it('returns defaults when no data attributes set', () => {
    const table = makeTable('<table data-gridix></table>');
    const opts = parseOptions(table);
    expect(opts.search).toBe(true);
    expect(opts.pagination.enabled).toBe(true);
    expect(opts.pagination.pageLength).toBe(10);
    expect(opts.sort).toBe(true);
    expect(opts.theme).toBe('default');
  });

  it('reads search=false', () => {
    const table = makeTable('<table data-gridix data-gridix-search="false"></table>');
    expect(parseOptions(table).search).toBe(false);
  });

  it('reads page-length', () => {
    const table = makeTable('<table data-gridix data-gridix-page-length="25"></table>');
    expect(parseOptions(table).pagination.pageLength).toBe(25);
  });

  it('reads page-length-menu as array', () => {
    const table = makeTable('<table data-gridix data-gridix-page-length-menu="5,10,20"></table>');
    expect(parseOptions(table).pagination.pageLengthMenu).toEqual([5, 10, 20]);
  });

  it('reads export formats', () => {
    const table = makeTable('<table data-gridix data-gridix-export="csv,json"></table>');
    expect(parseOptions(table).export).toEqual(['csv', 'json']);
  });

  it('reads dark theme', () => {
    const table = makeTable('<table data-gridix data-gridix-theme="dark"></table>');
    expect(parseOptions(table).theme).toBe('dark');
  });

  it('reads fixed-header-offset', () => {
    const table = makeTable('<table data-gridix data-gridix-fixed-header-offset="64"></table>');
    expect(parseOptions(table).fixedHeaderOffset).toBe(64);
  });

  it('clamps negative fixed-header-offset to 0', () => {
    const table = makeTable('<table data-gridix data-gridix-fixed-header-offset="-100"></table>');
    expect(parseOptions(table).fixedHeaderOffset).toBe(0);
  });

  it('clamps excessively large fixed-header-offset to 1000', () => {
    const table = makeTable('<table data-gridix data-gridix-fixed-header-offset="99999"></table>');
    expect(parseOptions(table).fixedHeaderOffset).toBe(1000);
  });

  it('falls back to default for non-numeric fixed-header-offset', () => {
    const table = makeTable('<table data-gridix data-gridix-fixed-header-offset="abc"></table>');
    expect(parseOptions(table).fixedHeaderOffset).toBe(0); // DEFAULTS.fixedHeaderOffset
  });
});

describe('parseCols', () => {
  it('reads col labels from thead', () => {
    const table = makeTable(`
      <table><thead><tr>
        <th>Name</th><th>Age</th><th>City</th>
      </tr></thead></table>
    `);
    const cols = parseCols(table);
    expect(cols).toHaveLength(3);
    expect(cols[0].label).toBe('Name');
    expect(cols[1].label).toBe('Age');
    expect(cols[2].label).toBe('City');
  });

  it('reads col type', () => {
    const table = makeTable(`
      <table><thead><tr>
        <th data-gridix-col-type="number">Price</th>
        <th data-gridix-col-type="date">Date</th>
      </tr></thead></table>
    `);
    const cols = parseCols(table);
    expect(cols[0].type).toBe('number');
    expect(cols[1].type).toBe('date');
  });

  it('defaults sortable and searchable to true', () => {
    const table = makeTable('<table><thead><tr><th>A</th></tr></thead></table>');
    const [col] = parseCols(table);
    expect(col.sortable).toBe(true);
    expect(col.searchable).toBe(true);
  });

  it('reads sortable=false', () => {
    const table = makeTable(
      '<table><thead><tr><th data-gridix-col-sortable="false">A</th></tr></thead></table>',
    );
    expect(parseCols(table)[0].sortable).toBe(false);
  });

  it('reads visible=false', () => {
    const table = makeTable(
      '<table><thead><tr><th data-gridix-col-visible="false">Hidden</th></tr></thead></table>',
    );
    expect(parseCols(table)[0].visible).toBe(false);
  });

  it('reads no-export flag', () => {
    const table = makeTable(
      '<table><thead><tr><th data-gridix-col-no-export>Actions</th></tr></thead></table>',
    );
    expect(parseCols(table)[0].noExport).toBe(true);
  });
});

describe('parseRows', () => {
  it('returns all tbody rows', () => {
    const table = makeTable(`
      <table>
        <thead><tr><th>A</th></tr></thead>
        <tbody>
          <tr><td>1</td></tr>
          <tr><td>2</td></tr>
          <tr><td>3</td></tr>
        </tbody>
      </table>
    `);
    expect(parseRows(table)).toHaveLength(3);
  });

  it('returns empty array for empty tbody', () => {
    const table = makeTable('<table><tbody></tbody></table>');
    expect(parseRows(table)).toHaveLength(0);
  });
});
