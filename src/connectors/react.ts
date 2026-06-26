/**
 * Gridix React connector.
 *
 * Provides a `useGridix` hook that initialises a `GridixTable` instance when
 * the ref is attached and automatically destroys it on unmount.
 *
 * This file contains no React imports — it only uses React's type shapes
 * via JSDoc-style comments so it compiles without React as a devDependency.
 * Copy and integrate this file into your React project alongside the Gridix
 * package, then import React in your consuming component.
 *
 * @example
 * ```tsx
 * import { useRef } from 'react';
 * import { useGridix } from 'gridix/connectors/react';
 *
 * export function MyTable() {
 *   const tableRef = useRef<HTMLTableElement>(null);
 *   useGridix(tableRef, { sort: true, pagination: { enabled: true, pageLength: 10, pageLengthMenu: [10, 25] } });
 *
 *   return (
 *     <table ref={tableRef} data-gridix>
 *       <thead>…</thead>
 *       <tbody>…</tbody>
 *     </table>
 *   );
 * }
 * ```
 *
 * @module gridix/connectors/react
 */

import { GridixTable } from '../core/gridix-table';
import type { GridixOptions } from '../types';

/**
 * A minimal type for React's `RefObject` / `MutableRefObject`.
 * Keeps this connector dependency-free while preserving type safety.
 */
export interface TableRef {
  readonly current: HTMLTableElement | null;
}

/**
 * React hook signature — call this from your component's body.
 *
 * The hook accepts a `ref` pointing at the `<table>` element and an optional
 * `options` object. It initialises `GridixTable` when the ref becomes
 * non-null (component mounts) and calls `.destroy()` when the component
 * unmounts or `options` changes.
 *
 * **Important:** Because this file does not import React, you must call it
 * through the hook pattern in your own project with `useEffect` and
 * `useRef` imported from React. See the copy-paste template below.
 *
 * @param ref - React ref attached to the `<table>` element.
 * @param options - Gridix options to apply (optional; data attributes take precedence).
 * @returns The live `GridixTable` instance, or `null` before mount.
 */
export type UseGridixHook = (ref: TableRef, options?: Partial<GridixOptions>) => GridixTable | null;

/**
 * Copy-paste template for integrating Gridix into a React component.
 *
 * ```tsx
 * import { useRef, useEffect, useState } from 'react';
 * import { GridixTable } from 'gridix';
 * import type { GridixOptions } from 'gridix';
 *
 * export function useGridix(
 *   ref: React.RefObject<HTMLTableElement>,
 *   options?: Partial<GridixOptions>,
 * ): GridixTable | null {
 *   const [instance, setInstance] = useState<GridixTable | null>(null);
 *
 *   useEffect(() => {
 *     if (!ref.current) return;
 *     const grid = new GridixTable(ref.current, options);
 *     setInstance(grid);
 *     return () => {
 *       grid.destroy();
 *       setInstance(null);
 *     };
 *   // Re-run only when the ref target changes (stable across renders).
 *   // eslint-disable-next-line react-hooks/exhaustive-deps
 *   }, [ref.current]);
 *
 *   return instance;
 * }
 * ```
 */

/**
 * Creates a `GridixTable` instance for the given table element and returns a
 * teardown function. Use this in environments where React hooks are unavailable
 * (e.g. React Native Web, SSR boundaries, or non-hook components).
 *
 * @param tableEl - The `<table>` DOM element to initialise.
 * @param options - Gridix options (optional).
 * @returns An object with the `instance` and a `destroy` function.
 */
export function createGridix(
  tableEl: HTMLTableElement,
  options?: Partial<GridixOptions>,
): { instance: GridixTable; destroy: () => void } {
  const instance = new GridixTable(tableEl, options);
  return {
    instance,
    destroy: (): void => instance.destroy(),
  };
}
