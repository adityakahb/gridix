import type { ColDef, ExportFormat } from '../types';

/**
 * Guards a single cell value against **CSV formula injection** (a.k.a. CSV
 * injection / DDE injection).
 *
 * Spreadsheet applications (Excel, Google Sheets, LibreOffice Calc) interpret
 * cells whose first character is `=`, `+`, `-`, `@`, `\t`, or `\r` as
 * formulas. A malicious actor who can influence table cell content could craft
 * a value that executes arbitrary code or exfiltrates data when the CSV is
 * opened.
 *
 * This function prefixes such values with a single apostrophe `'`, which all
 * major spreadsheet applications treat as a "force literal string" prefix.
 *
 * References:
 * - OWASP: https://owasp.org/www-community/attacks/CSV_Injection
 * - RFC 4180 §2 (does not address formula prefixes; this is a defensive addition)
 *
 * @param value - Raw, unquoted cell string.
 * @returns The value unchanged if safe, or prefixed with `'` when it starts
 *   with a formula-injection character.
 */
function sanitizeCsvValue(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Returns the exportable text for a single cell, preferring the
 * `data-gridix-original` attribute (which stores the pre-highlight raw value)
 * over `textContent`. Falls back to an empty string when the cell is absent.
 *
 * @param row - The row containing the cell.
 * @param colIndex - Zero-based column index.
 */
function getCellText(row: HTMLTableRowElement, colIndex: number): string {
  const cell = row.cells[colIndex];
  return cell?.getAttribute('data-gridix-original') ?? cell?.textContent?.trim() ?? '';
}

/**
 * Builds the 2-D cell-value matrix for the given exportable columns.
 *
 * @param rows - Filtered (and sorted) rows to export.
 * @param cols - All column definitions (used indirectly via `getCellText`).
 * @param exportableCols - Ordered list of column indices to include.
 * @returns Row-major array of string cell values.
 */
function buildRows(
  rows: HTMLTableRowElement[],
  cols: ColDef[],
  exportableCols: number[],
): string[][] {
  return rows.map(row => exportableCols.map(i => getCellText(row, i)));
}

/**
 * Builds the header row for the export by looking up each exportable column's
 * label. Falls back to `"Col N"` (1-based) when the column definition is
 * missing.
 *
 * @param cols - All column definitions.
 * @param exportableCols - Ordered list of column indices to include.
 * @returns Array of header label strings.
 */
function buildHeaders(cols: ColDef[], exportableCols: number[]): string[] {
  return exportableCols.map(i => cols[i]?.label ?? `Col ${i + 1}`);
}

/**
 * Exports the visible rows as a RFC-4180 CSV file and triggers a browser
 * download.
 *
 * All values are double-quoted; embedded double-quotes are escaped by doubling
 * them (`"Say ""hi"""`). Lines are separated by `\r\n` per the RFC.
 *
 * Cell values are also passed through {@link sanitizeCsvValue} to prevent
 * formula injection when the file is opened in a spreadsheet application.
 *
 * @param rows - Filtered rows to export.
 * @param cols - All column definitions.
 * @param exportableCols - Ordered column indices to include.
 * @param filename - Target filename for the download (default `gridix-export.csv`).
 */
export function exportCsv(
  rows: HTMLTableRowElement[],
  cols: ColDef[],
  exportableCols: number[],
  filename = 'gridix-export.csv',
): void {
  const headers = buildHeaders(cols, exportableCols);
  const data = buildRows(rows, cols, exportableCols);

  /** RFC-4180 field encoding + formula-injection guard. */
  const escape = (v: string): string => {
    const safe = sanitizeCsvValue(v);
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const csv = [headers, ...data].map(r => r.map(escape).join(',')).join('\r\n');

  download(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports the visible rows as a pretty-printed JSON array and triggers a
 * browser download. Each element is an object keyed by column label.
 *
 * @param rows - Filtered rows to export.
 * @param cols - All column definitions.
 * @param exportableCols - Ordered column indices to include.
 * @param filename - Target filename for the download (default `gridix-export.json`).
 */
export function exportJson(
  rows: HTMLTableRowElement[],
  cols: ColDef[],
  exportableCols: number[],
  filename = 'gridix-export.json',
): void {
  const headers = buildHeaders(cols, exportableCols);
  const data = buildRows(rows, cols, exportableCols).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
  download(JSON.stringify(data, null, 2), filename, 'application/json');
}

/**
 * Copies the visible rows as tab-separated text (with a header row) to the
 * system clipboard via the Clipboard API.
 *
 * Rows are separated by `\n`; columns within a row are separated by `\t`.
 * Cell values are passed through {@link sanitizeCsvValue} to prevent formula
 * injection when the text is pasted into a spreadsheet application.
 *
 * @param rows - Filtered rows to copy.
 * @param cols - All column definitions.
 * @param exportableCols - Ordered column indices to include.
 */
export function copyToClipboard(
  rows: HTMLTableRowElement[],
  cols: ColDef[],
  exportableCols: number[],
): void {
  const headers = buildHeaders(cols, exportableCols);
  const data = buildRows(rows, cols, exportableCols);
  const text = [headers, ...data].map(r => r.map(sanitizeCsvValue).join('\t')).join('\n');
  navigator.clipboard?.writeText(text);
}

/**
 * Routes an export action to the appropriate export function based on `format`.
 *
 * @param format - One of `'csv'`, `'json'`, or `'copy'`.
 * @param rows - Filtered rows to export.
 * @param cols - All column definitions.
 * @param exportableCols - Ordered column indices to include.
 */
export function runExport(
  format: ExportFormat,
  rows: HTMLTableRowElement[],
  cols: ColDef[],
  exportableCols: number[],
): void {
  if (format === 'csv') exportCsv(rows, cols, exportableCols);
  if (format === 'json') exportJson(rows, cols, exportableCols);
  if (format === 'copy') copyToClipboard(rows, cols, exportableCols);
}

/**
 * Creates a temporary object URL from `content`, triggers a programmatic
 * anchor click to start the file download, then revokes the URL.
 *
 * @param content - File content as a string.
 * @param filename - Suggested download filename.
 * @param mime - MIME type for the `Blob`.
 */
function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
