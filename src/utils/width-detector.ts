/**
 * Measures the natural (content-driven) width of a table by temporarily
 * switching it to `width: auto; table-layout: auto`, reading `scrollWidth`,
 * then restoring all original inline styles.
 *
 * This delegates the minimum content width calculation to the browser's own
 * layout engine rather than summing column widths manually.
 *
 * @param table - The `<table>` element to measure.
 * @returns The natural pixel width, or `0` if the layout engine returns nothing.
 */
export function measureNaturalWidth(table: HTMLTableElement): number {
  const prevWidth = table.style.width;
  const prevLayout = table.style.tableLayout;
  const prevMinWidth = table.style.minWidth;

  table.style.width = 'auto';
  table.style.tableLayout = 'auto';
  table.style.minWidth = '0';

  const natural = table.scrollWidth;

  table.style.width = prevWidth;
  table.style.tableLayout = prevLayout;
  table.style.minWidth = prevMinWidth;

  return natural || 0;
}

/**
 * Applies `measureNaturalWidth` as the `min-width` of the scroll container,
 * then installs a `ResizeObserver` that re-measures whenever the scroll
 * container changes size (e.g. when the browser window is resized or the
 * column count changes).
 *
 * @param scrollContainer - The scrollable wrapper `<div>` around the table.
 * @param table - The `<table>` element to measure.
 * @returns A teardown function that disconnects the `ResizeObserver`.
 */
export function applyNaturalWidth(
  scrollContainer: HTMLElement,
  table: HTMLTableElement,
): () => void {
  const update = (): void => {
    const width = measureNaturalWidth(table);
    if (width > 0) {
      table.style.minWidth = `${width}px`;
    }
  };

  update();

  const ro = new ResizeObserver(update);
  ro.observe(scrollContainer);

  return (): void => ro.disconnect();
}
