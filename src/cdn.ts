/**
 * Gridix CDN entry point — **do not import this in a bundler**.
 *
 * This file re-exports everything from `src/index.ts` **and** runs an
 * auto-initialisation side effect that scans for `[data-gridix]` tables as
 * soon as the DOM is ready.
 *
 * The side effect is isolated here so that importing the ESM build
 * (`src/index.ts`) from a bundler never triggers double-initialisation.
 *
 * Rollup compiles this entry into `dist/scripts/gridix.cdn.min.js` (IIFE
 * format), which sets a `window.Gridix` global and calls `autoInit()`
 * automatically.
 *
 * @module gridix/cdn
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

import { autoInit } from './core/auto-init';

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // DOM already parsed — run immediately (e.g. script tag at bottom of <body>)
    autoInit();
  }
}
