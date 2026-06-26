import { describe, it, expect } from 'vitest';
import {
  matchesGlobalSearch,
  matchesColSearch,
  filterRows,
  highlightCells,
} from '../src/features/filtering';
import type { ColDef } from '../src/types';

function makeRow(cells: string[]): HTMLTableRowElement {
  const tr = document.createElement('tr');
  cells.forEach(v => {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });
  return tr;
}

function makeCols(n: number, overrides: Partial<ColDef>[] = []): ColDef[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    label: `Col ${i}`,
    type: 'string' as const,
    sortable: true,
    searchable: true,
    visible: true,
    noExport: false,
    ...overrides[i],
  }));
}

describe('matchesGlobalSearch', () => {
  it('returns true when query is empty', () => {
    expect(matchesGlobalSearch(makeRow(['foo']), '', makeCols(1))).toBe(true);
  });

  it('matches case-insensitively', () => {
    const row = makeRow(['Hello World']);
    expect(matchesGlobalSearch(row, 'hello', makeCols(1))).toBe(true);
    expect(matchesGlobalSearch(row, 'WORLD', makeCols(1))).toBe(true);
  });

  it('returns false when no cell matches', () => {
    const row = makeRow(['Foo', 'Bar']);
    expect(matchesGlobalSearch(row, 'baz', makeCols(2))).toBe(false);
  });

  it('searches across multiple cells', () => {
    const row = makeRow(['Foo', 'Bar', 'Baz']);
    expect(matchesGlobalSearch(row, 'bar', makeCols(3))).toBe(true);
  });

  it('skips non-searchable cols', () => {
    const row = makeRow(['match', 'hidden']);
    const cols = makeCols(2, [{}, { searchable: false }]);
    expect(matchesGlobalSearch(row, 'hidden', cols)).toBe(false);
  });

  it('skips non-visible cols', () => {
    const row = makeRow(['visible', 'invisible']);
    const cols = makeCols(2, [{}, { visible: false }]);
    expect(matchesGlobalSearch(row, 'invisible', cols)).toBe(false);
  });
});

describe('matchesColSearch', () => {
  it('returns true when all queries empty', () => {
    const row = makeRow(['a', 'b']);
    expect(matchesColSearch(row, ['', ''], makeCols(2))).toBe(true);
  });

  it('matches specific col', () => {
    const row = makeRow(['John', 'Engineer']);
    expect(matchesColSearch(row, ['', 'eng'], makeCols(2))).toBe(true);
    expect(matchesColSearch(row, ['', 'manager'], makeCols(2))).toBe(false);
  });

  it('requires all col queries to match', () => {
    const row = makeRow(['John', 'Engineer']);
    expect(matchesColSearch(row, ['john', 'engineer'], makeCols(2))).toBe(true);
    expect(matchesColSearch(row, ['john', 'manager'], makeCols(2))).toBe(false);
  });
});

describe('filterRows', () => {
  it('applies both global and col search', () => {
    const rows = [
      makeRow(['Alice', 'Engineer']),
      makeRow(['Bob', 'Manager']),
      makeRow(['Alice', 'Manager']),
    ];
    const cols = makeCols(2);
    const result = filterRows(rows, 'alice', ['', 'manager'], cols);
    expect(result).toHaveLength(1);
    expect(result[0].cells[0].textContent).toBe('Alice');
    expect(result[0].cells[1].textContent).toBe('Manager');
  });

  it('returns all rows when queries are empty', () => {
    const rows = [makeRow(['a']), makeRow(['b']), makeRow(['c'])];
    expect(filterRows(rows, '', [''], makeCols(1))).toHaveLength(3);
  });

  it('returns empty array when nothing matches', () => {
    const rows = [makeRow(['foo']), makeRow(['bar'])];
    expect(filterRows(rows, 'xyz', [''], makeCols(1))).toHaveLength(0);
  });
});

describe('highlightCells', () => {
  it('wraps matching text in <mark> elements', () => {
    const rows = [makeRow(['hello world'])];
    highlightCells(rows, 'hello', makeCols(1));
    expect(rows[0].cells[0].querySelector('mark')).not.toBeNull();
    expect(rows[0].cells[0].querySelector('mark')?.textContent).toBe('hello');
  });

  it('preserves text surrounding the match', () => {
    const rows = [makeRow(['say hello world'])];
    highlightCells(rows, 'hello', makeCols(1));
    expect(rows[0].cells[0].textContent).toBe('say hello world');
  });

  it('highlights all occurrences (case-insensitive)', () => {
    const rows = [makeRow(['Hello hello HELLO'])];
    highlightCells(rows, 'hello', makeCols(1));
    expect(rows[0].cells[0].querySelectorAll('mark')).toHaveLength(3);
  });

  it('resets cell to original textContent when query is empty', () => {
    const rows = [makeRow(['hello world'])];
    // First highlight, then clear
    highlightCells(rows, 'hello', makeCols(1));
    highlightCells(rows, '', makeCols(1));
    expect(rows[0].cells[0].querySelector('mark')).toBeNull();
    expect(rows[0].cells[0].textContent).toBe('hello world');
  });

  it('skips non-searchable columns', () => {
    const cols = makeCols(1, [{ searchable: false }]);
    const rows = [makeRow(['hello'])];
    highlightCells(rows, 'hello', cols);
    expect(rows[0].cells[0].querySelector('mark')).toBeNull();
  });

  // ── Security: XSS prevention ────────────────────────────────────────────
  it('does not create <script> elements when cell text contains angle brackets', () => {
    // Cell textContent has a literal "<script>" string (not parsed as HTML)
    const rows = [makeRow(['<script>xss</script>'])];
    highlightCells(rows, 'xss', makeCols(1));
    // The match should be highlighted…
    expect(rows[0].cells[0].querySelector('mark')?.textContent).toBe('xss');
    // …but no actual <script> element should exist in the DOM
    expect(rows[0].cells[0].querySelectorAll('script')).toHaveLength(0);
  });

  it('does not parse HTML tags from cell text as DOM elements', () => {
    const rows = [makeRow(['<b>bold</b> text'])];
    highlightCells(rows, 'bold', makeCols(1));
    // No <b> element should be created — the text is literal, not parsed as HTML
    expect(rows[0].cells[0].querySelectorAll('b')).toHaveLength(0);
    expect(rows[0].cells[0].querySelector('mark')?.textContent).toBe('bold');
  });

  it('renders angle brackets as literal text characters after highlighting', () => {
    const rows = [makeRow(['<tag>'])];
    highlightCells(rows, 'tag', makeCols(1));
    // textContent should preserve the original literal string
    expect(rows[0].cells[0].textContent).toBe('<tag>');
  });

  it('correctly highlights when query contains regex-special characters', () => {
    const rows = [makeRow(['price: $1.00'])];
    highlightCells(rows, '$1', makeCols(1));
    // escapeRegex should prevent '$' from being a regex end-of-string anchor
    const mark = rows[0].cells[0].querySelector('mark');
    expect(mark?.textContent).toBe('$1');
  });
});
