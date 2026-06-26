/**
 * Gridix — AEM-compatible DataTables alternative.
 *
 * This is the **ESM / CJS / UMD entry point**. It is a pure export with
 * zero side effects so it is safe to tree-shake and will never auto-initialise
 * any tables. Import from here in bundler or Node.js contexts.
 *
 * For the CDN drop-in (auto-initialisation on `DOMContentLoaded`) use
 * `dist/scripts/gridix.cdn.min.js` instead — that build re-exports everything
 * from this file and adds the side-effect in `src/cdn.ts`.
 *
 * @module gridix
 */
export { GridixTable as Gridix } from './core/gridix-table';
export { autoInit } from './core/auto-init';
export type {
  GridixOptions,
  ColDef,
  GridixState,
  SortDir,
  ColType,
  RowSelectMode,
  ExportFormat,
  GridixTheme,
} from './types';
