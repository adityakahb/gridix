/**
 * Gridix Svelte connector.
 *
 * Provides a Svelte `action` for use in Svelte 4/5 component templates.
 * Svelte actions are the idiomatic way to attach third-party library behaviour
 * to DOM elements — they receive the element on mount and return an optional
 * `destroy` callback.
 *
 * This file does not import from Svelte — copy the action below into your
 * Svelte project.
 *
 * @example
 * ```svelte
 * <!-- MyTable.svelte -->
 * <script lang="ts">
 *   import { gridix } from './gridix-action';
 * </script>
 *
 * <table use:gridix={{ sort: true, pagination: { enabled: true, pageLength: 10, pageLengthMenu: [10, 25] } }}>
 *   <thead>…</thead>
 *   <tbody>…</tbody>
 * </table>
 * ```
 *
 * @module gridix/connectors/svelte
 */

import { GridixTable } from '../core/gridix-table';
import type { GridixOptions } from '../types';

/**
 * Svelte `ActionReturn` shape — describes what a Svelte action can return.
 * Kept inline to avoid importing from 'svelte'.
 */
export interface ActionReturn<P = void> {
  /** Called when the action parameters change. */
  update?: (parameter: P) => void;
  /** Called when the element is unmounted. */
  destroy?: () => void;
}

/**
 * Copy-paste template: Svelte action that initialises Gridix on a `<table>`.
 *
 * ```ts
 * // lib/gridix-action.ts
 * import { GridixTable } from 'gridix';
 * import type { GridixOptions } from 'gridix';
 *
 * export function gridix(
 *   node: HTMLTableElement,
 *   options?: Partial<GridixOptions>,
 * ) {
 *   let instance = new GridixTable(node, options);
 *
 *   return {
 *     update(newOptions?: Partial<GridixOptions>) {
 *       instance.destroy();
 *       instance = new GridixTable(node, newOptions);
 *     },
 *     destroy() {
 *       instance.destroy();
 *     },
 *   };
 * }
 * ```
 */

/**
 * Creates a Svelte-compatible action object for the given table element.
 * Call this inside a Svelte `use:` directive or manually from `onMount`.
 *
 * @param tableEl - The `<table>` element to initialise.
 * @param options - Initial Gridix options.
 * @returns An `ActionReturn` with `update` and `destroy` callbacks.
 */
export function gridix(
  tableEl: HTMLTableElement,
  options?: Partial<GridixOptions>,
): ActionReturn<Partial<GridixOptions>> {
  let instance = new GridixTable(tableEl, options);

  return {
    update(newOptions?: Partial<GridixOptions>): void {
      instance.destroy();
      instance = new GridixTable(tableEl, newOptions);
    },
    destroy(): void {
      instance.destroy();
    },
  };
}
