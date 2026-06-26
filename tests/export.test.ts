import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportCsv, exportJson, copyToClipboard, runExport } from '../src/features/export';
import type { ColDef } from '../src/types';

function makeRows(data: string[][]): HTMLTableRowElement[] {
  return data.map(cells => {
    const row = document.createElement('tr');
    cells.forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      row.appendChild(td);
    });
    return row;
  });
}

const cols: ColDef[] = [
  { label: 'Name', type: 'string', sortable: true, visible: true },
  { label: 'Score', type: 'number', sortable: true, visible: true },
];
const exportableCols = [0, 1];

let capturedBlobContent = '';
let anchorClicks = 0;

function setupDownloadMocks() {
  capturedBlobContent = '';
  anchorClicks = 0;

  vi.stubGlobal('Blob', function (parts?: BlobPart[]) {
    capturedBlobContent = (parts?.[0] as string) ?? '';
    return { size: capturedBlobContent.length, type: '' } as Blob;
  });

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });

  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    anchorClicks++;
  });

  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn(() => Promise.resolve()) },
    writable: true,
    configurable: true,
  });
}

describe('exportCsv', () => {
  beforeEach(setupDownloadMocks);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('puts column headers in the first CSV line', () => {
    exportCsv(makeRows([['Alice', '95']]), cols, exportableCols);
    const firstLine = capturedBlobContent.split('\r\n')[0];
    expect(firstLine).toBe('"Name","Score"');
  });

  it('puts row data on subsequent lines', () => {
    exportCsv(
      makeRows([
        ['Alice', '95'],
        ['Bob', '87'],
      ]),
      cols,
      exportableCols,
    );
    const lines = capturedBlobContent.split('\r\n');
    expect(lines[1]).toBe('"Alice","95"');
    expect(lines[2]).toBe('"Bob","87"');
  });

  it('escapes double quotes by doubling them', () => {
    exportCsv(makeRows([['Say "hi"', '0']]), cols, exportableCols);
    expect(capturedBlobContent).toContain('"Say ""hi"""');
  });

  it('only exports specified column indices', () => {
    exportCsv(makeRows([['Alice', '95']]), cols, [0]);
    expect(capturedBlobContent).toContain('"Name"');
    expect(capturedBlobContent).not.toContain('"Score"');
  });

  it('triggers a file download via anchor click', () => {
    exportCsv(makeRows([['a', '1']]), cols, exportableCols);
    expect(anchorClicks).toBe(1);
  });

  it('accepts a custom filename', () => {
    exportCsv(makeRows([['a', '1']]), cols, exportableCols, 'my-data.csv');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('falls back to "Col N" label when ColDef is undefined for that index', () => {
    // Pass a cols array shorter than exportableCols so cols[i] is undefined
    exportCsv(makeRows([['x', 'y']]), [], [0, 1]);
    expect(capturedBlobContent).toContain('Col 1');
    expect(capturedBlobContent).toContain('Col 2');
  });

  it('returns empty string for a cell at an out-of-bounds column index', () => {
    // Row has only 1 cell, but exportableCols requests index 1 (missing)
    exportCsv(makeRows([['only-one']]), cols, [1]);
    const lines = capturedBlobContent.split('\r\n');
    expect(lines[1]).toBe('""'); // getCellText returns '' for undefined cell
  });

  it('uses data-gridix-original attribute value over textContent when present', () => {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = '$1,000';
    td.setAttribute('data-gridix-original', '1000');
    row.appendChild(td);
    exportCsv([row], cols, [0]);
    expect(capturedBlobContent).toContain('"1000"');
    expect(capturedBlobContent).not.toContain('1,000');
  });

  // ── Security: CSV formula injection prevention ──────────────────────────
  it('prefixes "=" cells with apostrophe to block formula injection', () => {
    exportCsv(makeRows([['=DANGEROUS()', '0']]), cols, exportableCols);
    const dataLine = capturedBlobContent.split('\r\n')[1];
    expect(dataLine).toBe('"\'=DANGEROUS()","0"');
  });

  it('prefixes "+" cells to block formula injection', () => {
    exportCsv(makeRows([['+attack', '0']]), cols, exportableCols);
    const dataLine = capturedBlobContent.split('\r\n')[1];
    expect(dataLine).toBe('"\'+attack","0"');
  });

  it('prefixes "-" cells to block formula injection', () => {
    exportCsv(makeRows([['-1+2', '0']]), cols, exportableCols);
    const dataLine = capturedBlobContent.split('\r\n')[1];
    expect(dataLine).toBe('"\'-1+2","0"');
  });

  it('prefixes "@" cells to block formula injection', () => {
    exportCsv(makeRows([['@SUM', '0']]), cols, exportableCols);
    const dataLine = capturedBlobContent.split('\r\n')[1];
    expect(dataLine).toBe('"\'@SUM","0"');
  });

  it('does not alter safe cell values that start with alphanumeric characters', () => {
    exportCsv(makeRows([['Alice', '42']]), cols, exportableCols);
    const dataLine = capturedBlobContent.split('\r\n')[1];
    expect(dataLine).toBe('"Alice","42"');
  });

  it('header labels that start with formula chars are also sanitized', () => {
    const injectedCols: ColDef[] = [
      { label: '=HeaderFormula', type: 'string', sortable: true, visible: true },
    ];
    exportCsv(makeRows([['value']]), injectedCols, [0]);
    const headerLine = capturedBlobContent.split('\r\n')[0];
    expect(headerLine).toBe('"\'=HeaderFormula"');
  });
});

describe('exportJson', () => {
  beforeEach(setupDownloadMocks);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('produces a valid JSON array', () => {
    exportJson(makeRows([['Alice', '95']]), cols, exportableCols);
    expect(() => JSON.parse(capturedBlobContent)).not.toThrow();
  });

  it('uses column labels as object keys', () => {
    exportJson(makeRows([['Alice', '95']]), cols, exportableCols);
    const parsed = JSON.parse(capturedBlobContent);
    expect(parsed[0]).toEqual({ Name: 'Alice', Score: '95' });
  });

  it('includes all rows', () => {
    exportJson(
      makeRows([
        ['Alice', '95'],
        ['Bob', '87'],
      ]),
      cols,
      exportableCols,
    );
    const parsed = JSON.parse(capturedBlobContent);
    expect(parsed).toHaveLength(2);
    expect(parsed[1]).toEqual({ Name: 'Bob', Score: '87' });
  });

  it('triggers a file download', () => {
    exportJson(makeRows([['a', '1']]), cols, exportableCols);
    expect(anchorClicks).toBe(1);
  });

  it('accepts a custom filename', () => {
    exportJson(makeRows([['a', '1']]), cols, exportableCols, 'out.json');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('copyToClipboard', () => {
  beforeEach(setupDownloadMocks);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('writes tab-separated text with header row to clipboard', () => {
    copyToClipboard(makeRows([['Alice', '95']]), cols, exportableCols);
    const text = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    const [header, data] = text.split('\n');
    expect(header).toBe('Name\tScore');
    expect(data).toBe('Alice\t95');
  });

  it('includes all data rows', () => {
    copyToClipboard(
      makeRows([
        ['Alice', '95'],
        ['Bob', '87'],
      ]),
      cols,
      exportableCols,
    );
    const text = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(text).toContain('Bob\t87');
  });

  it('sanitizes formula-injection values in clipboard output', () => {
    copyToClipboard(makeRows([['=FORMULA', '0']]), cols, exportableCols);
    const text = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    const dataLine = text.split('\n')[1];
    expect(dataLine).toBe("'=FORMULA\t0");
  });
});

describe('runExport', () => {
  beforeEach(setupDownloadMocks);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('routes "csv" format to exportCsv', () => {
    runExport('csv', makeRows([['a', '1']]), cols, exportableCols);
    expect(capturedBlobContent).toContain('"Name"');
  });

  it('routes "json" format to exportJson', () => {
    runExport('json', makeRows([['a', '1']]), cols, exportableCols);
    expect(() => JSON.parse(capturedBlobContent)).not.toThrow();
  });

  it('routes "copy" format to copyToClipboard', () => {
    runExport('copy', makeRows([['a', '1']]), cols, exportableCols);
    expect((navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });
});
