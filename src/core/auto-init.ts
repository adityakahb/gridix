import { GridixTable } from './gridix-table';
import { ATTR } from '../constants';

/**
 * Scans the document for all `<table data-gridix>` elements that have not yet
 * been initialised and constructs a `GridixTable` for each one.
 *
 * A table is considered already initialised when it carries the
 * `gridix-initialized` CSS class (added by the `GridixTable` constructor).
 * This guard prevents double-initialisation when `autoInit` is called more
 * than once (e.g. if the CDN script is accidentally included twice).
 *
 * This function is the only exported symbol that carries a DOM side-effect.
 * It is called automatically by `src/cdn.ts` on `DOMContentLoaded` (or
 * immediately if the document is already interactive). The ESM / CJS build
 * (`src/index.ts`) re-exports it for consumers who prefer programmatic control
 * over when initialisation occurs.
 */
export function autoInit(): void {
  const tables = document.querySelectorAll<HTMLTableElement>(`table[${ATTR.INIT}]`);
  tables.forEach(table => {
    if (!table.classList.contains('gridix-initialized')) {
      new GridixTable(table);
    }
  });
}
